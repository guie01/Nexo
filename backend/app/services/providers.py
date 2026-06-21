from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.models.provider import Provider
from app.schemas.provider import ProviderCreate, ProviderUpdate


def create_provider(db: Session, provider_in: ProviderCreate) -> Provider:
    provider = Provider(
        name=provider_in.name,
        email=provider_in.email,
        description=provider_in.description,
        phone=provider_in.phone,
        service_category=provider_in.service_category,
        city=provider_in.city,
        country=provider_in.country,
    )
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return provider


def create_provider_for_user(db: Session, user_id: int, provider_in: ProviderCreate) -> Provider:
    provider = Provider(
        user_id=user_id,
        name=provider_in.name,
        email=provider_in.email,
        description=provider_in.description,
        phone=provider_in.phone,
        service_category=provider_in.service_category,
        city=provider_in.city,
        country=provider_in.country,
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


def get_provider_by_id(db: Session, provider_id: int):
    return db.query(Provider).filter(Provider.id == provider_id).first()


def get_provider_by_user_id(db: Session, user_id: int):
    return db.query(Provider).filter(Provider.user_id == user_id).first()


def update_provider(db: Session, provider_id: int, provider_update: ProviderUpdate):
    provider = get_provider_by_id(db, provider_id)
    if not provider:
        return None
    for field, value in provider_update.model_dump(exclude_unset=True).items():
        setattr(provider, field, value)
    db.commit()
    db.refresh(provider)
    return provider


def delete_provider(db: Session, provider_id: int) -> bool:
    provider = get_provider_by_id(db, provider_id)
    if not provider:
        return False
    db.delete(provider)
    db.commit()
    return True