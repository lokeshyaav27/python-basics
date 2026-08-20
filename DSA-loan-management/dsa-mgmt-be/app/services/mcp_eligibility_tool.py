"""
Backward compatibility adapter for mcp_eligibility_tool.
The eligibility MCP tool is now located in `app.mcp.tools.eligibility_tool`.
"""
from app.mcp.tools.eligibility_tool import (
    ELIGIBILITY_TOOL_SPEC as MCP_ELIGIBILITY_TOOL_SPEC,
    check_loan_eligibility as execute_mcp_eligibility_tool,
)

__all__ = [
    "MCP_ELIGIBILITY_TOOL_SPEC",
    "execute_mcp_eligibility_tool",
]
