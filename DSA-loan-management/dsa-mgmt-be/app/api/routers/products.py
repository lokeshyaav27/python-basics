from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.db.session import SessionLocal
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=ProductRead)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    p = Product(name=payload.name, description=payload.description, image=payload.image)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("/", response_model=List[ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()
