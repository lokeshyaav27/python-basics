# DSA Loan Platform — Development Context

## Project approach

Build the application in two phases:

1. Core non-AI application
2. RAG + MCP + LLM + AI Agent

Do not introduce AI concepts into normal business logic unless required by the second phase.

## Core stack

- Frontend: React + TypeScript
- Backend: Python + FastAPI
- Database: PostgreSQL + pgvector
- ORM: SQLAlchemy
- Migrations: Alembic
- No LangChain
- No LangGraph
- Local development initially

## Engineering principles

- Keep business rules deterministic and testable.
- Keep API, business/domain logic, database access, and external integrations separated.
- Prefer small, focused modules.
- Use strong typing.
- Validate data at application boundaries.
- Never put secrets in source code.
- Use environment variables for configuration.
- Prefer reusable components and services over duplicated code.
- Keep AI integrations behind clear interfaces so the core application remains usable without AI.
