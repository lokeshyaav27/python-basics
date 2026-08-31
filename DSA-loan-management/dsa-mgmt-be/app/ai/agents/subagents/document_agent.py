import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.ai.agents.subagents.base import BaseSubAgent
from app.mcp.tools import SEARCH_BANK_POLICIES_SPEC, GET_BANK_PRODUCT_CATALOG_SPEC

logger = logging.getLogger("document_intelligence_agent")


class DocumentIntelligenceAgent(BaseSubAgent):
    """
    Sub-Agent specialized in RAG vector search across partner bank credit policy documents,
    guideline PDFs, KYC requirements, NRI guarantor terms, and prepayment rules.
    """

    def __init__(self):
        super().__init__(
            name="DocumentIntelligenceAgent",
            description=(
                "Specialist in bank policy PDFs, credit circulars, KYC rules, "
                "NRI guarantor clauses, legal guidelines, and bank product catalog parameters."
            ),
        )
        self.tools_spec = [SEARCH_BANK_POLICIES_SPEC, GET_BANK_PRODUCT_CATALOG_SPEC]

    def search_policies(
        self,
        db: Session,
        query: str,
        bank_id: Optional[int] = None,
        product_id: Optional[int] = None,
        auth_user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes semantic RAG search and policy extraction.
        """
        logger.info(
            f"📄 [DocumentIntelligenceAgent.search_policies] Query: \"{query[:100]}\" "
            f"| Bank ID Filter: {bank_id} | Product ID Filter: {product_id}"
        )

        system_prompt = """You are the **Document Intelligence & Credit Policy Specialist Agent**.
Your objective is to answer qualitative credit policy questions using verified excerpts from partner bank documents and policy PDFs.

### Instructions
1. Call `search_bank_policies` with the specific question or topic (e.g. "HDFC NRI guarantor KYC", "SBI prepayment penalty", "Axis and ICICI floating rate home loan prepayment and LTV").
2. When answering policy questions for multiple banks (e.g., comparing Axis Bank and ICICI Bank), evaluate both lenders from the retrieved excerpts and present a clear, side-by-side or per-bank breakdown.
3. Formulate your answer based strictly on the retrieved document excerpts.
4. Be direct, clear, and bullet-pointed. Cite the specific bank, document name, and policy rules clearly.
5. If a specific condition is not explicitly mentioned in the retrieved excerpts, state so transparently without guessing.
"""
        task_instruction = f"Policy Query: {query}\nBank ID Filter: {bank_id}\nProduct ID Filter: {product_id}"

        return self.run_subagent_task(
            db=db,
            system_prompt=system_prompt,
            task_instruction=task_instruction,
            tools_spec=self.tools_spec,
            auth_user=auth_user,
        )
