import json
import logging
from typing import Dict, Any
from db.session import get_db_session
from dsa_common.models import Bank, BankDocument, ProductBankLink

logger = logging.getLogger("mcp_resources.policy_docs")


def get_bank_policy_resource(bank_id: int) -> str:
    """
    Returns indexed policy documents and guidelines for a given partner bank.
    URI: dsa://policies/{bank_id}
    """
    logger.info(f"📦 [Resource: dsa://policies/{bank_id}] Fetching policy document library for Bank #{bank_id}")
    with get_db_session() as db:
        bank = db.query(Bank).filter(Bank.id == bank_id).first()
        if not bank:
            logger.warning(f"📦 [Resource: dsa://policies/{bank_id}] ❌ Bank #{bank_id} not found.")
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
                "documentType": getattr(d, "documentType", "PDF"),
                "fileSize": getattr(d, "fileSize", None),
                "uploadDate": d.createdAt.isoformat() if d.createdAt else None,
            }
            for d in docs
        ]

        logger.info(f"✅ [Resource: dsa://policies/{bank_id}] Streamed {len(doc_data)} policy documents for '{bank.name}'.")
        return json.dumps({
            "resource": f"dsa://policies/{bank_id}",
            "bankId": bank.id,
            "bankName": bank.name,
            "totalPolicyDocuments": len(doc_data),
            "documents": doc_data,
        }, indent=2)
