import json
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.ai.config import ai_config
from app.ai.client import get_ai_client
from app.ai.agents.subagents import (
    LoanMatchingAgent,
    DocumentIntelligenceAgent,
    ApplicationOperationsAgent,
)
from app.schemas.chat import ChatRequest, ChatResponse

logger = logging.getLogger("orchestrator_agent")


# Master Orchestrator Delegation Tool Definitions
ORCHESTRATOR_TOOLS_SPEC = [
    {
        "type": "function",
        "function": {
            "name": "ask_loan_matching_agent",
            "description": (
                "Delegates task to the Loan Matching & Underwriting Sub-Agent. "
                "Use when the user wants to: compare bank offers, find lowest EMI or best interest rate, "
                "check loan eligibility, evaluate FOIR/CIBIL, or analyze DSA commissions across partner banks."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "Specific instruction for the Loan Matching agent.",
                    },
                    "application_id": {
                        "type": ["integer", "null"],
                        "description": "Optional numeric loan application ID to evaluate.",
                    },
                },
                "required": ["task"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ask_document_agent",
            "description": (
                "Delegates task to the Document Intelligence Sub-Agent. "
                "Use when the user asks about: bank credit policy PDFs, KYC documents, NRI guarantor rules, "
                "prepayment penalties, LTV limits, or specific bank guidelines."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Specific policy question or topic to search (e.g. 'HDFC NRI guarantor KYC', 'SBI prepayment penalty').",
                    },
                    "bank_id": {
                        "type": ["integer", "null"],
                        "description": "Optional numeric bank ID to filter search results.",
                    },
                    "product_id": {
                        "type": ["integer", "null"],
                        "description": "Optional product ID (e.g. 1 for Home Loan).",
                    },
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ask_application_agent",
            "description": (
                "Delegates task to the Application & Portfolio Operations Sub-Agent. "
                "Use when the user wants to: fetch customer dossier details, view agent team directory, "
                "check platform KPIs, or view contact enquiries."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "task": {
                        "type": "string",
                        "description": "Specific operational or dossier lookup task.",
                    },
                    "application_id": {
                        "type": ["integer", "null"],
                        "description": "Optional numeric application ID.",
                    },
                },
                "required": ["task"],
            },
        },
    },
]


