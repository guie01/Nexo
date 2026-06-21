# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands run from `backend/` with the virtualenv active (`source venv/bin/activate`).

```bash
# Start dev server (hot reload)
uvicorn app.main:app --reload

# Run a migration
alembic upgrade head

# Generate a new migration after changing a model
alembic revision --autogenerate -m "describe the change"

# Roll back one migration
alembic downgrade -1
```

There is no test suite yet.

## Architecture

**Single-file routing.** All endpoints live in `app/main.py`. There are no `APIRouter` modules yet. As new resource domains are added, they should be split into `app/routers/<resource>.py` and included in `main.py` with `app.include_router(...)`.

**Three-layer pattern: model → schema → service → route.**
- `app/models/` — SQLAlchemy ORM models; import `Base` from `app.db.base`.
- `app/schemas/` — Pydantic v2 request/response models. Use `model_config = {"from_attributes": True}` (not the old `class Config`).
- `app/services/` — pure DB logic; should not import or raise `HTTPException` (that belongs in the route layer).
- Routes in `main.py` call services and handle HTTP-level error translation.

**Database.** PostgreSQL via SQLAlchemy 2.0 (legacy `session.query()` style currently used, not the 2.0 `select()` style). `DATABASE_URL` is read from `app/.env`. The `get_db()` dependency in `app/db/session.py` yields a session and closes it after the request.

**Migrations.** Alembic is configured in `alembic.ini` (hardcoded URL) and `alembic/env.py` (reads `Base.metadata`). When adding a new model, import it in `alembic/env.py` alongside the existing imports so autogenerate picks it up.

## Known Issues

- `UserUpdate` is defined in both `app/models/user.py` (wrong) and `app/schemas/user.py` (correct). The one in `models/` is unused and should be removed.
- `UserRead` and `UserOut` are near-duplicates; `UserRead` includes `created_at`, `UserOut` does not. Consolidate when touching user schemas.
- `app/services/users.py` raises `HTTPException` directly — this is a layering violation to be fixed when refactoring.
- Providers have no update or delete endpoints yet.

## Product Vision

Nexo is a SaaS-first platform for small service providers and tradespeople.

The product should initially focus on helping independent providers manage their workflow and operations:
- customers
- jobs
- scheduling
- quotes/estimates
- business organization
- simple analytics

The initial target users are small service businesses such as electricians and contractors, especially underserved or less digitized markets.

The MVP is NOT a broad marketplace.

Do not prematurely build:
- customer/provider matching systems
- lead marketplaces
- recommendation engines
- advanced AI agents
- payment processing
- embedded finance
- chat systems
- microservices
- event-driven architecture

These may become future features later.

Current priority:
workflow ownership before marketplace.

## Engineering Philosophy

Prefer:
- simple architecture
- clean CRUD
- explicit code
- maintainable service layers
- small safe iterations
- production-minded organization
- clear naming
- reusable schemas
- incremental migrations

Avoid:
- overengineering
- giant abstractions
- unnecessary frameworks
- premature optimization
- rewriting working code
- adding complexity without business value

## Preferred Development Workflow

Before coding:
1. Inspect existing implementation
2. Explain what exists
3. Recommend the smallest next useful step
4. Implement only that step

After coding:
- summarize changed files
- explain what changed
- explain how to test
- explain expected result

## Current MVP Roadmap

Phase 1:
- stabilize foundation
- clean architecture
- complete Providers CRUD

Phase 2:
- Customers domain
- Jobs domain
- Quotes/Estimates domain

Phase 3:
- provider analytics dashboard
- lightweight business insights

Phase 4:
- future AI placeholders only if explicitly requested

## Important Technical Notes

Use:
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- Pydantic v2

Use Decimal for money-related fields.

Service layers should not raise HTTPException directly.

Routes should handle HTTP translation and response formatting.

When adding new models:
- add SQLAlchemy model
- add Pydantic schemas
- create Alembic migration
- add service functions
- add endpoints
- explain how to test

## Important Rule

Do not restart or rebuild the project from scratch unless explicitly instructed.