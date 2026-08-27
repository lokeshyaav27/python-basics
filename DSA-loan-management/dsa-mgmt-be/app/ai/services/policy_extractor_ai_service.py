"""
AI Bank Policy Document Extractor Service
Extracts structured underwriting guidelines, rate tiers, fees, insurance, and caps from uploaded policy documents.
"""
import json
import logging
from typing import Dict, Any, Optional
from app.ai.client import get_ai_client
from app.core.config import settings
from app.core.constants import (
    MIN_CIBIL_SCORE,
    HOME_LOAN_ROI_TIER_1,
    HOME_LOAN_ROI_TIER_2,
    HOME_LOAN_ROI_TIER_3,
    HOME_LOAN_ROI_TIER_4,
    HOME_LOAN_FEMALE_CO_APPLICANT_REBATE,
    HOME_LOAN_MIN_ROI_FLOOR,
    BANK_DEFAULT_PROCESSING_FEE_PCT,
    BANK_DEFAULT_INSURANCE_PREMIUM_PCT,
    BANK_MATURITY_AGE_PRIVATE,
    BANK_MATURITY_AGE_PUBLIC_NBFC,
    HOME_LOAN_LTV_FLAT_APARTMENT,
    HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION,
    HOME_LOAN_LTV_STANDARD,
    HOME_LOAN_MAX_TENURE_YEARS,
)

logger = logging.getLogger("policy_extractor_ai")


def get_default_policy_parameters(bank_name: str = "", product_name: str = "") -> Dict[str, Any]:
    """
    Returns baseline fallback policy parameters based on domain constants.
    """
    is_home = "home" in product_name.lower() or "housing" in product_name.lower()
    return {
        "min_cibil": MIN_CIBIL_SCORE,
        "roi_tier_1_cibil_750_plus": HOME_LOAN_ROI_TIER_1,
        "roi_tier_2_cibil_700_749": HOME_LOAN_ROI_TIER_2,
        "roi_tier_3_cibil_650_699": HOME_LOAN_ROI_TIER_3,
        "roi_tier_4_cibil_below_650": HOME_LOAN_ROI_TIER_4,
        "female_rebate_pct": HOME_LOAN_FEMALE_CO_APPLICANT_REBATE,
        "min_roi_floor": HOME_LOAN_MIN_ROI_FLOOR,
        "processing_fee_pct": BANK_DEFAULT_PROCESSING_FEE_PCT,
        "min_processing_fee": 5000.0,
        "max_processing_fee": 25000.0,
        "property_insurance_pct": 0.10,
        "applicant_insurance_pct": 0.50,
        "max_maturity_age_salaried": BANK_MATURITY_AGE_PRIVATE,
        "max_maturity_age_self_employed": BANK_MATURITY_AGE_PUBLIC_NBFC,
        "max_tenure_years": HOME_LOAN_MAX_TENURE_YEARS if is_home else 5,
        "ltv_ready_pct": HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION,
        "ltv_under_construction_pct": HOME_LOAN_LTV_READY_OR_UNDER_CONSTRUCTION,
        "ltv_flat_pct": HOME_LOAN_LTV_FLAT_APARTMENT,
        "ltv_standard_pct": HOME_LOAN_LTV_STANDARD,
        "special_notes": [
            f"Extracted baseline policy for {bank_name} {product_name}.",
            "Subject to final credit approval and document verification.",
        ],
    }


def extract_policy_parameters(
    raw_text: str,
    bank_name: str,
    product_name: str,
) -> Dict[str, Any]:
    """
    Calls LLM to extract structured policy parameters from document text.
    Gracefully falls back to baseline defaults if text is ambiguous or LLM is unavailable.
    """
    defaults = get_default_policy_parameters(bank_name, product_name)
    if not raw_text or not raw_text.strip():
        logger.info(f"Empty text provided for {bank_name} - using default policy parameters.")
        return defaults

    client = get_ai_client()
    if not client:
        logger.warning(f"No AI client available - returning default policy parameters for {bank_name}.")
        return defaults

    # Truncate text to avoid context limits if text is huge
    sample_text = raw_text[:8000]

    system_prompt = (
        "You are an expert banking credit underwriter. Your task is to analyze bank policy document text "
        "and extract exact numeric loan underwriting rules into strict JSON format."
    )

    user_prompt = f"""
Analyze the following policy text for **Bank: {bank_name}** and **Product: {product_name}**.
Extract the policy parameters into a strict JSON object with EXACTLY the following numeric keys:

JSON Schema:
{{
  "min_cibil": <integer, minimum credit score required, e.g. 600 or 650>,
  "roi_tier_1_cibil_750_plus": <float, interest rate % p.a. for CIBIL >= 750, e.g. 7.35>,
  "roi_tier_2_cibil_700_749": <float, interest rate % p.a. for CIBIL 700-749, e.g. 7.65>,
  "roi_tier_3_cibil_650_699": <float, interest rate % p.a. for CIBIL 650-699, e.g. 8.10>,
  "roi_tier_4_cibil_below_650": <float, interest rate % p.a. for CIBIL < 650, e.g. 8.75>,
  "female_rebate_pct": <float, interest rate concession for female applicants, e.g. 0.05 or 0.50>,
  "min_roi_floor": <float, absolute minimum interest rate floor, e.g. 6.50>,
  "processing_fee_pct": <float, processing fee percentage, e.g. 0.50>,
  "min_processing_fee": <float, minimum processing fee in INR, e.g. 5000>,
  "max_processing_fee": <float, maximum processing fee in INR, e.g. 25000>,
  "property_insurance_pct": <float, property insurance % of loan amount, e.g. 0.10>,
  "applicant_insurance_pct": <float, applicant life insurance % of loan amount, e.g. 0.50>,
  "max_maturity_age_salaried": <integer, max age at loan maturity for salaried, e.g. 60>,
  "max_maturity_age_self_employed": <integer, max age at loan maturity for self-employed, e.g. 65>,
  "max_tenure_years": <integer, max loan tenure in years, e.g. 30>,
  "ltv_ready_pct": <float, max LTV % for ready property, e.g. 80.0>,
  "ltv_under_construction_pct": <float, max LTV % for under-construction property, e.g. 80.0>,
  "ltv_flat_pct": <float, max LTV % for flat/apartment, e.g. 60.0>,
  "ltv_standard_pct": <float, standard max LTV %, e.g. 75.0>,
  "special_notes": [<list of strings, key highlights or fine-print conditions>]
}}

Policy Document Text:
\"\"\"
{sample_text}
\"\"\"

If any specific value is not explicitly mentioned in the text, provide a sensible standard banking value.
Output ONLY valid JSON.
"""

    model_name = settings.OLLAMA_MODEL if settings.USE_OLLAMA else (settings.GROQ_MODEL or "llama-3.3-70b-versatile")

    try:
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )

        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)

        # Merge with defaults to guarantee all keys exist with valid numeric types
        result = {**defaults}
        for k, default_val in defaults.items():
            if k in parsed and parsed[k] is not None:
                try:
                    if isinstance(default_val, int):
                        result[k] = int(parsed[k])
                    elif isinstance(default_val, float):
                        result[k] = float(parsed[k])
                    elif isinstance(default_val, list):
                        result[k] = list(parsed[k])
                    else:
                        result[k] = parsed[k]
                except (ValueError, TypeError):
                    result[k] = default_val

        logger.info(f"Successfully extracted policy parameters for {bank_name} - {product_name}.")
        return result

    except Exception as e:
        logger.error(f"Error extracting policy parameters for {bank_name}: {e}")
        return defaults
