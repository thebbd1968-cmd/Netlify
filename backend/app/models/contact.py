"""
Contact / Lead model — real estate-specific CRM fields.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, ForeignKey
from sqlalchemy.dialects.sqlite import TEXT as SQLiteText
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(String(36), primary_key=True, default=_uuid)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Core info
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)

    # Real estate specific
    lead_source = Column(String(100), nullable=True)
        # zillow, referral, open_house, website, cold_call, other
    lead_status = Column(String(50), nullable=False, default="new")
        # new, contacted, qualifying, hot, nurture, closed, lost
    property_of_interest = Column(String(255), nullable=True)

    # Financial
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Contact preferences
    preferred_contact_method = Column(String(50), nullable=True, default="email")
    do_not_disturb = Column(Boolean, default=False)

    # Timestamps
    first_contacted_at = Column(DateTime, nullable=True)
    last_contacted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )