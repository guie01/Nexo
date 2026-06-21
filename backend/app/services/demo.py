"""
Demo data seeding and reset for development/testing.
Never call from production — guarded at the router layer.
"""
from decimal import Decimal
from datetime import datetime, date

from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.job import Job, JobStatus
from app.models.provider import Provider
from app.models.quote import Quote, QuoteItem, QuoteStatus
from app.schemas.quote import QuoteCreate, QuoteItemCreate, QuoteUpdate
from app.services.quotes import create_quote, add_quote_item, update_quote

DEMO_SENTINEL = "__nexo_demo__"


def is_seeded(db: Session, provider_id: int) -> bool:
    return (
        db.query(Customer)
        .filter(
            Customer.provider_id == provider_id,
            Customer.notes.contains(DEMO_SENTINEL),
        )
        .first()
        is not None
    )


def reset_demo(db: Session, provider_id: int) -> None:
    quote_ids = [
        row[0]
        for row in db.query(Quote.id).filter(Quote.provider_id == provider_id).all()
    ]
    if quote_ids:
        db.query(QuoteItem).filter(QuoteItem.quote_id.in_(quote_ids)).delete(
            synchronize_session=False
        )
    db.query(Quote).filter(Quote.provider_id == provider_id).delete(
        synchronize_session=False
    )
    db.query(Job).filter(Job.provider_id == provider_id).delete(
        synchronize_session=False
    )
    db.query(Customer).filter(Customer.provider_id == provider_id).delete(
        synchronize_session=False
    )
    db.commit()


