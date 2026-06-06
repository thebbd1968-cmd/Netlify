"""
Analysis routers — standalone calculation and market data lookup endpoints.
"""
from typing import Any, Optional, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/analysis", tags=["analysis"])


# ─── POST /analysis/calculate ───────────────────────────────────────────────

class AnalysisCalculateRequest(BaseModel):
    purchase_price: float
    down_payment_percent: float = 20
    monthly_rent: float
    monthly_expenses: float = 0  # taxes, insurance, maintenance, etc.
    hoa_dues: float = 0
    estimated_value: Optional[float] = None


class AnalysisCalculateResponse(BaseModel):
    cap_rate: float
    cash_on_cash_return: Optional[float] = None
    gross_yield: Optional[float] = None
    monthly_cash_flow: float
    annual_noi: float
    down_payment_amount: float
    total_monthly_cost: float


@router.post("/calculate", response_model=AnalysisCalculateResponse)
def calculate_analysis(body: AnalysisCalculateRequest):
    """
    Calculate ROI, Cap Rate, and Cash-on-Cash return from property financials.
    Standalone endpoint — no DB required, just math.
    """
    value = body.estimated_value or body.purchase_price

    # Net Operating Income
    total_monthly_cost = body.monthly_expenses + body.hoa_dues
    monthly_cash_flow = body.monthly_rent - total_monthly_cost
    annual_noi = monthly_cash_flow * 12

    # Cap Rate = NOI / Property Value
    cap_rate = round((annual_noi / value) * 100, 2) if value > 0 else 0.0

    # Cash-on-Cash = Annual Cash Flow / Total Cash Invested
    down_payment_amount = body.purchase_price * (body.down_payment_percent / 100)
    annual_cash_flow = monthly_cash_flow * 12
    cash_on_cash = round((annual_cash_flow / down_payment_amount) * 100, 2) if down_payment_amount > 0 else None

    # Gross Yield = Annual Rent / Purchase Price
    annual_rent = body.monthly_rent * 12
    gross_yield = round((annual_rent / body.purchase_price) * 100, 2) if body.purchase_price > 0 else None

    return AnalysisCalculateResponse(
        cap_rate=cap_rate,
        cash_on_cash_return=cash_on_cash,
        gross_yield=gross_yield,
        monthly_cash_flow=round(monthly_cash_flow, 2),
        annual_noi=round(annual_noi, 2),
        down_payment_amount=round(down_payment_amount, 2),
        total_monthly_cost=round(total_monthly_cost, 2),
    )


# ─── GET /analysis/lookup ───────────────────────────────────────────────────

# Simulated market data for demo purposes
_MARKET_DATA: dict[str, dict[str, Any]] = {
    "123 main st portland or 97201": {
        "estimated_value": 460000,
        "estimated_rent": 2500,
        "tax_history": {"2024": 4200, "2023": 4100, "2022": 3950},
        "neighborhood": "Pearl District",
        "avg_days_on_market": 18,
    },
    "456 oak ave portland or 97202": {
        "estimated_value": 290000,
        "estimated_rent": 1800,
        "tax_history": {"2024": 3200, "2023": 3100, "2022": 3000},
        "neighborhood": "Hawthorne",
        "avg_days_on_market": 22,
    },
    "789 pine rd beaverton or 97005": {
        "estimated_value": 510000,
        "estimated_rent": 3200,
        "tax_history": {"2024": 4800, "2023": 4650, "2022": 4400},
        "neighborhood": "Beaverton Central",
        "avg_days_on_market": 14,
    },
}


@router.get("/lookup")
def lookup_market_data(address: str = Query(..., description="Full property address")):
    """
    Fetch market data for a specific address.
    In production, this would integrate with PropStream, Zillow, or Attom Data.
    Currently returns simulated/sample data for demo addresses.
    """
    normalized = address.lower().strip()
    
    # Try exact match first
    if normalized in _MARKET_DATA:
        return _MARKET_DATA[normalized]
    
    # Try partial match
    for key, data in _MARKET_DATA.items():
        if all(word in key for word in normalized.split()):
            return data
    
    # No match — return simulated generic data with a warning
    return {
        "estimated_value": None,
        "estimated_rent": None,
        "tax_history": None,
        "neighborhood": None,
        "avg_days_on_market": None,
        "note": "Address not found in local database. In production, this would query PropStream/Zillow API.",
    }