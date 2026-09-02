import os
import sys
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Ensure parent and dsa-mgmt-be are available in sys.path
CURRENT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = CURRENT_DIR.parent
BE_DIR = PROJECT_ROOT / "dsa-mgmt-be"

if str(BE_DIR) not in sys.path:
    sys.path.insert(0, str(BE_DIR))
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

# Load .env: prioritize local dsa-mgmt-mcp/.env, fallback to dsa-mgmt-be/.env
local_env = CURRENT_DIR / ".env"
be_env = BE_DIR / ".env"

if local_env.exists():
    load_dotenv(dotenv_path=local_env)
elif be_env.exists():
    load_dotenv(dotenv_path=be_env)
else:
    load_dotenv()


class MCPConfig:
    """Central configuration for DSA Model Context Protocol (MCP) Server."""

    SERVER_NAME: str = os.getenv("MCP_SERVER_NAME", "dsa-loan-management-mcp")
    SERVER_VERSION: str = "1.0.0"
    HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("MCP_PORT", "8001"))

    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/dsa_db",
    )

    # JWT Authentication & RBAC
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "dsa-super-secret-jwt-key-change-in-prod-2025")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    # RAG Vector Search
    EMBEDDING_MODEL: str = os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    STORAGE_DIR: Path = Path(os.getenv("FILE_STORAGE_DIR", str(BE_DIR / "dsa-file-storage")))


mcp_config = MCPConfig()
