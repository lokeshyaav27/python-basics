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
from app.mcp.registry import get_all_tool_specs, execute_mcp_tool

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
            },
        })
    return groq_tools


def format_llm_response_for_log(response: Any) -> str:
    """
    Pretty-formats an LLM response object into clean, indented JSON for readable logging.
    """
    if response is None:
        return "None"
    try:
        if hasattr(response, "model_dump"):
            return json.dumps(response.model_dump(), indent=2, default=str)
        if hasattr(response, "dict"):
            return json.dumps(response.dict(), indent=2, default=str)
        if hasattr(response, "__dict__"):
            return json.dumps(response.__dict__, indent=2, default=str)
        return json.dumps(response, indent=2, default=str)
    except Exception:
        return str(response)


class ChatService:
    """
    Service responsible for handling interactive AI Underwriting chat conversations.
    Follows a strict, linear, single-tool-execution workflow with comprehensive logging:
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
        Executes a call to Groq LLM with models configured in environment variables.
        Returns (response_object, model_used, error).
        """
        models_to_try = self.config.candidate_models
        last_error = None

        for model_name in models_to_try:
            try:
                call_start = time.time()
                logger.info(f"🌐 [LLM INFERENCE START] model='{model_name}' | messages_count={len(messages)} | tools_attached={len(tools) if tools else 0}")
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
                call_ms = int((time.time() - call_start) * 1000)
                logger.info(f"✅ [LLM INFERENCE SUCCESS] model='{model_name}' finished in {call_ms}ms")
                return response, model_name, None

            except Exception as e:
                last_error = e
                logger.warning(f"⚠️ [LLM INFERENCE FAILED] Model '{model_name}' failed: {e}. Trying next candidate model...")

        return None, None, last_error

    def process_chat_conversation(self, db: Session, request: ChatRequest) -> ChatResponse:
        """
        Processes an incoming user query with full step-by-step logging and single-tool execution.
        """
        start_time = time.time()
        logger.info("=" * 90)
        logger.info("🚀 [STEP 1/5] INCOMING CHAT REQUEST RECEIVED")
        logger.info("=" * 90)

        # -------------------------------------------------------------
        # STEP 1: Parse and validate authentication & request metadata
        # -------------------------------------------------------------
        auth = request.authContext.dict() if request.authContext else {}
        user_role = (auth.get("role") or "customer").lower()
        user_id = auth.get("userId") or auth.get("identifier") or "N/A"
        user_name = auth.get("name") or "User"

        logger.info(f"👤 Caller Profile    -> Name: '{user_name}' | Role: '{user_role.upper()}' | Identifier: '{user_id}'")
        logger.info(f"🔗 Linked Entities   -> Application ID: {request.applicationId} | Customer ID: {request.customerId} | Agent ID: {request.agentId}")
        logger.info(f"💬 User Prompt Text  -> \"{request.message}\"")
        logger.info(f"📜 History Depth     -> {len(request.history)} prior messages in session")

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
        logger.info("-" * 90)
        logger.info("📋 [STEP 2/5] CONSTRUCTING ROLE-SPECIFIC SYSTEM PROMPT")
        logger.info("-" * 90)

        system_instruction = build_chat_assistant_prompt(
            auth_context=auth,
            linked_app_id=request.applicationId,
            linked_cust_id=request.customerId,
            linked_agent_id=request.agentId,
        )

        logger.info(f"📝 Full System Prompt ({len(system_instruction)} chars):\n" + "=" * 90 + f"\n{system_instruction}\n" + "=" * 90)

        messages: List[Dict[str, Any]] = [
            {"role": "system", "content": system_instruction}
        ]

        # Inject conversation history (up to last 8 messages for context)
        if request.history:
            logger.info(f"⏳ Attaching {min(len(request.history), 8)} history turns to context:")
            for idx, msg in enumerate(request.history[-8:], 1):
                messages.append({"role": msg.role, "content": msg.content})
                preview = msg.content[:100] + "..." if len(msg.content) > 100 else msg.content
                logger.info(f"   [History Turn {idx}] Role: {msg.role.upper()} -> \"{preview}\"")

        # Inject current user message
        messages.append({"role": "user", "content": request.message})
        logger.info(f"📦 Total Initial Message Payload: {len(messages)} items prepared for LLM")

        # -------------------------------------------------------------
        # STEP 3: Initial LLM Inference (Decide: Direct Answer vs Tool)
        # -------------------------------------------------------------
        logger.info("-" * 90)
        logger.info("🤖 [STEP 3/5] RUNNING INITIAL LLM INFERENCE (EVALUATING INTENT & TOOLS)")
        logger.info("-" * 90)

        all_tools = format_tools_for_groq()
        tool_names = [t["function"]["name"] for t in all_tools]
        logger.info(f"🛠️ Exposed {len(all_tools)} MCP Tools to LLM: {tool_names}")

        decision_start = time.time()
        response, model_used, error = self._call_llm(
            client=client,
            messages=messages,
            tools=all_tools,
            tool_choice="auto",
        )
        decision_ms = int((time.time() - decision_start) * 1000)

        if response is None:
            logger.error(f"❌ Initial LLM call failed across all candidate models in {decision_ms}ms. Error: {error}")
            return ChatResponse(
                response=f"⚠️ An error occurred while communicating with the AI Underwriter: {str(error)}",
                referencedDocs=[],
            )

        logger.info(f"📥 [STEP 3 LLM RESPONSE (PRETTIFIED JSON)]:\n" + "-" * 90 + f"\n{format_llm_response_for_log(response)}\n" + "-" * 90)

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
            logger.info("-" * 90)
            logger.info("💬 [STEP 4/5] LLM DECISION -> DIRECT TEXT ANSWER (NO TOOL CALL REQUIRED)")
            logger.info(f"Direct Response Content ({len(final_text)} chars):\n" + "-" * 90 + f"\n{final_text}\n" + "-" * 90)
            logger.info(f"✅ [COMPLETE] AI CHAT WORKFLOW FINISHED IN {elapsed_ms}ms (DIRECT ANSWER)")
            logger.info("=" * 90)
            return ChatResponse(
                response=final_text,
                referencedDocs=[],
                modelUsed=model_used,
                toolUsed=None,
            )

        # Case B: LLM requested a tool call. Pick the single specific tool.
        specific_tool_call = tool_calls[0]
        tool_name = specific_tool_call.function.name
        raw_args = specific_tool_call.function.arguments

        try:
            parsed_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
        except Exception:
            parsed_args = {}

        logger.info("-" * 90)
        logger.info(f"🔧 [STEP 4/5] LLM DECISION -> INVOKE SPECIFIC MCP TOOL: '{tool_name}'")
        logger.info(f"📥 Tool Arguments Received:\n{json.dumps(parsed_args, indent=2, default=str)}")
        logger.info("-" * 90)

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
            logger.info(f"⚡ Tool '{tool_name}' executed successfully in {tool_exec_duration}ms")

            # Extract referenced document citations if this was a policy RAG search
            if tool_name == "search_bank_policies":
                results_list = tool_result.get("results", []) if isinstance(tool_result, dict) else []
                for item in results_list:
                    doc_name = item.get("documentName")
                    bank_name = item.get("bankName")
                    if doc_name and bank_name:
                        referenced_docs.append(f"{bank_name} - {doc_name}")
                    elif doc_name:
                        referenced_docs.append(doc_name)
                logger.info(f"📚 Extracted {len(referenced_docs)} document citations from RAG search: {referenced_docs}")

            tool_result_str = json.dumps(tool_result, default=str)
            logger.info(f"📊 Tool Output Data ({len(tool_result_str)} bytes):\n" + "-" * 90 + f"\n{tool_result_str[:1200]}{'...' if len(tool_result_str) > 1200 else ''}\n" + "-" * 90)

        except HTTPException as he:
            tool_exec_duration = int((time.time() - tool_exec_start) * 1000)
            logger.warning(
                f"⚠️ Tool '{tool_name}' returned HTTPException ({he.status_code}): {he.detail} in {tool_exec_duration}ms"
            )
            tool_result_str = json.dumps({
                "status": "ERROR",
                "statusCode": he.status_code,
                "error": he.detail,
            })
        except Exception as ex:
            tool_exec_duration = int((time.time() - tool_exec_start) * 1000)
            logger.error(f"❌ Tool '{tool_name}' failed with unexpected exception: {ex} in {tool_exec_duration}ms")
            tool_result_str = json.dumps({
                "status": "ERROR",
                "error": str(ex),
            })

        # -------------------------------------------------------------
        # STEP 5: Final Response Synthesis (No Loop - Tool Choice: None)
        # -------------------------------------------------------------
        logger.info("-" * 90)
        logger.info("✨ [STEP 5/5] SYNTHESIZING FINAL STRUCTURED RESPONSE FROM TOOL DATA")
        logger.info("-" * 90)

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
        final_synthesis_start = time.time()
        final_response, final_model, final_error = self._call_llm(
            client=client,
            messages=messages,
            tools=None,
            tool_choice=None,
        )
        final_synthesis_ms = int((time.time() - final_synthesis_start) * 1000)

        if final_response is None:
            logger.error(f"❌ Final response synthesis failed in {final_synthesis_ms}ms: {final_error}")
            return ChatResponse(
                response=f"⚠️ Tool executed successfully, but failed to format final response: {str(final_error)}",
                referencedDocs=list(set(referenced_docs)),
            )

        logger.info(f"📥 [STEP 5 FINAL SYNTHESIS LLM RESPONSE (PRETTIFIED JSON)]:\n" + "-" * 90 + f"\n{format_llm_response_for_log(final_response)}\n" + "-" * 90)

        final_content = final_response.choices[0].message.content or ""
        total_duration_ms = int((time.time() - start_time) * 1000)

        logger.info(f"✨ Synthesized Final Response via '{final_model}' ({len(final_content)} chars, synthesis_time={final_synthesis_ms}ms):\n" + "=" * 90 + f"\n{final_content}\n" + "=" * 90)
        logger.info(f"📚 Referenced Docs Attached: {referenced_docs}")
        logger.info(f"✅ [COMPLETE] AI CHAT WORKFLOW FINISHED IN {total_duration_ms}ms")
        logger.info("=" * 90)

        return ChatResponse(
            response=final_content,
            referencedDocs=list(set(referenced_docs)),
            modelUsed=final_model,
            toolUsed=tool_name,
        )


chat_service = ChatService()
