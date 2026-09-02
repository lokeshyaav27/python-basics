import logging
import sys
from fastapi import FastAPI, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html
from app.api import routers as api_routers
from app.db.session import engine
from dsa_common.models import Base
from app.core.config import settings
from app.core.response import error_response
from fastapi.staticfiles import StaticFiles
from pathlib import Path

# Configure application logging to ensure INFO logs from all agents & subagents are visible in console
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
    force=True,
)

for _logger_name in [
    "orchestrator_agent",
    "ai_subagent",
    "loan_matching_agent",
    "document_intelligence_agent",
    "application_operations_agent",
    "ai_tool_parser",
    "ai_chat_service",
    "ai_client",
]:
    logging.getLogger(_logger_name).setLevel(logging.INFO)

# Disable Swagger, ReDoc, and OpenAPI schema in production environments
is_production = settings.ENVIRONMENT.lower() in ("production", "prod")

app = FastAPI(
    title="DSA Loan Management API",
    description="Backend APIs for DSA Loan Aggregator & MCP AI Underwriting",
    version="1.0.0",
    docs_url="/swagger" if not is_production else None,
    redoc_url="/redoc" if not is_production else None,
    openapi_url="/openapi.json" if not is_production else None,
)


# Global Exception Handlers for Unified Response Structure
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(
        message=str(exc.detail),
        status_code=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    first_error_msg = errors[0].get("msg", "Validation Error") if errors else "Validation Error"
    return error_response(
        message=f"Validation error: {first_error_msg}",
        status_code=422,
        result=errors,
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return error_response(
        message=str(exc) or "Internal Server Error",
        status_code=500,
    )


# Also serve Swagger UI directly at /docs for convenience in non-production environments
if not is_production:
    @app.get("/docs", include_in_schema=False)
    async def custom_docs_ui():
        return get_swagger_ui_html(
            openapi_url=app.openapi_url,
            title=f"{app.title} - Swagger UI",
            oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
            swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js",
            swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css",
        )

# Mount static file storage directories
project_root = Path(__file__).resolve().parents[1]
storage_base = project_root / settings.STORAGE_BASE_DIR

for subfolder, endpoint in [
    (settings.STORAGE_PRODUCT_IMAGES_DIR, f'/static/{settings.STORAGE_PRODUCT_IMAGES_DIR}'),
    (settings.STORAGE_BANK_LOGOS_DIR, f'/static/{settings.STORAGE_BANK_LOGOS_DIR}'),
    (settings.STORAGE_AGENT_PHOTOS_DIR, f'/static/{settings.STORAGE_AGENT_PHOTOS_DIR}'),
    (settings.STORAGE_BANK_DOCS_DIR, f'/static/{settings.STORAGE_BANK_DOCS_DIR}'),
]:
    target_dir = storage_base / subfolder
    target_dir.mkdir(parents=True, exist_ok=True)
    app.mount(endpoint, StaticFiles(directory=str(target_dir)), name=subfolder)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(api_routers.products.router, prefix="/api/products", tags=["products"])
app.include_router(api_routers.banks.router, prefix="/api/banks", tags=["banks"])
app.include_router(api_routers.agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(api_routers.auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(api_routers.loan_applications.router, prefix="/api/loan-applications", tags=["loan-applications"])
app.include_router(api_routers.contact.router, prefix="/api/contact", tags=["contact"])
app.include_router(api_routers.eligibility.router, prefix="/api/eligibility", tags=["eligibility"])
app.include_router(api_routers.comparison.router, prefix="/api/comparison", tags=["comparison"])
app.include_router(api_routers.chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(api_routers.ai_issues.router, prefix="/api/ai-issues", tags=["ai-issues"])


@app.on_event("startup")
def on_startup():
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    # Ensure tables are registered and created
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "ok", "service": "dsa-loan-mgmt-be"}
