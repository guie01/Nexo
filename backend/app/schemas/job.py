from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from decimal import Decimal

from app.models.job import JobStatus


class JobCreate(BaseModel):
    provider_id: int
    customer_id: int
    title: str
    description: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    estimated_price: Optional[Decimal] = None
    address: Optional[str] = None


class JobOut(BaseModel):
    id: int
    provider_id: int
    customer_id: int
    title: str
    description: Optional[str] = None
    status: JobStatus
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    estimated_price: Optional[Decimal] = None
    final_price: Optional[Decimal] = None
    address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[JobStatus] = None
    scheduled_date: Optional[datetime] = None
    completed_date: Optional[datetime] = None
    estimated_price: Optional[Decimal] = None
    final_price: Optional[Decimal] = None
    address: Optional[str] = None
