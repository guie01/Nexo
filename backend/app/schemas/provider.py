from typing import Optional
from pydantic import BaseModel, EmailStr


class ProviderCreate(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None
    phone: Optional[str] = None
    service_category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None


class ProviderOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    name: str
    email: EmailStr
    description: Optional[str] = None
    phone: Optional[str] = None
    service_category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None

    model_config = {"from_attributes": True}


class ProviderUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    description: Optional[str] = None
    phone: Optional[str] = None
    service_category: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None