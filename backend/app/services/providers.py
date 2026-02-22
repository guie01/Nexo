from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.provider import Provider
from app.schemas.provider import ProviderCreate


def create_provider(db: Session, provider_in: ProviderCreate) -> Provider:
    provider = Provider(
        name=provider_in.name,
        email=provider_in.email,
        description=provider_in.description,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


def list_providers(db: Session, limit: int = 50, offset: int = 0):
    return (
        db.query(Provider)
        .offset(offset)
        .limit(limit)
        .all()
    )