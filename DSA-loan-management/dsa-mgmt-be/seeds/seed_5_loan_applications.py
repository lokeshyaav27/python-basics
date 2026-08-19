import os
import sys
from pathlib import Path
from decimal import Decimal
import random

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine
from app.db.db_utils import ensure_database_exists
from app.models.base import Base
from app.models.product import Product
from app.models.agent import Agent
from app.models.client_general_detail import ClientGeneralDetail
from app.models.home_loan_detail import HomeLoanDetail
from app.models.car_loan_detail import CarLoanDetail
from app.models.personal_loan_detail import PersonalLoanDetail
from app.models.loan_application import LoanApplication


def seed_loan_applications():
    """Seeds demo loan applications (all Pending Review) across diverse customers."""
    ensure_database_exists()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        products = db.query(Product).filter(Product.isActive != False).all()
        agents = db.query(Agent).filter(Agent.isAdmin == False, Agent.isActive != False).all()

        if not products:
            print("Products missing. Please run seed_2_products_banks.py first.")
            from seeds.seed_2_products_banks import seed_products_banks
            products, _ = seed_products_banks()

        if not agents:
            print("Agents missing. Please run seed_3_agents.py first.")
            from seeds.seed_3_agents import seed_agents
            agents = [a for a in seed_agents() if not a.isAdmin]

        # ── Customer Data Definitions ─────────────────────────────────────────
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

        # 17 Loan Applications across 8 unique customers
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

        p_home = next((p for p in products if "home" in p.name.lower()), products[0])
        p_car = next((p for p in products if "car" in p.name.lower()), products[min(1, len(products)-1)])
        p_personal = next((p for p in products if "personal" in p.name.lower()), products[min(2, len(products)-1)])
        product_list = [p_home, p_car, p_personal]

        created_apps = []
        for i, plan in enumerate(apps_plan, 1):
            cust = customers[plan["cust_idx"]]
            prod = product_list[plan["prod_idx"]]
            assigned_agent = agents[(i - 1) % len(agents)]

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

            if "home" in prod.name.lower():
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

            elif "car" in prod.name.lower():
                cld = CarLoanDetail(
                    new_or_used="New",
                    car_value=Decimal(str(int(plan["req_amt"] * 1.15))),
                    down_payment=Decimal(str(int(plan["req_amt"] * 0.15))),
                    vehicle_age=0,
                )
                db.add(cld)
                db.flush()
                car_id = cld.id

            elif "personal" in prod.name.lower():
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
        return created_apps

    except Exception as e:
        db.rollback()
        print(f"Error seeding loan applications: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_loan_applications()
