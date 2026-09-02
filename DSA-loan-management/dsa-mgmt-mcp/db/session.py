import logging
from contextlib import contextmanager
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from core.config import mcp_config

logger = logging.getLogger("mcp_db")

engine = create_engine(mcp_config.DATABASE_URL, future=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


@contextmanager
def get_db_session() -> Generator[Session, None, None]:
    """
    Context manager providing a managed database session for MCP tool and resource handlers.
    Automatically closes the session upon exit.
    """
    db = SessionLocal()
    logger.debug("🗄️ [DB Session] Opened new PostgreSQL session.")
    try:
        yield db
    except Exception as e:
        logger.error(f"🗄️ [DB Session] Database error during transaction: {e}", exc_info=True)
        raise
    finally:
        db.close()
        logger.debug("🗄️ [DB Session] Closed PostgreSQL session.")
