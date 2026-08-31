from typing import Dict, Any, Optional, List
import re
from sqlalchemy.orm import Session
from app.models.bank import Bank
from app.models.product import Product
from app.rag import rag_service


SEARCH_BANK_POLICIES_SPEC = {
    "name": "search_bank_policies",
    "description": (
        "Performs semantic vector search across partner bank credit policy documents, "
        "eligibility guidelines, interest rate matrices, prepayment rules, FOIR/LTV thresholds, "
        "and required documentation using pgvector. Directly pass the bank name and topic in the query "
        "(e.g., 'HDFC home loan age limit', 'SBI prepayment penalty', 'ICICI minimum salary')."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "query": {
                "type": "string",
                "description": "Search query including bank name or policy topic (e.g. 'HDFC home loan prepayment penalty', 'SBI minimum salary').",
            },
            "bank_id": {
                "type": ["integer", "null"],
                "description": "Optional numeric bank ID to filter search results.",
            },
            "product_id": {
                "type": ["integer", "null"],
                "description": "Optional product ID (e.g., 1 for Home Loan) to filter search results.",
            },
            "top_k": {
                "type": ["integer", "null"],
                "description": "Number of top matching policy excerpts to retrieve (default 3).",
            },
        },
        "required": ["query"],
    },
}


def _resolve_bank_and_product_from_query(
    db: Session,
    query_text: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
) -> tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Infers bank_id and product_id from query keywords if not explicitly provided.
    """
    resolved_bank_id = bank_id
    resolved_product_id = product_id
    matched_bank_name = None

    q_lower = query_text.lower()

    if resolved_bank_id is None:
        active_banks = db.query(Bank).filter(Bank.isActive != False).all()
        matched_banks = []
        for b in active_banks:
            # Check bank name and standard short aliases
            b_name_lower = b.name.lower()
            aliases = [b_name_lower]
            if "state bank" in b_name_lower or "sbi" in b_name_lower:
                aliases.extend(["sbi", "state bank"])
            elif "hdfc" in b_name_lower:
                aliases.extend(["hdfc"])
            elif "icici" in b_name_lower:
                aliases.extend(["icici"])
            elif "axis" in b_name_lower:
                aliases.extend(["axis"])
            elif "punjab" in b_name_lower or "pnb" in b_name_lower:
                aliases.extend(["pnb", "punjab national"])
            elif "bajaj" in b_name_lower:
                aliases.extend(["bajaj"])
            elif "tata" in b_name_lower:
                aliases.extend(["tata", "tata capital"])

            if any(re.search(rf"\b{re.escape(alias)}\b", q_lower) for alias in aliases):
                matched_banks.append(b)

        if len(matched_banks) == 1:
            resolved_bank_id = matched_banks[0].id
            matched_bank_name = matched_banks[0].name
        elif len(matched_banks) > 1:
            # When multiple banks are mentioned in query (e.g. Axis and ICICI), do not restrict by single bank ID
            resolved_bank_id = None
            matched_bank_name = ", ".join(b.name for b in matched_banks)

    if resolved_product_id is None:
        active_products = db.query(Product).filter(Product.isActive != False).all()
        for p in active_products:
            p_name_lower = p.name.lower()
            if p_name_lower in q_lower or (p_name_lower.replace(" loan", "") in q_lower):
                resolved_product_id = p.id
                break

    return resolved_bank_id, resolved_product_id, matched_bank_name


def search_bank_policies(
    db: Session,
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 3,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Performs semantic vector search over bank policy & guideline PDF chunks using pgvector.
    Provides structured, token-compact excerpts for optimal LLM context size.
    """
    res_bank_id, res_prod_id, matched_bank = _resolve_bank_and_product_from_query(
        db=db,
        query_text=query,
        bank_id=bank_id,
        product_id=product_id,
    )

    # If multiple banks or all banks are targeted, retrieve more excerpts (up to 6)
    is_multi_bank = res_bank_id is None or (matched_bank and "," in matched_bank)
    limit = min(top_k or (6 if is_multi_bank else 3), 8 if is_multi_bank else 4)

    matches = rag_service.search_relevant_chunks(
        db=db,
        query_text=query,
        bank_id=res_bank_id,
        product_id=res_prod_id,
        top_k=limit,
    )

    compact_excerpts = []
    for m in matches:
        text_snippet = (m.get("chunkText") or "").strip()
        if len(text_snippet) > 350:
            text_snippet = text_snippet[:350] + "..."
        compact_excerpts.append({
            "bankName": m.get("bankName"),
            "documentName": m.get("documentName"),
            "pageNumber": m.get("pageNumber") or 1,
            "policyExcerpt": text_snippet,
        })

    return {
        "query": query,
        "matchedBankFilter": matched_bank or (f"Bank #{res_bank_id}" if res_bank_id else "All Partner Banks"),
        "totalExcerpts": len(compact_excerpts),
        "excerpts": compact_excerpts,
    }

