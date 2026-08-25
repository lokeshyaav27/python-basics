import json
import logging
import time
from datetime import datetime
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.schemas.chat import ChatRequest, ChatResponse, ChatMessage
from app.core.config import settings
from app.ai.config import ai_config
from app.ai.client import get_ai_client, get_groq_client
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
    Follows a dynamic ReAct (Reason + Act) Multi-Tool & Multi-Hop Agent Loop:
    1. Parse request and session authentication context.
    2. Construct role-specific system prompt and conversation history.
    3. In a loop (up to max_agent_turns):
       a. Query LLM with all MCP tools attached.
       b. If LLM generates a text answer (no tool calls), return final response.
       c. If LLM requests tool call(s), execute each tool (parallel / sequential),
          collect outputs, append tool messages, and feed back to the LLM for next turn.
    4. If maximum turns reached, execute a final synthesis call with tools disabled.
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
                logger.info(
                    f"🌐 [LLM INFERENCE START] model='{model_name}' | messages_count={len(messages)} | tools_attached={len(tools) if tools else 0}"
                )
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
                logger.warning(
                    f"⚠️ [LLM INFERENCE FAILED] Model '{model_name}' failed: {e}. Trying next candidate model from env..."
                )

        return None, None, last_error

    def process_chat_conversation(self, db: Session, request: ChatRequest) -> ChatResponse:
        """
        Processes an incoming user query with full ReAct multi-tool and multi-hop loop.
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

        # Check AI client availability
        client = get_ai_client()
        if client is None:
            provider_name = "Ollama (local server)" if settings.USE_OLLAMA else "Groq Cloud"
            logger.error(f"❌ AI client initialization failed. Please check {provider_name} configuration in .env.")
            return ChatResponse(
                response=f"⚠️ AI Underwriting service is currently unavailable. Please verify {provider_name} configuration in .env.",
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
        # STEP 3 & 4: ReAct Multi-Tool & Multi-Hop Execution Loop
        # -------------------------------------------------------------
        all_tools = format_tools_for_groq()
        tool_names = [t["function"]["name"] for t in all_tools]
        logger.info(f"🛠️ Exposed {len(all_tools)} MCP Tools to LLM: {tool_names}")

        max_turns = self.config.max_agent_turns or 4
        current_turn = 0
        referenced_docs: List[str] = []
        tools_executed_list: List[str] = []
        last_model_used: Optional[str] = None
        executed_signature_counts: Dict[str, int] = {}

        while current_turn < max_turns:
            current_turn += 1
            logger.info("-" * 90)
            logger.info(f"🔄 [AGENT LOOP TURN {current_turn}/{max_turns}] CALLING LLM (EVALUATING NEXT ACTION)")
            logger.info("-" * 90)

            turn_start = time.time()
            response, model_used, error = self._call_llm(
                client=client,
                messages=messages,
                tools=all_tools,
                tool_choice="auto",
            )
            turn_ms = int((time.time() - turn_start) * 1000)
            if model_used:
                last_model_used = model_used

            if response is None:
                logger.error(f"❌ LLM inference failed on Turn {current_turn} in {turn_ms}ms. Error: {error}")
                return ChatResponse(
                    response=f"⚠️ An error occurred while communicating with the AI Underwriter: {str(error)}",
                    referencedDocs=list(set(referenced_docs)),
                    modelUsed=last_model_used,
                    toolUsed=", ".join(tools_executed_list) if tools_executed_list else None,
                )

            logger.info(f"📥 [TURN {current_turn} LLM RESPONSE (PRETTIFIED JSON)]:\n" + "-" * 90 + f"\n{format_llm_response_for_log(response)}\n" + "-" * 90)

            response_message = response.choices[0].message
            tool_calls = response_message.tool_calls

            # ── Condition A: LLM decided it has enough data and produced final text response ──
            if not tool_calls:
                final_text = response_message.content or ""
                total_duration_ms = int((time.time() - start_time) * 1000)
                logger.info("-" * 90)
                logger.info(f"💬 [FINAL ANSWER GENERATED] LLM concluded reasoning on Turn {current_turn}")
                logger.info(f"✨ Synthesized Final Response via '{last_model_used}' ({len(final_text)} chars):\n" + "=" * 90 + f"\n{final_text}\n" + "=" * 90)
                logger.info(f"📚 Referenced Docs Attached: {referenced_docs}")
                logger.info(f"🔧 Tools Executed in Workflow: {tools_executed_list or 'None (Direct Answer)'}")
                logger.info(f"✅ [COMPLETE] AI CHAT WORKFLOW FINISHED IN {total_duration_ms}ms")
                logger.info("=" * 90)

                return ChatResponse(
                    response=final_text,
                    referencedDocs=list(set(referenced_docs)),
                    modelUsed=last_model_used,
                    toolUsed=", ".join(tools_executed_list) if tools_executed_list else None,
                )

            # ── Condition B: LLM requested one or more tool calls (Parallel / Sequential) ──
            logger.info(f"🔧 [TOOL CALLS REQUESTED] LLM requested {len(tool_calls)} tool execution(s) in Turn {current_turn}:")

            # Append assistant message containing the tool calls
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
                        },
                    }
                    for tc in tool_calls
                ],
            })

            # Execute all tool calls requested in this turn
            should_break_loop = False
            for idx, tc in enumerate(tool_calls, 1):
                t_name = tc.function.name
                raw_args = tc.function.arguments

                try:
                    p_args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                except Exception:
                    p_args = {}

                # Anti-spin repetition guardrail
                sig = f"{t_name}:{json.dumps(p_args, sort_keys=True)}"
                executed_signature_counts[sig] = executed_signature_counts.get(sig, 0) + 1
                if executed_signature_counts[sig] > 2:
                    logger.warning(f"⚠️ Circular tool loop detected for '{t_name}'. Breaking agent loop to synthesize answer.")
                    should_break_loop = True

                logger.info(f"   [{idx}/{len(tool_calls)}] Executing Tool: '{t_name}' with args:\n{json.dumps(p_args, indent=2, default=str)}")

                t_start = time.time()
                try:
                    t_result = execute_mcp_tool(
                        db=db,
                        tool_name=t_name,
                        arguments=p_args,
                        auth_user=auth,
                    )
                    t_duration = int((time.time() - t_start) * 1000)
                    logger.info(f"   ⚡ Tool '{t_name}' completed successfully in {t_duration}ms")

                    # Collect citations if RAG tool
                    if t_name == "search_bank_policies":
                        results_list = t_result.get("results", []) if isinstance(t_result, dict) else []
                        for item in results_list:
                            doc_name = item.get("documentName")
                            bank_name = item.get("bankName")
                            if doc_name and bank_name:
                                referenced_docs.append(f"{bank_name} - {doc_name}")
                            elif doc_name:
                                referenced_docs.append(doc_name)
                        logger.info(f"   📚 RAG citations updated: {len(referenced_docs)} total document citations")

                    t_result_str = json.dumps(t_result, default=str)
                    tools_executed_list.append(t_name)

                except HTTPException as he:
                    t_duration = int((time.time() - t_start) * 1000)
                    logger.warning(f"   ⚠️ Tool '{t_name}' returned HTTPException ({he.status_code}): {he.detail} in {t_duration}ms")
                    t_result_str = json.dumps({"status": "ERROR", "statusCode": he.status_code, "error": he.detail})
                except Exception as ex:
                    t_duration = int((time.time() - t_start) * 1000)
                    logger.error(f"   ❌ Tool '{t_name}' failed with unexpected exception: {ex} in {t_duration}ms")
                    t_result_str = json.dumps({"status": "ERROR", "error": str(ex)})

                # Append tool result message
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": t_name,
                    "content": t_result_str,
                })

            if should_break_loop:
                break

        # -------------------------------------------------------------
        # STEP 5: Final Synthesis Guardrail (If Loop Exceeded Max Turns)
        # -------------------------------------------------------------
        logger.info("-" * 90)
        logger.info("✨ [FINAL SYNTHESIS GUARDRAIL] FORCING TEXT FORMATTING (TOOLS DISABLED)")
        logger.info("-" * 90)

        messages.append({
            "role": "system",
            "content": (
                "All necessary MCP tools and business context have been executed above. "
                "Now formulate the final comprehensive response to the user following the required Markdown table templates, bullet points, and status icons. "
                "Provide your complete formatted answer directly in text."
            ),
        })

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
                modelUsed=final_model or last_model_used,
                toolUsed=", ".join(tools_executed_list) if tools_executed_list else None,
            )

        logger.info(f"📥 [FINAL SYNTHESIS LLM RESPONSE (PRETTIFIED JSON)]:\n" + "-" * 90 + f"\n{format_llm_response_for_log(final_response)}\n" + "-" * 90)

        final_content = final_response.choices[0].message.content or ""
        total_duration_ms = int((time.time() - start_time) * 1000)

        logger.info(f"✨ Synthesized Final Response via '{final_model}' ({len(final_content)} chars, synthesis_time={final_synthesis_ms}ms):\n" + "=" * 90 + f"\n{final_content}\n" + "=" * 90)
        logger.info(f"📚 Referenced Docs Attached: {referenced_docs}")
        logger.info(f"🔧 Tools Executed in Workflow: {tools_executed_list}")
        logger.info(f"✅ [COMPLETE] AI CHAT WORKFLOW FINISHED IN {total_duration_ms}ms")
        logger.info("=" * 90)

        return ChatResponse(
            response=final_content,
            referencedDocs=list(set(referenced_docs)),
            modelUsed=final_model or last_model_used,
            toolUsed=", ".join(tools_executed_list) if tools_executed_list else None,
        )


chat_service = ChatService()
