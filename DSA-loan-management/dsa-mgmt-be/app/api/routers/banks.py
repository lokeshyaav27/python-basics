from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.session import SessionLocal
from app.models.bank import Bank
from app.models.product import Product
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
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
    links = db.query(ProductBankLink).filter(ProductBankLink.bankId == bank_id).all()
    links_map = {link.productId: link for link in links}

    result = []
    for p in products:
        link = links_map.get(p.id)
        docs = []
        if link:
            # Query multiple documents from bank_documents table
            db_docs = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).order_by(BankDocument.id.asc()).all()
            for d in db_docs:
                docs.append({
                    "id": d.id,
                    "name": d.documentName,
                    "fileName": d.documentLocation,
                    "createdAt": d.createdAt.isoformat() if d.createdAt else None,
                })

        result.append({
            "productId": p.id,
            "productName": p.name,
            "productDescription": p.description,
            "productImage": p.image,
            "isLinked": link is not None,
            "linkId": link.id if link else None,
            "commission": float(link.commission) if (link and link.commission is not None) else None,
            "documents": docs,
        })
    return result


@router.post("/{bank_id}/products/{product_id}/link")
def link_bank_product(
    bank_id: int,
    product_id: int,
    is_linked: bool = Form(...),
    commission: Optional[float] = Form(None),
    db: Session = Depends(get_db),
):
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank_id,
        ProductBankLink.productId == product_id,
    ).first()

    storage = get_document_storage()

    # If unlinking, delete the link record and attached documents
    if not is_linked:
        if link:
            # Delete attached bank_documents
            attached_docs = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).all()
            for doc in attached_docs:
                try:
                    (storage / doc.documentLocation).unlink(missing_ok=True)
                except Exception:
                    pass
                db.delete(doc)

            db.delete(link)
            db.commit()
        return {"status": "ok", "isLinked": False}

    # If linking (or updating existing link)
    if not link:
        link = ProductBankLink(bankId=bank_id, productId=product_id)
        db.add(link)
        db.flush()

    if commission is not None:
        link.commission = commission

    db.commit()
    db.refresh(link)

    # Fetch all docs
    db_docs = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).all()
    docs = [{"id": d.id, "name": d.documentName, "fileName": d.documentLocation} for d in db_docs]

    return {
        "status": "ok",
        "isLinked": True,
        "linkId": link.id,
        "commission": float(link.commission) if link.commission is not None else None,
        "documents": docs,
    }


@router.post("/{bank_id}/products/{product_id}/documents")
def upload_bank_product_document(
    bank_id: int,
    product_id: int,
    file: UploadFile = File(...),
    document_name: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail="Bank not found")

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get or create link
    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank_id,
        ProductBankLink.productId == product_id,
    ).first()

    if not link:
        link = ProductBankLink(bankId=bank_id, productId=product_id)
        db.add(link)
        db.flush()

    contents = file.file.read()
    size_limit = 20 * 1024 * 1024  # 20MB limit
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail="Document too large; max 20MB")

    storage = get_document_storage()
    orig_name = file.filename or "document.pdf"
    doc_title = document_name.strip() if (document_name and document_name.strip()) else orig_name

    ext = os.path.splitext(orig_name)[1].lower() or ".pdf"
    fname = f"{uuid4().hex}{ext}"
    with open(storage / fname, "wb") as f:
        f.write(contents)

    new_doc = BankDocument(
        productBankLinkId=link.id,
        documentName=doc_title,
        documentLocation=fname,
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)

    return {
        "status": "ok",
        "document": {
            "id": new_doc.id,
            "name": new_doc.documentName,
            "fileName": new_doc.documentLocation,
            "createdAt": new_doc.createdAt.isoformat() if new_doc.createdAt else None,
        }
    }


@router.delete("/{bank_id}/products/{product_id}/documents/{document_id}")
def delete_bank_product_document(
    bank_id: int,
    product_id: int,
    document_id: int,
    db: Session = Depends(get_db),
):
    link = db.query(ProductBankLink).filter(
        ProductBankLink.bankId == bank_id,
        ProductBankLink.productId == product_id,
    ).first()

    if not link:
        raise HTTPException(status_code=404, detail="Product link not found")

    doc = db.query(BankDocument).filter(
        BankDocument.id == document_id,
        BankDocument.productBankLinkId == link.id,
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    storage = get_document_storage()
    try:
        (storage / doc.documentLocation).unlink(missing_ok=True)
    except Exception:
        pass

    db.delete(doc)
    db.commit()
    return {"status": "ok"}
