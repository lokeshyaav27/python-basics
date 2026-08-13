from fastapi import FastAPI
from app.api import routers as api_routers
from app.db.session import engine
from app.models.base import Base

app = FastAPI(title="DSA Mgmt BE")

app.include_router(api_routers.products.router, prefix="/api/products", tags=["products"])


@app.on_event("startup")
def on_startup():
    # Create DB tables from models (development convenience)
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "dsa-mgmt-be"}
