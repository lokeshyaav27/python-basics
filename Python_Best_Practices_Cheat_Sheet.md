# Python Best Practices Cheat Sheet

> A practical checklist based on our Python training, focused on writing
> production-quality Python for backend and AI applications.

------------------------------------------------------------------------

# Project Structure

``` text
my_project/
│
├── .venv/
├── .gitignore
├── .env
├── requirements.txt          # or pyproject.toml (modern)
├── config.py
├── main.py
├── services/
├── models/
├── routes/
├── utils/
└── tests/
```

## Guidelines

-   Keep one responsibility per module.
-   Prefer **absolute imports** over relative imports.
-   Group related utilities (`file_utils.py`, `string_utils.py`) instead
    of one huge `utils.py`.
-   Keep business logic in `services`, not routes/controllers.

------------------------------------------------------------------------

# File Handling

## ✅ Prefer

``` python
with open("data.json") as f:
    data = f.read()
```

Instead of manually calling `close()`.

Use `pathlib.Path` instead of `os.path` where possible.

------------------------------------------------------------------------

# JSON

## Reading

``` python
data = json.load(file)
```

## Writing

``` python
json.dump(data, file, indent=4)
```

Always use `indent=4` for human-readable JSON.

Use:

-   `load()` → file
-   `loads()` → string
-   `dump()` → file
-   `dumps()` → string

------------------------------------------------------------------------

# CSV

Prefer:

``` python
csv.DictReader()
csv.DictWriter()
```

instead of numeric indexes.

------------------------------------------------------------------------

# Path Handling

Prefer:

``` python
from pathlib import Path

path = Path("data") / "users.json"
```

instead of string concatenation.

Useful methods:

-   `exists()`
-   `glob()`
-   `rglob()`
-   `is_file()`
-   `is_dir()`

------------------------------------------------------------------------

# API Calls

Always specify a timeout.

``` python
response = requests.get(url, timeout=10)
```

Always check HTTP errors.

``` python
response.raise_for_status()
```

Wrap API calls in:

``` python
try:
    ...
except requests.RequestException:
    ...
```

------------------------------------------------------------------------

# Response Validation

Validate content type before parsing.

``` python
if "application/json" in response.headers.get("Content-Type", ""):
    data = response.json()
```

------------------------------------------------------------------------

# Safe Dictionary Access

Avoid

``` python
user["email"]
```

Prefer

``` python
user.get("email")
```

Nested:

``` python
city = (
    user.get("address", {})
        .get("city")
)
```

Use `[]` only when the key is guaranteed to exist.

------------------------------------------------------------------------

# Data Validation

Validate external data.

``` python
age = data.get("age")

if isinstance(age, int):
    ...
```

Never trust API responses blindly.

------------------------------------------------------------------------

# Environment Variables

Never hardcode secrets.

❌

``` python
API_KEY = "secret"
```

✅

``` python
api_key = os.getenv("OPENAI_API_KEY")
```

Centralize configuration.

``` python
# config.py
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PORT = int(os.getenv("PORT", "8000"))
```

Add to `.gitignore`

``` text
.env
.venv/
__pycache__/
*.pyc
```

------------------------------------------------------------------------

# Type Hints

Always add type hints.

``` python
def square(number: int) -> int:
    return number * number
```

Prefer

``` python
list[str]
dict[str, int]
str | None
```

Avoid `Any` unless necessary.

------------------------------------------------------------------------

# Functions

Keep functions:

-   Small
-   Focused
-   Single responsibility

Good

``` python
def calculate_total(...):
```

Bad

``` python
def process_everything(...):
```

------------------------------------------------------------------------

# Async

Use async only for I/O-bound work.

Good candidates:

-   APIs
-   Database
-   Files
-   Email
-   Cloud Storage

Do **not** use async for CPU-intensive calculations.

Never use:

``` python
time.sleep()
```

inside async code.

Use:

``` python
await asyncio.sleep()
```

------------------------------------------------------------------------

# Concurrency

Run independent async tasks together.

``` python
await asyncio.gather(
    task1(),
    task2()
)
```

Limit concurrency for large workloads.

``` python
asyncio.Semaphore(5)
```

Always use timeouts for external services.

------------------------------------------------------------------------

# CLI

Prefer `argparse` over `sys.argv`.

Benefits:

-   Validation
-   Help messages
-   Default values
-   Type conversion

------------------------------------------------------------------------

# Error Handling

Catch specific exceptions.

Good

``` python
except FileNotFoundError:
```

Avoid

``` python
except:
```

Use `raise_for_status()` for HTTP calls.

------------------------------------------------------------------------

# General Python Tips

-   Prefer `pathlib` over `os.path`
-   Prefer `DictReader` over `csv.reader`
-   Prefer `with` statements for files
-   Prefer `json.dump(..., indent=4)`
-   Prefer `.get()` for optional dictionary keys
-   Prefer absolute imports
-   Use `config.py` for configuration
-   Use environment variables for secrets
-   Use type hints everywhere
-   Validate API responses
-   Validate external data types
-   Always specify request timeouts
-   Keep modules and functions focused
-   Write production-quality exception handling

------------------------------------------------------------------------

# AI Project Checklist

-   ✅ Virtual environment
-   ✅ `.env`
-   ✅ `.gitignore`
-   ✅ `config.py`
-   ✅ Type hints
-   ✅ Timeout on HTTP requests
-   ✅ `raise_for_status()`
-   ✅ Content-Type validation
-   ✅ Safe `.get()` access
-   ✅ `json.dump(indent=4)`
-   ✅ `pathlib`
-   ✅ Absolute imports
-   ✅ Structured project layout
-   ✅ Async for I/O
-   ✅ Semaphore for concurrency
-   ✅ Logging (instead of excessive print statements)
-   ✅ Unit tests for business logic
