import os
from io import BytesIO
from pathlib import Path
from typing import List, Optional
from uuid import uuid4
from PIL import Image
from fastapi import HTTPException, UploadFile
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductRead


class ProductService:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

    @staticmethod
    def get_storage_path() -> Path:
        project_root = Path(__file__).resolve().parents[2]
        storage = project_root / 'dsa-file-storage' / 'product-images'
        storage.mkdir(parents=True, exist_ok=True)
        return storage

    def validate_and_save_image(self, file: UploadFile) -> str:
        contents = file.file.read()
        size_limit = 3 * 1024 * 1024
        if len(contents) > size_limit:
            raise HTTPException(status_code=400, detail='File too large; max 3MB')

        try:
            img = Image.open(BytesIO(contents))
            width, height = img.size
        except Exception:
            raise HTTPException(status_code=400, detail='Invalid image file')

        ratio = width / height
        target_ratio = 2 / 3
        tol = 0.08
        if abs(ratio - target_ratio) > tol:
            raise HTTPException(
                status_code=400,
                detail=f'Image aspect ratio must be 2:3 (width:height). Detected ratio: {ratio:.2f}',
            )

        ext = os.path.splitext(file.filename)[1] or '.jpg'
        fname = f"{uuid4().hex}{ext}"
        storage = self.get_storage_path()
        with open(storage / fname, 'wb') as f:
            f.write(contents)
        return fname

    def list_products(self, include_inactive: bool = False) -> List[ProductRead]:
        products = self.product_repo.list_products(include_inactive=include_inactive)
        return [ProductRead.from_orm(p) for p in products]

    def get_product_by_id(self, product_id: int) -> ProductRead:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail='Product not found')
        return ProductRead.from_orm(product)

    def create_product(self, name: str, description: str, file: UploadFile) -> ProductRead:
        if not file or not file.filename:
            raise HTTPException(status_code=400, detail='Image file is required')
        fname = self.validate_and_save_image(file)
        product = self.product_repo.create(name=name, description=description, image_filename=fname)
        return ProductRead.from_orm(product)

    def update_product(
        self,
        product_id: int,
        name: str,
        description: str,
        file: Optional[UploadFile] = None,
        remove_image: bool = False,
    ) -> ProductRead:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail='Product not found')

        image_fname = product.image
        update_image = False
        if file is not None and file.filename:
            image_fname = self.validate_and_save_image(file)
            update_image = True
        elif remove_image:
            image_fname = None
            update_image = True

        updated_product = self.product_repo.update(
            product=product,
            name=name,
            description=description,
            image_filename=image_fname,
            update_image=update_image,
        )
        return ProductRead.from_orm(updated_product)

    def delete_product(self, product_id: int) -> dict:
        product = self.product_repo.get_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail='Product not found')
        self.product_repo.soft_delete(product)
        return {"id": product_id, "deleted": True}
