from typing import Optional
from pydantic import BaseModel, EmailStr


class ProviderCreate(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None


class ProviderOut(BaseModel):
    id: int
    name: str
    email: EmailStr
    description: Optional[str] = None

    model_config = {"from_attributes": True}