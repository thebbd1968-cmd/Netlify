"""
FollowUpSequence model — stores automated nurture sequences.
A sequence defines WHEN to trigger (trigger_event), WHAT message to send (templates),
and HOW often (interval_days) for multi-step sequences.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, Float, ForeignKey
from sqlalchemy.dialects.sqlite import TEXT as SQLiteText

from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class FollowUpSequence(Base):
    """A nurture sequence with triggers, templates, and schedule."""
    __tablename__ = "follow_up_sequences"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    # Sequence identity
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Trigger: what event starts this sequence
    trigger_event = Column(String(100), nullable=False, default="new_lead")
        # new_lead, no_response_for_days, deal_stage_change, birthday, listing_expiring

    # For "no_response_for_days" trigger
    trigger_days = Column(Integer, nullable=True, default=7)

    # Target channel
    channel = Column(String(20), nullable=False, default="email")
        # email, sms, both

    # Multi-step: each step has a template and delay
    steps = Column(SQLiteText, nullable=True)
        # JSON array: [{"step":1, "delay_days":0, "subject":"...", "template":"..."}, ...]

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )


class FollowUpLog(Base):
    """Tracks sent follow-ups to avoid duplicates and log history."""
    __tablename__ = "follow_up_logs"

    id = Column(String(36), primary_key=True, default=_uuid)
    sequence_id = Column(String(36), ForeignKey("follow_up_sequences.id"), nullable=False)
    contact_id = Column(String(36), ForeignKey("contacts.id"), nullable=False)

    step_number = Column(Integer, nullable=False, default=1)
    channel = Column(String(20), nullable=False)  # email or sms

    # What was sent
    subject = Column(String(255), nullable=True)
    message_body = Column(Text, nullable=True)

    # Status
    status = Column(String(50), nullable=False, default="sent")
        # sent, delivered, opened, clicked, replied, failed

    # Viktor integration — was this drafted by Viktor?
    drafted_by_viktor = Column(Boolean, default=True)

    # Timestamps
    sent_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    responded_at = Column(DateTime, nullable=True)