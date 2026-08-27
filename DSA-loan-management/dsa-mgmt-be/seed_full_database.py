import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.db.session import SessionLocal, engine
from app.models.base import Base
from app.models.product import Product
from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.models.agent import Agent
from app.models.client_general_detail import ClientGeneralDetail
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.loan_application import LoanApplication
from app.models.contact_enquiry import ContactEnquiry
from app.db.db_utils import ensure_database_exists

# Import modular seeders
from seeds.seed_1_admin import seed_admin
from seeds.seed_2_products_banks import seed_products_banks
from seeds.seed_3_agents import seed_agents
from seeds.seed_4_product_bank_mapping import seed_product_bank_mapping
from seeds.seed_5_loan_applications import seed_loan_applications


def reset_and_seed_full_database():
    """Resets database and executes all 5 modular seeders sequentially."""
    print("\n=======================================================")
    print("      STARTING FULL DATABASE SEEDING WORKFLOW         ")
    print("=======================================================\n")

    # 0. Ensure target database exists in PostgreSQL
    ensure_database_exists()

    # 1. Enable pgvector extension and ensure columns exist
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.execute(text("ALTER TABLE IF EXISTS product_bank_links ADD COLUMN IF NOT EXISTS policy_parameters JSON;"))
        conn.commit()

    # 2. Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clean existing data in logical dependency order
        print("Cleaning existing database records...")
        db.query(LoanApplication).delete()
        db.query(BankDocument).delete()
        db.query(ProductBankLink).delete()
        db.query(ClientGeneralDetail).delete()
        db.query(HomeLoanDetail).delete()
        db.query(CarLoanDetail).delete()
        db.query(PersonalLoanDetail).delete()
        db.query(ContactEnquiry).delete()
        db.query(Agent).delete()
        db.query(Bank).delete()
        db.query(Product).delete()
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error resetting database: {e}")
        raise
    finally:
        db.close()

    # ── Execute 5 Modular Seeders Sequentially ─────────────────────────────

    # 1. Seed Only One Admin User
    admin = seed_admin()

    # 2. Seed Products & Banks
    products, banks = seed_products_banks()

    # 3. Seed Agents
    agents = seed_agents()

    # 4. Seed Product-Bank Mapping & Vector Embeddings
    links = seed_product_bank_mapping()

    # 5. Seed Loan Applications
    apps = seed_loan_applications()

    print("\n=======================================================")
    print("   ALL 5 MODULAR DATABASE SEEDERS COMPLETED SUCCESSFULLY! ")
    print("=======================================================")
    print(f"Summary:")
    print(f" 1. Admin User: 1 ({admin.email})")
    print(f" 2. Products & Banks: {len(products)} Products, {len(banks)} Institutions")
    print(f" 3. DSA Agents: {len(agents)} Agents")
    print(f" 4. Product-Bank Links: {len(links)} Links (with pgvector documents)")
    print(f" 5. Loan Applications: {len(apps)} Applications (All Pending Review)")
    print("=======================================================\n")


if __name__ == "__main__":
    reset_and_seed_full_database()
