# Python Best Practices

## 1. Project structure

Prefer a feature/layer-oriented structure rather than one large file.

```text
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── security.py
│   │   └── logging.py
│   ├── api/
│   │   ├── dependencies.py
│   │   └── routes/
│   ├── schemas/
│   ├── models/
│   ├── services/
│   ├── repositories/
│   ├── domain/
│   ├── utils/
│   └── integrations/
├── tests/
├── alembic/
├── .env
└── pyproject.toml
```

For larger features, group related code by feature while keeping clear boundaries.

## 2. Type hints

Use type hints consistently.

```python
def calculate_emi(
    principal: Decimal,
    annual_rate: Decimal,
    months: int,
) -> Decimal:
    ...
```

Prefer explicit types over `Any`.

Use Pydantic models for request/response validation.

## 3. Pydantic

Use Pydantic/FastAPI schemas at API boundaries.

```python
class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    mobile: str
```

Do not use database models directly as API contracts.

## 4. Business logic

Keep business rules outside route handlers.

Bad:

```python
@router.post("/eligibility")
def check(...):
    # 100 lines of rules
```

Better:

```text
Route
  ↓
Service
  ↓
Eligibility domain logic
  ↓
Repository / external services
```

Eligibility, EMI, FOIR and matching calculations should be deterministic Python code.

## 5. Database access

Use SQLAlchemy for persistence.

Prefer:

```text
API → Service → Repository → SQLAlchemy → PostgreSQL
```

Do not spread SQLAlchemy queries throughout route handlers.

Use Alembic for schema migrations.

## 6. Error handling

- Raise meaningful application/domain exceptions.
- Convert them to appropriate HTTP responses at the API boundary.
- Do not expose stack traces or database internals to clients.
- Do not use broad `except Exception` unless logging and re-raising is intentional.

## 7. Configuration

Use environment variables and a typed settings object.

Never hardcode:

- Database passwords
- API keys
- JWT secrets
- LLM keys

Keep `.env` out of Git.

## 8. Async

Use async only where it provides value.

FastAPI endpoints calling async I/O should use async appropriately. Do not make CPU-heavy calculations async just for the sake of it.

## 9. Files and data

For file processing:

```text
Upload
  ↓
Validate
  ↓
Process
  ↓
Store
  ↓
Persist metadata
```

Never trust file names, paths, MIME types, or user-provided metadata.

## 10. HTTP/API integrations

External API calls belong in integration/client modules.

```text
service
  ↓
BankClient
  ↓
HTTP API
```

Use timeouts, retries where appropriate, structured errors, and logging.

## 11. Logging

Use Python's logging facilities.

Log:

- request correlation information
- important business events
- external integration failures
- unexpected exceptions

Never log passwords, tokens, OTPs, or sensitive customer information unnecessarily.

## 12. Testing

Prefer:

- Unit tests for business/domain logic
- API/integration tests for FastAPI
- Repository/database tests where useful

Most financial calculations and eligibility rules should have focused unit tests.

## 13. Python style

- Follow PEP 8.
- Use descriptive names.
- Keep functions small.
- Avoid unnecessary global state.
- Prefer composition over deep inheritance.
- Use `pathlib` for filesystem paths.
- Use `Decimal` for financial calculations rather than floating-point arithmetic.
- Use dataclasses/Pydantic models where appropriate.
