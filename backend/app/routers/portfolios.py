"""
Portfolios router — investor portfolio tracking.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import Portfolio, PortfolioProperty
from app.models.property import Property
from app.schemas import (
    PortfolioCreate,
    PortfolioOut,
    PortfolioUpdate,
    PropertyOut,
    MessageResponse,
)
from .auth import get_current_user_id as require_auth

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("", response_model=List[PortfolioOut])
def list_portfolios(
    user_id: str = Depends(require_auth),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Portfolio).filter(Portfolio.user_id == user_id)
    return q.order_by(Portfolio.created_at.desc()).offset(skip).limit(limit).all()


@router.post("", response_model=PortfolioOut, status_code=201)
def create_portfolio(body: PortfolioCreate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    portfolio = Portfolio(user_id=user_id, **body.model_dump())
    db.add(portfolio)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.get("/{portfolio_id}", response_model=PortfolioOut)
def get_portfolio(portfolio_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    return portfolio


@router.put("/{portfolio_id}", response_model=PortfolioOut)
def update_portfolio(portfolio_id: str, body: PortfolioUpdate, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    for key, val in body.model_dump(exclude_unset=True).items():
        setattr(portfolio, key, val)
    db.commit()
    db.refresh(portfolio)
    return portfolio


@router.delete("/{portfolio_id}", response_model=MessageResponse)
def delete_portfolio(portfolio_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")
    db.query(PortfolioProperty).filter(PortfolioProperty.portfolio_id == portfolio_id).delete()
    db.delete(portfolio)
    db.commit()
    return MessageResponse(message="Portfolio deleted")


@router.post("/{portfolio_id}/properties/{property_id}", response_model=PropertyOut)
def add_property_to_portfolio(
    portfolio_id: str,
    property_id: str,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    prop = db.query(Property).filter(Property.id == property_id, Property.owner_id == user_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    exists = db.query(PortfolioProperty).filter(
        PortfolioProperty.portfolio_id == portfolio_id,
        PortfolioProperty.property_id == property_id,
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Property already in portfolio")

    link = PortfolioProperty(
        portfolio_id=portfolio_id,
        property_id=property_id,
        purchase_price=prop.purchase_price,
        current_value=prop.estimated_value,
        monthly_rent=prop.monthly_rent,
    )
    db.add(link)
    db.commit()
    return prop


@router.delete("/{portfolio_id}/properties/{property_id}", response_model=MessageResponse)
def remove_property_from_portfolio(
    portfolio_id: str,
    property_id: str,
    user_id: str = Depends(require_auth),
    db: Session = Depends(get_db),
):
    link = (
        db.query(PortfolioProperty)
        .join(Portfolio)
        .filter(
            PortfolioProperty.portfolio_id == portfolio_id,
            PortfolioProperty.property_id == property_id,
            Portfolio.user_id == user_id,
        )
        .first()
    )
    if not link:
        raise HTTPException(status_code=404, detail="Property not found in portfolio")
    db.delete(link)
    db.commit()
    return MessageResponse(message="Property removed from portfolio")


@router.get("/{portfolio_id}/properties", response_model=List[PropertyOut])
def list_portfolio_properties(portfolio_id: str, user_id: str = Depends(require_auth), db: Session = Depends(get_db)):
    portfolio = db.query(Portfolio).filter(Portfolio.id == portfolio_id, Portfolio.user_id == user_id).first()
    if not portfolio:
        raise HTTPException(status_code=404, detail="Portfolio not found")

    links = db.query(PortfolioProperty).filter(PortfolioProperty.portfolio_id == portfolio_id).all()
    property_ids = [l.property_id for l in links]
    properties = db.query(Property).filter(Property.id.in_(property_ids)).all()
    return properties