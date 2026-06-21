from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime
from decimal import Decimal

from app.models.quote import QuoteStatus


class QuoteItemCreate(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal


class QuoteItemUpdate(BaseModel):
    description: Optional[str] = None
    quantity: Optional[Decimal] = None
    unit_price: Optional[Decimal] = None


class QuoteItemOut(BaseModel):
    id: int
    quote_id: int
    description: str
    quantity: Decimal
    unit_price: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class QuoteCreate(BaseModel):
    provider_id: int
    customer_id: int
    job_id: Optional[int] = None
    discount: Optional[Decimal] = Decimal("0")
    tax: Optional[Decimal] = Decimal("0")
    notes: Optional[str] = None
    valid_until: Optional[date] = None


class QuoteUpdate(BaseModel):
    status: Optional[QuoteStatus] = None
    discount: Optional[Decimal] = None
    tax: Optional[Decimal] = None
    notes: Optional[str] = None
    valid_until: Optional[date] = None


class QuoteOut(BaseModel):
    id: int
    provider_id: int
    customer_id: int
    job_id: Optional[int] = None
    quote_number: str
    status: QuoteStatus
    subtotal: Decimal
    discount: Decimal
    tax: Decimal
    total: Decimal
    notes: Optional[str] = None
    valid_until: Optional[date] = None
    created_at: datetime
    updated_at: datetime
    items: List[QuoteItemOut] = []

    model_config = {"from_attributes": True}
