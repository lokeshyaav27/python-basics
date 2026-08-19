import os
import sys
import shutil
from pathlib import Path
from decimal import Decimal
import random

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.db.db_utils import ensure_database_exists
from app.models.base import Base
from app.models.product import Product
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.services import rag_service


def copy_bank_documents_static_assets():
    """Ensures bank documents storage directory exists."""
    base_dir = Path(__file__).resolve().parents[1]
    storage_dir = base_dir / "dsa-file-storage" / "bank-documents"
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def seed_product_bank_mapping():
    """Seeds product-bank mapping links and indexes policy documents into pgvector."""
    ensure_database_exists()
    storage_dir = copy_bank_documents_static_assets()
    
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        products = db.query(Product).filter(Product.isActive != False).all()
        banks = db.query(Bank).filter(Bank.isActive != False).all()

        if not products or not banks:
            print("Products or banks missing. Please run seed_2_products_banks.py first.")
            from seeds.seed_2_products_banks import seed_products_banks
            products, banks = seed_products_banks()

        # ── 1. Create Product-Bank Links ──────────────────────────────────────
        print("\n--- Seeding Product-Bank Links ---")
        commissions = [Decimal("0.75"), Decimal("1.00"), Decimal("1.25"), Decimal("1.50"), Decimal("1.75"), Decimal("2.00")]
        created_links = []

        for bank in banks:
            for prod in products:
                link = db.query(ProductBankLink).filter(
                    ProductBankLink.bankId == bank.id,
                    ProductBankLink.productId == prod.id
                ).first()

                if not link:
                    comm = random.choice(commissions)
                    link = ProductBankLink(
                        bankId=bank.id,
                        productId=prod.id,
                        commission=comm,
                        isActive=True,
                    )
                    db.add(link)
                    db.commit()
                    db.refresh(link)
                created_links.append(link)

        print(f"Created/Verified {len(created_links)} product-bank links with custom commissions.")

        # ── 2. Index Bank Policy Documents into pgvector ──────────────────────
        print("\n--- Indexing Bank Policy Documents into pgvector ---")
        base_dir = Path(__file__).resolve().parents[1]
        docs_src = base_dir.parent / "home-loan-bank-documents"

        p_home = db.query(Product).filter(Product.name.ilike("%home%")).first()
        if not p_home and products:
            p_home = products[0]

        folder_map = {
            "Axis": "Axis Bank",
            "Bajaj_Housing": "Bajaj Housing Finance",
            "HDFC": "HDFC Bank",
            "ICICI": "ICICI Bank",
            "PNB": "Punjab National Bank (PNB)",
            "SBI": "State Bank of India (SBI)",
            "Tata_Capital": "Tata Capital Financial Services",
        }

        indexed_chunks_total = 0
        if docs_src.exists() and p_home:
            for folder_name, b_name in folder_map.items():
                target_bank = next((b for b in banks if b_name.lower() in b.name.lower()), None)
                if not target_bank:
                    continue

                target_link = next((l for l in created_links if l.bankId == target_bank.id and l.productId == p_home.id), None)
                if not target_link:
                    continue

                folder_path = docs_src / folder_name
                if not folder_path.exists():
                    continue

                for pdf_file in folder_path.glob("*.pdf"):
                    dest_filename = f"{target_bank.id}_{p_home.id}_{pdf_file.name}"
                    dest_path = storage_dir / dest_filename
                    shutil.copy2(pdf_file, dest_path)

                    doc_name = pdf_file.stem.replace("_", " ")
                    bdoc = db.query(BankDocument).filter(
                        BankDocument.productBankLinkId == target_link.id,
                        BankDocument.documentLocation == dest_filename
                    ).first()

                    if not bdoc:
                        bdoc = BankDocument(
                            productBankLinkId=target_link.id,
                            documentName=doc_name,
                            documentLocation=dest_filename,
                        )
                        db.add(bdoc)
                        db.commit()
                        db.refresh(bdoc)

                    chunks_count = rag_service.index_document(
                        db=db,
                        bank_document_id=bdoc.id,
                        bank_id=target_bank.id,
                        product_id=p_home.id,
                        file_path=dest_path,
                    )
                    indexed_chunks_total += chunks_count

            print(f"Indexed {indexed_chunks_total} vector document chunks across partner banks.")

        print(f"\nSuccessfully seeded product-bank mappings and indexed documents.")
        return created_links

    except Exception as e:
        db.rollback()
        print(f"Error seeding product bank mapping: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_product_bank_mapping()
