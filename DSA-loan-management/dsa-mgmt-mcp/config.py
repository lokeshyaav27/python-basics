import os
import sys
from pathlib import Path
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

    # Server Settings
    SERVER_NAME: str = os.getenv("MCP_SERVER_NAME", "dsa-loan-management-mcp")
    SERVER_VERSION: str = "1.0.0"
    HOST: str = os.getenv("MCP_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("MCP_PORT", "8001"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # Database Configuration (matches dsa-mgmt-be)
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:admin@localhost:5432/dsa-mgmt",
    )

    # JWT Authentication & RBAC (matches dsa-mgmt-be)
    JWT_SECRET_KEY: str = os.getenv(
        "JWT_SECRET_KEY",
        "dsa-loan-mgmt-jwt-secret-key-2026-secure-auth",
    )
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

    # File Storage Directories
    STORAGE_BASE_DIR: str = os.getenv("STORAGE_BASE_DIR", "dsa-file-storage")
    STORAGE_BANK_DOCS_DIR: str = os.getenv("STORAGE_BANK_DOCS_DIR", "bank-documents")
    STORAGE_DIR: Path = Path(os.getenv("FILE_STORAGE_DIR", str(BE_DIR / STORAGE_BASE_DIR)))

    # RAG Vector Search Configuration
    RAG_EMBEDDING_MODEL: str = os.getenv("RAG_EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    RAG_CHUNK_SIZE: int = int(os.getenv("RAG_CHUNK_SIZE", "1000"))
    RAG_CHUNK_OVERLAP: int = int(os.getenv("RAG_CHUNK_OVERLAP", "150"))
    RAG_DEFAULT_TOP_K: int = int(os.getenv("RAG_DEFAULT_TOP_K", "4"))
    RAG_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.35"))


mcp_config = MCPConfig()
