from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.bank import Bank
from app.models.product import Product
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument


GET_BANK_PRODUCT_CATALOG_SPEC = {
    "name": "get_bank_product_catalog",
    "description": (
        "Fetches partner bank and product catalogs. Can retrieve: "
        "(1) all partner banks offering a specific loan product (pass product_id), "
        "(2) a bank's detailed profile and commission structure (pass bank_id), or "
        "(3) all active loan products and partner lending institutions."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional loan product ID (e.g. 1 for Home Loan, 2 for Car Loan, 3 for Personal Loan).",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional numeric partner bank ID to inspect bank details and commission slabs.",
            },
        },
    },
}

BANK_TOOLS_SPECS = [GET_BANK_PRODUCT_CATALOG_SPEC]


def get_bank_product_catalog(
    db: Session,
    product_id: Optional[int] = None,
    bank_id: Optional[int] = None,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Unified catalog tool for partner banks, products, and commission matrix.
    """
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    show_comm = role in ["admin", "agent"]

    # Case 1: Specific Bank Profile & Commission Slab Lookup
    if bank_id is not None and bank_id > 0:
        bank = db.query(Bank).filter(Bank.id == bank_id).first()
        if not bank:
            raise HTTPException(status_code=404, detail=f"Bank #{bank_id} not found.")

        links = db.query(ProductBankLink).filter(ProductBankLink.bankId == bank_id).all()
        products_offered = []
        for l in links:
            item = {
                "productId": l.productId,
                "productName": l.product.name if l.product else None,
            }
            if show_comm:
                item["dsaCommissionPct"] = float(l.commission) if l.commission is not None else None
            products_offered.append(item)

        return {
            "catalogType": "single_bank",
            "bankId": bank.id,
            "bankName": bank.name,
            "isNationalize": bank.isNationalize,
            "isPrivate": bank.isPrivate,
            "isNbfc": bank.isNbfc,
            "productsOffered": products_offered,
        }

    # Case 2: Banks by Specific Product
    if product_id is not None and product_id > 0:
        product = db.query(Product).filter(Product.id == product_id).first()
        links = (
            db.query(ProductBankLink, Bank)
            .join(Bank, Bank.id == ProductBankLink.bankId)
            .filter(ProductBankLink.productId == product_id, Bank.isActive != False)
            .all()
        )

        banks_list = []
        for link, bank in links:
            doc_count = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).count()
            item = {
                "bankId": bank.id,
                "bankName": bank.name,
                "isNationalize": bank.isNationalize,
                "isPrivate": bank.isPrivate,
                "isNbfc": bank.isNbfc,
                "hasPolicyDocs": doc_count > 0,
            }
            if show_comm:
                item["dsaCommissionPct"] = float(link.commission) if link.commission is not None else None
            if link.policyParameters:
                item["policyParameters"] = link.policyParameters
            banks_list.append(item)

        return {
            "catalogType": "product_banks",
            "productId": product_id,
            "productName": product.name if product else None,
            "totalPartnerBanks": len(banks_list),
            "partnerBanks": banks_list,
        }

    # Case 3: Complete Platform Catalog (All Products & Banks)
    products = db.query(Product).filter(Product.isActive != False).order_by(Product.id.asc()).all()
    banks = db.query(Bank).filter(Bank.isActive != False).order_by(Bank.id.asc()).all()

    return {
        "catalogType": "full_catalog",
        "totalProducts": len(products),
        "products": [{"id": p.id, "name": p.name, "description": p.description} for p in products],
        "totalBanks": len(banks),
        "banks": [
            {
                "id": b.id,
                "name": b.name,
                "isNationalize": b.isNationalize,
                "isPrivate": b.isPrivate,
                "isNbfc": b.isNbfc,
            }
            for b in banks
        ],
    }

