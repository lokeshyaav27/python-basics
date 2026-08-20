import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage, ToolExecutionAudit
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.chat_assistant_prompt import build_chat_assistant_prompt
from app.mcp import get_all_tool_specs, execute_mcp_tool

logger = logging.getLogger("chat_ai_service")
logger.setLevel(logging.INFO)


def format_tools_for_groq() -> List[Dict[str, Any]]:
    """
    Transforms MCP specifications into OpenAI/Groq function calling format.
    """
    specs = get_all_tool_specs()
    return [
        {
            "type": "function",
            "function": {
                "name": s["name"],
                "description": s["description"],
                "parameters": s["parameters"],
            }
        }
        for s in specs
    ]


class ChatService:
    def __init__(self):
        self.config = ai_config

    def process_chat_conversation(self, db: Session, request: ChatRequest) -> ChatResponse:
        """
        Executes multi-turn tool-augmented conversational underwriting reasoning.
        """
        client = get_groq_client()
        if client is None:
            return ChatResponse(
                response="⚠️ AI Underwriting service is currently unavailable. Please verify GROQ_API_KEY.",
                toolExecutions=[],
                referencedDocs=[],
            )

        auth = request.authContext.dict() if request.authContext else {}
        user_role = (auth.get("role") or "customer").lower()

        system_instruction = build_chat_assistant_prompt(
            auth_context=auth,
            linked_app_id=request.applicationId,
            linked_cust_id=request.customerId,
        )

        messages = [{"role": "system", "content": system_instruction}]

        # Inject conversation history
        for msg in request.history:
            messages.append({"role": msg.role, "content": msg.content})

        # Inject current user message
        messages.append({"role": "user", "content": request.message})

        tools = format_tools_for_groq()
        tool_executions: List[ToolExecutionAudit] = []
        referenced_docs: List[str] = []

        candidate_models = [self.config.primary_model] + self.config.fallback_models
        seen_models = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen_models or seen_models.add(m))]

        for turn in range(self.config.max_agent_turns):
            response = None
            last_error = None

            for model_name in models_to_try:
                try:
                    response = client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        tools=tools,
                        tool_choice="auto",
                        temperature=self.config.temperature,
                        max_tokens=self.config.max_tokens,
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

            if not tool_calls:
                final_text = response_message.content or ""
                return ChatResponse(
                    response=final_text,
                    toolExecutions=tool_executions,
                    referencedDocs=list(set(referenced_docs)),
                )

            # Append assistant turn with tool calls
            messages.append({
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
            })

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
                    result = execute_mcp_tool(db, tool_name=func_name, arguments=args, auth_user=auth)
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

                tool_executions.append(
                    ToolExecutionAudit(
                        toolName=func_name,
                        arguments=args,
                        status=status,
                        summary=summary,
                        timestamp=call_time,
                    )
                )

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": func_name,
                    "content": tool_result_str,
                })

        return ChatResponse(
            response="I evaluated the tools for your loan application. Please ask any specific follow-up questions.",
            toolExecutions=tool_executions,
            referencedDocs=list(set(referenced_docs)),
        )


chat_service = ChatService()
