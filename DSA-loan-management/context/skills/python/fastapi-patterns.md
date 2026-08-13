# Python + FastAPI Patterns

## Request flow

```text
Router
  ↓
Schema validation
  ↓
Service
  ↓
Domain/business logic
  ↓
Repository / Integration
  ↓
Response schema
```

## Rules

- Routers should stay thin.
- Services coordinate use cases.
- Domain functions contain deterministic business rules.
- Repositories handle persistence.
- Integration clients handle external APIs.
- Pydantic schemas define API contracts.
- Dependency injection should be used for DB sessions, authenticated users, and shared services.

## Example feature

```text
customers/
├── router.py
├── schemas.py
├── service.py
├── repository.py
├── models.py
└── tests/
```

Avoid a single `customer.py` containing routes, models, queries and business logic.
