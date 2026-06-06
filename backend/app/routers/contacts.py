"""
Contacts / CRM router.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.contact import Contact
from app.schemas import ContactCreate, ContactOut, ContactUpdate, MessageResponse
from .auth import get_current_user_id as require_auth
from app.events import fire_event, EVENT_LEAD_CREATED

router = APIRouter(prefix="/contacts", tags=["contacts"])


@router.get("", response_model=List[ContactOut])
def list_contacts(
    user_id: str = Depends(require_auth),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(Contact).filter(Contact.owner_id == user_id)
    if status:
        q = q.filter(Contact.lead_status == status)
    return q.order_by(Contact.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=ContactOut, status_code=201)
def create_contact(body: ContactCreate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    contact = Contact(owner_id=user_id, **body.model_dump())
    db.add(contact)
    db.commit()
    db.refresh(contact)
    # Fire event for Viktor Auto-Nurture
    fire_event(EVENT_LEAD_CREATED, {
        "contact_id": contact.id,
        "name": contact.name,
        "email": contact.email,
        "phone": contact.phone,
        "lead_source": contact.lead_source,
        "lead_status": contact.lead_status,
        "owner_id": user_id,
    })
    return contact


@router.get("/{contact_id}", response_model=ContactOut)
def get_contact(contact_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == user_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    return contact


@router.put("/{contact_id}", response_model=ContactOut)
def update_contact(contact_id: str, body: ContactUpdate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == user_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(contact, key, val)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}", response_model=MessageResponse)
def delete_contact(contact_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    contact = db.query(Contact).filter(Contact.id == contact_id, Contact.owner_id == user_id).first()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    db.delete(contact)
    db.commit()
    return MessageResponse(message="Contact deleted")