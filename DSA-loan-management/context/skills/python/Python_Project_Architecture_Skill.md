# Python Project Architecture & Coding Skill

## Purpose

Use this skill whenever creating, modifying, reviewing, or refactoring a Python project.

The goal is to produce clean, maintainable, testable, secure, production-oriented Python code suitable for backend and AI applications.

Priorities:

1. Correctness
2. Readability
3. Maintainability
4. Testability
5. Security
6. Reliability
7. Performance
8. Simplicity

Do not introduce unnecessary frameworks or abstractions.

---

# 1. Default Project Architecture

For a medium-sized Python backend or AI application, prefer:

```text
project/
├── .venv/
├── .env
├── .env.example
├── .gitignore
├── README.md
├── requirements.txt
├── pyproject.toml              # use when the project adopts modern packaging
│
├── app/
│   ├── __init__.py
│   ├── main.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── settings.py
│   │
│   ├── routes/
│   │   ├── __init__.py
│   │   └── health.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── example_service.py
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   └── example.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── example.py
│   │
│   ├── clients/
│   │   ├── __init__.py
│   │   └── external_api.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   └── example_repository.py
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   └── helpers.py
│   │
│   └── prompts/                 # AI projects only
│       ├── system/
│       └── templates/
│
└── tests/
    ├── unit/
    └── integration/
```

For a small script, do not create this entire structure unnecessarily.

---

# 2. Layer Responsibilities

## `routes/`

Responsible for:

- HTTP request handling
- Request parameter extraction
- Authentication/authorization integration
- Calling services
- Returning responses

Routes should NOT contain substantial business logic.

---

## `services/`

Contains business/application logic.

Examples:

```text
user_service.py
order_service.py
llm_service.py
rag_service.py
agent_service.py
```

Services coordinate business rules, repositories, external clients, and workflows.

---

## `clients/`

Use for communication with external systems.

Examples:

```text
openai_client.py
github_client.py
weather_client.py
payment_client.py
```

A client should encapsulate API URL, authentication, headers, timeout, retry behavior, response parsing, and provider-specific details.

---

## `repositories/`

Use for persistence/data access.

Examples:

```text
user_repository.py
document_repository.py
conversation_repository.py
```

Repositories isolate database/storage implementation from business logic.

---

## `models/` and `schemas/`

Use models for domain/database representation and schemas for request/response validation and structured data. With FastAPI/Pydantic, keep API schemas separate from database models when useful.

---

## `utils/`

Only put genuinely reusable, focused helpers here.

Prefer:

```text
utils/
├── date_utils.py
├── file_utils.py
└── string_utils.py
```

Avoid one huge `utils.py` containing unrelated functions.

---

# 3. Configuration

Centralize configuration.

Prefer:

```text
.env
.env.example
app/config/settings.py
```

Never hardcode secrets.

Bad:

```python
OPENAI_API_KEY = "sk-..."
```

For modern applications, prefer a typed settings object when appropriate:

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    openai_api_key: str
    app_env: str = "development"
    log_level: str = "INFO"
```

Use `.env.example` to document required configuration without exposing secrets.

---

# 4. Environment Variables

`.env`:

```text
OPENAI_API_KEY=...
DATABASE_URL=...
APP_ENV=development
```

`.gitignore`:

```text
.env
.venv/
__pycache__/
*.pyc
```

Never commit API keys, passwords, private tokens, or production secrets.

---

# 5. Imports

Prefer clear absolute imports:

```python
from app.services.llm_service import LLMService
```

Avoid deep relative imports unless there is a strong reason.

Avoid circular dependencies by improving module boundaries rather than hiding imports.

---

# 6. Type Hints

Use type hints for public functions, methods, and important variables.

```python
def calculate_total(prices: list[float]) -> float:
    return sum(prices)
```

Prefer modern syntax:

```python
str | None
list[str]
dict[str, int]
```

Avoid `Any` unless there is a real reason.

Type hints do not provide complete runtime validation by themselves. Use Pydantic or explicit validation for external/untrusted data.

---

# 7. Functions

Functions should:

- Do one clear thing
- Have descriptive names
- Have type hints
- Avoid excessive parameters
- Avoid hidden global state
- Be easy to test

Prefer several focused functions over one `process_everything()` function.

---

# 8. Error Handling

Catch specific exceptions.

```python
try:
    ...
except FileNotFoundError:
    ...
except ValueError:
    ...
```

Avoid:

```python
try:
    ...
except:
    pass
