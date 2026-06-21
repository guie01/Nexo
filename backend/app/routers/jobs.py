from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.job import JobStatus
from app.schemas.job import JobCreate, JobOut, JobUpdate
from app.services.jobs import (
    create_job, list_jobs, get_job_by_id, update_job, delete_job,
    CustomerProviderMismatch, InvalidStatusTransition,
)

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/", response_model=JobOut, status_code=201)
def create_job_endpoint(job_in: JobCreate, db: Session = Depends(get_db)):
    try:
        return create_job(db, job_in)
    except CustomerProviderMismatch:
        raise HTTPException(status_code=422, detail="Customer does not belong to the specified provider")
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=422, detail="Invalid provider_id or customer_id")


@router.get("/", response_model=List[JobOut])
def list_jobs_endpoint(
    db: Session = Depends(get_db),
    provider_id: Optional[int] = Query(None),
    status: Optional[JobStatus] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_jobs(db, provider_id=provider_id, status=status, limit=limit, offset=offset)


@router.get("/{job_id}", response_model=JobOut)
def read_job(job_id: int, db: Session = Depends(get_db)):
    job = get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.patch("/{job_id}", response_model=JobOut)
def patch_job(job_id: int, payload: JobUpdate, db: Session = Depends(get_db)):
    try:
        job = update_job(db, job_id, payload)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        return job
    except InvalidStatusTransition as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.delete("/{job_id}", status_code=204)
def remove_job(job_id: int, db: Session = Depends(get_db)):
    deleted = delete_job(db, job_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Job not found")
