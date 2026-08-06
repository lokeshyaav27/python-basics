"""Environment variables - keeping secrets and config out of your code.

Optional but recommended:
    pip install python-dotenv

Rules:
  1. Never hard-code API keys, passwords or connection strings.
  2. Keep real values in a .env file that is listed in .gitignore.
  3. Commit a .env.example with the KEY NAMES and dummy values only.
"""

import os
from pathlib import Path

HERE = Path(__file__).parent

# --- Reading variables that already exist in your shell ---
print("--- from the OS environment ---")
print("  PATH set     :", "PATH" in os.environ)
print("  USERNAME     :", os.environ.get("USERNAME", "(not set)"))
print("  total vars   :", len(os.environ))

# --- os.environ[...] raises if missing; os.getenv() returns a default ---
try:
    os.environ["DEFINITELY_NOT_SET"]
except KeyError as err:
    print("\n  os.environ[missing] raises KeyError:", err)

print("  os.getenv(missing)          :", os.getenv("DEFINITELY_NOT_SET"))
print("  os.getenv(missing, default) :", os.getenv("DEFINITELY_NOT_SET", "fallback"))

# --- Setting a variable for this process only ---
os.environ["APP_ENV"] = "development"
print("\n  set APP_ENV  :", os.getenv("APP_ENV"))
print("  (this lasts only while this program runs)")

# --- Everything comes back as a STRING. Convert deliberately. ---
os.environ["PORT"] = "8080"
os.environ["DEBUG"] = "true"
os.environ["TIMEOUT"] = "2.5"

port = int(os.getenv("PORT", "8000"))
timeout = float(os.getenv("TIMEOUT", "10"))
# bool("false") is True! Compare against known-true strings instead.
debug = os.getenv("DEBUG", "false").strip().lower() in {"1", "true", "yes", "on"}

print("\n--- typed config ---")
print(f"  port    : {port} ({type(port).__name__})")
print(f"  timeout : {timeout} ({type(timeout).__name__})")
print(f"  debug   : {debug} ({type(debug).__name__})")
print("  the trap: bool('false') ==", bool("false"), "- never cast bools this way")

# --- Create a .env.example (safe to commit) and a .env (never commit) ---
EXAMPLE = HERE / ".env.example"
EXAMPLE.write_text(
    "# Copy to .env and fill in real values. Never commit .env.\n"
    "APP_ENV=development\n"
    "API_KEY=your-key-here\n"
    "API_BASE_URL=https://api.example.com\n"
    "DATABASE_URL=postgresql://user:pass@localhost:5432/mydb\n"
    "PORT=8000\n"
    "DEBUG=true\n",
    encoding="utf-8",
)
print(f"\nwrote {EXAMPLE.name} - commit this one")

DOTENV = HERE / ".env"
if not DOTENV.exists():
    DOTENV.write_text(
        "APP_ENV=local\n"
        "API_KEY=sk-demo-1234567890\n"
        "API_BASE_URL=https://httpbin.org\n"
        "PORT=9000\n"
        "DEBUG=false\n",
        encoding="utf-8",
    )
    print(f"wrote {DOTENV.name} - already ignored by the project .gitignore")

# --- Loading a .env file with python-dotenv ---
print("\n--- loading .env ---")
try:
    from dotenv import load_dotenv

    load_dotenv(DOTENV, override=True)
    print("  loaded with python-dotenv")
except ImportError:
    # Minimal fallback parser so this example runs without the library.
    for line in DOTENV.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, value = line.partition("=")
            os.environ[key.strip()] = value.strip()
    print("  python-dotenv not installed; used a minimal fallback parser")
    print("  install the real thing with:  pip install python-dotenv")

print("  APP_ENV      :", os.getenv("APP_ENV"))
print("  API_BASE_URL :", os.getenv("API_BASE_URL"))
print("  PORT         :", os.getenv("PORT"))


# --- Fail fast on missing required config ---
def require(name):
    """Read a required variable, or stop with a clear message."""
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


print("\n--- required config ---")
print("  API_KEY loaded:", require("API_KEY")[:7] + "...")   # never log the whole key
try:
    require("STRIPE_SECRET")
except RuntimeError as err:
    print("  ", err)


# --- A config object gathered in one place, validated once at startup ---
from dataclasses import dataclass


@dataclass(frozen=True)
class Config:
    app_env: str
    api_key: str
    api_base_url: str
    port: int
    debug: bool

    @classmethod
    def from_env(cls):
        return cls(
            app_env=os.getenv("APP_ENV", "development"),
            api_key=require("API_KEY"),
            api_base_url=require("API_BASE_URL"),
            port=int(os.getenv("PORT", "8000")),
            debug=os.getenv("DEBUG", "false").lower() in {"1", "true", "yes"},
        )

    def __repr__(self):
        # Redact the secret so it never lands in logs or tracebacks.
        return (f"Config(app_env={self.app_env!r}, api_key='***', "
                f"api_base_url={self.api_base_url!r}, port={self.port}, "
                f"debug={self.debug})")


config = Config.from_env()
print("\n--- config object ---")
print(" ", config)
print("  frozen dataclass - immutable after startup")
try:
    config.port = 1
except AttributeError as err:
    print("  ", err)
