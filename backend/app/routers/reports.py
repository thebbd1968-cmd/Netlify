"""
Reports router — aggregated performance data.
"""
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.deal import Deal
from app.models.contact import Contact
from app.models.task import Task
from app.models.property import Property
from .auth import get_current_user_id as require_auth

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/gci")
def get_gci_report(
    user_id: str = Depends(require_auth),
    timeframe: str = Query("month", regex="^(month|quarter|year)$"),
    db: Session = Depends(get_db),
):
    """
    Get Gross Commission Income stats.
    Returns total GCI, pending GCI, and deal counts.
    """
    deals = db.query(Deal).filter(Deal.user_id == user_id).all()

    closed_deals = [d for d in deals if d.stage == "closed"]
    active_deals = [d for d in deals if d.status == "active"]

    # Calculate commissions
    total_gci = 0.0
    pending_gci = 0.0

    for deal in deals:
        if deal.closing_price and deal.commission_rate:
            commission = deal.closing_price * (deal.commission_rate / 100)
            if deal.stage == "closed":
                total_gci += commission
            else:
                pending_gci += commission

    # Pipeline value (sum of offer prices for active deals)
    pipeline_value = sum(d.offer_price or 0 for d in active_deals)

    return {
        "total_gci": round(total_gci, 2),
        "pending_gci": round(pending_gci, 2),
        "closed_deals_count": len(closed_deals),
        "active_deals_count": len(active_deals),
        "pipeline_value": round(pipeline_value, 2),
        "timeframe": timeframe,
    }


@router.get("/summary")
def get_full_summary(
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    """
    Full dashboard summary — all counts and metrics in one call.
    """
    deals = db.query(Deal).filter(Deal.user_id == user_id).all()
    contacts = db.query(Contact).filter(Contact.owner_id == user_id).count()
    properties = db.query(Property).filter(Property.owner_id == user_id).count()
    tasks = db.query(Task).filter(Task.user_id == user_id).all()

    pending_tasks = len([t for t in tasks if t.status != "done"])
    active_deals = [d for d in deals if d.status == "active"]

    # Pipeline breakdown
    stages = {"lead": 0, "showing": 0, "offer": 0, "under_contract": 0, "closed": 0}
    for d in active_deals:
        if d.stage in stages:
            stages[d.stage] += 1

    # Commission totals
    total_gci = sum(
        (d.closing_price or 0) * (d.commission_rate or 0) / 100
        for d in deals if d.stage == "closed"
    )
    pending_gci = sum(
        (d.closing_price or 0) * (d.commission_rate or 0) / 100
        for d in deals if d.stage != "closed" and d.status == "active"
    )

    return {
        "deals": {
            "total": len(deals),
            "active": len(active_deals),
            "pipeline": stages,
            "total_gci": round(total_gci, 2),
            "pending_gci": round(pending_gci, 2),
            "pipeline_value": round(sum(d.offer_price or 0 for d in active_deals), 2),
        },
        "contacts": contacts,
        "properties": properties,
        "tasks": {
            "total": len(tasks),
            "pending": pending_tasks,
        },
    }