"""
Nurture / Follow-up router — manages auto-nurture sequences for Viktor to execute.
"""
import json
from datetime import datetime, timezone, timedelta
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.events import fire_event
from app.models.contact import Contact
from app.models.nurture import FollowUpSequence, FollowUpLog
from app.models.deal import Deal
from app.schemas import MessageResponse
from .auth import get_current_user_id as require_auth

router = APIRouter(prefix="/nurture", tags=["nurture"])


# ─── Pydantic Schemas ───────────────────────────────────────────────────────

class SequenceStep(BaseModel):
    step: int
    delay_days: int = 0
    subject: Optional[str] = None
    template: str = ""


class SequenceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    trigger_event: str = "new_lead"
    trigger_days: Optional[int] = None
    channel: str = "email"
    steps: list[SequenceStep] = [
        SequenceStep(step=1, delay_days=0, subject="Thanks for your interest!",
                     template="Hi {{contact_name}},\n\nThank you for reaching out! I'd love to help you find the perfect property.\n\nCould you let me know what you're looking for?\n\nBest,\n{{agent_name}}"),
        SequenceStep(step=2, delay_days=3, subject="Still looking?",
                     template="Hi {{contact_name}},\n\nJust checking in! I have some new listings that might interest you.\n\nWould you like to schedule a call?\n\nBest,\n{{agent_name}}"),
        SequenceStep(step=3, delay_days=7, subject="Last chance for this month's deals",
                     template="Hi {{contact_name}},\n\nI wanted to reach out one last time. If you're still in the market, I'd love to help.\n\nBest,\n{{agent_name}}"),
    ]
    is_active: bool = True


class SequenceOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    trigger_event: str
    trigger_days: Optional[int] = None
    channel: str
    steps: Any  # JSON array
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SequenceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    trigger_event: Optional[str] = None
    trigger_days: Optional[int] = None
    channel: Optional[str] = None
    steps: Optional[list[SequenceStep]] = None
    is_active: Optional[bool] = None


class LogOut(BaseModel):
    id: str
    sequence_id: str
    contact_id: str
    step_number: int
    channel: str
    subject: Optional[str] = None
    message_body: Optional[str] = None
    status: str
    sent_at: datetime
    responded_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Helper Functions ───────────────────────────────────────────────────────

def render_template(template: str, contact: Contact, agent_name: str = "Your Agent") -> str:
    """Replace template variables with actual values."""
    first_name = contact.name.split()[0] if contact.name else "there"
    return (
        template
        .replace("{{contact_name}}", contact.name or "there")
        .replace("{{first_name}}", first_name)
        .replace("{{agent_name}}", agent_name)
        .replace("{{contact_email}}", contact.email or "")
        .replace("{{contact_phone}}", contact.phone or "")
    )


def check_triggers_for_contact(contact: Contact, db: Session) -> list[FollowUpSequence]:
    """Check which sequences should trigger for a given contact."""
    sequences = db.query(FollowUpSequence).filter(
        FollowUpSequence.is_active == True
    ).all()

    triggered: list[FollowUpSequence] = []

    for seq in sequences:
        if seq.trigger_event == "new_lead" and contact.lead_status == "new":
            triggered.append(seq)
            continue

        if seq.trigger_event == "no_response_for_days" and seq.trigger_days:
            if contact.last_contacted_at:
                days_since = (datetime.now(timezone.utc) - contact.last_contacted_at).days
                if days_since >= seq.trigger_days:
                    triggered.append(seq)
                    continue

    return triggered


# ─── CRUD Endpoints ─────────────────────────────────────────────────────────

