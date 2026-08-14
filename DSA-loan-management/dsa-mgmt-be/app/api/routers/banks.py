from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.bank import Bank
from app.schemas.bank import BankCreate, BankRead
from pathlib import Path
from io import BytesIO
from PIL import Image
import os
from uuid import uuid4

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_logo_storage() -> Path:
    project_root = Path(__file__).resolve().parents[3]
    storage = project_root / 'dsa-file-storage' / 'bank-logo-images'
    storage.mkdir(parents=True, exist_ok=True)
    return storage


@router.post("/", response_model=BankRead)
def create_bank(
    name: str = Form(...),
    isNationalize: bool = Form(False),
    isPrivate: bool = Form(False),
    isnbfc: bool = Form(False),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    logo_fname: Optional[str] = None
    if file is not None:
        contents = file.file.read()
        size_limit = 3 * 1024 * 1024
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail='file too large; max 3MB')
        try:
            img = Image.open(BytesIO(contents))
            width, height = img.size
        except Exception:
            raise HTTPException(status_code=400, detail='invalid image file')

        ext = os.path.splitext(file.filename)[1] or '.jpg'
        logo_fname = f"{uuid4().hex}{ext}"
        storage = get_logo_storage()
        with open(storage / logo_fname, 'wb') as f:
            f.write(contents)

    b = Bank(name=name, isNationalize=isNationalize, isPrivate=isPrivate, isnbfc=isnbfc, logo=logo_fname)
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.get("/", response_model=List[BankRead])
def list_banks(db: Session = Depends(get_db)):
    return db.query(Bank).all()


@router.put("/{bank_id}", response_model=BankRead)
def update_bank(
    bank_id: int,
    name: str = Form(...),
    isNationalize: bool = Form(False),
    isPrivate: bool = Form(False),
    isnbfc: bool = Form(False),
    file: UploadFile | None = File(None),
    remove_logo: bool = Form(False),
    db: Session = Depends(get_db),
):
    b = db.query(Bank).filter(Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail='bank not found')

    storage = get_logo_storage()

    # handle new file upload
    if file is not None:
        contents = file.file.read()
        size_limit = 3 * 1024 * 1024
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail='file too large; max 3MB')
        try:
            img = Image.open(BytesIO(contents))
            width, height = img.size
        except Exception:
            raise HTTPException(status_code=400, detail='invalid image file')

        ext = os.path.splitext(file.filename)[1] or '.jpg'
        logo_fname = f"{uuid4().hex}{ext}"
        with open(storage / logo_fname, 'wb') as f:
            f.write(contents)

        # delete old logo
        if b.logo:
            old = storage / b.logo
            if old.exists():
                try:
                    old.unlink()
                except Exception:
                    pass
        b.logo = logo_fname

    # handle remove flag — only when no new file was uploaded
    elif remove_logo and b.logo:
        old = storage / b.logo
        if old.exists():
            try:
                old.unlink()
            except Exception:
                pass
        b.logo = None

    b.name = name
    b.isNationalize = isNationalize
    b.isPrivate = isPrivate
    b.isnbfc = isnbfc
    db.add(b)
    db.commit()
    db.refresh(b)
    return b


@router.delete("/{bank_id}")
def delete_bank(bank_id: int, db: Session = Depends(get_db)):
    b = db.query(Bank).filter(Bank.id == bank_id).first()
    if not b:
        raise HTTPException(status_code=404, detail='bank not found')
    storage = get_logo_storage()
    if b.logo:
        old = storage / b.logo
        if old.exists():
            try:
                old.unlink()
            except Exception:
                pass
    db.delete(b)
    db.commit()
    return {"status": "ok"}
