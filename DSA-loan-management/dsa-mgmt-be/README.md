# dsa-mgmt-be

Backend scaffold for DSA Loan Management (FastAPI + PostgreSQL).

Quick start:

```bash
cd DSA-loan-management/dsa-mgmt-be
python -m venv .venv

# Windows (PowerShell):
.venv\Scripts\Activate.ps1
# Windows (Command Prompt):
.venv\Scripts\activate.bat
# macOS / Linux:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# (edit DATABASE_URL in .env if needed)

uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

This scaffold contains a minimal FastAPI app, SQLAlchemy session, a sample `Product` model and router, an `.env.example`, and Alembic placeholders.
