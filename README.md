# Nexo

Nexo is a SaaS platform for small service providers and tradespeople — electricians, contractors, and other independent operators in underserved, less-digitized markets.

It gives providers a single place to manage their workflow: customers, jobs, scheduling, quotes, and a lightweight analytics dashboard. The MVP is not a marketplace.

---

## Architecture

```
Nexo/
├── backend/     FastAPI · PostgreSQL · SQLAlchemy 2 · Alembic · Pydantic v2
└── frontend/    Next.js 16 · React 19 · Tailwind CSS v4 · shadcn/ui · TanStack Query
```

The backend follows a four-layer pattern: **model → schema → service → route**.

---

## Prerequisites

- Python 3.11+
- Node.js 20+
- PostgreSQL (running locally or via Docker)

---

## Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/app/.env`:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/nexo
SECRET_KEY=your-secret-key
```

Run migrations and start the dev server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API is available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Migrations

```bash
# After changing a model
alembic revision --autogenerate -m "describe the change"
alembic upgrade head

# Roll back one step
alembic downgrade -1
```

### Seed demo data

```bash
python seed_demo.py
```

---

## Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
npm run dev
```

App is available at `http://localhost:3000`.

---

## API Overview

| Domain | Prefix |
|---|---|
| Auth | `/auth` |
| Users | `/users` |
| Providers | `/providers` |
| Customers | `/customers` |
| Jobs | `/jobs` |
| Quotes | `/quotes` |
| Dashboard | `/dashboard` |

Health check: `GET /health`

---

## Roadmap

| Phase | Scope |
|---|---|
| 1 | Foundation — Providers CRUD, auth, clean architecture |
| 2 | Customers, Jobs, Quotes/Estimates domains |
| 3 | Provider analytics dashboard, business insights |
| 4 | AI features (only if explicitly requested) |
