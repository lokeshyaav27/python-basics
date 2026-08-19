import os
import sys
import shutil
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine
from app.models.base import Base
from app.models.product import Product
from app.models.bank import Bank


def copy_products_banks_static_assets():
    """Copies product images and bank logos to storage directory."""
    base_dir = Path(__file__).resolve().parents[1]
    source_img_dir = base_dir.parent / "dsa-loan-mgmt-images"
    storage_dir = base_dir / "dsa-file-storage"

    prod_dir = storage_dir / "product-images"
    bank_dir = storage_dir / "bank-logo-images"

    prod_dir.mkdir(parents=True, exist_ok=True)
    bank_dir.mkdir(parents=True, exist_ok=True)

    if not source_img_dir.exists():
        print(f"Source images directory not found at: {source_img_dir}")
        return

    # Copy Product Images
    for p_img in ["home-loan.jpg", "car-loan.jpg", "personal-loan.jpg", "business-loan.jpg"]:
        src = source_img_dir / p_img
        if src.exists():
            shutil.copy2(src, prod_dir / p_img)
            print(f"Copied product image: {p_img}")

    # Copy Bank Logos
    for b_img in ["sbi.jpg", "icici.jpg"]:
        src = source_img_dir / b_img
        if src.exists():
            shutil.copy2(src, bank_dir / b_img)
            print(f"Copied bank logo: {b_img}")


def seed_products_banks():
    """Seeds loan products and partner banking institutions."""
    copy_products_banks_static_assets()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # ── 1. Create / Upsert 3 Products ─────────────────────────────────
        print("\n--- Seeding 3 Products ---")
        products_defs = [
            {
                "name": "Home Loan",
                "description": "Low-interest housing loans with flexible 30-year tenure and up to 90% property value financing for purchase, construction, or renovation.",
                "image": "home-loan.jpg",
            },
            {
                "name": "Car Loan",
                "description": "Fast-track vehicle financing for brand new and pre-owned cars with 100% on-road funding and minimal documentation.",
                "image": "car-loan.jpg",
            },
            {
                "name": "Personal Loan",
                "description": "Instant collateral-free personal loans for emergency expenses, weddings, medical needs, travel, and debt consolidation.",
                "image": "personal-loan.jpg",
            },
        ]

        seeded_products = []
        for p_def in products_defs:
            p = db.query(Product).filter(Product.name.ilike(p_def["name"])).first()
            if not p:
                p = Product(
                    name=p_def["name"],
                    description=p_def["description"],
                    image=p_def["image"],
                    isActive=True,
                )
                db.add(p)
                db.commit()
                db.refresh(p)
                print(f"Created product: {p.name} (ID: {p.id})")
            else:
                p.description = p_def["description"]
                p.image = p_def["image"]
                p.isActive = True
                db.commit()
                db.refresh(p)
                print(f"Updated product: {p.name} (ID: {p.id})")
            seeded_products.append(p)

        # ── 2. Create / Upsert 5 Banks & 2 NBFCs ───────────────────────────
        print("\n--- Seeding 5 Banks & 2 NBFCs ---")
        banks_defs = [
            {"name": "State Bank of India (SBI)", "isNationalize": True, "isPrivate": False, "isNbfc": False, "logo": "sbi.jpg"},
            {"name": "ICICI Bank", "isNationalize": False, "isPrivate": True, "isNbfc": False, "logo": "icici.jpg"},
            {"name": "HDFC Bank", "isNationalize": False, "isPrivate": True, "isNbfc": False, "logo": None},
            {"name": "Axis Bank", "isNationalize": False, "isPrivate": True, "isNbfc": False, "logo": None},
            {"name": "Punjab National Bank (PNB)", "isNationalize": True, "isPrivate": False, "isNbfc": False, "logo": None},
            {"name": "Bajaj Housing Finance", "isNationalize": False, "isPrivate": False, "isNbfc": True, "logo": None},
            {"name": "Tata Capital Financial Services", "isNationalize": False, "isPrivate": False, "isNbfc": True, "logo": None},
        ]

        seeded_banks = []
        for b_def in banks_defs:
            b = db.query(Bank).filter(Bank.name.ilike(b_def["name"])).first()
            if not b:
                b = Bank(
                    name=b_def["name"],
                    isNationalize=b_def["isNationalize"],
                    isPrivate=b_def["isPrivate"],
                    isNbfc=b_def["isNbfc"],
                    logo=b_def["logo"],
                    isActive=True,
                )
                db.add(b)
                db.commit()
                db.refresh(b)
                print(f"Created institution: {b.name} (ID: {b.id})")
            else:
                b.isNationalize = b_def["isNationalize"]
                b.isPrivate = b_def["isPrivate"]
                b.isNbfc = b_def["isNbfc"]
                b.logo = b_def["logo"]
                b.isActive = True
                db.commit()
                db.refresh(b)
                print(f"Updated institution: {b.name} (ID: {b.id})")
            seeded_banks.append(b)

        print(f"\nSuccessfully seeded {len(seeded_products)} products and {len(seeded_banks)} institutions.")
        return seeded_products, seeded_banks

    except Exception as e:
        db.rollback()
        print(f"Error seeding products and banks: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_products_banks()
