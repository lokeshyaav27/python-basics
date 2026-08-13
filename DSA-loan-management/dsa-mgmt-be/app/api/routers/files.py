from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.product import Product
from pathlib import Path
import os
from uuid import uuid4
from io import BytesIO
from PIL import Image

router = APIRouter()


def get_storage_dir() -> Path:
    # Project root is two levels up from app/ (dsa-mgmt-be parent)
    project_root = Path(__file__).resolve().parents[4].parent
    storage = project_root / 'dsa-file-storage' / 'product-images'
    storage.mkdir(parents=True, exist_ok=True)
    return storage


@router.post('/product-image')
async def upload_product_image(file: UploadFile = File(...), product_id: int | None = None, db: Session = Depends(get_db)):
    contents = await file.read()
    size_limit = 3 * 1024 * 1024
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail='file too large; max 3MB')

    try:
        img = Image.open(BytesIO(contents))
        width, height = img.size
    except Exception:
        raise HTTPException(status_code=400, detail='invalid image file')

    # height:width should be 2:3 -> height/width == 2/3
    if abs((height / width) - (2.0 / 3.0)) > 0.03:
        raise HTTPException(status_code=400, detail='image must have 2:3 (height:width) ratio')

    ext = os.path.splitext(file.filename)[1] or '.jpg'
    fname = f"{uuid4().hex}{ext}"
    storage = get_storage_dir()
    file_path = storage / fname
    with open(file_path, 'wb') as f:
        f.write(contents)

    # If product_id provided, update product.image and delete previous file
    if product_id is not None:
        p = db.query(Product).filter(Product.id == product_id).first()
        if not p:
            # remove saved file
            try:
                file_path.unlink()
            except Exception:
                pass
            raise HTTPException(status_code=404, detail='product not found')

        # delete old image if exists
        if p.image:
            old_path = storage / p.image
            if old_path.exists():
                try:
                    old_path.unlink()
                except Exception:
                    pass

        p.image = fname
        db.add(p)
        db.commit()
        db.refresh(p)
        return {'filename': fname, 'product_id': p.id}

    return {'filename': fname}


@router.delete('/product-image/{filename}')
def delete_product_image(filename: str):
    storage = get_storage_dir()
    path = storage / filename
    if path.exists():
        try:
            path.unlink()
            return JSONResponse({'status': 'ok'})
        except Exception:
            raise HTTPException(status_code=500, detail='could not delete file')
    raise HTTPException(status_code=404, detail='file not found')
