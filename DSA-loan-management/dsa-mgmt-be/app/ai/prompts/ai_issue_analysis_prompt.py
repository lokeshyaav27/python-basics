from typing import Optional, Dict, Any, List


def build_ai_issue_analysis_prompt(
    user_query: str,
    ai_response: str,
    user_remarks: Optional[str] = None,
    chat_history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Constructs the system prompt for the AI Underwriting Quality Assurance & Issue Diagnosis Agent.
    Evaluates reported AI chat interactions to diagnose root causes and suggest remediations.
    """
    history_str = ""
    if chat_history:
        for idx, turn in enumerate(chat_history[-6:], 1):
            role_tag = "USER" if turn.get("role") == "user" else "ASSISTANT"
            history_str += f"{idx}. **{role_tag}**: {turn.get('content', '')}\n"
    else:
        history_str = "No prior history provided."

    return f"""You are the senior **AI Underwriting Quality Assurance & Credit Risk Auditor** for a digital DSA (Direct Selling Agent) Loan Aggregator platform in India.

Your objective is to inspect a reported AI chat interaction, determine the root cause of the error/inaccuracy, and provide actionable remediation recommendations.

### Incident Audit Dossier
- **User Feedback / Remarks**: {user_remarks or 'None provided by user.'}

#### Recent Conversation History:
{history_str}

#### Flagged User Query:
\"\"\"{user_query}\"\"\"

#### Flagged AI Assistant Response:
\"\"\"{ai_response}\"\"\"

---

### Instructions for Analysis:
1. **Diagnosis**: Determine if the assistant hallucinated, miscalculated, gave incomplete advice, violated role/confidentiality restrictions, or if the response was misunderstood by the user.
2. **Actionable Suggestions**: Detail concrete steps for engineers or underwriters to prevent similar issues (e.g. policy document ingestion, prompt adjustments, calculation guardrails).

### Output Format (Strict JSON ONLY):
Respond ONLY with a valid JSON object matching the following structure without extra commentary or markdown codeblocks:
{{
  "root_cause": "Clear 1-3 sentence technical diagnosis of the issue.",
  "suggestion": "Actionable 2-4 bullet recommendations to fix or improve the platform."
}}
"""
