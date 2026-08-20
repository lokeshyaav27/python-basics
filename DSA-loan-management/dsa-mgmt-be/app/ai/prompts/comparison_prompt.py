import json
from typing import Dict, Any


def build_comparison_prompt(comparison_data: Dict[str, Any], user_role: str = "customer") -> str:
    """
    Builds user prompt for generating multi-bank comparative loan analysis.
    """
    return f"""You are a senior banking and loan advisory expert.
Synthesize the following bank loan comparison data and provide a concise, structured comparative recommendation:

Comparison Data:
{json.dumps(comparison_data, indent=2, default=str)}

User Role: {user_role.upper()}

Guidelines:
1. Compare interest rates (ROI), processing fees, EMI differences, and female co-applicant benefits.
2. Identify the best overall bank offer for the customer.
3. If user is AGENT or ADMIN, summarize DSA payout/commission differences.
4. Keep the synthesis concise, punchy, and formatted with Markdown bullet points.
"""
