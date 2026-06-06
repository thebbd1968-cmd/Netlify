"""
Portfolio model — investor-focused.
A portfolio groups properties together with financial tracking.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, ForeignKey
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Portfolio(Base):
    __tablename__ = "portfolios"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Portfolio-level financials
    total_invested = Column(Float, nullable=True, default=0)
    total_equity = Column(Float, nullable=True, default=0)
    monthly_income = Column(Float, nullable=True, default=0)
    monthly_expenses = Column(Float, nullable=True, default=0)

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class PortfolioProperty(Base):
    """Junction table: which properties belong to which portfolio."""
    __tablename__ = "portfolio_properties"

    id = Column(String(36), primary_key=True, default=_uuid)
    portfolio_id = Column(String(36), ForeignKey("portfolios.id"), nullable=False)
    property_id = Column(String(36), ForeignKey("properties.id"), nullable=False)

    # Per-property tracking within portfolio
    purchase_price = Column(Float, nullable=True)
    current_value = Column(Float, nullable=True)
    equity = Column(Float, nullable=True, default=0)
    monthly_rent = Column(Float, nullable=True)
    monthly_expenses = Column(Float, nullable=True)

    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))