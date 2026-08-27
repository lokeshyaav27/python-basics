import os
import sys
import shutil
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.session import SessionLocal, engine
from app.db.db_utils import ensure_database_exists
from app.models.base import Base
from app.models.agent import Agent
from app.core.security import hash_password


def copy_admin_static_assets():
    """Copies admin avatar to storage directory."""
    base_dir = Path(__file__).resolve().parents[1]
    source_img_dir = base_dir.parent / "dsa-loan-mgmt-images"
    storage_dir = base_dir / "dsa-file-storage" / "agent-photos"
    storage_dir.mkdir(parents=True, exist_ok=True)

    if source_img_dir.exists():
        user_src_dir = source_img_dir / "dsa-user-images"
        if user_src_dir.exists():
            admin_photo = user_src_dir / "user-01.png"
            if admin_photo.exists():
                shutil.copy2(admin_photo, storage_dir / "user-01.png")
                print("Copied admin photo: user-01.png")


def seed_admin():
    """Seeds only one default admin user in the agents table."""
    ensure_database_exists()
    copy_admin_static_assets()
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print("\n--- Seeding 1 Default Admin User ---")
        admin_email = "dsa_admin@yopmail.com"
        existing_admin = db.query(Agent).filter(Agent.email.ilike(admin_email)).first()

        if existing_admin:
            existing_admin.name = "Admin"
            existing_admin.mobile = "1111111111"
            existing_admin.password = hash_password("azilen@123")
            existing_admin.tempPasswordReset = True
            existing_admin.isAdmin = True
            existing_admin.photo = "user-01.png"
            existing_admin.isActive = True
            db.commit()
            db.refresh(existing_admin)
            print(f"Updated existing admin user: {existing_admin.email} (ID: {existing_admin.id})")
            return existing_admin
        else:
            admin = Agent(
                name="Admin",
                email=admin_email,
                mobile="1111111111",
                password=hash_password("azilen@123"),
                tempPasswordReset=True,
                isAdmin=True,
                photo="user-01.png",
                isActive=True,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            print(f"Created default admin user: {admin.email} (ID: {admin.id})")
            return admin

    except Exception as e:
        db.rollback()
        print(f"Error seeding admin: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
