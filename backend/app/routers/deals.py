"""
Deals router — transaction pipeline management.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deal import Deal
from app.schemas import DealCreate, DealOut, DealUpdate, MessageResponse
from .auth import get_current_user_id as require_auth
from app.events import fire_event, EVENT_DEAL_STAGE_CHANGED

router = APIRouter(prefix="/deals", tags=["deals"])


@router.get("", response_model=List[DealOut])
def list_deals(
    user_id: str = Depends(require_auth),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    stage: str = None,
    status: str = None,
    db: Session = Depends(get_db),
):
    q = db.query(Deal).filter(Deal.user_id == user_id)
    if stage:
        q = q.filter(Deal.stage == stage)
    if status:
        q = q.filter(Deal.status == status)
    return q.order_by(Deal.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=DealOut, status_code=201)
def create_deal(body: DealCreate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    deal = Deal(user_id=user_id, **body.model_dump())
    db.add(deal)
    db.commit()
    db.refresh(deal)
    return deal


@router.get("/{deal_id}", response_model=DealOut)
def get_deal(deal_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal


@router.put("/{deal_id}", response_model=DealOut)
def update_deal(deal_id: str, body: DealUpdate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    old_stage = deal.stage
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(deal, key, val)
    db.commit()
    db.refresh(deal)
    # Fire event if stage changed
    if body.stage and body.stage != old_stage:
        fire_event(EVENT_DEAL_STAGE_CHANGED, {
            "deal_id": deal.id,
            "old_stage": old_stage,
            "new_stage": deal.stage,
            "user_id": user_id,
        })
    return deal


@router.delete("/{deal_id}", response_model=MessageResponse)
def delete_deal(deal_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id, Deal.user_id == user_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return MessageResponse(message="Deal deleted")


@router.get("/pipeline/summary", response_model=dict)
def pipeline_summary(user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    """Get deal counts by stage for the kanban board."""
    deals = db.query(Deal).filter(Deal.user_id == user_id, Deal.status == "active").all()
    stages = {"lead": 0, "showing": 0, "offer": 0, "under_contract": 0, "closed": 0}
    for d in deals:
        if d.stage in stages:
            stages[d.stage] += 1
    return stages