import os
import shutil
import sys
from pathlib import Path
from decimal import Decimal
import random

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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


def copy_static_assets():
    """Copies product, bank, and user images to the backend file storage."""
    base_dir = Path(__file__).resolve().parent
    source_img_dir = base_dir.parent / "dsa-loan-mgmt-images"
    storage_dir = base_dir / "dsa-file-storage"

    prod_dir = storage_dir / "product-images"
    bank_dir = storage_dir / "bank-logo-images"
    agent_dir = storage_dir / "agent-photos"

    prod_dir.mkdir(parents=True, exist_ok=True)
    bank_dir.mkdir(parents=True, exist_ok=True)
    agent_dir.mkdir(parents=True, exist_ok=True)

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

    # Copy Agent Photos
    user_src_dir = source_img_dir / "dsa-user-images"
    if user_src_dir.exists():
        for user_img in user_src_dir.glob("*.png"):
            shutil.copy2(user_img, agent_dir / user_img.name)
            print(f"Copied agent photo: {user_img.name}")


def seed_database():
    copy_static_assets()

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Clean existing data in logical order
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

        # ── 1. Create 3 Products ─────────────────────────────────────────
        print("\n--- Seeding 3 Products ---")
        p_home = Product(
            name="Home Loan",
            description="Low-interest housing loans with flexible 30-year tenure and up to 90% property value financing for purchase, construction, or renovation.",
            image="home-loan.jpg",
            isActive=True,
        )
        p_car = Product(
            name="Car Loan",
            description="Fast-track vehicle financing for brand new and pre-owned cars with 100% on-road funding and minimal documentation.",
            image="car-loan.jpg",
            isActive=True,
        )
        p_personal = Product(
            name="Personal Loan",
            description="Instant collateral-free personal loans for emergency expenses, weddings, medical needs, travel, and debt consolidation.",
            image="personal-loan.jpg",
            isActive=True,
        )
        db.add_all([p_home, p_car, p_personal])
        db.commit()
        db.refresh(p_home)
        db.refresh(p_car)
        db.refresh(p_personal)
        products = [p_home, p_car, p_personal]
        print(f"Created {len(products)} products: {[p.name for p in products]}")

        # ── 2. Create 5 Banks & 2 NBFCs (Total 7 Institutions) ───────────
        print("\n--- Seeding 5 Banks & 2 NBFCs ---")
        banks = [
            Bank(name="State Bank of India (SBI)", isNationalize=True, isPrivate=False, isNbfc=False, logo="sbi.jpg", isActive=True),
            Bank(name="ICICI Bank", isNationalize=False, isPrivate=True, isNbfc=False, logo="icici.jpg", isActive=True),
            Bank(name="HDFC Bank", isNationalize=False, isPrivate=True, isNbfc=False, logo=None, isActive=True),
            Bank(name="Axis Bank", isNationalize=False, isPrivate=True, isNbfc=False, logo=None, isActive=True),
            Bank(name="Punjab National Bank (PNB)", isNationalize=True, isPrivate=False, isNbfc=False, logo=None, isActive=True),
            Bank(name="Bajaj Housing Finance", isNationalize=False, isPrivate=False, isNbfc=True, logo=None, isActive=True),
            Bank(name="Tata Capital Financial Services", isNationalize=False, isPrivate=False, isNbfc=True, logo=None, isActive=True),
        ]
        db.add_all(banks)
        db.commit()
        for b in banks:
            db.refresh(b)
        print(f"Created {len(banks)} institutions: {[b.name for b in banks]}")

        # ── 3. Link Banks with Multiple Products (No Documents) ──────────
        print("\n--- Seeding Product-Bank Links ---")
        links = []
        commissions = [Decimal("0.75"), Decimal("1.00"), Decimal("1.25"), Decimal("1.50"), Decimal("1.75"), Decimal("2.00")]
        for bank in banks:
            for prod in products:
                comm = random.choice(commissions)
                link = ProductBankLink(
                    bankId=bank.id,
                    productId=prod.id,
                    commission=comm,
                    isActive=True,
                )
                links.append(link)
        db.add_all(links)
        db.commit()
        print(f"Created {len(links)} product-bank links with custom commissions.")

        # ── 4. Create 8 Agents (2 Admins + 6 Regular Agents) ─────────────
        print("\n--- Seeding 8 Agents (2 Admins + 6 Regular Agents) ---")
        agents_data = [
            # Admins
            {"name": "Lokesh Admin", "email": "lokesh_dsa_admin@yopmail.com", "mobile": "1111111111", "password": "Lokesh@123", "is_admin": True, "photo": "user-01.png"},
            {"name": "Rajesh Sharma (Admin)", "email": "rajesh.admin@dsafinance.com", "mobile": "9810011223", "password": "Admin@123", "is_admin": True, "photo": "user-02.png"},
            # Regular Agents
            {"name": "Lokesh Agent", "email": "lokesh_agent@yopmail.com", "mobile": "2222222222", "password": "Lokesh@123", "is_admin": False, "photo": "user-03.png"},
            {"name": "Priya Verma", "email": "priya.verma@dsafinance.com", "mobile": "9876500001", "password": "Agent@123", "is_admin": False, "photo": "user-04.png"},
            {"name": "Amitabh Sen", "email": "amitabh.sen@dsafinance.com", "mobile": "9876500002", "password": "Agent@123", "is_admin": False, "photo": "user-05.png"},
            {"name": "Sneha Kulkarni", "email": "sneha.k@dsafinance.com", "mobile": "9876500003", "password": "Agent@123", "is_admin": False, "photo": "user-06.png"},
            {"name": "Vikram Malhotra", "email": "vikram.m@dsafinance.com", "mobile": "9876500004", "password": "Agent@123", "is_admin": False, "photo": "user-07.png"},
            {"name": "Ananya Roy", "email": "ananya.roy@dsafinance.com", "mobile": "9876500005", "password": "Agent@123", "is_admin": False, "photo": "user-08.png"},
        ]

        created_agents = []
        for ag in agents_data:
            a = Agent(
                name=ag["name"],
                email=ag["email"],
                mobile=ag["mobile"],
                password=ag["password"],
                tempPassword=ag["password"],
                tempPasswordReset=True,
                isAdmin=ag["is_admin"],
                photo=ag["photo"],
                isActive=True,
            )
            created_agents.append(a)
        db.add_all(created_agents)
        db.commit()
        for a in created_agents:
            db.refresh(a)
        regular_agents = [a for a in created_agents if not a.isAdmin]
        print(f"Created {len(created_agents)} agents ({len([a for a in created_agents if a.isAdmin])} Admins, {len(regular_agents)} Regular Agents).")

        # ── 5. Create Loan Applications (All Pending Review, Without Approval/Rejection) ──
        print("\n--- Seeding Loan Applications (Pending Review) ---")
        customers = [
            {"name": "Lokesh Yadav", "mobile": "123123", "email": "lokesh@application.com", "city": "Delhi NCR", "income": 95000, "age": 32, "gender": "Male"},
            {"name": "Rahul Sharma", "mobile": "9876543210", "email": "rahul.sharma@gmail.com", "city": "Mumbai", "income": 120000, "age": 36, "gender": "Male"},
            {"name": "Pooja Hegde", "mobile": "9822334455", "email": "pooja.h@yahoo.com", "city": "Bangalore", "income": 85000, "age": 29, "gender": "Female"},
            {"name": "Rohan Gupta", "mobile": "9811223344", "email": "rohan.gupta@outlook.com", "city": "Pune", "income": 110000, "age": 34, "gender": "Male"},
            {"name": "Neha Mehta", "mobile": "9844556677", "email": "neha.mehta@gmail.com", "city": "Ahmedabad", "income": 70000, "age": 31, "gender": "Female"},
            {"name": "Siddharth Rao", "mobile": "9855667788", "email": "sid.rao@rediffmail.com", "city": "Hyderabad", "income": 140000, "age": 40, "gender": "Male"},
            {"name": "Divya Sundaram", "mobile": "9866778899", "email": "divya.s@gmail.com", "city": "Chennai", "income": 90000, "age": 28, "gender": "Female"},
            {"name": "Karan Kapoor", "mobile": "9877889900", "email": "karan.k@yahoo.com", "city": "Chandigarh", "income": 105000, "age": 35, "gender": "Male"},
        ]

        # 16 Loan Applications across 8 unique customers (all status=None for testing)
        apps_plan = [
            # Customer 1 (Lokesh)
            {"cust_idx": 0, "prod_idx": 0, "req_amt": 5000000, "tenure": 240},
            {"cust_idx": 0, "prod_idx": 1, "req_amt": 1200000, "tenure": 60},
            {"cust_idx": 0, "prod_idx": 2, "req_amt": 300000, "tenure": 24},
            # Customer 2 (Rahul)
            {"cust_idx": 1, "prod_idx": 0, "req_amt": 7500000, "tenure": 300},
            {"cust_idx": 1, "prod_idx": 2, "req_amt": 500000, "tenure": 36},
            # Customer 3 (Pooja)
            {"cust_idx": 2, "prod_idx": 1, "req_amt": 950000, "tenure": 48},
            {"cust_idx": 2, "prod_idx": 0, "req_amt": 4200000, "tenure": 180},
            # Customer 4 (Rohan)
            {"cust_idx": 3, "prod_idx": 0, "req_amt": 6000000, "tenure": 240},
            {"cust_idx": 3, "prod_idx": 1, "req_amt": 1500000, "tenure": 60},
            # Customer 5 (Neha)
            {"cust_idx": 4, "prod_idx": 2, "req_amt": 800000, "tenure": 36},
            {"cust_idx": 4, "prod_idx": 0, "req_amt": 3500000, "tenure": 180},
            # Customer 6 (Siddharth)
            {"cust_idx": 5, "prod_idx": 0, "req_amt": 8500000, "tenure": 240},
            {"cust_idx": 5, "prod_idx": 1, "req_amt": 2200000, "tenure": 60},
            # Customer 7 (Divya)
            {"cust_idx": 6, "prod_idx": 0, "req_amt": 4800000, "tenure": 240},
            {"cust_idx": 6, "prod_idx": 2, "req_amt": 250000, "tenure": 24},
            # Customer 8 (Karan)
            {"cust_idx": 7, "prod_idx": 0, "req_amt": 5500000, "tenure": 180},
            {"cust_idx": 7, "prod_idx": 1, "req_amt": 1100000, "tenure": 60},
        ]

        created_apps = []
        for i, plan in enumerate(apps_plan, 1):
            cust = customers[plan["cust_idx"]]
            prod = products[plan["prod_idx"]]
            assigned_agent = regular_agents[(i - 1) % len(regular_agents)]

            # 1. Create client general details
            cgd = ClientGeneralDetail(
                name=cust["name"],
                age=cust["age"],
                gender=cust["gender"],
                location=cust["city"],
                employment_type="Salaried",
                monthly_income=Decimal(str(cust["income"])),
                monthly_obligation=Decimal("15000.00"),
                existing_emi=Decimal("10000.00"),
                cibil_score=random.randint(730, 810),
                loan_amount_required=Decimal(str(plan["req_amt"])),
                preferred_tenure=plan["tenure"],
                isSalaried=True,
            )
            db.add(cgd)
            db.flush()

            # 2. Create product specific details
            home_id = None
            car_id = None
            personal_id = None

            if prod.name == "Home Loan":
                hld = HomeLoanDetail(
                    property_value=Decimal(str(int(plan["req_amt"] * 1.25))),
                    property_location=f"{cust['city']} Prime Heights",
                    propertyUsageType="Residential",
                    down_payment=Decimal(str(int(plan["req_amt"] * 0.25))),
                    isPartProperty=False,
                    propertyRequirement="Ready to Move",
                    propertyType="Apartment",
                    propertyStatus="Freehold",
                    femaleCoApplicant=(cust["gender"] == "Female"),
                    propertyInsurance=True,
                    applicantInsurance=True,
                )
                db.add(hld)
                db.flush()
                home_id = hld.id

            elif prod.name == "Car Loan":
                cld = CarLoanDetail(
                    new_or_used="New",
                    car_value=Decimal(str(int(plan["req_amt"] * 1.15))),
                    down_payment=Decimal(str(int(plan["req_amt"] * 0.15))),
                    vehicle_age=0,
                )
                db.add(cld)
                db.flush()
                car_id = cld.id

            elif prod.name == "Personal Loan":
                pld = PersonalLoanDetail(
                    loan_purpose="Home Improvement",
                    other=None,
                    required_amount=Decimal(str(plan["req_amt"])),
                    existing_obligations=Decimal("15000.00"),
                )
                db.add(pld)
                db.flush()
                personal_id = pld.id

            # 3. Create Loan Application record (status=None -> Pending Review)
            app = LoanApplication(
                name=cust["name"],
                email=cust["email"],
                mobile=cust["mobile"],
                uniqueCustomerId=cust["mobile"],
                productId=prod.id,
                agentId=assigned_agent.id,
                bankId=None,
                clientGeneralDetailTableId=cgd.id,
                homeLoanDetailId=home_id,
                carLoanDetailId=car_id,
                personalLoanDetailId=personal_id,
                status=None,
                description=None,
                isActive=True,
            )
            created_apps.append(app)

        db.add_all(created_apps)
        db.commit()
        print(f"Created {len(created_apps)} loan applications (all Pending Review) across {len(customers)} unique customers.")

        # ── 6. Seed Demo Contact Enquiries ────────────────────────────────
        print("\n--- Seeding Demo Contact Enquiries ---")
        enquiries = [
            ContactEnquiry(name="Suresh Raina", email="suresh.r@gmail.com", mobile="9812345678", loanType="Home Loan", message="Need 60L home loan consultation for Gurgaon property.", status="new", isActive=True),
            ContactEnquiry(name="Anil Kumble", email="anil.k@yahoo.com", mobile="9823456789", loanType="Car Loan", message="Inquiring about corporate car lease vs auto loan.", status="in-progress", isActive=True),
            ContactEnquiry(name="Deepika Padukone", email="deepika.p@outlook.com", mobile="9834567890", loanType="Personal Loan", message="Emergency personal loan inquiry.", status="new", isActive=True),
        ]
        db.add_all(enquiries)
        db.commit()
        print(f"Created {len(enquiries)} contact enquiries.")

        print("\n=======================================================")
        print("DATABASE SEEDING COMPLETED SUCCESSFULLY!")
        print(f"Summary:")
        print(f" - 3 Products (Home, Car, Personal)")
        print(f" - 7 Institutions (5 Banks + 2 NBFCs)")
        print(f" - {len(links)} Product-Bank Links")
        print(f" - 8 Agents (2 Admins, 6 Regular Agents)")
        print(f" - {len(created_apps)} Loan Applications (All Pending Review)")
        print(f" - 3 Contact Enquiries")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
