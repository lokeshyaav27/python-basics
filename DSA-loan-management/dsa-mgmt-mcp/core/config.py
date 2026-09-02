import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Path resolutions
MCP_ROOT = Path(__file__).resolve().parent.parent

if str(MCP_ROOT) not in sys.path:
    sys.path.insert(0, str(MCP_ROOT))

# Load .env: prioritize local dsa-mgmt-mcp/.env
local_env = MCP_ROOT / ".env"
if local_env.exists():
    load_dotenv(dotenv_path=local_env)
else:
    load_dotenv()


class MCPConfig:
    """Central configuration for standalone DSA Model Context Protocol (MCP) Server."""

    # Server Settings
    SERVER_NAME: str = os.getenv("MCP_SERVER_NAME", "dsa-loan-management-mcp")
    SERVER_VERSION: str = "1.0.0"
    HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("MCP_PORT", "8001"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database Configuration (independent PostgreSQL connection)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:admin@localhost:5432/dsa-mgmt",
    )

    # JWT Authentication & RBAC
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "dsa-loan-mgmt-jwt-secret-key-2026-secure-auth",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

    # RAG Vector Search Configuration
    EMBEDDING_MODEL_NAME: str = os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    RAG_CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
    RAG_DEFAULT_TOP_K: int = int(os.getenv("RAG_DEFAULT_TOP_K", "4"))
    RAG_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.35"))


mcp_config = MCPConfig()
