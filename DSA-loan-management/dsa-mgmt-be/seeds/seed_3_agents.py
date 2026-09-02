import os
import sys
import shutil
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine
from app.db.db_utils import ensure_database_exists
from dsa_common.models import Base
from dsa_common.models import Agent
from app.core.security import hash_password


def copy_agents_static_assets():
    """Copies agent photos to storage directory."""
    base_dir = Path(__file__).resolve().parents[1]
    source_img_dir = base_dir.parent / "dsa-loan-mgmt-images"
    storage_dir = base_dir / "dsa-file-storage" / "agent-photos"
    storage_dir.mkdir(parents=True, exist_ok=True)

    if source_img_dir.exists():
        user_src_dir = source_img_dir / "dsa-user-images"
        if user_src_dir.exists():
            for user_img in user_src_dir.glob("*.png"):
                shutil.copy2(user_img, storage_dir / user_img.name)
                print(f"Copied agent photo: {user_img.name}")


def seed_agents():
    """Seeds DSA agents and secondary admins."""
    ensure_database_exists()
    copy_agents_static_assets()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n--- Seeding DSA Agents & Secondary Admins ---")
        agents_data = [
            {"name": "Rajesh Sharma (Admin)", "email": "rajesh.admin@dsafinance.com", "mobile": "9810011223", "password": "azilen@123", "is_admin": True, "photo": "user-02.png"},
            {"name": "Lokesh Yadav", "email": "lokesh_yadav@yopmail.com", "mobile": "2222222222", "password": "azilen@123", "is_admin": False, "photo": "user-03.png"},
            {"name": "Priya Verma", "email": "priya.verma@dsafinance.com", "mobile": "9876500001", "password": "azilen@123", "is_admin": False, "photo": "user-04.png"},
            {"name": "Amitabh Sen", "email": "amitabh.sen@dsafinance.com", "mobile": "9876500002", "password": "azilen@123", "is_admin": False, "photo": "user-05.png"},
            {"name": "Sneha Kulkarni", "email": "sneha.k@dsafinance.com", "mobile": "9876500003", "password": "azilen@123", "is_admin": False, "photo": "user-06.png"},
            {"name": "Vikram Malhotra", "email": "vikram.m@dsafinance.com", "mobile": "9876500004", "password": "azilen@123", "is_admin": False, "photo": "user-07.png"},
            {"name": "Ananya Roy", "email": "ananya.roy@dsafinance.com", "mobile": "9876500005", "password": "azilen@123", "is_admin": False, "photo": "user-08.png"},
        ]

        seeded_agents = []
        for ag in agents_data:
            a = db.query(Agent).filter(Agent.email.ilike(ag["email"])).first()
            if not a:
                a = Agent(
                    name=ag["name"],
                    email=ag["email"],
                    mobile=ag["mobile"],
                    password=hash_password(ag["password"]),
                    tempPasswordReset=True,
                    isAdmin=ag["is_admin"],
                    photo=ag["photo"],
                    isActive=True,
                )
                db.add(a)
                db.commit()
                db.refresh(a)
                print(f"Created agent: {a.name} ({a.email}) [Admin={a.isAdmin}]")
            else:
                a.name = ag["name"]
                a.mobile = ag["mobile"]
                a.password = hash_password(ag["password"])
                a.tempPasswordReset = True
                a.isAdmin = ag["is_admin"]
                a.photo = ag["photo"]
                a.isActive = True
                db.commit()
                db.refresh(a)
                print(f"Updated agent: {a.name} ({a.email}) [Admin={a.isAdmin}]")
            seeded_agents.append(a)

        regular_agents = [a for a in seeded_agents if not a.isAdmin]
        print(f"\nSuccessfully seeded {len(seeded_agents)} agents ({len(regular_agents)} regular agents).")
        return seeded_agents

    except Exception as e:
        db.rollback()
        print(f"Error seeding agents: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_agents()
