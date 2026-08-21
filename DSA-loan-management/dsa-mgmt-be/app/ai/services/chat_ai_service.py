import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage
from app.ai.config import ai_config
from app.ai.client import get_groq_client
from app.ai.prompts.chat_assistant_prompt import build_chat_assistant_prompt
from app.mcp import get_all_tool_specs, execute_mcp_tool

# Configure structured logger for AI Chat Service
logger = logging.getLogger("ai_chat_service")
logger.setLevel(logging.INFO)

# If no handlers exist, add a standard stream handler for console visibility
if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [AI-CHAT-SERVICE] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def format_tools_for_groq() -> List[Dict[str, Any]]:
    """
    Transforms MCP tool specifications into OpenAI/Groq function calling format.
    """
    specs = get_all_tool_specs()
    groq_tools = []
    for s in specs:
        groq_tools.append({
            "type": "function",
            "function": {
                "name": s["name"],
                "description": s["description"],
                "parameters": s["parameters"],
            }
        })
    return groq_tools


class ChatService:
    """
    Service responsible for handling interactive AI Underwriting chat conversations.
    Follows a strict, linear, single-tool-execution workflow:
    1. Parse request and session authentication context.
    2. Construct role-specific system prompt and conversation history.
    3. Query LLM to either answer directly or select ONE specific MCP tool.
    4. Execute the specific MCP tool deterministically (if requested).
    5. Synthesize the final structured markdown response using the tool output.
    """

    def __init__(self):
        self.config = ai_config

    def _call_llm(
        self,
        client: Any,
        messages: List[Dict[str, Any]],
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
    ) -> Tuple[Optional[Any], Optional[str], Optional[Exception]]:
        """
        Executes a call to Groq LLM with primary and fallback models.
        Returns (response_object, model_used, error).
        """
        candidate_models = [self.config.primary_model] + self.config.fallback_models
        seen_models = set()
        models_to_try = []
        for m in candidate_models:
            if m and m not in seen_models:
                seen_models.add(m)
                models_to_try.append(m)

        last_error = None

        for model_name in models_to_try:
            try:
                logger.info(f"Attempting LLM call with model='{model_name}' (messages={len(messages)})")
                kwargs: Dict[str, Any] = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": self.config.temperature,
                    "max_tokens": self.config.max_tokens,
                }
                if tools:
                    kwargs["tools"] = tools
                    if tool_choice:
                        kwargs["tool_choice"] = tool_choice

                response = client.chat.completions.create(**kwargs)
                logger.info(f"LLM call succeeded with model='{model_name}'")
                return response, model_name, None

            except Exception as e:
                last_error = e
                logger.warning(f"Model '{model_name}' failed: {e}. Trying next candidate model...")

        return None, None, last_error

    def process_chat_conversation(self, db: Session, request: ChatRequest) -> ChatResponse:
        """
        Processes an incoming user query with full step-by-step logging and single-tool execution.
        """
        start_time = time.time()
        logger.info("=" * 80)
        logger.info("🚀 [STEP 1/5] INCOMING CHAT REQUEST RECEIVED")

        # -------------------------------------------------------------
        # STEP 1: Parse and validate authentication & request metadata
        # -------------------------------------------------------------
        auth = request.authContext.dict() if request.authContext else {}
        user_role = (auth.get("role") or "customer").lower()
        user_id = auth.get("userId") or auth.get("identifier") or "N/A"
        user_name = auth.get("name") or "User"

        logger.info(
            f"Caller Info -> Name: '{user_name}' | Role: '{user_role.upper()}' | ID: '{user_id}'"
        )
        logger.info(
            f"Context Links -> App ID: {request.applicationId} | Customer ID: {request.customerId} | Agent ID: {request.agentId}"
        )
        logger.info(f"User Query -> \"{request.message}\"")
        logger.info(f"Conversation History Length -> {len(request.history)} prior messages")

        # Check Groq client availability
        client = get_groq_client()
        if client is None:
            logger.error("❌ Groq client initialization failed. GROQ_API_KEY may be missing.")
            return ChatResponse(
                response="⚠️ AI Underwriting service is currently unavailable. Please verify GROQ_API_KEY.",
                referencedDocs=[],
            )

        # -------------------------------------------------------------
        # STEP 2: Build system prompt and prepare conversation messages
        # -------------------------------------------------------------
        logger.info("📋 [STEP 2/5] CONSTRUCTING ROLE-SPECIFIC SYSTEM PROMPT")

        system_instruction = build_chat_assistant_prompt(
            auth_context=auth,
            linked_app_id=request.applicationId,
            linked_cust_id=request.customerId,
            linked_agent_id=request.agentId,
        )

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_instruction}
        ]

        # Inject conversation history (up to last 8 messages for context)
        for msg in request.history[-8:]:
            messages.append({"role": msg.role, "content": msg.content})

        # Inject current user message
        messages.append({"role": "user", "content": request.message})

        logger.info(f"Prepared total message payload: {len(messages)} items")

        # -------------------------------------------------------------
        # STEP 3: Initial LLM Inference (Decide: Direct Answer vs Tool)
        # -------------------------------------------------------------
        logger.info("🤖 [STEP 3/5] RUNNING INITIAL LLM INFERENCE (EVALUATING TOOL CALL)")

        all_tools = format_tools_for_groq()
        logger.info(f"Exposed {len(all_tools)} available MCP tools to LLM")

        response, model_used, error = self._call_llm(
            client=client,
            messages=messages,
            tools=all_tools,
            tool_choice="auto",
        )

        if response is None:
            logger.error(f"❌ Initial LLM call failed across all candidate models. Error: {error}")
            return ChatResponse(
                response=f"⚠️ An error occurred while communicating with the AI Underwriter: {str(error)}",
                referencedDocs=[],
            )

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        # -------------------------------------------------------------
        # STEP 4: Tool Execution (Specific Tool Execution - No Looping)
        # -------------------------------------------------------------
        referenced_docs: List[str] = []

        if not tool_calls:
            # Case A: LLM answered directly without calling any tool
            final_text = response_message.content or ""
            elapsed_ms = int((time.time() - start_time) * 1000)
            logger.info("💬 [STEP 4/5] LLM DECIDED: DIRECT ANSWER (NO TOOL CALL NEEDED)")
            logger.info(f"Direct Response Length: {len(final_text)} chars")
            logger.info(f"✅ [STEP 5/5] WORKFLOW COMPLETED IN {elapsed_ms}ms (DIRECT ANSWER)")
            logger.info("=" * 80)
            return ChatResponse(
                response=final_text,
                referencedDocs=[],
            )

        # Case B: LLM requested a tool call. Pick the single specific tool.
        specific_tool_call = tool_calls[0]
        tool_name = specific_tool_call.function.name
        raw_args = specific_tool_call.function.arguments

        try:
            parsed_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        except Exception:
            parsed_args = {}

        logger.info("🔧 [STEP 4/5] LLM DECIDED: CALL SPECIFIC TOOL")
        logger.info(f"Selected Tool -> '{tool_name}'")
        logger.info(f"Tool Arguments -> {json.dumps(parsed_args, default=str)}")

        tool_exec_start = time.time()
        tool_result_str = ""

        try:
            tool_result = execute_mcp_tool(
                db=db,
                tool_name=tool_name,
                arguments=parsed_args,
                auth_user=auth,
            )
            tool_exec_duration = int((time.time() - tool_exec_start) * 1000)
            logger.info(f"Tool '{tool_name}' executed successfully in {tool_exec_duration}ms")

            # Extract referenced document citations if this was a policy RAG search
            if tool_name in ["search_bank_documents", "search_bank_policies", "semantic_search"]:
                results_list = tool_result.get("results", []) if isinstance(tool_result, dict) else []
                for item in results_list:
                    doc_name = item.get("documentName")
                    bank_name = item.get("bankName")
                    if doc_name and bank_name:
                        referenced_docs.append(f"{bank_name} - {doc_name}")
                    elif doc_name:
                        referenced_docs.append(doc_name)
                logger.info(f"Extracted {len(referenced_docs)} document citations from RAG search")

            tool_result_str = json.dumps(tool_result, default=str)

        except HTTPException as he:
            tool_exec_duration = int((time.time() - tool_exec_start) * 1000)
            logger.warning(
                f"Tool '{tool_name}' returned HTTPException ({he.status_code}): {he.detail} in {tool_exec_duration}ms"
            )
            tool_result_str = json.dumps({
                "status": "ERROR",
                "statusCode": he.status_code,
                "error": he.detail,
            })
        except Exception as ex:
            tool_exec_duration = int((time.time() - tool_exec_start) * 1000)
            logger.error(f"Tool '{tool_name}' failed with unexpected exception: {ex} in {tool_exec_duration}ms")
            tool_result_str = json.dumps({
                "status": "ERROR",
                "error": str(ex),
            })

        # -------------------------------------------------------------
        # STEP 5: Final Response Synthesis (No Loop - Tool Choice: None)
        # -------------------------------------------------------------
        logger.info("✨ [STEP 5/5] SYNTHESIZING FINAL STRUCTURED RESPONSE FROM TOOL DATA")

        # Append assistant's tool call message
        messages.append({
            "role": "assistant",
            "content": response_message.content or "",
            "tool_calls": [
                {
                    "id": specific_tool_call.id,
                    "type": "function",
                    "function": {
                        "name": tool_name,
                        "arguments": raw_args,
                    },
                }
            ],
        })

        # Append tool execution result message (required by OpenAI/Groq specification)
        messages.append({
            "role": "tool",
            "tool_call_id": specific_tool_call.id,
            "name": tool_name,
            "content": tool_result_str,
        })

        # Append system synthesis instruction to guide the LLM to output the final formatted text
        messages.append({
            "role": "system",
            "content": (
                "The requested tool execution data has been successfully retrieved above. "
                "Now formulate the final comprehensive response to the user following the required Markdown table templates, bullet points, and status icons. "
                "Provide your complete formatted answer directly in text."
            ),
        })

        # Call LLM for final synthesis without tools (guarantees text-only output, no recursive loop)
        final_response, final_model, final_error = self._call_llm(
            client=client,
            messages=messages,
            tools=None,
            tool_choice=None,
        )

        if final_response is None:
            logger.error(f"❌ Final response synthesis failed: {final_error}")
            return ChatResponse(
                response=f"⚠️ Tool executed successfully, but failed to format final response: {str(final_error)}",
                referencedDocs=list(set(referenced_docs)),
            )

        final_content = final_response.choices[0].message.content or ""
        total_duration_ms = int((time.time() - start_time) * 1000)

        logger.info(f"Synthesized Final Response ({len(final_content)} chars) via '{final_model}'")
        logger.info(f"Referenced Docs: {referenced_docs}")
        logger.info(f"✅ [COMPLETE] AI CHAT WORKFLOW FINISHED IN {total_duration_ms}ms")
        logger.info("=" * 80)

        return ChatResponse(
            response=final_content,
            referencedDocs=list(set(referenced_docs)),
        )


chat_service = ChatService()
