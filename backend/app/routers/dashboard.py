from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.dashboard import ProviderDashboard
from app.services.dashboard import get_provider_dashboard

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/providers/{provider_id}", response_model=ProviderDashboard)
def provider_dashboard(provider_id: int, db: Session = Depends(get_db)):
    data = get_provider_dashboard(db, provider_id)
    if data is None:
        raise HTTPException(status_code=404, detail="Provider not found")
    return data
