from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import hash_password, verify_password


class EmailAlreadyRegistered(Exception):
    pass


def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()


def register_user(db: Session, email: str, password: str, full_name: str = None):
    if get_user_by_email(db, email):
        raise EmailAlreadyRegistered()
    user = User(
        email=email,
        full_name=full_name,
        password_hash=hash_password(password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str):
    user = get_user_by_email(db, email)
    if not user or not user.password_hash:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
