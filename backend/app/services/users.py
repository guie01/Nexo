from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError

def create_user(db: Session, user_in: UserCreate) -> User:
    user = User(email=user_in.email, full_name=user_in.full_name)
    db.add(user)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already exists"
        )

    db.refresh(user)
    return user

def list_users(db: Session, limit: int = 50, offset: int = 0):
    return (
        db.query(User)
        .offset(offset)
        .limit(limit)
        .all()
    )

def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()    


def update_user(db: Session, user_id: int, user_update: UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        return None

    update_data = user_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(user, field, value)

    db.commit()
    db.refresh(user)

    return user


def delete_user(db: Session, user_id: int) -> bool:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return False

    db.delete(user)
    db.commit()
    return True