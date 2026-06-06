"""
Viktor Webhooks — endpoints that Viktor calls to send events into our system.
"""
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.events import fire_event, get_event_log
from app.models.contact import Contact
from app.models.task import Task
from app.schemas import MessageResponse
from .auth import get_current_user_id as require_auth

router = APIRouter(prefix="/webhooks/viktor", tags=["viktor-webhooks"])

# Viktor webhook secret for verifying requests
import os
VIKTOR_SECRET = os.getenv("VIKTOR_WEBHOOK_SECRET", "viktor-dev-secret")


class ViktorEventRequest(BaseModel):
    """Schema for events Viktor sends to our system."""
    event_type: str
    payload: dict[str, Any]
    source: Optional[str] = "viktor"


class ViktorEventResponse(BaseModel):
    event_id: str
    status: str
    message: str


@router.post("/event", response_model=ViktorEventResponse)
def handle_viktor_event(body: ViktorEventRequest):
    """
    Viktor sends events here to trigger actions in our system.
    
    Supported event types:
    - lead_responded: A lead responded to a Viktor follow-up
    - task_completed: Viktor completed a task
    - nurture_completed: Viktor finished a nurture sequence
    - analysis_requested: Viktor needs property analysis data
    
    All events are logged and can trigger automated workflows.
    """
    event_id = fire_event(body.event_type, {
        **body.payload,
        "source": body.source,
    })

    if not event_id:
        raise HTTPException(status_code=500, detail="Failed to process event")

    return ViktorEventResponse(
        event_id=event_id,
        status="processed",
        message=f"Event '{body.event_type}' processed successfully",
    )


class UpdateContactStatusRequest(BaseModel):
    """Viktor asks to update a contact's status after nurture."""
    contact_id: str
    lead_status: str
    notes: Optional[str] = None


@router.post("/update-contact-status", response_model=MessageResponse)
def handle_viktor_update_contact(
    body: UpdateContactStatusRequest,
    db: Session = Depends(get_db),
):
    """
    Viktor calls this when a lead responds to an email/SMS.
    Updates the contact's status in our CRM.
    """
    contact = db.query(Contact).filter(Contact.id == body.contact_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    contact.lead_status = body.lead_status
    contact.last_contacted_at = datetime.now(timezone.utc)
    if body.notes:
        existing = contact.notes or ""
        contact.notes = f"[Viktor] {body.notes}\n{existing}"

    db.commit()

    fire_event("lead_responded", {
        "contact_id": contact.id,
        "lead_status": body.lead_status,
        "source": "viktor",
    })

    return MessageResponse(message=f"Contact {body.contact_id} updated to status '{body.lead_status}'")


@router.get("/events", response_model=list[dict[str, Any]])
def list_events(limit: int = 50):
    """
    Get recent event log — useful for debugging Viktor integrations.
    """
    return get_event_log(limit)