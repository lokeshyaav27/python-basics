import json
import logging
from typing import Dict, Any
from db.session import get_db_session
from app.models.bank import Bank
from app.models.product import Product
from app.models.product_bank_link import ProductBankLink

logger = logging.getLogger("mcp_resources.catalog")


def get_bank_catalog_resource() -> str:
    """
    Returns live JSON string resource for active partner banks and their basic profiles.
    URI: dsa://catalog/banks
    """
    logger.info("📦 [Resource: dsa://catalog/banks] Reading live partner bank catalog...")
    with get_db_session() as db:
        banks = db.query(Bank).filter(Bank.isActive != False).all()
        data = [
            {
                "id": b.id,
                "name": b.name,
                "isNationalize": b.isNationalize,
                "isPrivate": b.isPrivate,
                "isNbfc": b.isNbfc,
            }
            for b in banks
        ]
        logger.info(f"✅ [Resource: dsa://catalog/banks] Streamed {len(data)} active partner banks.")
        return json.dumps({"resource": "dsa://catalog/banks", "totalBanks": len(data), "banks": data}, indent=2)


def get_product_catalog_resource() -> str:
    """
    Returns live JSON string resource for active loan products.
    URI: dsa://catalog/products
    """
    logger.info("📦 [Resource: dsa://catalog/products] Reading live product catalog...")
    with get_db_session() as db:
        products = db.query(Product).filter(Product.isActive != False).all()
        data = [
            {
                "id": p.id,
                "name": p.name,
                "description": p.description,
            }
            for p in products
        ]
        logger.info(f"✅ [Resource: dsa://catalog/products] Streamed {len(data)} active loan products.")
        return json.dumps({"resource": "dsa://catalog/products", "totalProducts": len(data), "products": data}, indent=2)
