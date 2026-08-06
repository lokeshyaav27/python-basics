"""API fundamentals - what an HTTP request actually is.

This uses only the standard library (`urllib`) so you can see the raw
mechanics before `requests` hides them.

It needs an internet connection. The public echo services below are free and
occasionally down, so the script probes them first and skips the live section
with a clear message if none respond.
"""

import json
import urllib.error
import urllib.parse
import urllib.request

# Two interchangeable echo services. httpbingo is a Go clone of httpbin and
# implements the same routes, so either works.
CANDIDATE_HOSTS = ["https://httpbin.org", "https://httpbingo.org"]

# --- Anatomy of a URL ---
url = "https://api.example.com/v1/users?role=admin&page=2#section"
parts = urllib.parse.urlparse(url)
print("--- URL anatomy ---")
print("  scheme  :", parts.scheme)     # https
print("  host    :", parts.netloc)     # api.example.com
print("  path    :", parts.path)       # /v1/users
print("  query   :", parts.query)      # role=admin&page=2
print("  fragment:", parts.fragment)   # section (never sent to the server)
print("  parsed query:", urllib.parse.parse_qs(parts.query))

# --- Building a query string safely (handles spaces and symbols) ---
query = urllib.parse.urlencode({"q": "python for ai", "limit": 10, "sort": "date"})
print("\nencoded query:", query)

# --- The HTTP methods and what they mean ---
print("\n--- HTTP methods ---")
for method, meaning in [
    ("GET", "read a resource; no body; safe to repeat"),
    ("POST", "create a resource; sends a body; not idempotent"),
    ("PUT", "replace a resource entirely"),
    ("PATCH", "update part of a resource"),
    ("DELETE", "remove a resource"),
]:
    print(f"  {method:<7} {meaning}")

# --- Status code families ---
print("\n--- status code families ---")
for prefix, meaning in [
    ("2xx", "success (200 OK, 201 Created, 204 No Content)"),
    ("3xx", "redirect (301 Moved, 304 Not Modified)"),
    ("4xx", "you made a mistake (400, 401, 403, 404, 429)"),
    ("5xx", "the server broke (500, 502, 503)"),
]:
    print(f"  {prefix}  {meaning}")


def request_json(base, path, params=None, headers=None, data=None,
                 method="GET", timeout=10):
    """Perform a request and return (status, headers, parsed_body)."""
    target = base + path
    if params:
        target += "?" + urllib.parse.urlencode(params)

    body = None
    if data is not None:
        body = json.dumps(data).encode("utf-8")
        headers = {"Content-Type": "application/json", **(headers or {})}

    request = urllib.request.Request(
        target,
        data=body,
        headers={"User-Agent": "python-basics-course/1.0", **(headers or {})},
        method=method,
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        # response.headers is a case-insensitive Message, unlike a plain dict,
        # which matters because header casing varies between servers.
        return response.status, response.headers, json.load(response)


def first(value):
    """Echo services differ: httpbin gives a string, httpbingo a list."""
    return value[0] if isinstance(value, list) else value


def pick_host():
    """Return the first echo host that answers with valid JSON."""
    for base in CANDIDATE_HOSTS:
        try:
            status, _, _ = request_json(base, "/get", timeout=8)
            if status == 200:
                return base
        except (urllib.error.URLError, json.JSONDecodeError, TimeoutError) as err:
            reason = getattr(err, "reason", err)
            print(f"  {base} unavailable ({reason})")
    return None


print("\n--- probing echo hosts ---")
BASE = pick_host()

if BASE is None:
    print("\nNo echo service responded, so the live requests are skipped.")
    print("Everything above is offline material and still applies.")
    raise SystemExit(0)

print("  using:", BASE)


# --------------------------------------------------------------------------
# Each demo is a function, so one network hiccup cannot kill the rest.
# --------------------------------------------------------------------------
def demo_get():
    """A real GET request with a query string."""
    status, headers, body = request_json(
        BASE, "/get", params={"course": "python", "module": 4})
    print("  status         :", status)
    print("  content-type   :", headers.get("Content-Type"))
    print("  server saw args:", {k: first(v) for k, v in body["args"].items()})
    print("  server saw UA  :", first(body["headers"]["User-Agent"]))


def demo_headers():
    """Custom headers, e.g. an auth token."""
    _, _, body = request_json(
        BASE, "/headers",
        headers={"Authorization": "Bearer fake-token-123", "X-Course": "Module 4"},
    )
    print("  Authorization:", first(body["headers"].get("Authorization")))
    print("  X-Course     :", first(body["headers"].get("X-Course")))


def demo_post():
    """Passing `data` is what turns this into a POST at the protocol level."""
    status, _, body = request_json(
        BASE, "/post", data={"name": "Lokesh", "role": "Developer"}, method="POST",
    )
    print("  status      :", status)
    print("  echoed json :", body["json"])


def demo_error_status():
    """Error statuses raise HTTPError in urllib - they do not return normally."""
    try:
        request_json(BASE, "/status/404")
        print("  no error raised, which is unexpected")
    except urllib.error.HTTPError as err:
        print(f"  HTTPError {err.code}: {err.reason}")
        print("  HTTPError is a subclass of URLError, so order your except")
        print("  clauses from most specific to least specific")


DEMOS = [
    ("GET /get", demo_get),
    ("custom headers echoed back", demo_headers),
    ("POST /post", demo_post),
    ("an error status", demo_error_status),
]

failed = []
for title, demo in DEMOS:
    print(f"\n--- {title} ---")
    try:
        demo()
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as err:
        print(f"  skipped: {type(err).__name__} (the echo service is flaky)")
        failed.append(title)

print(f"\n{len(DEMOS) - len(failed)}/{len(DEMOS)} live sections completed")
if failed:
    print("skipped:", ", ".join(failed), "- rerun to try again")

# --- Why timeouts matter ---
print("\nAlways pass a timeout. Without one, a hung server blocks your program")
print("forever, because there is no default timeout in urllib or requests.")
