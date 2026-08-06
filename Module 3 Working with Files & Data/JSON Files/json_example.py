"""Reading and writing JSON - the format almost every API speaks."""

import json
from pathlib import Path

HERE = Path(__file__).parent
JSON_PATH = HERE / "config.json"

data = {
    "app": "python-basics",
    "version": 1.2,
    "debug": False,
    "owner": None,
    "modules": ["fundamentals", "files", "apis"],
    "limits": {"timeout": 30, "retries": 3},
}

# --- Python -> JSON string (dumps = "dump to string") ---
compact = json.dumps(data)
pretty = json.dumps(data, indent=2, sort_keys=True)
print("--- compact ---")
print(compact)
print("\n--- pretty (indent=2) ---")
print(pretty)

# --- Write to a file (dump, no "s") ---
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2)
print(f"\nwrote {JSON_PATH.name} ({JSON_PATH.stat().st_size} bytes)")

# --- Read from a file (load) ---
with open(JSON_PATH, encoding="utf-8") as f:
    loaded = json.load(f)
print("\nloaded app :", loaded["app"])
print("timeout    :", loaded["limits"]["timeout"])
print("round-trips equal:", loaded == data)

# --- JSON string -> Python (loads) ---
raw = '{"name": "Lokesh", "age": 40, "skills": ["Python", "SQL"]}'
person = json.loads(raw)
print("\nparsed:", person, "->", type(person).__name__)

# --- Type mapping between the two worlds ---
print("\nPython -> JSON:")
for value in ({"a": 1}, [1, 2], ("t", "u"), "text", 42, 3.14, True, None):
    print(f"  {type(value).__name__:<5} {str(value):<10} -> {json.dumps(value)}")
print("  note: a tuple becomes a JSON array, and comes back as a list")

# --- Handling malformed JSON ---
for bad in ('{"unclosed": ', "{'single': 'quotes'}", ""):
    try:
        json.loads(bad)
    except json.JSONDecodeError as err:
        print(f"\nJSONDecodeError on {bad!r}: {err.msg} (char {err.pos})")

# --- Types JSON does not know about need a custom encoder ---
from datetime import date, datetime


def encode_extras(obj):
    """Called by json.dump for anything it cannot serialise itself."""
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, set):
        return sorted(obj)
    raise TypeError(f"{type(obj).__name__} is not JSON serialisable")


record = {"created": date(2026, 8, 6), "tags": {"python", "json"}}
print("\nwith default=:", json.dumps(record, default=encode_extras))

try:
    json.dumps({"fn": print})
except TypeError as err:
    print("no encoder   :", err)

# --- Non-ASCII text ---
unicode_data = {"city": "Ahmedabad", "greeting": "नमस्ते"}
print("\nescaped :", json.dumps(unicode_data))
print("readable:", json.dumps(unicode_data, ensure_ascii=False))

# --- Working with a list of records, like an API response ---
API_PATH = HERE / "users.json"
users = [
    {"id": 1, "name": "Lokesh", "active": True, "score": 92},
    {"id": 2, "name": "Priya", "active": False, "score": 78},
    {"id": 3, "name": "Amit", "active": True, "score": 85},
]
API_PATH.write_text(json.dumps(users, indent=2), encoding="utf-8")

records = json.loads(API_PATH.read_text(encoding="utf-8"))
active = [u["name"] for u in records if u["active"]]
print("\nactive users :", active)
print("average score:", sum(u["score"] for u in records) / len(records))
print("top scorer   :", max(records, key=lambda u: u["score"])["name"])

# --- JSON Lines: one JSON object per line, great for logs/streaming ---
JSONL_PATH = HERE / "events.jsonl"
with open(JSONL_PATH, "w", encoding="utf-8") as f:
    for user in users:
        f.write(json.dumps(user) + "\n")

with open(JSONL_PATH, encoding="utf-8") as f:
    streamed = [json.loads(line) for line in f if line.strip()]
print("\njsonl records read:", len(streamed))
