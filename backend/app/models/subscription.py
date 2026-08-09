"""
Subscription model — tracks user billing plans purchased via Gumroad.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Float, Boolean
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), nullable=False, index=True)

    # Gumroad data
    gumroad_license_key = Column(String(255), unique=True, nullable=False)
    gumroad_product_id = Column(String(255), nullable=True)
    gumroad_product_permalink = Column(String(255), nullable=True)
    gumroad_sale_id = Column(String(255), nullable=True)
    gumroad_subscription_id = Column(String(255), nullable=True)

    # Plan info
    plan_tier = Column(String(50), nullable=False)  # starter | professional | enterprise
    status = Column(String(50), nullable=False, default="active")

    # Pricing
    amount_paid = Column(Float, nullable=True)
    recurring_amount = Column(Float, nullable=True)

    # Dates
    purchased_at = Column(DateTime, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Management
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
