from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.bank import Bank
from app.models.product import Product
from app.models.product_bank_link import ProductBankLink
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


def get_document_storage() -> Path:
    project_root = Path(__file__).resolve().parents[3]
    storage = project_root / 'dsa-file-storage' / 'bank-documents'
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
def list_banks(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Bank)
    if not include_inactive:
        query = query.filter(Bank.isActive == True)
    return query.all()


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
    b.isActive = False
    db.add(b)
    db.commit()
    return {"status": "ok"}


# ── Product Linking Endpoints ─────────────────────────────────────────────────

@router.get("/{bank_id}/products")
def get_bank_products(bank_id: int, db: Session = Depends(get_db)):
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    # Get all active products
    products = db.query(Product).filter(Product.isActive == True).all()

    # Get existing links for this bank
    links = db.query(ProductBankLink).filter(ProductBankLink.bankid == bank_id).all()
    links_map = {link.productid: link for link in links}

    result = []
    for p in products:
        link = links_map.get(p.id)
        result.append({
            "productId": p.id,
            "productName": p.name,
            "productDescription": p.description,
            "productImage": p.image,
            "isLinked": link is not None,
            "linkId": link.id if link else None,
            "commission": float(link.commission) if (link and link.commission is not None) else None,
            "policyDocument": link.policyDocument if link else None,
        })
    return result


@router.post("/{bank_id}/products/{product_id}/link")
def link_bank_product(
    bank_id: int,
    product_id: int,
    is_linked: bool = Form(...),
    commission: Optional[float] = Form(None),
    file: UploadFile | None = File(None),
    remove_document: bool = Form(False),
    db: Session = Depends(get_db),
):
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankid == bank_id,
        ProductBankLink.productid == product_id,
    ).first()

    storage = get_document_storage()

    # If unlinking, delete the link record and remove policy doc
    if not is_linked:
        if link:
            if link.policyDocument:
                old = storage / link.policyDocument
                if old.exists():
                    try:
                        old.unlink()
                    except Exception:
                        pass
            db.delete(link)
            db.commit()
        return {"status": "ok", "isLinked": False}

    # If linking (or updating existing link)
    if not link:
        link = ProductBankLink(bankid=bank_id, productid=product_id)
        db.add(link)

    if commission is not None:
        link.commission = commission

    if file is not None:
        contents = file.file.read()
        size_limit = 10 * 1024 * 1024  # 10MB limit for policy documents
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail="Document too large; max 10MB")

        ext = os.path.splitext(file.filename or "")[1].lower() or ".pdf"
        fname = f"{uuid4().hex}{ext}"
        with open(storage / fname, "wb") as f:
            f.write(contents)

        if link.policyDocument:
            old = storage / link.policyDocument
            if old.exists():
                try:
                    old.unlink()
                except Exception:
                    pass
        link.policyDocument = fname
    elif remove_document and link.policyDocument:
        old = storage / link.policyDocument
        if old.exists():
            try:
                old.unlink()
            except Exception:
                pass
        link.policyDocument = None

    db.commit()
    db.refresh(link)

    return {
        "status": "ok",
        "isLinked": True,
        "linkId": link.id,
        "commission": float(link.commission) if link.commission is not None else None,
        "policyDocument": link.policyDocument,
    }
