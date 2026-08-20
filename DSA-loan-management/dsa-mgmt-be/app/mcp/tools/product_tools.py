from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.product import Product


PRODUCT_TOOLS_SPECS = [
    {
        "name": "get_all_products",
        "description": "Lists all available loan products in the platform (e.g. Home Loan, Car Loan, Personal Loan).",
        "parameters": {
            "type": "object",
            "properties": {}
        }
    }
]


def get_all_products(
    db: Session,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    products = db.query(Product).filter(Product.isActive != False).order_by(Product.id.asc()).all()
    return {
        "totalProducts": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
                "image": p.image,
            }
            for p in products
        ]
    }
