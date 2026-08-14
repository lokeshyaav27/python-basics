from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from uuid import uuid4
import os
from io import BytesIO
from PIL import Image

from app.db.session import SessionLocal
from app.models.product import Product
from app.schemas.product import ProductRead
from app.api.routers.files import get_storage_dir

router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _sanitize_name(name: str) -> str:
    # simple sanitize: lowercase, replace spaces with -, keep alnum and -
    s = name.strip().lower().replace(' ', '-')
    return ''.join(ch for ch in s if (ch.isalnum() or ch == '-')) or uuid4().hex


@router.post("", response_model=ProductRead)
@router.post("/", response_model=ProductRead)
async def create_product(
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    contents = await file.read()
    size_limit = 3 * 1024 * 1024
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail='file too large; max 3MB')

    try:
        img = Image.open(BytesIO(contents))
        width, height = img.size
    except Exception:
        raise HTTPException(status_code=400, detail='invalid image file')

    if abs((height / width) - (2.0 / 3.0)) > 0.03:
        raise HTTPException(status_code=400, detail='image must have 2:3 (height:width) ratio')

    ext = os.path.splitext(file.filename)[1] or '.jpg'
    base = _sanitize_name(name)
    fname = f"{base}-{uuid4().hex}{ext}"
    storage = get_storage_dir()
    path = storage / fname
    with open(path, 'wb') as f:
        f.write(contents)

    p = Product(name=name, description=description, image=fname)
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("", response_model=List[ProductRead])
@router.get("/", response_model=List[ProductRead])
def list_products(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Product)
    if not include_inactive:
        query = query.filter(Product.isActive != False)
    return query.all()


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    name: str = Form(...),
    description: str = Form(...),
    file: UploadFile | None = File(None),
    remove_image: bool = Form(False),
    db: Session = Depends(get_db),
):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="product not found")

    storage = get_storage_dir()
    # If remove_image flag set and no new file provided, delete old image and clear
    if remove_image and file is None:
        if p.image:
            old = storage / p.image
            if old.exists():
                try:
                    old.unlink()
                except Exception:
                    pass
        p.image = ''

    # If new file provided, validate, save and delete old
    elif file is not None:
        contents = await file.read()
        size_limit = 3 * 1024 * 1024
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail='file too large; max 3MB')
        try:
            img = Image.open(BytesIO(contents))
            width, height = img.size
        except Exception:
            raise HTTPException(status_code=400, detail='invalid image file')
        if abs((height / width) - (2.0 / 3.0)) > 0.03:
            raise HTTPException(status_code=400, detail='image must have 2:3 (height:width) ratio')

        ext = os.path.splitext(file.filename)[1] or '.jpg'
        base = _sanitize_name(name)
        fname = f"{base}-{uuid4().hex}{ext}"
        storage = get_storage_dir()
        new_path = storage / fname
        with open(new_path, 'wb') as f:
            f.write(contents)

        # delete old image if exists
        if p.image:
            old = storage / p.image
            if old.exists():
                try:
                    old.unlink()
                except Exception:
                    pass

        p.image = fname

    p.name = name
    p.description = description
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="product not found")
    p.isActive = False
    db.add(p)
    db.commit()
    return {"status": "ok", "deleted_id": product_id}
