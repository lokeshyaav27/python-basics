from sqlalchemy import Column, Integer, String, Text
from app.models.base import Base


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    image = Column(String(1024), nullable=True)
