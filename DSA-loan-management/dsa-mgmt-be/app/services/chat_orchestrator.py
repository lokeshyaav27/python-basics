import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from groq import Groq
from fastapi import HTTPException

from app.core.config import settings
from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ToolExecutionAudit
from app.services.mcp_dsa_tools import (
    execute_dsa_mcp_tool,
    MCP_DSA_TOOLS_SPECS,
    check_auth_permission,
)
from app.services.mcp_eligibility_tool import MCP_ELIGIBILITY_TOOL_SPEC, execute_mcp_eligibility_tool
from app.services.mcp_comparison_tool import MCP_COMPARISON_TOOL_SPEC, execute_mcp_comparison_tool

logger = logging.getLogger("chat_assistant")
logger.setLevel(logging.INFO)


# ── Assemble All Tools for Groq Tool-Calling ─────────────────────────────────
def get_all_tool_definitions() -> List[Dict[str, Any]]:
    all_specs = [
        MCP_ELIGIBILITY_TOOL_SPEC,
        MCP_COMPARISON_TOOL_SPEC,
    ] + MCP_DSA_TOOLS_SPECS

    groq_tools = []
    for spec in all_specs:
        groq_tools.append({
            "type": "function",
            "function": {
                "name": spec["name"],
                "description": spec["description"],
                "parameters": spec["parameters"],
            }
        })
    return groq_tools


# ── System Prompt Builder ───────────────────────────────────────────────────
def build_system_prompt(auth_context: Optional[Dict[str, Any]], linked_app_id: Optional[int] = None, linked_cust_id: Optional[str] = None) -> str:
    role = (auth_context.get("role") if auth_context else "customer").lower()
    caller_name = auth_context.get("name") if auth_context else "User"
    caller_id = auth_context.get("userId") or auth_context.get("identifier") or "N/A"

    prompt = f"""You are the expert **AI Loan Underwriting & Advisory Assistant** for the Direct Selling Agent (DSA) Loan Management Platform.

### Current User Session Context
- **Caller Name**: {caller_name}
- **Role**: {role.upper()}
- **User / Identifier ID**: {caller_id}
{f'- **Linked Application in Chat**: Application #{linked_app_id}' if linked_app_id else ''}
{f'- **Linked Customer in Chat**: Customer ID {linked_cust_id}' if linked_cust_id else ''}

### Core Principles & Business Guidelines
1. **Deterministic Accuracy**:
   - ALWAYS execute tools (`check_loan_eligibility`, `compare_banks`, `get_loan_by_id`, etc.) for calculating financial terms, FOIR, LTV, EMIs, and underwriting verdicts.
   - NEVER fabricate, extrapolate, or guess financial figures.

2. **RAG Vector Search for Bank Policies**:
   - For questions regarding specific bank policies, guidelines, interest rate rebates, female co-applicant discounts, insurance requirements, or prepayment penalties, ALWAYS call the `search_bank_documents` tool.
   - Base policy explanations strictly on retrieved document excerpts.

3. **Strict Role-Based Security & Data Privacy**:
   - **Customer Role**: Customers are STRICTLY prohibited from seeing other customers' loans, personal information, or DSA agent commission payouts. If a customer attempts to query another customer's data or agent commissions, politely inform them of access restrictions.
   - **Agent / Admin Role**: Authorized to review assigned loan applications, calculate commissions, and evaluate multiple partner banks.

4. **Handling Ambiguity & Missing Information**:
   - If a borrower or agent asks about "my loan" and has multiple applications, call `get_loan_details_by_customer_id` or `get_all_loans_of_customers`, and if multiple active loans exist, list them and ask for clarification.
   - If required parameters (e.g., Application ID, bank names) are missing from the prompt, check conversation history or politely ask the user to provide them.

5. **Read vs Write Safety & Confirmation**:
   - You are an advisory assistant. If a user asks to approve, reject, or submit an application to a bank, advise them that formal approvals require agent/admin review and confirmation via the portal interface.

6. **Output Formatting**:
   - Respond in professional, highly readable markdown.
   - Use bold headers, bullet lists, structured comparison tables, and Indian currency formatting (`₹`).
"""
    return prompt