@router.get("", response_model=List[SequenceOut])
def list_sequences(
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    return db.query(FollowUpSequence).filter(
        FollowUpSequence.user_id == user_id
    ).order_by(FollowUpSequence.created_at.desc()).all()


@router.post("", response_model=SequenceOut, status_code=201)
def create_sequence(
    body: SequenceCreate,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    seq = FollowUpSequence(
        user_id=user_id,
        name=body.name,
        description=body.description,
        trigger_event=body.trigger_event,
        trigger_days=body.trigger_days,
        channel=body.channel,
        steps=json.dumps([s.model_dump() for s in body.steps]),
        is_active=body.is_active,
    )
    db.add(seq)
    db.commit()
    db.refresh(seq)
    return seq


@router.get("/{sequence_id}", response_model=SequenceOut)
def get_sequence(
    sequence_id: str,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    seq = db.query(FollowUpSequence).filter(
        FollowUpSequence.id == sequence_id,
        FollowUpSequence.user_id == user_id,
    ).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    return seq


@router.put("/{sequence_id}", response_model=SequenceOut)
def update_sequence(
    sequence_id: str,
    body: SequenceUpdate,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    seq = db.query(FollowUpSequence).filter(
        FollowUpSequence.id == sequence_id,
        FollowUpSequence.user_id == user_id,
    ).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")

    update_data = body.model_dump(exclude_unset=True)
    if "steps" in update_data and update_data["steps"] is not None:
        update_data["steps"] = json.dumps([s.model_dump() for s in update_data["steps"]])

    for key, val in update_data.items():
        setattr(seq, key, val)

    db.commit()
    db.refresh(seq)
    return seq


@router.delete("/{sequence_id}", response_model=MessageResponse)
def delete_sequence(
    sequence_id: str,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    seq = db.query(FollowUpSequence).filter(
        FollowUpSequence.id == sequence_id,
        FollowUpSequence.user_id == user_id,
    ).first()
    if not seq:
        raise HTTPException(status_code=404, detail="Sequence not found")
    db.delete(seq)
    db.commit()
    return MessageResponse(message="Sequence deleted")


# ─── Trigger & Execution Endpoints ──────────────────────────────────────────

@router.post("/check-triggers", response_model=List[dict[str, Any]])
def check_triggers(
    user_id: str = Depends(require_auth),
    contact_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Check all active sequences for trigger matches against the user's contacts.
    Returns which sequences would fire for which contacts.
    This is what Viktor would poll or we'd run on a schedule.
    """
    contacts_query = db.query(Contact).filter(Contact.owner_id == user_id)
    if contact_id:
        contacts_query = contacts_query.filter(Contact.id == contact_id)

    contacts = contacts_query.all()
    matches: list[dict[str, Any]] = []

    for contact in contacts:
        triggered = check_triggers_for_contact(contact, db)
        for seq in triggered:
            # Check if already sent last step
            last_log = db.query(FollowUpLog).filter(
                FollowUpLog.sequence_id == seq.id,
                FollowUpLog.contact_id == contact.id,
            ).order_by(FollowUpLog.step_number.desc()).first()

            next_step = 1
            if last_log:
                next_step = last_log.step_number + 1

            steps = json.loads(seq.steps) if isinstance(seq.steps, str) else seq.steps

            if next_step <= len(steps):
                step_data = steps[next_step - 1]
                rendered = render_template(step_data["template"], contact)
                matches.append({
                    "contact_id": contact.id,
                    "contact_name": contact.name,
                    "sequence_id": seq.id,
                    "sequence_name": seq.name,
                    "channel": seq.channel,
                    "step": next_step,
                    "subject": step_data.get("subject", ""),
                    "rendered_template": rendered,
                    "trigger_event": seq.trigger_event,
                })

    return matches


@router.post("/send", response_model=MessageResponse)
def send_follow_up(
    sequence_id: str = Query(...),
    contact_id: str = Query(...),
    step: int = Query(1),
    channel: str = Query("email"),
    subject: Optional[str] = Query(None),
    message_body: str = Query(...),
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Log a sent follow-up. Viktor calls this after sending the message.
    """
    contact = db.query(Contact).filter(
        Contact.id == contact_id,
        Contact.owner_id == user_id,
    ).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")

    log = FollowUpLog(
        sequence_id=sequence_id,
        contact_id=contact_id,
        step_number=step,
        channel=channel,
        subject=subject,
        message_body=message_body,
        status="sent",
        drafted_by_viktor=True,
    )
    db.add(log)

    # Update contact's last_contacted_at
    contact.last_contacted_at = datetime.now(timezone.utc)

    db.commit()

    fire_event("nurture_message_sent", {
        "sequence_id": sequence_id,
        "contact_id": contact_id,
        "step": step,
        "channel": channel,
    })

    return MessageResponse(message=f"Follow-up sent to {contact.name}")


@router.get("/logs", response_model=List[LogOut])
def list_logs(
    user_id: str = Depends(require_auth),
    contact_id: Optional[str] = Query(None),
    sequence_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get follow-up logs for monitoring."""
    q = db.query(FollowUpLog).join(
        FollowUpSequence,
        FollowUpLog.sequence_id == FollowUpSequence.id,
    ).filter(FollowUpSequence.user_id == user_id)

    if contact_id:
        q = q.filter(FollowUpLog.contact_id == contact_id)
    if sequence_id:
        q = q.filter(FollowUpLog.sequence_id == sequence_id)

    return q.order_by(FollowUpLog.sent_at.desc()).limit(limit).all()


@router.post("/log-response", response_model=MessageResponse)
def log_response(
    log_id: str = Query(...),
    response_status: str = Query(..., regex="^(opened|clicked|replied|unsubscribed)$"),
    db: Session = Depends(get_db),
):
    """
    Viktor calls this when a lead responds to a follow-up.
    Updates the log status and fires a lead_responded event.
    """
    log = db.query(FollowUpLog).filter(FollowUpLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    log.status = response_status
    if response_status == "replied":
        log.responded_at = datetime.now(timezone.utc)

    db.commit()

    fire_event("lead_responded", {
        "log_id": log_id,
        "contact_id": log.contact_id,
        "sequence_id": log.sequence_id,
        "response_status": response_status,
    })

    return MessageResponse(message=f"Response '{response_status}' logged")


# ─── Default Templates Endpoint ─────────────────────────────────────────────

@router.get("/templates/defaults", response_model=List[dict[str, Any]])
def get_default_templates():
    """
    Return the default follow-up templates that agents can start with.
    """
    return [
        {
            "name": "New Lead Welcome",
            "trigger": "new_lead",
            "channel": "email",
            "steps": [
                {"step": 1, "delay_days": 0, "subject": "Thanks for your interest!",
                 "template": "Hi {{first_name}},\n\nThanks for reaching out! I'd love to help you find the perfect property.\n\nWhat type of property are you looking for?\n\nBest,\n{{agent_name}}"},
                {"step": 2, "delay_days": 3, "subject": "Just checking in",
                 "template": "Hi {{first_name}},\n\nJust checking in! I have some new listings that might interest you.\n\nWould you like to schedule a call?\n\nBest,\n{{agent_name}}"},
            ],
        },
        {
            "name": "No Response Follow-up",
            "trigger": "no_response_for_days",
            "trigger_days": 7,
            "channel": "email",
            "steps": [
                {"step": 1, "delay_days": 0, "subject": "Still in the market?",
                 "template": "Hi {{first_name}},\n\nIt's been a while since we last spoke. Are you still looking for a property?\n\nI'd love to help if you are!\n\nBest,\n{{agent_name}}"},
                {"step": 2, "delay_days": 7, "subject": "One more thing...",
                 "template": "Hi {{first_name}},\n\nJust wanted to reach out one last time. If you're still in the market, I'm here to help.\n\nBest,\n{{agent_name}}"},
            ],
        },
        {
            "name": "Quick SMS Follow-up",
            "trigger": "new_lead",
            "channel": "sms",
            "steps": [
                {"step": 1, "delay_days": 0, "template": "Hi {{first_name}}! Thanks for your interest. Want to chat about what you're looking for?"},
                {"step": 2, "delay_days": 2, "template": "Hey {{first_name}} — just checking in. Any questions about the properties you saw?"},
            ],
        },
    ]