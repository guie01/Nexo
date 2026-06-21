from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.provider import ProviderCreate, ProviderOut, ProviderUpdate
from app.services.providers import (
    create_provider, list_providers, get_provider_by_id, update_provider, delete_provider,
)

router = APIRouter(prefix="/providers", tags=["providers"])


@router.post("/", response_model=ProviderOut, status_code=201)
def create_provider_endpoint(provider_in: ProviderCreate, db: Session = Depends(get_db)):
    try:
        return create_provider(db, provider_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Provider email already registered")


@router.get("/", response_model=List[ProviderOut])
def list_providers_endpoint(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_providers(db, limit=limit, offset=offset)


@router.get("/{provider_id}", response_model=ProviderOut)
def read_provider(provider_id: int, db: Session = Depends(get_db)):
    provider = get_provider_by_id(db, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


@router.patch("/{provider_id}", response_model=ProviderOut)
def patch_provider(provider_id: int, payload: ProviderUpdate, db: Session = Depends(get_db)):
    try:
        provider = update_provider(db, provider_id, payload)
        if not provider:
            raise HTTPException(status_code=404, detail="Provider not found")
        return provider
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Provider email already registered")


@router.delete("/{provider_id}", status_code=204)
def remove_provider(provider_id: int, db: Session = Depends(get_db)):
    deleted = delete_provider(db, provider_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Provider not found")
