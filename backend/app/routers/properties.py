"""
Properties router.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.property import Property
from app.schemas import PropertyCreate, PropertyOut, PropertyUpdate, MessageResponse
from .auth import get_current_user_id as require_auth

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=List[PropertyOut])
def list_properties(
    user_id: str = Depends(require_auth),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(Property).filter(Property.owner_id == user_id)
    if status:
        q = q.filter(Property.status == status)
    return q.order_by(Property.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PropertyOut, status_code=201)
def create_property(body: PropertyCreate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    prop = Property(owner_id=user_id, **body.model_dump())
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop


@router.put("/{property_id}", response_model=PropertyOut)
def update_property(property_id: str, body: PropertyUpdate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(prop, key, val)
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", response_model=MessageResponse)
def delete_property(property_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    db.delete(prop)
    db.commit()
    return MessageResponse(message="Property deleted")


@router.post("/{property_id}/analyze", response_model=PropertyOut)
def analyze_property(property_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    """Run deal analysis on a property: cap rate, cash-on-cash, ROI."""
    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    # Basic analysis calculations
    if prop.estimated_value and prop.monthly_rent:
        annual_noi = (prop.monthly_rent * 12) - (prop.hoa_dues * 12 if prop.hoa_dues else 0)
        if prop.estimated_value > 0:
            prop.cap_rate = round((annual_noi / prop.estimated_value) * 100, 2)

    if prop.purchase_price and prop.monthly_rent:
        down_payment = prop.purchase_price * 0.20
        annual_cash_flow = (prop.monthly_rent * 12) - (prop.hoa_dues * 12 if prop.hoa_dues else 0)
        if down_payment > 0 and annual_cash_flow > 0:
            prop.cash_on_cash_return = round((annual_cash_flow / down_payment) * 100, 2)

    if prop.purchase_price and prop.monthly_rent and prop.purchase_price > 0:
        prop.gross_yield = round(((prop.monthly_rent * 12) / prop.purchase_price) * 100, 2)

    db.commit()
    db.refresh(prop)
    return prop