from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routers as api_routers
from app.db.session import engine
from app.models.base import Base
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(title="DSA Loan Management Backend")

# Mount static file storage directories
project_root = Path(__file__).resolve().parents[1]
storage_base = project_root / 'dsa-file-storage'

for subfolder, endpoint in [
    ('product-images', '/static/product-images'),
    ('bank-logo-images', '/static/bank-logo-images'),
    ('agent-photos', '/static/agent-photos'),
    ('bank-documents', '/static/bank-documents'),
]:
    target_dir = storage_base / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    app.mount(endpoint, StaticFiles(directory=str(target_dir)), name=subfolder)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_routers.products.router, prefix="/api/products", tags=["products"])
app.include_router(api_routers.banks.router, prefix="/api/banks", tags=["banks"])
app.include_router(api_routers.agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(api_routers.auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(api_routers.files.router, prefix="/api/files", tags=["files"])
app.include_router(api_routers.loan_applications.router, prefix="/api/loan-applications", tags=["loan-applications"])
app.include_router(api_routers.contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(api_routers.rag.router, prefix="/api/rag", tags=["rag"])
app.include_router(api_routers.eligibility.router, prefix="/api/eligibility", tags=["eligibility"])


@app.on_event("startup")
def on_startup():
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    # Ensure tables are registered and created
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "dsa-loan-mgmt-be"}
