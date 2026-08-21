import json
import logging
from typing import Optional, Dict, Any, List, Tuple

from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.ai_issue_analysis_prompt import build_ai_issue_analysis_prompt

logger = logging.getLogger("ai_issue_service")
logger.setLevel(logging.INFO)


class AIIssueSuggestionService:
    """
    Service that analyzes reported AI chat interactions, evaluates correctness,
    and generates root-cause diagnostics & remediation suggestions.
    """

    def __init__(self):
        self.config = ai_config

    def analyze_reported_issue(
        self,
        user_query: str,
        ai_response: str,
        user_remarks: Optional[str] = None,
        chat_history: Optional[List[Dict[str, str]]] = None,
    ) -> Tuple[str, str]:
        """
        Executes AI diagnostic analysis.
        Returns (root_cause: str, suggestion: str).
        """
        client = get_groq_client()
        if client is None:
            logger.warning("Groq client unavailable; using default issue diagnostic.")
            return (
                "AI diagnostic service is currently offline.",
                "Review the flagged query and assistant response logs manually.",
            )

        prompt = build_ai_issue_analysis_prompt(
            user_query=user_query,
            ai_response=ai_response,
            user_remarks=user_remarks,
            chat_history=chat_history,
        )

        messages = [
            {
                "role": "system",
                "content": "You are a senior AI Underwriting QA Auditor. Analyze the issue and return ONLY strict valid JSON.",
            },
            {"role": "user", "content": prompt},
        ]

        models_to_try = self.config.candidate_models

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
                raw_sug = data.get("suggestion")
                if isinstance(raw_sug, list):
                    suggestion = "\n".join(f"- {s}" for s in raw_sug)
                elif isinstance(raw_sug, str):
                    suggestion = raw_sug
                else:
                    suggestion = "Audit credit policy and RAG citations."

                logger.info(f"Issue diagnostic complete: RootCause='{root_cause[:60]}...'")
                return root_cause, suggestion

            except Exception as e:
                logger.warning(f"Diagnostic model '{model_name}' failed: {e}. Trying next candidate model from env...")

        return (
            f"User reported concern: {user_remarks or 'Response flagged for review.'}",
            "Perform manual audit of underwriting output and check partner bank policy rules.",
        )


ai_issue_service = AIIssueSuggestionService()
