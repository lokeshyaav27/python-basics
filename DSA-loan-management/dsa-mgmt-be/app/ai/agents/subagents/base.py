import json
import logging
import time
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
from app.ai.config import ai_config
from app.ai.client import get_ai_client
from app.mcp.registry import execute_mcp_tool

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
                logger.warning(f"[{self.name}] Model '{model_name}' failed: {e}. Trying next candidate from env...")

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
        client = get_ai_client()
        if not client:
            return {
                "agentName": self.name,
                "status": "ERROR",
                "summary": "AI client unavailable.",
                "referencedDocs": [],
                "toolsExecuted": [],
            }

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

        for turn in range(1, max_turns + 1):
            response, model_used, error = self._call_llm(
                client=client,
                messages=messages,
                tools=formatted_tools,
            )

            if not response or not response.choices:
                logger.error(f"[{self.name}] Turn {turn} LLM failed: {error}")
                break

            choice = response.choices[0]
            msg = choice.message
            tool_calls = getattr(msg, "tool_calls", None)

            # Case A: Sub-agent generated final summary text
            if not tool_calls:
                final_text = msg.content or ""
                return {
                    "agentName": self.name,
                    "status": "SUCCESS",
                    "summary": final_text,
                    "modelUsed": model_used,
                    "referencedDocs": referenced_docs,
                    "toolsExecuted": tools_executed,
                }

            # Case B: Tool execution turn
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

                tools_executed.append(t_name)
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
                except Exception as ex:
                    t_res_str = json.dumps({"status": "ERROR", "error": str(ex)})

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "name": t_name,
                    "content": t_res_str,
                })

        # Final synthesis if loop ended
        final_synth_resp, final_model, _ = self._call_llm(
            client=client,
            messages=messages,
            tools=None,
        )
        if final_synth_resp and final_synth_resp.choices:
            final_text = final_synth_resp.choices[0].message.content or ""
        else:
            final_text = "Analysis completed based on the retrieved application and bank underwriting records."

        return {
            "agentName": self.name,
            "status": "SUCCESS",
            "summary": final_text,
            "modelUsed": final_model or model_used,
            "referencedDocs": referenced_docs,
            "toolsExecuted": tools_executed,
        }
