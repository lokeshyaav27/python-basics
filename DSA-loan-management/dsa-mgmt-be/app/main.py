from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routers as api_routers
from app.db.session import engine
from app.models.base import Base
from fastapi.staticfiles import StaticFiles
from pathlib import Path

app = FastAPI(title="DSA Mgmt BE")

# mount static files for product images inside this service folder (dsa-mgmt-be/dsa-file-storage)
project_root = Path(__file__).resolve().parents[1]
static_dir = project_root / 'dsa-file-storage' / 'product-images'
static_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/product-images", StaticFiles(directory=str(static_dir)), name="product-images")
# mount static files for bank logos
bank_logo_dir = project_root / 'dsa-file-storage' / 'bank-logo-images'
bank_logo_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/bank-logo-images", StaticFiles(directory=str(bank_logo_dir)), name="bank-logo-images")

# Allow CORS for frontend dev server(s)
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

app.include_router(api_routers.products.router, prefix="/api/products", tags=["products"])
from app.api.routers import files as file_router
app.include_router(file_router.router, prefix="/api/files", tags=["files"])
app.include_router(api_routers.banks.router, prefix="/api/banks", tags=["banks"])
app.include_router(api_routers.auth.router, prefix="/api/auth", tags=["auth"])


@app.on_event("startup")
def on_startup():
    # Create DB tables from models (development convenience)
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "dsa-mgmt-be"}
