import json
import re
import uuid
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger("ai_tool_parser")


class ParsedFunction:
    def __init__(self, name: str, arguments: Any):
        self.name = name
        if isinstance(arguments, str):
            self.arguments = arguments
        else:
            self.arguments = json.dumps(arguments)


class ParsedToolCall:
    def __init__(self, id: str, name: str, arguments: Any):
        self.id = id
        self.type = "function"
        self.function = ParsedFunction(name, arguments)


def _parse_param_value(val_str: str) -> Any:
    """Converts string parameter values to appropriate Python types."""
    v = val_str.strip()
    v_lower = v.lower()
    if v_lower in ("null", "none"):
        return None
    if v_lower == "true":
        return True
    if v_lower == "false":
        return False
    
    # Try numeric conversions
    try:
        if "." in v:
            val_float = float(v)
            # If it's a whole number like 1.0, convert to int if expected for IDs
            return int(val_float) if val_float.is_integer() else val_float
        return int(v)
    except ValueError:
        pass

    # Try JSON array/object parsing
    if (v.startswith("{") and v.endswith("}")) or (v.startswith("[") and v.endswith("]")):
        try:
            return json.loads(v)
        except Exception:
            pass

    return v


def extract_tool_calls(msg: Any) -> List[ParsedToolCall]:
    """
    Extracts tool calls from LLM completion message.
    Handles both native OpenAI-style `msg.tool_calls` and text-based fallback tool calls
    (e.g., XML `<tool_call><function=...>` or JSON formats emitted by Ollama/local models).
    """
    results: List[ParsedToolCall] = []

    # 1. Check native tool_calls
    native_calls = getattr(msg, "tool_calls", None)
    if native_calls:
        for tc in native_calls:
            tc_id = getattr(tc, "id", None) or f"call_{uuid.uuid4().hex[:8]}"
            fn = getattr(tc, "function", tc)
            fn_name = getattr(fn, "name", "")
            fn_args = getattr(fn, "arguments", "{}")
            results.append(ParsedToolCall(id=tc_id, name=fn_name, arguments=fn_args))
        if results:
            return results

    content = getattr(msg, "content", "") or ""
    if not content or not isinstance(content, str):
        return []

    # 2. Check XML format: <tool_call><function=name>...</function></tool_call>
    xml_tool_pattern = re.compile(
        r"<tool_call>\s*<function=([a-zA-Z0-9_\-\.]+?)>\s*(.*?)\s*</function>\s*</tool_call>",
        re.DOTALL | re.IGNORECASE,
    )
    for match in xml_tool_pattern.finditer(content):
        fn_name = match.group(1).strip()
        body = match.group(2).strip()

        param_pattern = re.compile(
            r"<parameter=([a-zA-Z0-9_\-\.]+?)>\s*(.*?)\s*</parameter>",
            re.DOTALL | re.IGNORECASE,
        )
        args_dict: Dict[str, Any] = {}
        for p_match in param_pattern.finditer(body):
            p_name = p_match.group(1).strip()
            p_val = p_match.group(2).strip()
            args_dict[p_name] = _parse_param_value(p_val)

        tc_id = f"call_xml_{uuid.uuid4().hex[:8]}"
        logger.info(f"Parsed text-based XML tool call: {fn_name} with args {args_dict}")
        results.append(ParsedToolCall(id=tc_id, name=fn_name, arguments=args_dict))

    if results:
        return results

    # 3. Check JSON tool_call inside <tool_call> tag: <tool_call>{"name": ..., "arguments": ...}</tool_call>
    json_tag_pattern = re.compile(
        r"<tool_call>\s*(\{.*?\})\s*</tool_call>",
        re.DOTALL | re.IGNORECASE,
    )
    for match in json_tag_pattern.finditer(content):
        try:
            data = json.loads(match.group(1))
            fn_name = data.get("name") or data.get("function")
            fn_args = data.get("arguments") or data.get("parameters") or {}
            if fn_name:
                tc_id = f"call_json_{uuid.uuid4().hex[:8]}"
                results.append(ParsedToolCall(id=tc_id, name=fn_name, arguments=fn_args))
        except Exception:
            pass

    if results:
        return results

    # 4. Check [TOOL_CALLS] block: [TOOL_CALLS] [{"name": ..., "arguments": ...}]
    tool_calls_tag = re.search(r"\[TOOL_CALLS\]\s*(\[.*?\]|\{.*?\})", content, re.DOTALL)
    if tool_calls_tag:
        try:
            data = json.loads(tool_calls_tag.group(1))
            if isinstance(data, list):
                for item in data:
                    fn_name = item.get("name")
                    fn_args = item.get("arguments", {})
                    if fn_name:
                        results.append(ParsedToolCall(id=f"call_{uuid.uuid4().hex[:8]}", name=fn_name, arguments=fn_args))
            elif isinstance(data, dict):
                fn_name = data.get("name")
                fn_args = data.get("arguments", {})
                if fn_name:
                    results.append(ParsedToolCall(id=f"call_{uuid.uuid4().hex[:8]}", name=fn_name, arguments=fn_args))
        except Exception:
            pass

    return results
