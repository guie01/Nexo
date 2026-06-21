"""
Development-only endpoints for demo data management.
Blocked in production via APP_ENV environment variable check.
"""
import os

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.provider import Provider
from app.services.demo import is_seeded, reset_demo, seed_demo

router = APIRouter(prefix="/dev", tags=["dev"])


def _require_dev():
    if os.getenv("APP_ENV", "development") == "production":
        raise HTTPException(status_code=403, detail="Not available in production")


class SeedRequest(BaseModel):
    provider_id: int
    reset: bool = False


@router.post("/seed")
def seed_endpoint(body: SeedRequest, db: Session = Depends(get_db)):
    _require_dev()

    provider = db.query(Provider).filter(Provider.id == body.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    if body.reset:
        reset_demo(db, body.provider_id)
    elif is_seeded(db, body.provider_id):
        return {"status": "already_seeded", "message": "Demo data already present. Pass reset=true to re-seed."}

    counts = seed_demo(db, body.provider_id)
    return {"status": "seeded", **counts}


@router.post("/reset")
def reset_endpoint(body: SeedRequest, db: Session = Depends(get_db)):
    _require_dev()

    provider = db.query(Provider).filter(Provider.id == body.provider_id).first()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    reset_demo(db, body.provider_id)
    return {"status": "reset"}
