from urllib.parse import urlparse, urlunparse
from sqlalchemy import create_engine, text
from app.core.config import settings


def ensure_database_exists(database_url: str = settings.DATABASE_URL):
    """
    Checks if the target database exists in PostgreSQL.
    If it does not exist, connects to the administrative 'postgres' database
    and automatically executes CREATE DATABASE "<target_db>".
    """
    parsed = urlparse(database_url)
    target_db = parsed.path.lstrip('/')

    if not target_db:
        return

    admin_url = urlunparse(parsed._replace(path='/postgres'))
    admin_engine = create_engine(admin_url, isolation_level="AUTOCOMMIT")

    try:
        with admin_engine.connect() as conn:
            res = conn.execute(
                text("SELECT 1 FROM pg_database WHERE datname = :dbname"),
                {"dbname": target_db}
            )
            exists = res.scalar() is not None

            if not exists:
                print(f"[DB Setup] Database '{target_db}' does not exist. Creating database '{target_db}'...")
                conn.execute(text(f'CREATE DATABASE "{target_db}";'))
                print(f"[DB Setup] Database '{target_db}' created successfully.")
            else:
                print(f"[DB Setup] Database '{target_db}' exists.")
    except Exception as e:
        print(f"[DB Setup Note] Could not verify database creation via admin connection: {e}")
    finally:
        admin_engine.dispose()
