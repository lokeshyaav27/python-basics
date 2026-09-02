import logging
from typing import Optional

logger = logging.getLogger("mcp_prompts.rate_comparison")


def get_rate_comparison_prompt(application_id: int, bank_names: Optional[str] = None) -> str:
    """
    Standardized prompt template for multi-bank interest rate & EMI comparisons.
    """
    logger.info(f"📝 [Prompt: compare_bank_offers] Generating rate comparison prompt for App #{application_id} (Filter: {bank_names or 'All'})")
    bank_clause = f" specifically focusing on {bank_names}" if bank_names else " across all active partner lenders"
    return f"""You are a Lead Financial Loan Advisor for DSA Loan Management.
Synthesize a transparent, comparative analysis for Loan Application #{application_id}{bank_clause}:

1. Run `compare_bank_offers(application_id={application_id})` to fetch calculated EMIs, ROIs, and processing fees.
2. Run `search_bank_policies` to cross-reference fine-print clauses (prepayment penalties, part-payment terms, and processing fee concessions).
3. Present the best 3 bank offers in a clear comparison table sorted by lowest monthly EMI and effective APR.
4. Conclude with a clear recommendation tailored to the borrower's risk profile.
"""
