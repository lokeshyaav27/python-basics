import logging
from typing import Dict, Any
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.underwriting_prompt import build_underwriting_prompt

logger = logging.getLogger("ai_explainer")


def generate_ai_explanation(eligibility_data: Dict[str, Any]) -> str:
    """
    Generates a natural language summary and underwriting guidance using Groq's
    configured model with fallback to deterministic rule summary.
    """
    status = eligibility_data.get("status")
    if status == "INCOMPLETE_DETAILS":
        missing = ", ".join(eligibility_data.get("missingFields", []))
        return f"Application profile is currently incomplete. Please provide: {missing} to compute eligibility."

    if status == "ERROR":
        return eligibility_data.get("message", "Unable to evaluate application.")

    client = get_groq_client()
    if not client:
        return eligibility_data.get("recommendation", "Deterministic evaluation completed.")

    prompt = build_underwriting_prompt(eligibility_data)
    try:
        completion = client.chat.completions.create(
            model=ai_config.primary_model,
            messages=[
                {"role": "system", "content": "You are a professional retail loan credit underwriter in India."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            max_tokens=300,
        )
        return completion.choices[0].message.content or "Eligibility evaluated."
    except Exception as e:
        logger.warning(f"AI explanation generation failed: {e}")
        return eligibility_data.get("recommendation", "Evaluation completed.")
