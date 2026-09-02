from typing import Dict, Any, Optional
from db.session import get_db_session
from core.auth import resolve_auth_user, enforce_tool_rbac
from rag.vector_search import perform_policy_vector_search


def handle_search_bank_policies(
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 3,
    auth_token: Optional[str] = None,
    auth_context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Performs semantic vector search across partner bank credit policy documents,
    eligibility guidelines, interest rate matrices, prepayment rules, FOIR/LTV thresholds,
    and required documentation using pgvector embeddings.
    """
    user = resolve_auth_user(auth_token=auth_token, auth_context=auth_context)
    enforce_tool_rbac("search_bank_policies", user)

    with get_db_session() as db:
        return perform_policy_vector_search(
            db=db,
            query=query,
            bank_id=bank_id,
            product_id=product_id,
            top_k=top_k,
        )
