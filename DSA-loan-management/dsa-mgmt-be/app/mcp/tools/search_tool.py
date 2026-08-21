from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.rag import rag_service


SEARCH_TOOL_SPEC = {
    "name": "search_bank_documents",
    "description": "Performs semantic vector search across partner bank loan policy and guideline documents using pgvector. Directly include the bank name and topic in the query string (e.g. 'HDFC home loan age limit', 'ICICI minimum income'). Do not call get_bank_list first.",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query including bank name or policy topic (e.g. 'HDFC home loan age limit', 'SBI minimum salary')."},
            "bank_id": {"type": ["integer", "null"], "description": "Optional numeric bank ID if already known. Pass null if searching by query text."},
            "product_id": {"type": ["integer", "null"], "description": "Optional product ID if already known. Pass null otherwise."},
            "top_k": {"type": ["integer", "null"], "description": "Number of top matching chunks to retrieve (default 4)."}
        },
        "required": ["query"]
    }
}


def search_bank_documents(
    db: Session,
    query: str,
    bank_id: Optional[int] = None,
    product_id: Optional[int] = None,
    top_k: int = 4,
    auth_user: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Performs semantic vector search over bank policy & guideline PDF chunks using pgvector.
    Provides structured excerpts and formatted LLM knowledge context.
    """
    matches = rag_service.search_relevant_chunks(
        db=db,
        query_text=query,
        bank_id=bank_id,
        product_id=product_id,
        top_k=top_k,
    )

    context_blocks = []
    for idx, m in enumerate(matches, 1):
        text_snippet = m['chunkText']
        if len(text_snippet) > 400:
            text_snippet = text_snippet[:400] + "..."
        doc_header = f"[{idx}] {m['bankName']} - {m['documentName']} (Page {m['pageNumber'] or '1'})"
        context_blocks.append(f"{doc_header}\n{text_snippet}")

    llm_context = "\n\n---\n\n".join(context_blocks) if context_blocks else "No relevant bank policy document excerpts found."

    return {
        "query": query,
        "totalMatches": len(matches),
        "llmContext": llm_context,
        "results": matches,
    }