def seed_demo(db: Session, provider_id: int) -> dict:
    # ── Customers ────────────────────────────────────────────────────────────
    customers_data = [
        dict(full_name="John Smith",     phone="(555) 201-4567", email="john.smith@example.com",   address="12 Oak Street, Austin TX",          notes=f"{DEMO_SENTINEL} Residential client"),
        dict(full_name="María García",   phone="(555) 304-8921", email="mgarcia@gmail.com",         address="845 Riverside Drive, Austin TX",     notes=f"{DEMO_SENTINEL} Kitchen remodel"),
        dict(full_name="Robert Johnson", phone="(555) 445-3201", email="r.johnson@hotmail.com",     address="3301 Congress Ave, Austin TX",       notes=f"{DEMO_SENTINEL}"),
        dict(full_name="Sarah Williams", phone="(555) 512-7843", email="swilliams@email.com",       address="7 Pine Lane, Austin TX",             notes=f"{DEMO_SENTINEL}"),
        dict(full_name="Carlos Mendoza", phone="(555) 678-2341", email="cmendoza@gmail.com",        address="220 South 1st St, Austin TX",        notes=f"{DEMO_SENTINEL} EV enthusiast"),
    ]

    customers = []
    for d in customers_data:
        c = Customer(provider_id=provider_id, **d)
        db.add(c)
        customers.append(c)
    db.flush()

    cid = {c.full_name: c.id for c in customers}

    # ── Jobs ─────────────────────────────────────────────────────────────────
    jobs_data = [
        dict(customer_id=cid["John Smith"],     title="Panel Upgrade – 200A Service",       status=JobStatus.completed,   scheduled_date=datetime(2026, 5, 12, 9, 0),  estimated_price=Decimal("2600"), final_price=Decimal("2800"), address="12 Oak Street, Austin TX"),
        dict(customer_id=cid["María García"],   title="Kitchen Outlet Installation",         status=JobStatus.in_progress, scheduled_date=datetime(2026, 6, 18, 10, 0), estimated_price=Decimal("350"),  address="845 Riverside Drive, Austin TX"),
        dict(customer_id=cid["Robert Johnson"], title="Ceiling Fan Installation",            status=JobStatus.scheduled,   scheduled_date=datetime(2026, 6, 25, 14, 0), estimated_price=Decimal("180"),  address="3301 Congress Ave, Austin TX"),
        dict(customer_id=cid["Sarah Williams"], title="Lighting Repair – Living Room",       status=JobStatus.new,         estimated_price=Decimal("120")),
        dict(customer_id=cid["Carlos Mendoza"], title="EV Charger Installation",            status=JobStatus.completed,   scheduled_date=datetime(2026, 6, 1, 8, 0),   estimated_price=Decimal("1100"), final_price=Decimal("1200"), address="220 South 1st St, Austin TX"),
        dict(customer_id=cid["John Smith"],     title="Bathroom Rewiring",                  status=JobStatus.in_progress, scheduled_date=datetime(2026, 6, 20, 9, 0),  estimated_price=Decimal("950"),  address="12 Oak Street, Austin TX"),
        dict(customer_id=cid["María García"],   title="Additional Outlets – Home Office",   status=JobStatus.scheduled,   scheduled_date=datetime(2026, 6, 28, 11, 0), estimated_price=Decimal("275"),  address="845 Riverside Drive, Austin TX"),
        dict(customer_id=cid["Robert Johnson"], title="Generator Transfer Switch",          status=JobStatus.new,         estimated_price=Decimal("3500")),
    ]

    for d in jobs_data:
        db.add(Job(provider_id=provider_id, **d))
    db.flush()

    # ── Quotes ───────────────────────────────────────────────────────────────
    quotes_spec = [
        {
            "customer": "John Smith",
            "notes": "Includes breaker box replacement and full service upgrade to 200A.",
            "valid_until": date(2026, 7, 1),
            "final_status": QuoteStatus.accepted,
            "items": [
                ("Labor – Panel replacement (8 h)", Decimal("8"),   Decimal("95")),
                ("200A service panel (Square D)",   Decimal("1"),   Decimal("420")),
                ("Permit & inspection fees",         Decimal("1"),   Decimal("150")),
            ],
        },
        {
            "customer": "María García",
            "notes": "Two new 20A circuits for kitchen island.",
            "valid_until": date(2026, 7, 15),
            "final_status": QuoteStatus.sent,
            "items": [
                ("Labor – Outlet installation (3 h)", Decimal("3"), Decimal("95")),
                ("GFCI outlets & hardware",           Decimal("4"), Decimal("22")),
            ],
        },
        {
            "customer": "Robert Johnson",
            "notes": None,
            "valid_until": date(2026, 7, 20),
            "final_status": None,
            "items": [
                ("Labor – Fan installation (2 h)",   Decimal("2"), Decimal("95")),
                ("Ceiling fan mounting hardware",     Decimal("1"), Decimal("35")),
            ],
        },
        {
            "customer": "Sarah Williams",
            "notes": "Replace faulty dimmer switches and associated wiring.",
            "valid_until": date(2026, 6, 30),
            "final_status": QuoteStatus.accepted,
            "items": [
                ("Labor – Lighting repair (1.5 h)", Decimal("1.5"), Decimal("95")),
                ("Dimmer switches (x3)",             Decimal("3"),   Decimal("28")),
            ],
        },
        {
            "customer": "Carlos Mendoza",
            "notes": "Level 2 charger, dedicated 50A circuit. Customer to provide charger unit.",
            "valid_until": date(2026, 6, 15),
            "final_status": QuoteStatus.rejected,
            "items": [
                ("Labor – EV charger install (6 h)", Decimal("6"), Decimal("95")),
                ("50A breaker & wiring materials",   Decimal("1"), Decimal("180")),
                ("Permit & inspection",              Decimal("1"), Decimal("120")),
            ],
        },
        {
            "customer": "Carlos Mendoza",
            "notes": "Revised – customer supplying own Level 2 charger unit.",
            "valid_until": date(2026, 7, 31),
            "final_status": None,
            "items": [
                ("Labor – EV charger install (6 h)", Decimal("6"), Decimal("95")),
                ("50A breaker & wiring materials",   Decimal("1"), Decimal("160")),
                ("Permit & inspection",              Decimal("1"), Decimal("120")),
            ],
        },
    ]

    for spec in quotes_spec:
        q = create_quote(
            db,
            QuoteCreate(
                provider_id=provider_id,
                customer_id=cid[spec["customer"]],
                notes=spec["notes"],
                valid_until=spec["valid_until"],
            ),
        )
        for desc, qty, price in spec["items"]:
            add_quote_item(
                db, q.id, QuoteItemCreate(description=desc, quantity=qty, unit_price=price)
            )
        if spec["final_status"]:
            update_quote(db, q.id, QuoteUpdate(status=QuoteStatus.sent))
            if spec["final_status"] != QuoteStatus.sent:
                update_quote(db, q.id, QuoteUpdate(status=spec["final_status"]))

    db.commit()

    return {
        "customers": len(customers_data),
        "jobs": len(jobs_data),
        "quotes": len(quotes_spec),
    }
