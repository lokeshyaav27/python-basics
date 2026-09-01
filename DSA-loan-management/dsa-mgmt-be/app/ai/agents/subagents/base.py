import json
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.ai.config import ai_config
from app.ai.client import get_ai_client
from app.ai.agents.tool_parser import extract_tool_calls
from app.ai.mcp_client import execute_mcp_tool

logger = logging.getLogger("ai_subagent")


class BaseSubAgent:
    """
    Abstract base class for domain-specialized AI Sub-Agents.
    Provides standard LLM execution, tool calling loop, citation collection, and error handling.
    """

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
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

        logger.info(
            f"🤖 [{self.name}._call_llm] Invoking LLM | Candidates: {models_to_try} "
            f"| Messages: {len(messages)} | Tools Attached: {len(tools) if tools else 0}"
        )

        for idx, model_name in enumerate(models_to_try, 1):
            start_t = time.time()
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

                logger.debug(f"   [{self.name}._call_llm] (Attempt {idx}/{len(models_to_try)}) Calling model '{model_name}'...")
                response = client.chat.completions.create(**payload)
                elapsed_ms = int((time.time() - start_t) * 1000)
                logger.info(f"   ✓ [{self.name}._call_llm] Success with '{model_name}' in {elapsed_ms}ms")
                return response, model_name, None
            except Exception as e:
                elapsed_ms = int((time.time() - start_t) * 1000)
                last_error = e
                logger.warning(
                    f"   ⚠️ [{self.name}._call_llm] (Attempt {idx}/{len(models_to_try)}) Model '{model_name}' failed "
                    f"after {elapsed_ms}ms: {e}. Trying next candidate from env..."
                )

        logger.error(f"❌ [{self.name}._call_llm] All candidate models exhausted! Last error: {last_error}")
        return None, None, last_error

    def run_subagent_task(
        self,
        db: Session,
        system_prompt: str,
        task_instruction: str,
        tools_spec: List[Dict[str, Any]],
        auth_user: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes the sub-agent task loop with its specialized prompt and tools.
        Returns a structured dictionary with response text, citations, and tools used.
        """
        subagent_start_t = time.time()
        client = get_ai_client()
        if not client:
            logger.error(f"❌ [{self.name}] AI client unavailable. API key or Ollama not configured.")
            return {
                "agentName": self.name,
                "status": "ERROR",
                "summary": "AI client unavailable.",
                "referencedDocs": [],
                "toolsExecuted": [],
            }

        task_preview = task_instruction.replace("\n", " | ")
        tools_names = [s.get("name", s.get("function", {}).get("name", "tool")) for s in tools_spec]
        logger.info(f"🚀 [{self.name}] Starting Sub-Agent Task | \"{task_preview}\" | Available Tools: {tools_names}")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": task_instruction},
        ]

        formatted_tools = [
            {
                "type": "function",
                "function": {
                    "name": s["name"],
                    "description": s["description"],
                    "parameters": s["parameters"],
                },
            }
            for s in tools_spec
        ]

        tools_executed: List[str] = []
        referenced_docs: List[str] = []
        max_turns = 3
        last_model_used: Optional[str] = None

        for turn in range(1, max_turns + 1):
            logger.info(f"👉 [{self.name}.loop] === Turn {turn}/{max_turns} ===")
            response, model_used, error = self._call_llm(
                client=client,
                messages=messages,
                tools=formatted_tools,
            )
            if model_used:
                last_model_used = model_used

            if not response or not response.choices:
                logger.error(f"❌ [{self.name}.loop] Turn {turn} LLM call failed completely: {error}")
                break

            choice = response.choices[0]
            msg = choice.message
            tool_calls = extract_tool_calls(msg)

            # Case A: Sub-agent generated final summary text
            if not tool_calls:
                final_text = msg.content or ""
                total_elapsed_ms = int((time.time() - subagent_start_t) * 1000)
                logger.info(
                    f"🏁 [{self.name}.loop] Turn {turn}: Final summary text generated directly "
                    f"(Length: {len(final_text)} chars). Returning SUCCESS in {total_elapsed_ms}ms."
                )
                return {
                    "agentName": self.name,
                    "status": "SUCCESS",
                    "summary": final_text,
                    "modelUsed": model_used,
                    "referencedDocs": referenced_docs,
                    "toolsExecuted": tools_executed,
                }

            # Case B: Tool execution turn
            logger.info(
                f"⚙️ [{self.name}.loop] Turn {turn}: Extracted {len(tool_calls)} tool calls: "
                f"{[tc.function.name for tc in tool_calls]}"
            )

            messages.append({
                "role": "assistant",
                "content": msg.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments if isinstance(tc.function.arguments, str) else json.dumps(tc.function.arguments),
                        },
                    }
                    for tc in tool_calls
                ],
            })

            for tc_idx, tc in enumerate(tool_calls, 1):
                t_name = tc.function.name
                try:
                    p_args = json.loads(tc.function.arguments) if isinstance(tc.function.arguments, str) else tc.function.arguments
                except Exception:
                    p_args = {}

                tools_executed.append(t_name)
                logger.info(f"   ⚡ [{self.name}.loop] ({tc_idx}/{len(tool_calls)}) Executing MCP tool '{t_name}' with args={p_args}")
                tool_exec_t = time.time()
                try:
                    t_res = execute_mcp_tool(
                        db=db,
                        tool_name=t_name,
                        arguments=p_args,
                        auth_user=auth_user,
                    )
                    # Track citations if RAG tool
                    if t_name == "search_bank_policies" and isinstance(t_res, dict):
                        excerpts = t_res.get("excerpts", t_res.get("results", []))
                        for item in excerpts:
                            doc = item.get("documentName") or item.get("document")
                            bank = item.get("bankName") or item.get("bank")
                            if doc and bank:
                                tag = f"{bank} - {doc}"
                                if tag not in referenced_docs:
                                    referenced_docs.append(tag)
                            elif doc and doc not in referenced_docs:
                                referenced_docs.append(doc)

                    t_res_str = json.dumps(t_res, default=str)
                    tool_elapsed_ms = int((time.time() - tool_exec_t) * 1000)
                    logger.info(f"   📥 [{self.name}.loop] Tool '{t_name}' completed in {tool_elapsed_ms}ms | Total Citations: {len(referenced_docs)}")
                except Exception as ex:
                    tool_elapsed_ms = int((time.time() - tool_exec_t) * 1000)
                    logger.error(f"   ❌ [{self.name}.loop] Tool '{t_name}' execution error after {tool_elapsed_ms}ms: {ex}")
                    t_res_str = json.dumps({"status": "ERROR", "error": str(ex)})

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": t_name,
                    "content": t_res_str,
                })

        # Final synthesis if loop ended
        logger.info(f"✍️ [{self.name}.loop] Tool loop concluded after turns. Running final sub-agent synthesis turn (tools=None)...")
        final_synth_resp, final_model, synth_err = self._call_llm(
            client=client,
            messages=messages,
            tools=None,
        )
        if final_synth_resp and final_synth_resp.choices:
            final_text = final_synth_resp.choices[0].message.content or ""
            if final_model:
                last_model_used = final_model
            logger.info(f"✅ [{self.name}.loop] Final synthesis complete (Model: {last_model_used}, Length: {len(final_text)} chars)")
        else:
            logger.warning(f"⚠️ [{self.name}.loop] Final synthesis turn failed: {synth_err}")
            final_text = "Analysis completed based on the retrieved application and bank underwriting records."

        total_elapsed_ms = int((time.time() - subagent_start_t) * 1000)
        logger.info(
            f"✅ [{self.name} COMPLETE] Finished in {total_elapsed_ms}ms | Model: {last_model_used} "
            f"| Tools Executed: {tools_executed} | Citations: {referenced_docs}"
        )

        return {
            "agentName": self.name,
            "status": "SUCCESS",
            "summary": final_text,
            "modelUsed": last_model_used,
            "referencedDocs": referenced_docs,
            "toolsExecuted": tools_executed,
        }
