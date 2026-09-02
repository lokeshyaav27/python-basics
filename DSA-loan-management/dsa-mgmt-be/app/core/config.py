from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field

ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    ENVIRONMENT: str = Field(default="development")  # 'development', 'staging', or 'production'
    DATABASE_URL: str = Field(default="postgresql://postgres:admin@localhost:5432/dsa-mgmt")

    # Storage Directories
    STORAGE_BASE_DIR: str = Field(default="dsa-file-storage")
    STORAGE_PRODUCT_IMAGES_DIR: str = Field(default="product-images")
    STORAGE_BANK_LOGOS_DIR: str = Field(default="bank-logo-images")
    STORAGE_AGENT_PHOTOS_DIR: str = Field(default="agent-photos")
    STORAGE_BANK_DOCS_DIR: str = Field(default="bank-documents")

    # AI Provider Switch & Configuration
    USE_OLLAMA: bool = Field(default=False)

    # Groq Configuration (Active when USE_OLLAMA=False)
    GROQ_API_KEY: str = Field(default="")
    GROQ_MODEL: str = Field(default="")
    GROQ_FALLBACK_MODEL: str = Field(default="")

    # Ollama Local Configuration (Active when USE_OLLAMA=True)
    OLLAMA_BASE_URL: str = Field(default="http://localhost:11434/v1")
    OLLAMA_MODEL: str = Field(default="")

    # RAG Vector Search Configuration
    RAG_EMBEDDING_MODEL: str = Field(default="all-MiniLM-L6-v2")
    RAG_CHUNK_SIZE: int = Field(default=1000)
    RAG_CHUNK_OVERLAP: int = Field(default=150)
    RAG_DEFAULT_TOP_K: int = Field(default=4)
    RAG_SIMILARITY_THRESHOLD: float = Field(default=0.35)

    # JWT Authentication
    JWT_SECRET_KEY: str = Field(default="dsa-loan-mgmt-jwt-secret-key-2026-secure-auth")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=60 * 24 * 7)  # 7 days

    # Model Context Protocol (MCP) Server Configuration
    MCP_SERVER_URL: str = Field(default="http://localhost:8001/sse")
    MCP_TRANSPORT: str = Field(default="direct")  # 'direct' for in-process or 'sse' for remote microservice


settings = Settings()
