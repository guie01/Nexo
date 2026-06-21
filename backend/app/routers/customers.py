from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.customer import CustomerCreate, CustomerOut, CustomerUpdate
from app.services.customers import (
    create_customer, list_customers, get_customer_by_id, update_customer, delete_customer,
)

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("/", response_model=CustomerOut, status_code=201)
def create_customer_endpoint(customer_in: CustomerCreate, db: Session = Depends(get_db)):
    try:
        return create_customer(db, customer_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid provider_id: provider does not exist")


@router.get("/", response_model=List[CustomerOut])
def list_customers_endpoint(
    db: Session = Depends(get_db),
    provider_id: int = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_customers(db, limit=limit, offset=offset, provider_id=provider_id)


@router.get("/{customer_id}", response_model=CustomerOut)
def read_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.patch("/{customer_id}", response_model=CustomerOut)
def patch_customer(customer_id: int, payload: CustomerUpdate, db: Session = Depends(get_db)):
    customer = update_customer(db, customer_id, payload)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.delete("/{customer_id}", status_code=204)
def remove_customer(customer_id: int, db: Session = Depends(get_db)):
    deleted = delete_customer(db, customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
