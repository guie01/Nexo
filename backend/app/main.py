from fastapi import FastAPI
from fastapi import Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db


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
