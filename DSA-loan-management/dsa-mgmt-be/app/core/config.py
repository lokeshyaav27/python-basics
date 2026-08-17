from pathlib import Path
from pydantic_settings import BaseSettings

ENV_FILE_PATH = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:admin@localhost:5432/dsa-mgmt"

    class Config:
        env_file = str(ENV_FILE_PATH) if ENV_FILE_PATH.exists() else ".env"


settings = Settings()