```

When re-raising, preserve the original exception when useful:

```python
raise ServiceError("Unable to process document") from exc
```

---

# 9. HTTP/API Best Practices

Always set a timeout:

```python
response = requests.get(url, timeout=10)
response.raise_for_status()
```

Consider timeout, retry, rate limits, authentication, response validation, logging, and error handling.

Do not assume external APIs always return valid data.

---

# 10. API Response Validation

Check HTTP status:

```python
response.raise_for_status()
```

When JSON is expected:

```python
content_type = response.headers.get("Content-Type", "")

if "application/json" not in content_type:
    raise ValueError("Expected JSON response")

data = response.json()
```

Validate data types:

```python
if not isinstance(data, dict):
    raise ValueError("Expected object response")
```

---

# 11. Dictionary Access

Use `[]` when the key is guaranteed to exist:

```python
user["id"]
```

Use `.get()` when the key may be absent:

```python
email = user.get("email")
```

For nested optional data:

```python
city = user.get("address", {}).get("city")
```

Do not blindly chain `[]` through untrusted API responses.

---

# 12. File Handling

Always use context managers:

```python
with open(path, encoding="utf-8") as file:
    content = file.read()
```

Prefer `pathlib`:

```python
from pathlib import Path

path = Path("data") / "users.json"
```

Avoid manually concatenating paths.

---

# 13. JSON

Use:

```python
json.load(file)
json.loads(text)
json.dump(data, file, indent=4)
json.dumps(data, indent=4)
```

Remember:

- `load` → file to Python object
- `loads` → string to Python object
- `dump` → Python object to file
- `dumps` → Python object to string

---

# 14. CSV

Prefer `csv.DictReader` and `csv.DictWriter` when columns have names.

---

# 15. Async Programming

Use async primarily for I/O-bound work such as HTTP APIs, databases, network operations, cloud storage, and concurrent tool calls.

Do not use async merely because code is "modern".

Do not use `time.sleep()` inside async workflows. Use:

```python
await asyncio.sleep(5)
```

---

# 16. Concurrent Execution

Use:

```python
results = await asyncio.gather(
    task_one(),
    task_two(),
)
```

for independent concurrent work.

Use `asyncio.create_task()` when explicit task lifecycle/control is required.

Use a semaphore when concurrency must be limited:

```python
semaphore = asyncio.Semaphore(5)
```

Always consider API rate limits, memory usage, connection limits, cancellation, and timeouts.

---

# 17. CLI Applications

Prefer `argparse` over manually parsing `sys.argv` for real CLI applications.

Use positional arguments, optional flags, choices, defaults, type conversion, and automatic help.

Keep CLI parsing separate from business logic.

---

# 18. Logging

Prefer `logging` over excessive `print()` statements.

Use appropriate levels: DEBUG, INFO, WARNING, ERROR, CRITICAL.

Never log API keys, passwords, tokens, or sensitive user data.

---

# 19. Testing

Recommended structure:

```text
tests/
├── unit/
└── integration/
```

Prioritize tests for business rules, data transformation, error handling, external API adapters, and critical workflows.

---

# 20. Dependency Management

Traditional/simple projects can use:

```text
requirements.txt
```

Modern projects can use:

```text
pyproject.toml
```

with a suitable dependency manager.

Do not add dependencies without a reason. Prefer the standard library or an existing dependency when appropriate.

---

# 21. AI Project Architecture

For AI applications, prefer:

```text
app/
├── config/
├── routes/
├── services/
│   ├── llm_service.py
│   ├── rag_service.py
│   └── agent_service.py
├── clients/
│   ├── llm_client.py
│   ├── vector_db_client.py
│   └── external_api_client.py
├── schemas/
├── models/
├── repositories/
├── tools/
├── prompts/
│   ├── system/
│   └── templates/
└── utils/
```

Keep provider-specific code isolated.

```text
services/llm_service.py
        ↓
clients/openai_client.py
```

The service should not contain every provider SDK detail.

---

# 22. LLM Client Design

Create a reusable client abstraction responsible for model configuration, authentication, request construction, timeout, retry, error handling, usage extraction, and logging.

Do not spread provider SDK calls throughout the application.

Prefer:

```text
routes
  ↓
services
  ↓
LLM client
  ↓
Provider SDK
```

---

# 23. Prompt Management

Do not bury large prompts inside Python functions.

Prefer:

```text
prompts/
├── system/
│   ├── assistant.md
│   └── researcher.md
└── templates/
    ├── summarize.md
    └── classify.md
```

Keep prompts versionable and reviewable.

---

# 24. Structured Outputs

When an AI response has a known structure, prefer schema-based validation.

```python
class UserSummary(BaseModel):
    name: str
    summary: str
    confidence: float
```

Do not rely only on `json.loads(raw_text)` when strict application-level validation is required.

---

# 25. Tool Calling

Tools should have a clear name, description, explicit input schema, narrow responsibility, validation, authorization, and error handling.

Bad:

```text
do_everything()
```

Better:

```text
get_customer()
search_orders()
create_ticket()
```

Never allow an LLM to perform privileged actions without application-level authorization.

---

# 26. RAG Architecture

Prefer separation:

```text
Document ingestion
        ↓
