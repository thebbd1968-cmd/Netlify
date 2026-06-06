"""
User model — agents, investors, brokers, and firm admins.
Supports multi-tenant: each user belongs to a firm/workspace.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.sqlite import TEXT as SQLiteText

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=_uuid)
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=False)

    # Role: agent | investor | broker | admin
    role = Column(String(50), nullable=False, default="agent")

    # Firm / workspace the user belongs to
    firm_id = Column(String(36), nullable=True)

    # Profile
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    avatar_url = Column(Text, nullable=True)

    # Preferences
    preferences = Column(SQLiteText, nullable=True)  # JSON blob

    # Status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )