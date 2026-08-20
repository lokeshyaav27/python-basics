import json
from typing import Dict, Any


def build_underwriting_prompt(eligibility_data: Dict[str, Any]) -> str:
    """
    Builds user prompt for generating natural language loan underwriting explanations.
    """
    return f"""You are a senior credit underwriting expert in Indian retail lending.
Analyze the following loan eligibility evaluation and provide a clear, empathetic, and professional summary:

Eligibility Assessment Data:
{json.dumps(eligibility_data, indent=2, default=str)}

Guidelines:
1. Explain the approval/rejection/partial-approval status clearly with the reason.
2. Highlight key factors: CIBIL score, FOIR, LTV, and proposed EMI.
3. If partially eligible or rejected, provide 2-3 actionable tips to improve eligibility (e.g. adding a co-applicant, reducing existing debts, or extending tenure).
4. Keep the response structured, clear, and concise (under 200 words).
"""