Parsing
        ↓
Chunking
        ↓
Embedding
        ↓
Vector storage
        ↓
Retrieval
        ↓
Context construction
        ↓
LLM
        ↓
Answer + citations
```

Do not combine the entire RAG pipeline into one giant function.

---

# 27. Agent Architecture

For agentic systems, separate:

```text
Agent
 ↓
State
 ↓
Planner/Reasoning
 ↓
Tool Registry
 ↓
Tool Execution
 ↓
Observation
 ↓
Next Step
```

Always implement safety boundaries: maximum iterations, timeouts, cost/token budget, tool authorization, input validation, output validation, human approval for high-risk actions, and checkpoint/recovery where necessary.

---

# 28. Dynamic Code Execution

Treat LLM-generated code as untrusted.

Never assume this is safe:

```python
exec(llm_output)
```

Do not execute arbitrary model-generated code in the application process.

If code execution is genuinely required, use a properly isolated sandbox/container with strict CPU, memory, time, filesystem, network, and process restrictions.

---

# 29. Security

Always assume external input can be malicious.

Validate HTTP input, uploaded files, tool arguments, LLM-generated structured data, database parameters, URLs, and file paths.

Use parameterized database queries, allow-lists, authentication, authorization, least privilege, and secret management.

---

# 30. AI-Specific Reliability

For external LLM calls:

```text
Request
  ↓
Timeout
  ↓
Retry if appropriate
  ↓
Validate response
  ↓
Track usage/cost
  ↓
Log safe metadata
```

Consider rate limits, token/context limits, provider outages, invalid structured output, hallucinations, and prompt injection.

---

# 31. Performance

Do not optimize prematurely. Measure first.

Track response time, database time, external API time, token usage, memory, and concurrent requests.

Common AI optimizations include smaller prompts, context trimming, better retrieval, model routing, caching, concurrent independent calls, and batching.

---

# 32. AI Coding Agent Rules

When an AI coding assistant modifies this project:

1. Inspect the existing project structure before creating files.
2. Identify the correct architectural layer.
3. Reuse existing services/utilities.
4. Do not create duplicate helpers.
5. Do not introduce a framework without approval.
6. Do not change public APIs unnecessarily.
7. Never hardcode secrets.
8. Add/update tests for meaningful behavior changes.
9. Preserve existing naming conventions.
10. Keep functions focused.
11. Explain significant architectural changes.

Before coding, inspect related code and tests.

While coding, use type hints, validate external data, handle errors explicitly, add network timeouts, use `raise_for_status()` where applicable, use `.get()` for optional dictionary fields, prefer `pathlib`, and avoid unnecessary dependencies.

For AI features, isolate provider SDK code, keep prompts maintainable, validate structured outputs, treat model/tool data as untrusted, track cost/usage, add timeout/retry handling, enforce authorization outside the LLM, and add iteration/cost limits to agents.

After coding:

1. Run tests.
2. Run type checking when configured.
3. Run lint/format checks when configured.
4. Review the diff.
5. Check for duplicated logic.
6. Check security implications.
7. Summarize what changed and why.

---

# 33. Recommended Tooling

Typical backend/AI stack:

```text
Python
FastAPI
Pydantic
pytest
Ruff
mypy or pyright
OpenAI SDK
httpx
SQLAlchemy
PostgreSQL
Redis
```

For modern dependency management, consider:

```text
pyproject.toml
uv
```

Do not install all of these by default. Add only what the project needs.

---

# 34. Definition of Done

- [ ] Correct behavior
- [ ] Type hints
- [ ] Error handling
- [ ] Input validation
- [ ] Logging where appropriate
- [ ] Tests
- [ ] No secrets
- [ ] No unnecessary dependency
- [ ] Existing architecture respected
- [ ] No duplicate functionality
- [ ] Documentation updated when behavior/architecture changes

---

# 35. Golden Rules

1. Keep architecture simple.
2. Separate HTTP, business logic, persistence, and external integrations.
3. Prefer composition over unnecessary inheritance.
4. Validate external data.
5. Fail clearly instead of silently.
6. Use timeouts for network calls.
7. Never trust LLM output.
8. Never expose secrets.
9. Measure before optimizing.
10. Write code that another developer can understand six months later.

## Final Principle

The objective is not to write the most sophisticated Python code.

The objective is to write the **simplest correct code that fits the existing architecture and can safely evolve**.

For AI applications, add one additional rule:

> The LLM is a probabilistic component inside the system. It must never be treated as the application's source of truth, security boundary, or authorization mechanism.