# ── Core Conversational Orchestrator ─────────────────────────────────────────
def process_chat_conversation(db: Session, request: ChatRequest) -> ChatResponse:
    auth = request.authContext.dict() if request.authContext else {"role": "customer"}
    user_role = auth.get("role", "customer").lower()

    # Initialize Groq client
    if not settings.GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured in backend .env file."
        )

    client = Groq(api_key=settings.GROQ_API_KEY)
    tools = get_all_tool_definitions()

    # Build messages array with history
    system_prompt = build_system_prompt(
        auth_context=auth,
        linked_app_id=request.applicationId,
        linked_cust_id=request.customerId,
    )

    messages: List[Dict[str, Any]] = [{"role": "system", "content": system_prompt}]

    # Add conversation history (up to last 12 messages)
    for msg in request.history[-12:]:
        if msg.role in ["user", "assistant"]:
            messages.append({"role": msg.role, "content": msg.content})

    # Add current user prompt
    messages.append({"role": "user", "content": request.message})

    tool_executions: List[ToolExecutionAudit] = []
    referenced_docs: List[str] = []

    # Agent Loop (Up to 4 tool calling turns)
    candidate_models = [settings.GROQ_MODEL, "openai/gpt-oss-20b", "qwen/qwen3.6-27b"]
    # Deduplicate while preserving order
    seen_models = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen_models or seen_models.add(m))]

    max_turns = 4
    for turn in range(max_turns):
        response = None
        last_error = None

        for model_name in models_to_try:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=messages,
                    tools=tools,
                    tool_choice="auto",
                    temperature=0.1,
                    max_tokens=1500,
                )
                break
            except Exception as e:
                last_error = e
                logger.warning(f"Model {model_name} failed: {e}. Trying fallback model...")

        if response is None:
            logger.error(f"All candidate models failed. Last error: {last_error}")
            return ChatResponse(
                response=f"⚠️ An error occurred while communicating with the AI Underwriter: {str(last_error)}",
                toolExecutions=tool_executions,
                referencedDocs=referenced_docs,
            )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # If model generated a final text response without tool calls, we're done!
        if not tool_calls:
            final_text = response_message.content or ""
            return ChatResponse(
                response=final_text,
                toolExecutions=tool_executions,
                referencedDocs=list(set(referenced_docs)),
            )

        # Append assistant message with tool calls as a clean dictionary
        assistant_entry = {
            "role": "assistant",
            "content": response_message.content or "",
            "tool_calls": [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                }
                for tc in tool_calls
            ]
        }
        messages.append(assistant_entry)

        # Execute each tool call
        for tc in tool_calls:
            func_name = tc.function.name
            raw_args = tc.function.arguments
            try:
                args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            except Exception:
                args = {}

            call_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            logger.info(f"[AUDIT] Role={user_role} | User={auth.get('userId') or auth.get('identifier')} | Tool={func_name} | Args={args}")

            tool_result_str = ""
            status = "SUCCESS"
            summary = ""

            try:
                # 1. Specialized tools
                if func_name == "check_loan_eligibility":
                    app_id = int(args.get("application_id") or args.get("applicationId") or request.applicationId or 0)
                    result = execute_mcp_eligibility_tool(db, application_id=app_id)
                    summary = f"Evaluated Application #{app_id}: {result.get('recommendation', 'Verdict generated')}"
                    tool_result_str = json.dumps(result, default=str)

                elif func_name == "compare_banks":
                    app_id = int(args.get("application_id") or args.get("applicationId") or request.applicationId or 0)
                    bank_ids = args.get("bank_ids") or args.get("bankIds") or []
                    result = execute_mcp_comparison_tool(db, application_id=app_id, bank_ids=bank_ids, user_role=user_role)
                    summary = f"Compared {len(result.get('banksCompared', []))} banks for Application #{app_id}"
                    tool_result_str = json.dumps(result, default=str)

                # 2. General DSA MCP Tools + RAG
                else:
                    result = execute_dsa_mcp_tool(db, tool_name=func_name, arguments=args, auth_user=auth)
                    if func_name in ["search_bank_documents", "search_bank_policies", "semantic_search"]:
                        summary = f"Searched {result.get('totalMatches', 0)} policy document chunks for '{args.get('query')}'"
                        for m in result.get("results", []):
                            if m.get("documentName"):
                                referenced_docs.append(f"{m.get('bankName')} - {m.get('documentName')}")
                    else:
                        summary = f"Executed {func_name} successfully"
                    tool_result_str = json.dumps(result, default=str)

            except HTTPException as he:
                status = "DENIED" if he.status_code == 403 else "NOT_FOUND" if he.status_code == 404 else "VALIDATION_ERROR"
                summary = f"HTTP {he.status_code}: {he.detail}"
                tool_result_str = json.dumps({"status": "ERROR", "statusCode": he.status_code, "error": he.detail})
            except Exception as ex:
                status = "ERROR"
                summary = f"Error: {str(ex)}"
                tool_result_str = json.dumps({"status": "ERROR", "error": str(ex)})

            # Log audit trail
            tool_executions.append(
                ToolExecutionAudit(
                    toolName=func_name,
                    arguments=args,
                    status=status,
                    summary=summary,
                    timestamp=call_time,
                )
            )

            # Append tool response message to LLM history
            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "name": func_name,
                "content": tool_result_str,
            })

    # Fallback if loop exceeded
    return ChatResponse(
        response="I evaluated the tools for your loan application. Please ask any specific follow-up questions.",
        toolExecutions=tool_executions,
        referencedDocs=list(set(referenced_docs)),
    )
