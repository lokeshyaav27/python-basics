from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import routers as api_routers
from app.db.session import engine
from app.models.base import Base

app = FastAPI(title="DSA Mgmt BE")

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
app.include_router(api_routers.banks.router, prefix="/api/banks", tags=["banks"])
app.include_router(api_routers.auth.router, prefix="/api/auth", tags=["auth"])


@app.on_event("startup")
def on_startup():
    # Create DB tables from models (development convenience)
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "dsa-mgmt-be"}
