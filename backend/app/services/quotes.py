from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.quote import Quote, QuoteItem, QuoteStatus
from app.models.customer import Customer
from app.models.job import Job
from app.schemas.quote import QuoteCreate, QuoteUpdate, QuoteItemCreate, QuoteItemUpdate


VALID_TRANSITIONS = {
    QuoteStatus.draft:    {QuoteStatus.sent},
    QuoteStatus.sent:     {QuoteStatus.accepted, QuoteStatus.rejected, QuoteStatus.expired},
    QuoteStatus.rejected: {QuoteStatus.draft},
    QuoteStatus.expired:  {QuoteStatus.draft},
    QuoteStatus.accepted: set(),
}


class QuoteConsistencyError(Exception):
    pass


class InvalidStatusTransition(Exception):
    pass


def _recalculate_totals(db: Session, quote: Quote) -> None:
    items = db.query(QuoteItem).filter(QuoteItem.quote_id == quote.id).all()
    subtotal = sum((item.line_total for item in items), Decimal("0"))
    discount = quote.discount if quote.discount is not None else Decimal("0")
    tax = quote.tax if quote.tax is not None else Decimal("0")
    quote.subtotal = subtotal
    quote.total = subtotal - discount + tax


def _validate_references(db: Session, provider_id: int, customer_id: int, job_id: Optional[int]) -> None:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer or customer.provider_id != provider_id:
        raise QuoteConsistencyError("Customer does not belong to the specified provider")

    if job_id is not None:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job or job.provider_id != provider_id:
            raise QuoteConsistencyError("Job does not belong to the specified provider")


def create_quote(db: Session, quote_in: QuoteCreate):
    _validate_references(db, quote_in.provider_id, quote_in.customer_id, quote_in.job_id)

    count = db.query(Quote).filter(Quote.provider_id == quote_in.provider_id).count()
    quote_number = f"Q{count + 1:04d}"

    quote = Quote(
        provider_id=quote_in.provider_id,
        customer_id=quote_in.customer_id,
        job_id=quote_in.job_id,
        quote_number=quote_number,
        status=QuoteStatus.draft,
        subtotal=Decimal("0"),
        discount=quote_in.discount or Decimal("0"),
        tax=quote_in.tax or Decimal("0"),
        total=Decimal("0") - (quote_in.discount or Decimal("0")) + (quote_in.tax or Decimal("0")),
        notes=quote_in.notes,
        valid_until=quote_in.valid_until,
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote


def list_quotes(
    db: Session,
    provider_id: Optional[int] = None,
    status: Optional[QuoteStatus] = None,
    limit: int = 50,
    offset: int = 0,
):
    query = db.query(Quote)
    if provider_id is not None:
        query = query.filter(Quote.provider_id == provider_id)
    if status is not None:
        query = query.filter(Quote.status == status)
    return query.offset(offset).limit(limit).all()


def get_quote_by_id(db: Session, quote_id: int):
    return db.query(Quote).filter(Quote.id == quote_id).first()


def update_quote(db: Session, quote_id: int, quote_update: QuoteUpdate):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        return None

    updates = quote_update.model_dump(exclude_unset=True)

    if "status" in updates:
        new_status = updates["status"]
        if new_status not in VALID_TRANSITIONS[quote.status]:
            raise InvalidStatusTransition(
                f"Cannot transition from '{quote.status.value}' to '{new_status.value}'"
            )

    for field, value in updates.items():
        setattr(quote, field, value)

    if "discount" in updates or "tax" in updates:
        _recalculate_totals(db, quote)

    db.commit()
    db.refresh(quote)
    return quote


def delete_quote(db: Session, quote_id: int) -> bool:
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        return False
    db.delete(quote)
    db.commit()
    return True


def add_quote_item(db: Session, quote_id: int, item_in: QuoteItemCreate):
    quote = get_quote_by_id(db, quote_id)
    if not quote:
        return None

    line_total = item_in.quantity * item_in.unit_price

    item = QuoteItem(
        quote_id=quote_id,
        description=item_in.description,
        quantity=item_in.quantity,
        unit_price=item_in.unit_price,
        line_total=line_total,
    )
    db.add(item)
    db.flush()

    _recalculate_totals(db, quote)
    db.commit()
    db.refresh(quote)
    return quote


def update_quote_item(db: Session, item_id: int, item_update: QuoteItemUpdate):
    item = db.query(QuoteItem).filter(QuoteItem.id == item_id).first()
    if not item:
        return None

    updates = item_update.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(item, field, value)

    item.line_total = item.quantity * item.unit_price

    quote = get_quote_by_id(db, item.quote_id)
    _recalculate_totals(db, quote)

    db.commit()
    db.refresh(quote)
    return quote


def delete_quote_item(db: Session, item_id: int) -> bool:
    item = db.query(QuoteItem).filter(QuoteItem.id == item_id).first()
    if not item:
        return False

    quote = get_quote_by_id(db, item.quote_id)
    db.delete(item)
    db.flush()

    _recalculate_totals(db, quote)
    db.commit()
    return True