class OrchestratorAgent:
    """
    Master Supervisor and Intent Router that coordinates domain sub-agents
    and synthesizes multi-source responses.
    """

    def __init__(self):
        self.matching_agent = LoanMatchingAgent()
        self.doc_agent = DocumentIntelligenceAgent()
        self.ops_agent = ApplicationOperationsAgent()
        self.config = ai_config

    def _call_llm(
        self,
        client: Any,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[Optional[Any], Optional[str], Optional[Exception]]:
        """Executes LLM completion across candidate models from .env."""
        models_to_try = self.config.candidate_models
        last_error = None

        for model_name in models_to_try:
            try:
                payload: Dict[str, Any] = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens,
                }
                if tools:
                    payload["tools"] = tools
                    payload["tool_choice"] = "auto"

                response = client.chat.completions.create(**payload)
                return response, model_name, None
            except Exception as e:
                last_error = e
                logger.warning(f"[Orchestrator] Model '{model_name}' failed: {e}. Trying next candidate from env...")

        return None, None, last_error

    def process_conversation(
        self,
        db: Session,
        request: ChatRequest,
    ) -> ChatResponse:
        """
        Main entrypoint: Classifies user intent, delegates to sub-agents,
        and unifies final response.
        """
        start_time = time.time()
        auth = request.authContext.model_dump() if request.authContext else {}
        role = (auth.get("role") or "customer").lower()
        user_name = auth.get("name") or "User"
        user_id = auth.get("userId")

        logger.info(f"🚀 [ORCHESTRATOR] New Chat Request from {user_name} ({role.upper()} ID: {user_id})")
        logger.info(f"   Prompt: '{request.message}'")

        client = get_ai_client()
        if not client:
            return ChatResponse(
                response="AI service is currently unavailable. Please verify API key configuration.",
                status="ERROR",
                referencedDocs=[],
                toolsExecuted=[],
            )

        system_prompt = f"""You are the **Master AI Credit & Loan Orchestrator** for the DSA Loan Management Platform.
You coordinate specialized domain sub-agents to provide accurate, underwriting-grade financial assistance.

### Sub-Agents Under Your Command:
1. `ask_loan_matching_agent`: Evaluates borrower eligibility, compares interest rates & monthly EMIs across partner banks, and calculates commercial DSA commissions.
2. `ask_document_agent`: Performs semantic RAG vector searches on bank policy PDFs for KYC rules, NRI guarantor clauses, and fine-print guidelines.
3. `ask_application_agent`: Looks up customer dossiers, agent roster directory, and portfolio KPIs.

### User Context:
- **Active User**: {user_name} ({role.upper()}, ID: {user_id})
- **Application Context**: Application #{request.applicationId if request.applicationId else 'None provided'}

### Instructions:
- For multi-part or compound questions (e.g. compare rates AND check KYC documents), call the relevant sub-agents.
- Once you receive the sub-agents' data, synthesize a comprehensive, clean, and well-structured final answer.
- Always use professional banking formatting (bullet points, bold key rates, EMIs, and document names).
"""

        messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]

        # Append compact recent history
        if request.history:
            for item in request.history[-4:]:
                messages.append({"role": item.role, "content": item.content})

        messages.append({"role": "user", "content": request.message})

        all_referenced_docs: List[str] = []
        all_tools_executed: List[str] = []
        final_answer = ""
        last_model_used: Optional[str] = None
        max_turns = 3

        for turn in range(1, max_turns + 1):
            response, model_used, error = self._call_llm(
                client=client,
                messages=messages,
                tools=ORCHESTRATOR_TOOLS_SPEC,
            )
            if model_used:
                last_model_used = model_used

            if not response or not response.choices:
                logger.error(f"[Orchestrator] Turn {turn} LLM call failed: {error}")
                final_answer = f"An error occurred while communicating with the AI Underwriter: {error}"
                break

            choice = response.choices[0]
            msg = choice.message
            tool_calls = getattr(msg, "tool_calls", None)

            # If LLM reached final synthesis
            if not tool_calls:
                final_answer = msg.content or ""
                break

            # Process Sub-Agent Delegations
            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in tool_calls
                ],
            })

            for tc in tool_calls:
                t_name = tc.function.name
                try:
                    p_args = json.loads(tc.function.arguments) if isinstance(tc.function.arguments, str) else tc.function.arguments
                except Exception:
                    p_args = {}

                all_tools_executed.append(t_name)
                logger.info(f"   🔀 [DELEGATION] Orchestrator calling sub-agent '{t_name}' with args: {p_args}")

                sub_result: Dict[str, Any] = {}

                if t_name == "ask_loan_matching_agent":
                    app_id = p_args.get("application_id") or request.applicationId
                    sub_result = self.matching_agent.evaluate(
                        db=db,
                        query=p_args.get("task", request.message),
                        application_id=app_id,
                        auth_user=auth,
                    )
                elif t_name == "ask_document_agent":
                    sub_result = self.doc_agent.search_policies(
                        db=db,
                        query=p_args.get("query", request.message),
                        bank_id=p_args.get("bank_id"),
                        product_id=p_args.get("product_id"),
                        auth_user=auth,
                    )
                elif t_name == "ask_application_agent":
                    app_id = p_args.get("application_id") or request.applicationId
                    sub_result = self.ops_agent.manage_operations(
                        db=db,
                        query=p_args.get("task", request.message),
                        application_id=app_id,
                        auth_user=auth,
                    )
                else:
                    sub_result = {"status": "ERROR", "summary": f"Unknown sub-agent '{t_name}'"}

                # Merge citations and sub-agent tools
                for doc in sub_result.get("referencedDocs", []):
                    if doc not in all_referenced_docs:
                        all_referenced_docs.append(doc)
                for st in sub_result.get("toolsExecuted", []):
                    if st not in all_tools_executed:
                        all_tools_executed.append(st)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": t_name,
                    "content": json.dumps(sub_result.get("summary", str(sub_result)), default=str),
                })

        duration_ms = int((time.time() - start_time) * 1000)
        logger.info(f"✅ [ORCHESTRATOR COMPLETE] Finished in {duration_ms}ms | Tools: {all_tools_executed}")

        return ChatResponse(
            response=final_answer,
            referencedDocs=all_referenced_docs,
            modelUsed=last_model_used,
            toolUsed=", ".join(all_tools_executed) if all_tools_executed else None,
        )


orchestrator_agent = OrchestratorAgent()
