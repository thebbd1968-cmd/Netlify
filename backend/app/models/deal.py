"""
Deal model — tracks a property transaction from lead-to-closed.
Deal stages: lead -> showing -> offer -> under_contract -> closed
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, ForeignKey
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Deal(Base):
    __tablename__ = "deals"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id"), nullable=True)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=True)

    # Stage tracking (kanban)
    stage = Column(String(50), nullable=False, default="lead")
        # lead -> showing -> offer -> under_contract -> closed

    # Financials
    offer_price = Column(Float, nullable=True)
    closing_price = Column(Float, nullable=True)
    commission_rate = Column(Float, nullable=True)
    commission_amount = Column(Float, nullable=True)
    buyer_side = Column(Boolean, default=True)  # True=buyer's agent, False=seller's

    # Key dates
    showing_date = Column(DateTime, nullable=True)
    offer_date = Column(DateTime, nullable=True)
    contract_date = Column(DateTime, nullable=True)
    closing_date = Column(DateTime, nullable=True)
    target_close_date = Column(DateTime, nullable=True)

    # Notes
    notes = Column(Text, nullable=True)

    # Status
    status = Column(String(50), nullable=False, default="active")
        # active, won, lost, cancelled

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )