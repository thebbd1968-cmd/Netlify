"""
Gumroad Webhooks — handles sale, subscription, and cancellation events from Gumroad.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.events import fire_event

router = APIRouter(prefix="/webhooks/gumroad", tags=["gumroad-webhooks"])

GUMROAD_SECRET = os.getenv("GUMROAD_WEBHOOK_SECRET", "")

# ─── Plan definitions (mirrors billing.py for webhook processing) ─────────────
PLAN_PERMALINKS = {
    "douglas-re-starter": "starter",
    "douglas-re-pro": "professional",
    "douglas-re-enterprise": "enterprise",
}


def verify_gumroad_signature(body: bytes, signature: str) -> bool:
    """
    Verify the HMAC-SHA256 signature from Gumroad webhooks.
    Gumroad signs the request body with the shared secret.
    """
    if not GUMROAD_SECRET:
        # Signature verification skipped in dev
        return True
    try:
        expected = hmac.new(
            GUMROAD_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()
        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


def _find_user_by_email(db: Session, email: str) -> Optional[User]:
    """Look up an existing user by email."""
    return db.query(User).filter(User.email == email).first()


@router.post("")
async def handle_gumroad_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Receive webhook events from Gumroad.

    Supported events:
    - ping: Test webhook from Gumroad setup
    - sale: New purchase (license key issued)
    - subscription.updated: Subscription status change
    - subscription.cancelled: User cancelled
    - subscription.deactivated: Subscription ended/failed payment
    """
    body = await request.body()
    raw_body = body.decode("utf-8", errors="replace")

    # Parse the form-encoded body Gumroad sends
    try:
        data = _parse_gumroad_body(raw_body)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook body")

    # Verify signature if present
    signature = request.headers.get("Gumroad-Signature", "")
    if signature and not verify_gumroad_signature(body, signature):
        raise HTTPException(status_code=403, detail="Invalid signature")

    event = data.get("event", "")
    product_permalink = data.get("product_permalink", "")
    email = data.get("email", "")
    license_key = data.get("license_key", "")
    sale_id = data.get("sale_id", "")
    subscription_id = data.get("subscription_id", "")
    product_id = data.get("product_id", "")
    price = float(data.get("price", 0))

    # Map permalink to our plan tier
    plan_tier = PLAN_PERMALINKS.get(product_permalink, "starter")

    if event == "ping":
        return {"status": "ok", "message": "Webhook received"}

    fire_event("gumroad_webhook", {
        "event": event,
        "product_permalink": product_permalink,
        "email": email,
        "plan_tier": plan_tier,
    })

    if event in ("sale", "subscription.updated"):
        # Find or create user
        user = _find_user_by_email(db, email)
        if not user:
            # Auto-create a user for the buyer
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

        # Upsert subscription
        existing = None
        if license_key:
            existing = db.query(Subscription).filter(
                Subscription.gumroad_license_key == license_key
            ).first()

        if existing:
            existing.status = "active"
            existing.is_active = True
            existing.gumroad_subscription_id = subscription_id or existing.gumroad_subscription_id
            existing.recurring_amount = _get_plan_price(plan_tier)
        else:
            sub = Subscription(
                id=str(uuid.uuid4()),
                user_id=user.id,
                gumroad_license_key=license_key or f"sale-{sale_id}",
                gumroad_product_id=product_id,
                gumroad_product_permalink=product_permalink,
                gumroad_sale_id=sale_id,
                gumroad_subscription_id=subscription_id,
                plan_tier=plan_tier,
                status="active",
                amount_paid=price,
                recurring_amount=price,
                purchased_at=datetime.now(timezone.utc),
                is_active=True,
            )
            db.add(sub)

        db.commit()
        return {"status": "ok", "message": f"Provisioned {plan_tier} for {email}"}

    elif event in ("subscription.cancelled", "subscription.deactivated"):
        # Deactivate the subscription
        if license_key:
            sub = db.query(Subscription).filter(
                Subscription.gumroad_license_key == license_key
            ).first()
        elif subscription_id:
            sub = db.query(Subscription).filter(
                Subscription.gumroad_subscription_id == subscription_id
            ).first()
        else:
            # Look up by email
            sub = (
                db.query(Subscription)
                .join(User)
                .filter(User.email == email, Subscription.is_active == True)
                .first()
            )

        if sub:
            sub.status = "cancelled" if event == "subscription.cancelled" else "expired"
            sub.is_active = False
            sub.cancelled_at = datetime.now(timezone.utc)
            db.commit()

        return {"status": "ok", "message": f"Deactivated subscription for {email}"}

    return {"status": "ok", "message": f"Event '{event}' acknowledged"}


def _parse_gumroad_body(raw: str) -> dict[str, str]:
    """Parse Gumroad's form-encoded or JSON webhook body."""
    # Try JSON first
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        pass

    # Parse URL-encoded form data
    from urllib.parse import parse_qs
    parsed = parse_qs(raw)
    result = {}
    for key, values in parsed.items():
        result[key] = values[0] if values else ""
    return result


# Inline plan prices for webhook processing (avoids circular import)
_PLAN_PRICES = {
    "starter": 29,
    "professional": 79,
    "enterprise": 199,
}

def _get_plan_price(tier: str) -> float:
    return float(_PLAN_PRICES.get(tier, 29))
