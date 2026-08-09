"""
Full billing router — Gumroad product listings, license verification, and subscription management.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subscription import Subscription
from app.models.user import User
from app.routers.auth import get_current_user_id as require_auth

router = APIRouter(prefix="/billing", tags=["billing"])

GUMROAD_ACCESS_TOKEN = os.getenv("GUMROAD_ACCESS_TOKEN", "")
GUMROAD_BASE = "https://api.gumroad.com/v2"

# ─── Product definitions (hardcoded — owner creates these manually in Gumroad) ──

PLANS = {
    "starter": {
        "tier": "starter",
        "name": "Starter",
        "price": 29,
        "interval": "month",
        "permalink": "douglas-re-starter",
        "features": [
            "1 seat",
            "CRM with unlimited contacts",
            "Deal kanban board",
            "Property analysis engine",
            "Basic reporting dashboard",
        ],
        "gumroad_url": "https://gumroad.com/l/douglas-re-starter",
    },
    "professional": {
        "tier": "professional",
        "name": "Professional",
        "price": 79,
        "interval": "month",
        "permalink": "douglas-re-pro",
        "features": [
            "5 seats",
            "Everything in Starter",
            "Advanced analytics & reports",
            "Portfolio tracking",
            "AI-powered nurture sequences",
            "Priority email support",
        ],
        "gumroad_url": "https://gumroad.com/l/douglas-re-pro",
    },
    "enterprise": {
        "tier": "enterprise",
        "name": "Enterprise",
        "price": 199,
        "interval": "month",
        "permalink": "douglas-re-enterprise",
        "features": [
            "Unlimited seats",
            "Everything in Professional",
            "White-label / custom branding",
            "Priority phone & chat support",
            "Custom integrations (MLS, Zapier)",
            "Dedicated account manager",
        ],
        "gumroad_url": "https://gumroad.com/l/douglas-re-enterprise",
    },
}


def _make_plan_response(plan: dict) -> dict:
    """Return a safe subset of plan data for the frontend."""
    return {
        "tier": plan["tier"],
        "name": plan["name"],
        "price": plan["price"],
        "interval": plan["interval"],
        "features": plan["features"],
        "gumroad_url": plan["gumroad_url"],
    }


# ─── Schemas ──────────────────────────────────────────────────────────────────

class LicenseVerifyRequest(BaseModel):
    license_key: str


class SubscriptionOut(BaseModel):
    id: str
    plan_tier: str
    status: str
    gumroad_product_permalink: Optional[str] = None
    amount_paid: Optional[float] = None
    recurring_amount: Optional[float] = None
    purchased_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class PlanOut(BaseModel):
    tier: str
    name: str
    price: int
    interval: str
    features: list[str]
    gumroad_url: str


# ─── Endpoints ────────────────────────────────────────────────────────────────


@router.get("/products", response_model=list[PlanOut])
def list_products():
    """Return the 3 subscription plans with Gumroad purchase URLs."""
    return [_make_plan_response(p) for p in PLANS.values()]


def _gumroad_verify_license(product_permalink: str, license_key: str) -> dict | None:
    """
    Call Gumroad's license verification API.
    Returns the license data dict on success, None on failure.
    """
    if not GUMROAD_ACCESS_TOKEN:
        # No token configured — return a mock for development
        return {
            "success": True,
            "purchase": {
                "product_id": "dev-product-id",
                "product_name": product_permalink,
                "seller_id": "dev-seller",
                "price": PLANS.get(product_permalink.replace("douglas-re-", "").replace("-", ""), {}).get("price", 0),
                "email": "dev@example.com",
                "license_key": license_key,
                "permalink": product_permalink,
            },
        }
    try:
        with httpx.Client(timeout=15) as client:
            resp = client.post(
                f"{GUMROAD_BASE}/licenses/verify",
                data={
                    "product_permalink": product_permalink,
                    "license_key": license_key,
                },
                params={"access_token": GUMROAD_ACCESS_TOKEN},
            )
            if resp.is_success:
                data = resp.json()
                if data.get("success"):
                    return data
            return None
    except Exception:
        return None


def _find_plan_by_permalink(permalink: str) -> dict | None:
    """Map a Gumroad product permalink to our plan definition."""
    for plan in PLANS.values():
        if plan["permalink"] == permalink:
            return plan
    # Try partial match
    for plan in PLANS.values():
        if permalink in plan["permalink"] or plan["permalink"] in permalink:
            return plan
    return None


@router.post("/verify-license", response_model=SubscriptionOut)
def verify_license(
    body: LicenseVerifyRequest,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    User submits their Gumroad license key.
    We verify it against Gumroad, then create/update a Subscription record.
    Tries each known product permalink until one succeeds.
    """
    if not body.license_key or len(body.license_key.strip()) < 5:
        raise HTTPException(status_code=400, detail="Invalid license key")

    # Try each product permalink
    verified = None
    matched_plan = None
    for plan in PLANS.values():
        result = _gumroad_verify_license(plan["permalink"], body.license_key.strip())
        if result and result.get("success"):
            verified = result
            matched_plan = plan
            break

    if not verified:
        raise HTTPException(status_code=400, detail="License key is invalid or does not match any Douglas RE plan")

    purchase = verified.get("purchase", {})
    email = purchase.get("email", "")
    product_id = purchase.get("product_id", "")
    price = purchase.get("price", 0)

    # Upsert subscription — one active subscription per user
    existing = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.gumroad_license_key == body.license_key.strip(),
        )
        .first()
    )

    if existing:
        # Already registered — update
        existing.status = "active"
        existing.is_active = True
        existing.recurring_amount = matched_plan["price"]
        db.commit()
        db.refresh(existing)
        return existing

    # Create new subscription
    sub = Subscription(
        id=str(uuid.uuid4()),
        user_id=user_id,
        gumroad_license_key=body.license_key.strip(),
        gumroad_product_id=str(product_id),
        gumroad_product_permalink=matched_plan["permalink"],
        plan_tier=matched_plan["tier"],
        status="active",
        amount_paid=float(price),
        recurring_amount=float(matched_plan["price"]),
        purchased_at=datetime.now(timezone.utc),
        is_active=True,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    return sub


@router.get("/subscription", response_model=Optional[SubscriptionOut])
def get_subscription(
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """Return the current user's active subscription, or null if none."""
    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == user_id, Subscription.is_active == True)
        .order_by(Subscription.created_at.desc())
        .first()
    )
    return sub
