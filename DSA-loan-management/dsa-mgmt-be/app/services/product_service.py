from typing import List, Optional
from fastapi import HTTPException, UploadFile
from app.models.product import Product
from app.repositories.product_repository import ProductRepository
from app.schemas.product import ProductRead
from app.core.storage import validate_and_save_image, delete_storage_file


class ProductService:
    def __init__(self, product_repo: ProductRepository):
        self.product_repo = product_repo

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
        fname = validate_and_save_image(file, subfolder="product-images", target_ratio=2/3)
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
            image_fname = validate_and_save_image(file, subfolder="product-images", target_ratio=2/3)
            update_image = True
        elif remove_image:
            if product.image:
                delete_storage_file(product.image, subfolder="product-images")
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
