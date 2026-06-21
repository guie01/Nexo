import os

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.routers import auth, users, providers, customers, jobs, quotes, dashboard

app = FastAPI(title="Nexo API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(providers.router)
app.include_router(customers.router)
app.include_router(jobs.router)
app.include_router(quotes.router)
app.include_router(quotes.items_router)
app.include_router(dashboard.router)

if os.getenv("APP_ENV", "development") != "production":
    from app.routers import dev
    app.include_router(dev.router)


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
