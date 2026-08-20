from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.bank import Bank
from app.models.product_bank_link import ProductBankLink
from app.models.bank_document import BankDocument
from app.mcp.auth import check_auth_permission


BANK_TOOLS_SPECS = [
    {
        "name": "get_bank_list",
        "description": "Lists all active partner banks and NBFCs.",
        "parameters": {
            "type": "object",
            "properties": {
                "include_inactive": {"type": "boolean", "description": "Whether to include deactivated banks (Admin only)."}
            }
        }
    },
    {
        "name": "get_bank_list_by_product_id",
        "description": "Fetches all partner banks offering a specific loan product (e.g., Home Loan, Car Loan).",
        "parameters": {
            "type": "object",
            "properties": {
                "product_id": {"type": "integer", "description": "ID of the loan product."}
            },
            "required": ["product_id"]
        }
    },
    {
        "name": "get_commission_structure_by_bank_id",
        "description": "Fetches DSA payout and commission structures for a specific bank (Admin/Agent only).",
        "parameters": {
            "type": "object",
            "properties": {
                "bank_id": {"type": "integer", "description": "ID of the bank."}
            },
            "required": ["bank_id"]
        }
    }
]


def get_bank_list(
    db: Session,
    include_inactive: bool = False,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    query = db.query(Bank)
    if not include_inactive or role != "admin":
        query = query.filter(Bank.isActive != False)

    banks = query.order_by(Bank.id.asc()).all()
    return {
        "totalBanks": len(banks),
        "banks": [
            {
                "id": b.id,
                "name": b.name,
                "isNationalize": b.isNationalize,
                "isPrivate": b.isPrivate,
                "isNbfc": b.isNbfc,
                "logo": b.logo,
            }
            for b in banks
        ]
    }


def get_bank_list_by_product_id(
    db: Session,
    product_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    links = (
        db.query(ProductBankLink, Bank)
        .join(Bank, Bank.id == ProductBankLink.bankId)
        .filter(ProductBankLink.productId == product_id, Bank.isActive != False)
        .all()
    )

    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"

    result = []
    for link, bank in links:
        doc_count = db.query(BankDocument).filter(BankDocument.productBankLinkId == link.id).count()
        item: Dict[str, Any] = {
            "bankId": bank.id,
            "bankName": bank.name,
            "isNationalize": bank.isNationalize,
            "isPrivate": bank.isPrivate,
            "isNbfc": bank.isNbfc,
            "hasPolicyDocs": doc_count > 0,
        }
        if role in ["admin", "agent"]:
            item["dsaCommissionPct"] = float(link.commission) if link.commission is not None else None
        result.append(item)

    return {
        "productId": product_id,
        "totalBanks": len(result),
        "banks": result,
    }


def get_commission_structure_by_bank_id(
    db: Session,
    bank_id: int,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    role = str(auth_user.get("role", "customer")).lower() if auth_user else "customer"
    if role == "customer":
        raise HTTPException(status_code=403, detail="Forbidden: Commission structures are internal to DSA agents and admins.")

    bank = db.query(Bank).filter(Bank.id == bank_id).first()
    if not bank:
        raise HTTPException(status_code=404, detail=f"Bank #{bank_id} not found.")

    links = db.query(ProductBankLink).filter(ProductBankLink.bankId == bank_id).all()
    return {
        "bankId": bank.id,
        "bankName": bank.name,
        "productCommissions": [
            {
                "productId": l.productId,
                "productName": l.product.name if l.product else None,
                "commissionPercentage": float(l.commission) if l.commission is not None else None,
            }
            for l in links
        ]
    }
