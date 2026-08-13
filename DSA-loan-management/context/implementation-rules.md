# Implementation Rules

## Backend

1. Keep FastAPI routers thin.
2. Business rules belong in services/domain modules.
3. Database access goes through SQLAlchemy/repositories.
4. Use Pydantic schemas at API boundaries.
5. Use Alembic for migrations.
6. Use Decimal for financial calculations.
7. Keep authentication and authorization separate from business logic.
8. Never expose secrets.
9. Add tests for eligibility, EMI, FOIR and other financial rules.
10. Keep future AI integrations behind separate interfaces.

## Frontend

1. TypeScript is mandatory.
2. Keep API calls in services.
3. Use hooks to connect UI with services/server state.
4. Keep pages focused on composition.
5. Use container/presentation separation where complexity justifies it.
6. Keep reusable components in shared/common folders.
7. Keep constants and helpers outside components.
8. Use i18n for all user-facing text.
9. Separate public/protected routes and enforce roles.
10. Do not put sensitive business authorization only in React.

## AI phase

When AI is introduced:

```text
React
  ↓
FastAPI
  ↓
AI orchestration
  ├── RAG
  ├── MCP
  ├── LLM
  └── deterministic business functions
```

The existing non-AI application must remain the source of truth for customer, loan, bank and application data.
