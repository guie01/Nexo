#!/usr/bin/env python3
"""
Nexo demo data seed script.

Run from the backend/ directory with the virtualenv active:

  python seed_demo.py                     # Seed first provider (skip if demo exists)
  python seed_demo.py --reset             # Delete all data and re-seed
  python seed_demo.py --provider-id 2    # Target a specific provider

Requirements: DATABASE_URL set in backend/app/.env
"""
import argparse
import sys

sys.path.insert(0, ".")

from app.db.session import SessionLocal
from app.models.provider import Provider
from app.services.demo import is_seeded, reset_demo, seed_demo


def find_provider(db, provider_id=None):
    if provider_id:
        p = db.query(Provider).filter(Provider.id == provider_id).first()
    else:
        p = db.query(Provider).first()
    if not p:
        print("ERROR: No provider found. Create an account and complete onboarding first.")
        sys.exit(1)
    return p


def main():
    parser = argparse.ArgumentParser(description="Seed Nexo with demo data")
    parser.add_argument("--provider-id", type=int, help="Provider ID (default: first provider)")
    parser.add_argument("--reset", action="store_true", help="Clear all existing data before seeding")
    args = parser.parse_args()

    db = SessionLocal()
    try:
        provider = find_provider(db, args.provider_id)
        print(f"Target provider: {provider.name} (id={provider.id})")

        if args.reset:
            print("Resetting existing data...")
            reset_demo(db, provider.id)
            print("  ✓ Cleared")
        elif is_seeded(db, provider.id):
            print("Demo data already present. Use --reset to re-seed.")
            return

        print("Seeding...")
        counts = seed_demo(db, provider.id)
        print(f"  ✓ {counts['customers']} customers")
        print(f"  ✓ {counts['jobs']} jobs")
        print(f"  ✓ {counts['quotes']} quotes")
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
