# Implementation Rules

## Backend

1. Keep FastAPI routers thin and modular.
2. Business rules belong in services/domain modules.
3. Database access goes through SQLAlchemy models and sessions.
4. Use Pydantic schemas at API boundaries.
5. Use Decimal for monetary values and commission rates.
6. Enforce immutable status transitions: once a `loan_application` is `approved` or `rejected`, prevent further status modifications.
7. Support nullable `status` (`null` represents Pending Review).
8. Store policy/guideline documents in the normalized `bank_documents` table with foreign key to `product_bank_links(id)` and `ON DELETE CASCADE`.
9. Static file uploads must be saved to dedicated subdirectories under `dsa-file-storage/` (`product-images`, `bank-logo-images`, `agent-photos`, `bank-documents`).
10. Keep authentication and authorization separate from business logic.
11. Never expose secrets or hardcoded passwords in client-accessible responses.
12. Keep future AI/RAG integrations modular and behind separate service interfaces.

## Frontend

1. TypeScript is mandatory for all components, hooks, and services.
2. Keep API calls strictly in `src/services/`.
3. Use TanStack Query (`@tanstack/react-query`) for server state management, caching, and cache invalidation.
4. Keep pages focused on composition; extract complex dialogs/modals into dedicated components (e.g. `ApplicationDetailModal`, `LinkProductsModal`).
5. Application detail views must render all 11 general profile fields and all product-specific parameters (Home/Car/Personal).
6. Enable live editing only when `status == null` (Pending Review); disable/hide editing controls once decision is finalized.
7. Separate public/protected routes and enforce role boundaries (Admin, Agent, Customer).
8. Use responsive Tailwind CSS styling with polished animations and accessible UI feedback (`antd` message/notification utilities).

## AI Phase Architecture

When AI is introduced in Phase 2:

```text
React (Client UI)
  ↓
FastAPI (Backend Gateway)
  ↓
AI Orchestration Layer
  ├── RAG Engine (Embeddings over `bank_documents` via PostgreSQL + pgvector)
  ├── MCP Tool Registry (Direct querying of applications, products, and partner banks)
  ├── LLM (Comparison, Explanation, and Eligibility Scoring)
  └── Deterministic Business Validation Rules
```

The existing non-AI application and relational schema must remain the single source of truth for customer, loan, bank, and agent data.
