"""
Backward compatibility adapter for mcp_comparison_tool.
The comparison MCP tool is now located in `app.mcp.tools.comparison_tool`.
"""
from app.mcp.tools.comparison_tool import (
    COMPARISON_TOOL_SPEC as MCP_COMPARISON_TOOL_SPEC,
    compare_banks as execute_mcp_comparison_tool,
)

__all__ = [
    "MCP_COMPARISON_TOOL_SPEC",
    "execute_mcp_comparison_tool",
]
