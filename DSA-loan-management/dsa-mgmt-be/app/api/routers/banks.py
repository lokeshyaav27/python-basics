from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.session import SessionLocal
from app.models.bank import Bank
from app.schemas.bank import BankCreate, BankRead

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=BankRead)
def create_bank(payload: BankCreate, db: Session = Depends(get_db)):
    b = Bank(name=payload.name, isNationalize=payload.isNationalize, isPrivate=payload.isPrivate, isnbfc=payload.isnbfc, logo=payload.logo)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.get("/", response_model=List[BankRead])
def list_banks(db: Session = Depends(get_db)):
    return db.query(Bank).all()
