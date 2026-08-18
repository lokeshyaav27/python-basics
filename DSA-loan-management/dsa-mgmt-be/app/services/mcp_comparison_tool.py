"""
MCP Tool Specification & Execution for Bank Loan Comparison
Enforces max 2 banks constraint and connects with pgvector RAG & Groq LLM.
"""
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.services.comparison import compare_banks_for_application


# ── MCP Tool Specification for Compare Banks ─────────────────────────────────
MCP_COMPARISON_TOOL_SPEC = {
    "name": "compare_banks",
    "description": (
        "Compares loan terms, eligibility, interest rates (ROI), maximum loan amount, "
        "monthly EMI, tenure, female co-applicant benefits, insurance costs (property and applicant), "
        "processing fees, and DSA commissions across up to 2 partner banks for a specific loan application, "
        "referencing indexed bank policy documents in pgvector."
    ),
    "parameters": {
        "type": "object",
        "properties": {
            "application_id": {
                "type": "integer",
                "description": "Unique integer ID of the loan application.",
            },
            "bank_ids": {
                "type": "array",
                "items": {"type": "integer"},
                "description": "List of bank IDs to compare. Maximum 2 banks allowed.",
                "maxItems": 2,
                "minItems": 1,
            },
            "user_role": {
                "type": "string",
                "enum": ["agent", "admin", "customer"],
                "description": "Role of the user. DSA commission is revealed ONLY for 'agent' or 'admin'.",
            },
        },
        "required": ["application_id", "bank_ids"],
    },
}


def execute_mcp_comparison_tool(
    db: Session,
    application_id: int,
    bank_ids: List[int],
    user_role: str = "customer",
) -> Dict[str, Any]:
    """
    Executes the bank comparison engine as an MCP tool.
    """
    return compare_banks_for_application(
        db=db,
        application_id=application_id,
        bank_ids=bank_ids,
        user_role=user_role,
    )
