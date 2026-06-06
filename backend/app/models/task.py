"""
Task model — kanban-style task management for deal stages.
Used for workflows, follow-ups, and transaction checklists.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Boolean, DateTime, Text, Integer, ForeignKey
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String(36), primary_key=True, default=_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    deal_id = Column(String(36), ForeignKey("deals.id"), nullable=True)
    contact_id = Column(String(36), ForeignKey("contacts.id"), nullable=True)

    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Kanban status
    status = Column(String(50), nullable=False, default="todo")
        # backlog, todo, in_progress, review, done

    # Priority
    priority = Column(String(20), nullable=False, default="medium")
        # low, medium, high, urgent

    # Dates
    due_date = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Assignment
    assigned_to = Column(String(36), nullable=True)

    # Recurring
    is_recurring = Column(Boolean, default=False)
    recurring_interval = Column(String(50), nullable=True)
        # daily, weekly, monthly

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )