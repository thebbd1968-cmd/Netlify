"""
Property model — listings, off-market properties, and tracked assets.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Float, Integer, ForeignKey
from sqlalchemy.dialects.sqlite import TEXT as SQLiteText

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Property(Base):
    __tablename__ = "properties"

    id = Column(String(36), primary_key=True, default=_uuid)
    owner_id = Column(String(36), ForeignKey("users.id"), nullable=True)

    # Address
    street_address = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(50), nullable=False)
    zip_code = Column(String(20), nullable=False)
    county = Column(String(100), nullable=True)

    # Property details
    property_type = Column(String(50), nullable=True)
        # single_family, multi_family, condo, townhouse, commercial, land
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Float, nullable=True)
    square_feet = Column(Float, nullable=True)
    lot_size = Column(Float, nullable=True)  # sq ft
    year_built = Column(Integer, nullable=True)

    # Financial
    list_price = Column(Float, nullable=True)
    estimated_value = Column(Float, nullable=True)
    purchase_price = Column(Float, nullable=True)
    monthly_rent = Column(Float, nullable=True)
    hoa_dues = Column(Float, nullable=True, default=0)

    # Analysis results (cached)
    cap_rate = Column(Float, nullable=True)
    cash_on_cash_return = Column(Float, nullable=True)
    roi_percent = Column(Float, nullable=True)
    gross_yield = Column(Float, nullable=True)

    # Status
    status = Column(String(50), nullable=False, default="active")
        # active, pending, under_contract, sold, off_market, archived

    # Listing source
    source = Column(String(100), nullable=True)
    source_url = Column(Text, nullable=True)
    mls_number = Column(String(100), nullable=True)

    # Metadata
    notes = Column(Text, nullable=True)
    tags = Column(SQLiteText, nullable=True)  # JSON array

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )