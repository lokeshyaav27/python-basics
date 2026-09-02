from typing import List, Optional
from sqlalchemy.orm import Session
from dsa_common.models.product import Product


class ProductRepository:
    def __init__(self, db: Session):
        self.db = db

    def list_products(self, include_inactive: bool = False) -> List[Product]:
        query = self.db.query(Product)
        if not include_inactive:
            query = query.filter(Product.isActive != False)
        return query.all()

    def get_by_id(self, product_id: int) -> Optional[Product]:
        return self.db.query(Product).filter(Product.id == product_id).first()

    def create(self, name: str, description: str, image_filename: Optional[str] = None) -> Product:
        product = Product(name=name, description=description, image=image_filename)
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def update(
        self,
        product: Product,
        name: str,
        description: str,
        image_filename: Optional[str] = None,
        update_image: bool = False,
    ) -> Product:
        product.name = name
        product.description = description
        if update_image:
            product.image = image_filename
        self.db.add(product)
        self.db.commit()
        self.db.refresh(product)
        return product

    def soft_delete(self, product: Product) -> Product:
        product.isActive = False
        self.db.add(product)
        self.db.commit()
        return product
