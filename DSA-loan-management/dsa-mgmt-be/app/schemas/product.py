from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    description: str
    image: str


class ProductCreate(ProductBase):
    pass


class ProductRead(ProductBase):
    id: int

    class Config:
        from_attributes = True
