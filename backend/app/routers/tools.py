"""
Viktor Tools — endpoints specifically designed for Viktor AI to call.
These are custom "tools" that Viktor can discover and use.
"""
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.events import fire_event, EVENT_PROPERTY_ANALYZED
from app.models.contact import Contact
from app.models.property import Property
from app.models.deal import Deal
from app.schemas import MessageResponse

router = APIRouter(prefix="/tools", tags=["viktor-tools"])


class AnalyzeAndDraftRequest(BaseModel):
    """Viktor sends an address and gets back analysis + drafted message."""
    address: str = Field(..., description="Property address to analyze")
    contact_id: Optional[str] = Field(None, description="Contact to draft message for")
    message_type: str = Field("email", description="email or sms")


class AnalysisResult(BaseModel):
    cap_rate: Optional[float] = None
    cash_on_cash_return: Optional[float] = None
    gross_yield: Optional[float] = None
    estimated_value: Optional[float] = None
    monthly_rent: Optional[float] = None


class DraftMessage(BaseModel):
    subject: Optional[str] = None
    body: str


class AnalyzeAndDraftResponse(BaseModel):
    analysis: AnalysisResult
    drafted_message: DraftMessage


@router.post("/analyze-and-draft", response_model=AnalyzeAndDraftResponse)
def analyze_and_draft(body: AnalyzeAndDraftRequest, db: Session = Depends(get_db)):
    """
    Viktor calls this to get a full property analysis AND a drafted
    email/SMS to send to a lead — all in one call.
    
    Steps:
    1. Look up or calculate property analysis
    2. Draft a personalized message for the contact
    """
    # Try to find an existing property by address
    prop = db.query(Property).filter(
        Property.street_address.ilike(body.address)
    ).first()

    analysis = AnalysisResult()

    if prop:
        analysis.estimated_value = prop.estimated_value
        analysis.monthly_rent = prop.monthly_rent
        analysis.cap_rate = prop.cap_rate
        analysis.cash_on_cash_return = prop.cash_on_cash_return
        analysis.gross_yield = prop.gross_yield

        # Run analysis if not already done
        if prop.monthly_rent and prop.estimated_value and not prop.cap_rate:
            annual_noi = (prop.monthly_rent * 12) - (prop.hoa_dues * 12 if prop.hoa_dues else 0)
            if prop.estimated_value > 0:
                prop.cap_rate = round((annual_noi / prop.estimated_value) * 100, 2)
                analysis.cap_rate = prop.cap_rate
            if prop.purchase_price and prop.purchase_price > 0:
                analysis.gross_yield = round(((prop.monthly_rent * 12) / prop.purchase_price) * 100, 2)
            db.commit()
    else:
        # No property found — return partial analysis
        analysis.estimated_value = None
        analysis.monthly_rent = None

    # Draft a message
    contact_name = "there"
    if body.contact_id:
        contact = db.query(Contact).filter(Contact.id == body.contact_id).first()
        if contact:
            contact_name = contact.name.split()[0]  # First name

    drafted_body = _draft_message(contact_name, body.address, analysis, body.message_type)
    drafted_subject = f"Property Analysis: {body.address}" if body.message_type == "email" else None

    # Fire event
    fire_event(EVENT_PROPERTY_ANALYZED, {
        "address": body.address,
        "contact_id": body.contact_id,
        "cap_rate": analysis.cap_rate,
        "message_type": body.message_type,
    })

    return AnalyzeAndDraftResponse(
        analysis=analysis,
        drafted_message=DraftMessage(subject=drafted_subject, body=drafted_body),
    )


def _draft_message(name: str, address: str, analysis: AnalysisResult, msg_type: str) -> str:
    """Generate a personalized email/SMS body for a property analysis."""
    greeting = f"Hi {name}," if name else "Hi there,"
    
    if analysis.cap_rate is not None:
        value_line = f"The property is estimated at ${analysis.estimated_value:,.0f}" if analysis.estimated_value else ""
        rent_line = f" with monthly rent of ${analysis.monthly_rent:,.0f}" if analysis.monthly_rent else ""
        analysis_line = f"\n\nAnalysis highlights:\n• Cap Rate: {analysis.cap_rate}%"
        if analysis.cash_on_cash_return:
            analysis_line += f"\n• Cash-on-Cash Return: {analysis.cash_on_cash_return}%"
        if analysis.gross_yield:
            analysis_line += f"\n• Gross Yield: {analysis.gross_yield}%"
    else:
        value_line = ""
        rent_line = ""
        analysis_line = "\n\nI'd be happy to run a detailed analysis on this property."

    if msg_type == "email":
        body = f"""{greeting}

I analyzed the property at {address}{value_line}{rent_line}.{analysis_line}

Would you like to schedule a time to discuss this further? I'm available to walk through the numbers and answer any questions.

Best regards,
Your Real Estate Advisor"""
    else:
        body = f"""{greeting} I ran the numbers on {address}{value_line}{rent_line}.{analysis_line} Want to chat about it?"""

    return body


class QuickAnalyzeRequest(BaseModel):
    """Simple analysis request for Viktor to get quick numbers."""
    purchase_price: float
    monthly_rent: float
    estimated_value: Optional[float] = None
    hoa_dues: float = 0
    down_payment_percent: float = 20  # Default 20%


class QuickAnalyzeResponse(BaseModel):
    cap_rate: float
    cash_on_cash_return: Optional[float] = None
    gross_yield: Optional[float] = None
    monthly_cash_flow: float


@router.post("/quick-analyze", response_model=QuickAnalyzeResponse)
def quick_analyze(body: QuickAnalyzeRequest):
    """
    Lightweight analysis tool for Viktor — just the numbers, no DB required.
    """
    annual_rent = body.monthly_rent * 12
    annual_expenses = body.hoa_dues * 12
    annual_noi = annual_rent - annual_expenses

    value = body.estimated_value or body.purchase_price
    cap_rate = round((annual_noi / value) * 100, 2) if value > 0 else 0.0

    down_payment = body.purchase_price * (body.down_payment_percent / 100)
    monthly_cash_flow = body.monthly_rent - body.hoa_dues
    annual_cash_flow = monthly_cash_flow * 12
    cash_on_cash = round((annual_cash_flow / down_payment) * 100, 2) if down_payment > 0 else None

    gross_yield = round((annual_rent / body.purchase_price) * 100, 2) if body.purchase_price > 0 else None

    return QuickAnalyzeResponse(
        cap_rate=cap_rate,
        cash_on_cash_return=cash_on_cash,
        gross_yield=gross_yield,
        monthly_cash_flow=monthly_cash_flow,
    )