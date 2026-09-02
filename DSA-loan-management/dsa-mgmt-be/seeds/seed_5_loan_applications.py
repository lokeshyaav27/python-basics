import os
import sys
from pathlib import Path
from decimal import Decimal
import random

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine
from app.db.db_utils import ensure_database_exists
from dsa_common.models import Base
from dsa_common.models import Product
from dsa_common.models import Agent
from dsa_common.models import ClientGeneralDetail
from dsa_common.models import HomeLoanDetail
from dsa_common.models import CarLoanDetail
from dsa_common.models import PersonalLoanDetail
from dsa_common.models import LoanApplication


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

        lokesh_agent = next((a for a in agents if "lokesh_yadav@yopmail.com" in a.email.lower()), agents[0])
        other_agents = [a for a in agents if a.id != lokesh_agent.id]
        if not other_agents:
            other_agents = [lokesh_agent]

        # ── Customer Data Definitions ─────────────────────────────────────────
        print("\n--- Seeding Loan Applications (Pending Review) ---")
        customers = [
            {"name": "Nishchay Yadav", "mobile": "1231231230", "email": "nishchay@application.com", "city": "Delhi NCR", "income": 95000, "age": 32, "gender": "Male"},
            {"name": "Rahul Sharma", "mobile": "9876543210", "email": "rahul.sharma@gmail.com", "city": "Mumbai", "income": 120000, "age": 36, "gender": "Male"},
            {"name": "Pooja Hegde", "mobile": "9822334455", "email": "pooja.h@yahoo.com", "city": "Bangalore", "income": 85000, "age": 29, "gender": "Female"},
            {"name": "Rohan Gupta", "mobile": "9811223344", "email": "rohan.gupta@outlook.com", "city": "Pune", "income": 110000, "age": 34, "gender": "Male"},
            {"name": "Neha Mehta", "mobile": "9844556677", "email": "neha.mehta@gmail.com", "city": "Ahmedabad", "income": 70000, "age": 31, "gender": "Female"},
            {"name": "Siddharth Rao", "mobile": "9855667788", "email": "sid.rao@rediffmail.com", "city": "Hyderabad", "income": 140000, "age": 40, "gender": "Male"},
            {"name": "Divya Sundaram", "mobile": "9866778899", "email": "divya.s@gmail.com", "city": "Chennai", "income": 90000, "age": 28, "gender": "Female"},
            {"name": "Karan Kapoor", "mobile": "9877889900", "email": "karan.k@yahoo.com", "city": "Chandigarh", "income": 105000, "age": 35, "gender": "Male"},
        ]

        p_home = next((p for p in products if "home" in p.name.lower()), products[0])
        p_car = next((p for p in products if "car" in p.name.lower()), products[min(1, len(products)-1)])
        p_personal = next((p for p in products if "personal" in p.name.lower()), products[min(2, len(products)-1)])

        # 18 Loan Applications: Exactly 1 Personal, 2 Car, 15 Home
        # 15 applications assigned to lokesh agent (1 Personal, 2 Car, 12 Home)
        apps_plan = [
            # Exactly 1 Personal Loan -> Assigned to Lokesh Agent
            {"cust_idx": 0, "prod": p_personal, "req_amt": 350000, "tenure": 24, "agent": lokesh_agent},

            # Exactly 2 Car Loans -> Both assigned to Lokesh Agent
            {"cust_idx": 0, "prod": p_car, "req_amt": 1200000, "tenure": 60, "agent": lokesh_agent},
            {"cust_idx": 1, "prod": p_car, "req_amt": 1800000, "tenure": 60, "agent": lokesh_agent},

            # 12 Home Loans assigned to Lokesh Agent
            {"cust_idx": 0, "prod": p_home, "req_amt": 5000000, "tenure": 240, "agent": lokesh_agent},
            {"cust_idx": 1, "prod": p_home, "req_amt": 7500000, "tenure": 300, "agent": lokesh_agent},
            {"cust_idx": 2, "prod": p_home, "req_amt": 4200000, "tenure": 180, "agent": lokesh_agent},
            {"cust_idx": 3, "prod": p_home, "req_amt": 6000000, "tenure": 240, "agent": lokesh_agent},
            {"cust_idx": 4, "prod": p_home, "req_amt": 3500000, "tenure": 180, "agent": lokesh_agent},
            {"cust_idx": 5, "prod": p_home, "req_amt": 8500000, "tenure": 240, "agent": lokesh_agent},
            {"cust_idx": 6, "prod": p_home, "req_amt": 4800000, "tenure": 240, "agent": lokesh_agent},
            {"cust_idx": 7, "prod": p_home, "req_amt": 5500000, "tenure": 180, "agent": lokesh_agent},
            {"cust_idx": 0, "prod": p_home, "req_amt": 3200000, "tenure": 180, "agent": lokesh_agent},
            {"cust_idx": 1, "prod": p_home, "req_amt": 6500000, "tenure": 240, "agent": lokesh_agent},
            {"cust_idx": 2, "prod": p_home, "req_amt": 2800000, "tenure": 120, "agent": lokesh_agent},
            {"cust_idx": 3, "prod": p_home, "req_amt": 9000000, "tenure": 300, "agent": lokesh_agent},

            # Remaining 3 Home Loans assigned to other team agents
            {"cust_idx": 4, "prod": p_home, "req_amt": 4500000, "tenure": 240, "agent": other_agents[0 % len(other_agents)]},
            {"cust_idx": 5, "prod": p_home, "req_amt": 7000000, "tenure": 240, "agent": other_agents[1 % len(other_agents)]},
            {"cust_idx": 6, "prod": p_home, "req_amt": 5200000, "tenure": 200, "agent": other_agents[2 % len(other_agents)]},
        ]

        created_apps = []
        for i, plan in enumerate(apps_plan, 1):
            cust = customers[plan["cust_idx"]]
            prod = plan["prod"]
            assigned_agent = plan["agent"]

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
                    loan_amount_required=Decimal(str(plan["req_amt"])),
                    preferred_tenure=plan["tenure"],
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
                    loan_amount_required=Decimal(str(plan["req_amt"])),
                    preferred_tenure=plan["tenure"],
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
                    loan_amount_required=Decimal(str(plan["req_amt"])),
                    preferred_tenure=plan["tenure"],
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
