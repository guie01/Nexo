from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session

from app.models.job import Job, JobStatus
from app.models.customer import Customer
from app.schemas.job import JobCreate, JobUpdate


VALID_TRANSITIONS = {
    JobStatus.new:         {JobStatus.quoted, JobStatus.cancelled},
    JobStatus.quoted:      {JobStatus.scheduled, JobStatus.cancelled},
    JobStatus.scheduled:   {JobStatus.in_progress, JobStatus.cancelled},
    JobStatus.in_progress: {JobStatus.completed, JobStatus.cancelled},
    JobStatus.completed:   set(),
    JobStatus.cancelled:   set(),
}


class CustomerProviderMismatch(Exception):
    pass


class InvalidStatusTransition(Exception):
    pass


def create_job(db: Session, job_in: JobCreate):
    customer = db.query(Customer).filter(Customer.id == job_in.customer_id).first()
    if not customer or customer.provider_id != job_in.provider_id:
        raise CustomerProviderMismatch()

    job = Job(
        provider_id=job_in.provider_id,
        customer_id=job_in.customer_id,
        title=job_in.title,
        description=job_in.description,
        status=JobStatus.new,
        scheduled_date=job_in.scheduled_date,
        estimated_price=job_in.estimated_price,
        address=job_in.address,
    )
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def list_jobs(
    db: Session,
    provider_id: Optional[int] = None,
    status: Optional[JobStatus] = None,
    limit: int = 50,
    offset: int = 0,
):
    query = db.query(Job)
    if provider_id is not None:
        query = query.filter(Job.provider_id == provider_id)
    if status is not None:
        query = query.filter(Job.status == status)
    return query.offset(offset).limit(limit).all()


def get_job_by_id(db: Session, job_id: int):
    return db.query(Job).filter(Job.id == job_id).first()


def update_job(db: Session, job_id: int, job_update: JobUpdate):
    job = get_job_by_id(db, job_id)
    if not job:
        return None

    updates = job_update.model_dump(exclude_unset=True)

    if "status" in updates:
        new_status = updates["status"]
        if new_status not in VALID_TRANSITIONS[job.status]:
            raise InvalidStatusTransition(
                f"Cannot transition from '{job.status.value}' to '{new_status.value}'"
            )

    for field, value in updates.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


def delete_job(db: Session, job_id: int) -> bool:
    job = get_job_by_id(db, job_id)
    if not job:
        return False
    db.delete(job)
    db.commit()
    return True
