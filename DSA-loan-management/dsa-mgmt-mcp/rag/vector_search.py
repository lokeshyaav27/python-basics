import logging
import re
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.bank import Bank
from app.models.product import Product
from app.rag import rag_service

logger = logging.getLogger("mcp_rag.vector_search")


def resolve_bank_and_product(
    db: Session,
    query_text: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    """
    Infers bank_id and product_id from natural language query keywords if not explicitly provided.
    """
    resolved_bank_id = bank_id
    resolved_product_id = product_id
    matched_bank_name = None

    q_lower = query_text.lower()
    logger.debug(f"🔍 [Vector Search Resolver] Resolving bank/product entities for query: '{query_text}'")

    if resolved_bank_id is None:
        active_banks = db.query(Bank).filter(Bank.isActive != False).all()
        matched_banks = []
        for b in active_banks:
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
            logger.debug(f"🔍 [Vector Search Resolver] Single bank matched: '{matched_bank_name}' (ID {resolved_bank_id})")
        elif len(matched_banks) > 1:
            resolved_bank_id = None
            matched_bank_name = ", ".join(b.name for b in matched_banks)
            logger.debug(f"🔍 [Vector Search Resolver] Multi-bank query detected: '{matched_bank_name}'")

    if resolved_product_id is None:
        active_products = db.query(Product).filter(Product.isActive != False).all()
        for p in active_products:
            p_name_lower = p.name.lower()
            if p_name_lower in q_lower or (p_name_lower.replace(" loan", "") in q_lower):
                resolved_product_id = p.id
                logger.debug(f"🔍 [Vector Search Resolver] Product matched: '{p.name}' (ID {p.id})")
                break

    return resolved_bank_id, resolved_product_id, matched_bank_name


def perform_policy_vector_search(
    db: Session,
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 3,
) -> Dict[str, Any]:
    """
    Executes semantic vector search over bank policy & guideline PDF chunks using pgvector embeddings.
    """
    res_bank_id, res_prod_id, matched_bank = resolve_bank_and_product(
        db=db,
        query_text=query,
        bank_id=bank_id,
        product_id=product_id,
    )

    is_multi_bank = res_bank_id is None or (matched_bank and "," in matched_bank)
    limit = min(top_k or (6 if is_multi_bank else 3), 8 if is_multi_bank else 4)

    logger.info(
        f"⚡ [pgvector Search] Query='{query}' | Filter BankId={res_bank_id} ({matched_bank or 'All'}) "
        f"| ProductId={res_prod_id} | TopK={limit}"
    )

    matches = rag_service.search_relevant_chunks(
        db=db,
        query_text=query,
        bank_id=res_bank_id,
        product_id=res_prod_id,
        top_k=limit,
    )

    logger.debug(f"⚡ [pgvector Search] Retrieved {len(matches)} raw vector matches from PostgreSQL.")

    compact_excerpts = []
    for m in matches:
        text_snippet = (m.get("chunkText") or "").strip()
        if len(text_snippet) > 350:
            text_snippet = text_snippet[:350] + "..."
        score = round(float(m.get("similarityScore", 0)), 4) if m.get("similarityScore") is not None else None
        compact_excerpts.append({
            "bankName": m.get("bankName"),
            "documentName": m.get("documentName"),
            "pageNumber": m.get("pageNumber") or 1,
            "policyExcerpt": text_snippet,
            "similarityScore": score,
        })
        logger.debug(f"   📄 Match: [{m.get('bankName')}] Doc: '{m.get('documentName')}' Pg {m.get('pageNumber')} | Score: {score}")

    return {
        "query": query,
        "matchedBankFilter": matched_bank or (f"Bank #{res_bank_id}" if res_bank_id else "All Partner Banks"),
        "totalExcerpts": len(compact_excerpts),
        "excerpts": compact_excerpts,
    }
