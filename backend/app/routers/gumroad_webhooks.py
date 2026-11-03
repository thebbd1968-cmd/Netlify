"""
Gumroad Webhooks — handles sale, subscription, and cancellation events from Gumroad.

Security model
--------------
Gumroad does not sign webhook payloads. Their own docs (https://gumroad.com/ping) say:
"Because the payload is unsigned ... treat a ping as a trigger rather than as data."
The only shared-secret mechanism Gumroad supports for resource subscriptions is a
secret embedded in the registered ``post_url`` as a query parameter — the URL is
stored verbatim by Gumroad and replayed on every delivery:

    https://<host>/webhooks/gumroad?secret=<GUMROAD_WEBHOOK_SECRET>

We verify that query parameter (constant-time compare) and, for callers that send a
header instead, also accept ``X-Gumroad-Webhook-Secret`` (plain shared secret) and
``X-Gumroad-Signature`` (hex HMAC-SHA256 of the raw body keyed with the secret).

Verification FAILS CLOSED: if ``GUMROAD_WEBHOOK_SECRET`` is not configured, every
request is rejected. There is no "dev mode" bypass.

Only the three Douglas RE product permalinks in ``PLAN_PERMALINKS`` may create or
update a user/subscription. Any other product (e.g. the unrelated playbooks sold on
the same Gumroad account) is acknowledged with 200 and otherwise ignored — no user,
no subscription, no mutation, and never a default tier.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.events import fire_event

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks/gumroad", tags=["gumroad-webhooks"])

SECRET_ENV_VAR = "GUMROAD_WEBHOOK_SECRET"

# ─── Plan definitions ────────────────────────────────────────────────────────
# The ONLY products allowed to create/update a subscription. Anything else is
# ignored. Never add a default/fallback tier here.
PLAN_PERMALINKS = {
    "douglas-re-starter": "starter",
    "douglas-re-pro": "professional",
    "douglas-re-enterprise": "enterprise",
}

# Monthly plan prices, in USD (mirrors billing.py; inlined to avoid a circular import)
PLAN_PRICES = {
    "starter": 29.0,
    "professional": 79.0,
    "enterprise": 199.0,
}

# Gumroad resource_name values → the event names this handler understands.
_RESOURCE_NAME_EVENTS = {
    "sale": "sale",
    "subscription_updated": "subscription.updated",
    "subscription_restarted": "subscription.updated",
    "cancellation": "subscription.cancelled",
    "subscription_ended": "subscription.deactivated",
}

SALE_EVENTS = ("sale", "subscription.updated")
CANCEL_EVENTS = ("subscription.cancelled", "subscription.deactivated")


# ─── Authentication ──────────────────────────────────────────────────────────
def configured_secret() -> str:
    """Read the shared secret at request time (never cached at import)."""
    return (os.getenv(SECRET_ENV_VAR) or "").strip()


def _presented_secrets(request: Request, data: dict[str, str]) -> list[str]:
    """Every credential the caller supplied, in the forms Gumroad/our clients use."""
    presented: list[str] = []

    # 1. Query parameter on the registered post_url — what Gumroad actually replays.
    for key in ("secret", "gumroad_secret"):
        value = request.query_params.get(key)
        if value:
            presented.append(value)

    # 2. Headers, for callers that authenticate out of band.
    for header in ("x-gumroad-webhook-secret", "x-gumroad-secret"):
        value = request.headers.get(header)
        if value:
            presented.append(value)

    return presented


def verify_webhook_request(request: Request, raw_body: bytes, data: dict[str, str]) -> None:
    """
    Authenticate an inbound Gumroad webhook. Raises HTTPException on failure.

    - secret not configured on the server  → 401 (fails closed)
    - no credential presented             → 401
    - credential presented but wrong      → 403
    """
    secret = configured_secret()
    if not secret:
        logger.error(
            "Gumroad webhook rejected: %s is not set on the server", SECRET_ENV_VAR
        )
        raise HTTPException(
            status_code=401,
            detail="Webhook authentication is not configured on this server",
        )

    presented = _presented_secrets(request, data)
    if presented and any(hmac.compare_digest(secret, value) for value in presented):
        return

    # Optional HMAC-SHA256 signature over the raw body, hex encoded.
    signature = (
        request.headers.get("x-gumroad-signature")
        or request.headers.get("gumroad-signature")
        or ""
    ).strip()
    if signature:
        expected = hmac.new(secret.encode("utf-8"), raw_body, hashlib.sha256).hexdigest()
        for candidate in (signature, signature.split("=", 1)[-1]):
            if hmac.compare_digest(expected, candidate.strip().lower()):
                return

    if not presented and not signature:
        raise HTTPException(status_code=401, detail="Missing webhook secret")

    logger.warning("Gumroad webhook rejected: invalid secret/signature")
    raise HTTPException(status_code=403, detail="Invalid webhook secret or signature")


# ─── Helpers ─────────────────────────────────────────────────────────────────
def resolve_plan_tier(product_permalink: str) -> Optional[str]:
    """Map a product permalink to a plan tier. Unknown products → None (ignored)."""
    permalink = (product_permalink or "").strip()
    # Gumroad sometimes sends a full URL (e.g. https://x.gumroad.com/l/douglas-re-pro)
    if "/" in permalink:
        permalink = permalink.rstrip("/").rsplit("/", 1)[-1]
    return PLAN_PERMALINKS.get(permalink)


def _str_field(data: dict[str, Any], key: str, default: str = "") -> str:
    value = data.get(key, default)
    if value is None:
        return default
    return value if isinstance(value, str) else str(value)


def _price_to_dollars(raw: Any) -> float:
    """Gumroad sends `price` in USD cents; store dollars."""
    try:
        cents = float(raw)
    except (TypeError, ValueError):
        return 0.0
    return round(cents / 100.0, 2)


def _find_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()


@router.post("")
async def handle_gumroad_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive webhook events from Gumroad.

    Supported events (either `event=` or Gumroad's `resource_name=`):
    - ping / test: webhook setup check
    - sale, subscription.updated: new purchase / subscription change
    - subscription.cancelled, subscription.deactivated: cancellation / end

    Everything is authenticated before any database work happens.
    """
    raw_body = await request.body()

    try:
        data = _parse_gumroad_body(raw_body.decode("utf-8", errors="replace"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook body")

    # 1. Authenticate first — before parsing semantics or touching the DB.
    verify_webhook_request(request, raw_body, data)

    event = _str_field(data, "event") or _RESOURCE_NAME_EVENTS.get(
        _str_field(data, "resource_name"), ""
    )
    product_permalink = _str_field(data, "product_permalink")
    email = _str_field(data, "email") or _str_field(data, "purchase_email")
    license_key = _str_field(data, "license_key")
    sale_id = _str_field(data, "sale_id")
    subscription_id = _str_field(data, "subscription_id")
    product_id = _str_field(data, "product_id")
    price = data.get("price", 0)

    # 2. Liveness check — no mutation.
    if event in ("ping", "test"):
        return {"status": "ok", "message": "Webhook received"}

    # 3. Only Douglas RE products may ever mutate a user/subscription.
    plan_tier = resolve_plan_tier(product_permalink)
    if plan_tier is None:
        logger.info(
            "Gumroad webhook ignored: permalink %r is not a Douglas RE product (event=%s)",
            product_permalink,
            event,
        )
        fire_event(
            "gumroad_webhook_ignored",
            {"event": event, "product_permalink": product_permalink},
        )
        return {
            "status": "ok",
            "message": f"Ignored: '{product_permalink}' is not a Douglas RE product",
        }

    fire_event(
        "gumroad_webhook",
        {
            "event": event,
            "product_permalink": product_permalink,
            "email": email,
            "plan_tier": plan_tier,
        },
    )

    if event in SALE_EVENTS:
        # At-least-once delivery: dedupe on sale_id before doing anything.
        if sale_id:
            already = (
                db.query(Subscription)
                .filter(Subscription.gumroad_sale_id == sale_id)
                .first()
            )
            if already:
                return {"status": "ok", "message": f"Duplicate sale {sale_id} ignored"}

        if not email:
            raise HTTPException(status_code=400, detail="Sale event is missing 'email'")

        user = _find_user_by_email(db, email)
        if not user:
            user = User(
                id=str(uuid.uuid4()),
                email=email,
                name=email.split("@")[0],
                hashed_password="",
                role="agent",
                is_active=True,
                email_verified=True,
            )
            db.add(user)
            db.flush()

        existing = None
        if license_key:
            existing = (
                db.query(Subscription)
                .filter(Subscription.gumroad_license_key == license_key)
                .first()
            )
        if existing is None and subscription_id:
            existing = (
                db.query(Subscription)
                .filter(Subscription.gumroad_subscription_id == subscription_id)
                .first()
            )

        recurring = PLAN_PRICES[plan_tier]
        if existing:
            existing.status = "active"
            existing.is_active = True
            existing.plan_tier = plan_tier
            existing.gumroad_subscription_id = (
                subscription_id or existing.gumroad_subscription_id
            )
            existing.gumroad_product_permalink = (
                product_permalink or existing.gumroad_product_permalink
            )
            existing.recurring_amount = recurring
        else:
            db.add(
                Subscription(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    gumroad_license_key=license_key or f"sale-{sale_id or uuid.uuid4()}",
                    gumroad_product_id=product_id,
                    gumroad_product_permalink=product_permalink,
                    gumroad_sale_id=sale_id or None,
                    gumroad_subscription_id=subscription_id or None,
                    plan_tier=plan_tier,
                    status="active",
                    amount_paid=_price_to_dollars(price),
                    recurring_amount=recurring,
                    purchased_at=datetime.now(timezone.utc),
                    is_active=True,
                )
            )

        db.commit()
        return {"status": "ok", "message": f"Provisioned {plan_tier} for {email}"}

    if event in CANCEL_EVENTS:
        sub = None
        if license_key:
            sub = (
                db.query(Subscription)
                .filter(Subscription.gumroad_license_key == license_key)
                .first()
            )
        if sub is None and subscription_id:
            sub = (
                db.query(Subscription)
                .filter(Subscription.gumroad_subscription_id == subscription_id)
                .first()
            )
        if sub is None and sale_id:
            sub = (
                db.query(Subscription)
                .filter(Subscription.gumroad_sale_id == sale_id)
                .first()
            )
        if sub is None and email:
            sub = (
                db.query(Subscription)
                .join(User, User.id == Subscription.user_id)
                .filter(User.email == email, Subscription.is_active == True)  # noqa: E712
                .first()
            )

        if sub:
            sub.status = "cancelled" if event == "subscription.cancelled" else "expired"
            sub.is_active = False
            sub.cancelled_at = datetime.now(timezone.utc)
            db.commit()
            return {"status": "ok", "message": f"Deactivated subscription for {email}"}

        return {"status": "ok", "message": "No matching subscription to deactivate"}

    return {"status": "ok", "message": f"Event '{event}' acknowledged"}


def _parse_gumroad_body(raw: str) -> dict[str, Any]:
    """Parse Gumroad's form-encoded or JSON webhook body."""
    if not raw or not raw.strip():
        return {}

    # Try JSON first
    try:
        parsed_json = json.loads(raw)
        if isinstance(parsed_json, dict):
            return parsed_json
    except (json.JSONDecodeError, TypeError):
        pass

    # Parse URL-encoded form data
    from urllib.parse import parse_qs

    parsed = parse_qs(raw, keep_blank_values=True)
    return {key: (values[0] if values else "") for key, values in parsed.items()}
