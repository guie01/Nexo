from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate


def create_customer(db: Session, customer_in: CustomerCreate):
    customer = Customer(**customer_in.model_dump())
    db.add(customer)
    db.commit()
    db.refresh(customer)
    return customer


def list_customers(db: Session, limit: int = 50, offset: int = 0, provider_id: int = None):
    q = db.query(Customer)
    if provider_id is not None:
        q = q.filter(Customer.provider_id == provider_id)
    return q.offset(offset).limit(limit).all()


def get_customer_by_id(db: Session, customer_id: int):
    return db.query(Customer).filter(Customer.id == customer_id).first()


def update_customer(db: Session, customer_id: int, customer_update: CustomerUpdate):
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        return None
    for field, value in customer_update.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> bool:
    customer = get_customer_by_id(db, customer_id)
    if not customer:
        return False
    db.delete(customer)
    db.commit()
    return True
