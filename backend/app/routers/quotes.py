from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.quote import QuoteStatus
from app.schemas.quote import QuoteCreate, QuoteOut, QuoteUpdate, QuoteItemCreate, QuoteItemUpdate
from app.services.quotes import (
    create_quote, list_quotes, get_quote_by_id, update_quote, delete_quote,
    add_quote_item, update_quote_item, delete_quote_item,
    QuoteConsistencyError, InvalidStatusTransition,
)

router = APIRouter(prefix="/quotes", tags=["quotes"])
items_router = APIRouter(prefix="/quote-items", tags=["quotes"])


@router.post("/", response_model=QuoteOut, status_code=201)
def create_quote_endpoint(quote_in: QuoteCreate, db: Session = Depends(get_db)):
    try:
        return create_quote(db, quote_in)
    except QuoteConsistencyError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid provider_id, customer_id, or job_id")


@router.get("/", response_model=List[QuoteOut])
def list_quotes_endpoint(
    db: Session = Depends(get_db),
    provider_id: Optional[int] = Query(None),
    status: Optional[QuoteStatus] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_quotes(db, provider_id=provider_id, status=status, limit=limit, offset=offset)


@router.get("/{quote_id}", response_model=QuoteOut)
def read_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.patch("/{quote_id}", response_model=QuoteOut)
def patch_quote(quote_id: int, payload: QuoteUpdate, db: Session = Depends(get_db)):
    try:
        quote = update_quote(db, quote_id, payload)
        if not quote:
            raise HTTPException(status_code=404, detail="Quote not found")
        return quote
    except InvalidStatusTransition as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.delete("/{quote_id}", status_code=204)
def remove_quote(quote_id: int, db: Session = Depends(get_db)):
    deleted = delete_quote(db, quote_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quote not found")


@router.post("/{quote_id}/items", response_model=QuoteOut, status_code=201)
def add_quote_item_endpoint(quote_id: int, item_in: QuoteItemCreate, db: Session = Depends(get_db)):
    quote = add_quote_item(db, quote_id, item_in)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@items_router.patch("/{item_id}", response_model=QuoteOut)
def patch_quote_item(item_id: int, payload: QuoteItemUpdate, db: Session = Depends(get_db)):
    quote = update_quote_item(db, item_id, payload)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote item not found")
    return quote


@items_router.delete("/{item_id}", status_code=204)
def remove_quote_item(item_id: int, db: Session = Depends(get_db)):
    deleted = delete_quote_item(db, item_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quote item not found")
