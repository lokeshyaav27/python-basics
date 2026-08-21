import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple

from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.ai_issue_analysis_prompt import build_ai_issue_analysis_prompt

logger = logging.getLogger("ai_issue_service")
logger.setLevel(logging.INFO)

# Cached documentation context
_CACHED_APP_DOCS: Optional[str] = None


def load_application_documentation() -> str:
    """
    Loads and caches official application markdown documentation from the context/ directory.
    """
    global _CACHED_APP_DOCS
    if _CACHED_APP_DOCS is not None:
        return _CACHED_APP_DOCS

    docs_parts: List[str] = []

    # Attempt to locate context/ directory relative to project root
    base_paths = [
        Path(__file__).resolve().parents[3] / "context",
        Path(__file__).resolve().parents[4] / "context",
        Path.cwd() / "context",
        Path.cwd().parent / "context",
    ]

    context_dir = None
    for bp in base_paths:
        if bp.is_dir():
            context_dir = bp
            break

    if context_dir:
        for filename in [
            "DSA_Loan_Eligibility_Rules.md",
            "DSA_Loan_Platform_Project_Overview.md",
            "DSA_Loan_Platform_DB_Schema.md",
        ]:
            file_path = context_dir / filename
            if file_path.is_file():
                try:
                    content = file_path.read_text(encoding="utf-8")
                    docs_parts.append(f"### File: {filename}\n{content}\n")
                except Exception as e:
                    logger.warning(f"Could not read context file {file_path}: {e}")

    if not docs_parts:
        docs_parts.append("Official Indian Retail Lending Underwriting Rules & Bank Policy Guidelines.")

    _CACHED_APP_DOCS = "\n\n".join(docs_parts)
    return _CACHED_APP_DOCS


class AIIssueSuggestionService:
    """
    Service that analyzes reported AI chat interactions, evaluates correctness against
    platform underwriting specifications, and generates root-cause diagnostics & remediation suggestions.
    """

    def __init__(self):
        self.config = ai_config

    def analyze_reported_issue(
        self,
        user_query: str,
        ai_response: str,
        issue_category: str,
        user_remarks: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
        user_role: str = "customer",
    ) -> Tuple[str, str, str]:
        """
        Executes AI diagnostic analysis.
        Returns (root_cause: str, suggestion: str, severity: str).
        """
        client = get_groq_client()
        if client is None:
            logger.warning("Groq client unavailable; using default issue diagnostic.")
            return (
                f"Issue flagged under '{issue_category}'. AI diagnostic service is currently offline.",
                "Review the flagged query and assistant response logs manually in Admin Audit Console.",
                "MEDIUM",
            )

        app_docs = load_application_documentation()

        prompt = build_ai_issue_analysis_prompt(
            user_query=user_query,
            ai_response=ai_response,
            issue_category=issue_category,
            user_remarks=user_remarks,
            chat_history=chat_history,
            user_role=user_role,
            app_documentation=app_docs[:14000],  # Limit token footprint
        )

        messages = [
            {
                "role": "system",
                "content": "You are a senior AI Underwriting QA Auditor. Analyze the issue and return ONLY strict valid JSON.",
            },
            {"role": "user", "content": prompt},
        ]

        candidate_models = [self.config.primary_model] + self.config.fallback_models
        seen_models = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen_models or seen_models.add(m))]

        for model_name in models_to_try:
            try:
                logger.info(f"Running issue diagnostic with model='{model_name}'...")
                res = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1024,
                    response_format={"type": "json_object"},
                )
                raw_json = res.choices[0].message.content or "{}"
                data = json.loads(raw_json)

                root_cause = data.get("root_cause") or "Reported discrepancy in assistant response."
                suggestion = data.get("suggestion") or "Audit credit policy and RAG citations."
                severity = str(data.get("severity") or "MEDIUM").upper()

                if severity not in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]:
                    severity = "MEDIUM"

                logger.info(f"Issue diagnostic complete: Severity='{severity}', RootCause='{root_cause[:60]}...'")
                return root_cause, suggestion, severity

            except Exception as e:
                logger.warning(f"Diagnostic model '{model_name}' failed: {e}. Trying fallback...")

        # Fallback diagnostic if all models fail
        return (
            f"User reported {issue_category}: {user_remarks or 'Response flagged for review.'}",
            "Perform manual audit of underwriting output and check partner bank policy rules.",
            "MEDIUM",
        )


ai_issue_service = AIIssueSuggestionService()
