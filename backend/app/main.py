from fastapi import FastAPI, Query, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db

from typing import List

from app.schemas.user import UserCreate, UserRead, UserOut, UserUpdate
from app.services.users import create_user, list_users, get_user_by_id, update_user, delete_user

from app.schemas.provider import ProviderCreate, ProviderOut
from app.services.providers import create_provider, list_providers



app = FastAPI(title="Nexo API")

@app.get("/")
def root():
    return {"status": "Nexo backend running 🚀"}

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"db": "ok"}

@app.post("/users", response_model=UserRead, status_code=201)
def create_user_endpoint(user_in: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, user_in)


@app.get("/users", response_model=List[UserRead])
def list_users_endpoint(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_users(db, limit=limit, offset=offset)

@app.get("/users/{user_id}", response_model=UserOut)
def read_user(user_id: int, db: Session = Depends(get_db)):
    user = get_user_by_id(db, user_id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.patch("/users/{user_id}", response_model=UserOut)
def patch_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    try:
        user = update_user(db, user_id=user_id, user_update=payload)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email already registered")
    

@app.delete("/users/{user_id}", status_code=204)
def remove_user(user_id: int, db: Session = Depends(get_db)):
    deleted = delete_user(db, user_id=user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    



@app.post("/providers", response_model=ProviderOut, status_code=201)
def create_provider_endpoint(provider_in: ProviderCreate, db: Session = Depends(get_db)):
    try:
        return create_provider(db, provider_in)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Provider email already registered")


@app.get("/providers", response_model=List[ProviderOut])
def list_providers_endpoint(
    db: Session = Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    return list_providers(db, limit=limit, offset=offset)




















