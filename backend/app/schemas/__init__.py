"""Pydantic schemas for API request/response validation."""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# ─── Auth ────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ─── Users ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "agent"
    phone: Optional[str] = None
    company: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    firm_id: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    preferences: Optional[str] = None


# ─── Contacts ────────────────────────────────────────────────────────────────

class ContactCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    lead_source: Optional[str] = None
    lead_status: str = "new"
    property_of_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    notes: Optional[str] = None


class ContactOut(BaseModel):
    id: str
    owner_id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    lead_source: Optional[str] = None
    lead_status: str
    property_of_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    notes: Optional[str] = None
    last_contacted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    lead_source: Optional[str] = None
    lead_status: Optional[str] = None
    property_of_interest: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    notes: Optional[str] = None


# ─── Properties ──────────────────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    street_address: str
    city: str
    state: str
    zip_code: str
    county: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    list_price: Optional[float] = None
    purchase_price: Optional[float] = None
    monthly_rent: Optional[float] = None
    hoa_dues: Optional[float] = 0
    status: str = "active"
    source: Optional[str] = None
    source_url: Optional[str] = None
    mls_number: Optional[str] = None
    notes: Optional[str] = None


class PropertyOut(BaseModel):
    id: str
    street_address: str
    city: str
    state: str
    zip_code: str
    county: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    list_price: Optional[float] = None
    estimated_value: Optional[float] = None
    purchase_price: Optional[float] = None
    monthly_rent: Optional[float] = None
    hoa_dues: Optional[float] = None
    cap_rate: Optional[float] = None
    cash_on_cash_return: Optional[float] = None
    roi_percent: Optional[float] = None
    status: str
    source: Optional[str] = None
    mls_number: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PropertyUpdate(BaseModel):
    street_address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    county: Optional[str] = None
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    square_feet: Optional[float] = None
    lot_size: Optional[float] = None
    year_built: Optional[int] = None
    list_price: Optional[float] = None
    purchase_price: Optional[float] = None
    monthly_rent: Optional[float] = None
    hoa_dues: Optional[float] = None
    estimated_value: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


# ─── Deals ───────────────────────────────────────────────────────────────────

class DealCreate(BaseModel):
    contact_id: Optional[str] = None
    property_id: Optional[str] = None
    stage: str = "lead"
    offer_price: Optional[float] = None
    commission_rate: Optional[float] = None
    buyer_side: bool = True
    notes: Optional[str] = None


class DealOut(BaseModel):
    id: str
    user_id: str
    contact_id: Optional[str] = None
    property_id: Optional[str] = None
    stage: str
    offer_price: Optional[float] = None
    closing_price: Optional[float] = None
    commission_rate: Optional[float] = None
    commission_amount: Optional[float] = None
    buyer_side: bool
    showing_date: Optional[datetime] = None
    offer_date: Optional[datetime] = None
    contract_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    target_close_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DealUpdate(BaseModel):
    stage: Optional[str] = None
    offer_price: Optional[float] = None
    closing_price: Optional[float] = None
    commission_rate: Optional[float] = None
    buyer_side: Optional[bool] = None
    showing_date: Optional[datetime] = None
    offer_date: Optional[datetime] = None
    contract_date: Optional[datetime] = None
    closing_date: Optional[datetime] = None
    target_close_date: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


# ─── Tasks ───────────────────────────────────────────────────────────────────

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deal_id: Optional[str] = None
    contact_id: Optional[str] = None
    status: str = "todo"
    priority: str = "medium"
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    is_recurring: bool = False
    recurring_interval: Optional[str] = None


class TaskOut(BaseModel):
    id: str
    user_id: str
    deal_id: Optional[str] = None
    contact_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    due_date: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    assigned_to: Optional[str] = None
    is_recurring: bool
    recurring_interval: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    due_date: Optional[datetime] = None
    assigned_to: Optional[str] = None


# ─── Portfolios ──────────────────────────────────────────────────────────────

class PortfolioCreate(BaseModel):
    name: str
    description: Optional[str] = None


class PortfolioOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    total_invested: Optional[float] = None
    total_equity: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PortfolioUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_invested: Optional[float] = None
    total_equity: Optional[float] = None
    monthly_income: Optional[float] = None
    monthly_expenses: Optional[float] = None


# ─── Generic ─────────────────────────────────────────────────────────────────

class MessageResponse(BaseModel):
    message: str


class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 50
