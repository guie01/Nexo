from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.schemas.user import UserRegister, UserLogin, UserRead, Token
from app.schemas.provider import ProviderCreate, ProviderOut
from app.services.auth import register_user, authenticate_user, EmailAlreadyRegistered
from app.services.providers import get_provider_by_user_id, create_provider_for_user
from app.core.security import create_access_token
from app.core.deps import get_current_user

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=UserRead, status_code=201)
def auth_register(user_in: UserRegister, db: Session = Depends(get_db)):
    try:
        return register_user(db, email=user_in.email, password=user_in.password, full_name=user_in.full_name)
    except EmailAlreadyRegistered:
        raise HTTPException(status_code=409, detail="Email already registered")


@router.post("/auth/login", response_model=Token)
def auth_login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, email=credentials.email, password=credentials.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return Token(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead)
def me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/me/provider", response_model=ProviderOut)
def me_provider(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    provider = get_provider_by_user_id(db, current_user.id)
    if not provider:
        raise HTTPException(status_code=404, detail="No provider found for this user")
    return provider


@router.post("/me/provider", response_model=ProviderOut, status_code=201)
def create_my_provider(
    provider_in: ProviderCreate,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = get_provider_by_user_id(db, current_user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Ya tienes un proveedor registrado")
    try:
        return create_provider_for_user(db, current_user.id, provider_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="El correo electrónico ya está registrado")
