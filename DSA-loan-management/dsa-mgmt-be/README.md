# dsa-mgmt-be

Backend scaffold for DSA Loan Management (FastAPI + PostgreSQL).

Quick start:

```bash
cd DSA-loan-management/dsa-mgmt-be
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
# source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# edit DATABASE_URL in .env if needed
uvicorn app.main:app --reload
```

This scaffold contains a minimal FastAPI app, SQLAlchemy session, a sample `Product` model and router, an `.env.example`, and Alembic placeholders.
