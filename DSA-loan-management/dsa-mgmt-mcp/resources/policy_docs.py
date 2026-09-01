import json
from typing import Dict, Any
from db import get_db_session
from app.models.bank import Bank
from app.models.bank_document import BankDocument
from app.models.product_bank_link import ProductBankLink


def get_bank_policy_resource(bank_id: int) -> str:
    """
    Returns indexed policy documents and guidelines for a given partner bank.
    URI: dsa://policies/{bank_id}
    """
    with get_db_session() as db:
        bank = db.query(Bank).filter(Bank.id == bank_id).first()
        if not bank:
            return json.dumps({"error": f"Bank #{bank_id} not found."})

        links = db.query(ProductBankLink).filter(ProductBankLink.bankId == bank_id).all()
        link_ids = [l.id for l in links]

        docs = (
            db.query(BankDocument)
            .filter(BankDocument.productBankLinkId.in_(link_ids))
            .all()
            if link_ids
            else []
        )

        doc_data = [
            {
                "id": d.id,
                "documentName": d.documentName,
                "documentType": d.documentType,
                "fileSize": d.fileSize,
                "uploadDate": d.uploadDate.isoformat() if d.uploadDate else None,
            }
            for d in docs
        ]

        return json.dumps({
            "resource": f"dsa://policies/{bank_id}",
            "bankId": bank.id,
            "bankName": bank.name,
            "totalPolicyDocuments": len(doc_data),
            "documents": doc_data,
        }, indent=2)
