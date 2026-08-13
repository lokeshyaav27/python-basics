from pydantic import BaseModel
from typing import Optional


class ProductBase(BaseModel):
    name: str
    description: str
    image: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    class Config:
        orm_mode = True
