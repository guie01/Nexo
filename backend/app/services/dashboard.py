from decimal import Decimal

from sqlalchemy.orm import Session
from sqlalchemy.sql import func

from app.models.customer import Customer
from app.models.job import Job, JobStatus
from app.models.quote import Quote, QuoteStatus
from app.models.provider import Provider


def get_provider_dashboard(db: Session, provider_id: int):
    if not db.query(Provider).filter(Provider.id == provider_id).first():
        return None

    total_customers = (
        db.query(func.count(Customer.id))
        .filter(Customer.provider_id == provider_id)
        .scalar() or 0
    )

    total_jobs = (
        db.query(func.count(Job.id))
        .filter(Job.provider_id == provider_id)
        .scalar() or 0
    )

    jobs_by_status = {s.value: 0 for s in JobStatus}
    for status, count in (
        db.query(Job.status, func.count(Job.id))
        .filter(Job.provider_id == provider_id)
        .group_by(Job.status)
        .all()
    ):
        jobs_by_status[status.value] = count

    total_quotes = (
        db.query(func.count(Quote.id))
        .filter(Quote.provider_id == provider_id)
        .scalar() or 0
    )

    quotes_by_status = {s.value: 0 for s in QuoteStatus}
    for status, count in (
        db.query(Quote.status, func.count(Quote.id))
        .filter(Quote.provider_id == provider_id)
        .group_by(Quote.status)
        .all()
    ):
        quotes_by_status[status.value] = count

    total_quoted_value = (
        db.query(func.sum(Quote.total))
        .filter(Quote.provider_id == provider_id)
        .scalar()
    ) or Decimal("0")

    accepted_quote_value = (
        db.query(func.sum(Quote.total))
        .filter(Quote.provider_id == provider_id, Quote.status == QuoteStatus.accepted)
        .scalar()
    ) or Decimal("0")

    completed_job_revenue = (
        db.query(func.sum(Job.final_price))
        .filter(Job.provider_id == provider_id, Job.status == JobStatus.completed)
        .scalar()
    ) or Decimal("0")

    average_job_value = (
        db.query(func.avg(Job.final_price))
        .filter(Job.provider_id == provider_id, Job.status == JobStatus.completed)
        .scalar()
    ) or Decimal("0")

    return {
        "provider_id": provider_id,
        "total_customers": total_customers,
        "total_jobs": total_jobs,
        "jobs_by_status": jobs_by_status,
        "total_quotes": total_quotes,
        "quotes_by_status": quotes_by_status,
        "total_quoted_value": total_quoted_value,
        "accepted_quote_value": accepted_quote_value,
        "completed_job_revenue": completed_job_revenue,
        "average_job_value": average_job_value,
    }
