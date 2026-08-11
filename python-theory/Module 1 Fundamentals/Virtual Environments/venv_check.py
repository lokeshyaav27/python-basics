"""Show whether you are running inside a virtual environment.

Create and activate a venv (PowerShell):
    python -m venv .venv
    .\\.venv\\Scripts\\Activate.ps1

Install and freeze dependencies:
    pip install requests
    pip freeze | Out-File -Encoding utf8 requirements.txt

Restore them elsewhere:
    pip install -r requirements.txt

Leave the venv:
    deactivate
"""

import sys
from pathlib import Path

# In a venv, sys.prefix points at the venv; base_prefix at the system Python.
in_venv = sys.prefix != sys.base_prefix

print("Interpreter   :", sys.executable)
print("sys.prefix    :", sys.prefix)
print("base_prefix   :", sys.base_prefix)
print("Inside venv?  :", in_venv)

if in_venv:
    print("Venv name     :", Path(sys.prefix).name)
else:
    print("\nYou are using the global Python. Activate a venv to isolate packages.")

# Which third-party packages are visible right now?
try:
    import requests

    print("\nrequests version:", requests.__version__)
except ImportError:
    print("\n`requests` is not installed here. Try: pip install requests")
