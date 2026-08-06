"""Handling API responses properly - status codes, parsing, errors, retries.

    pip install requests

Note the irony worth learning from: the free echo service this script talks to
is itself unreliable, which is exactly why code like `fetch_json()` below exists.
"""

try:
    import requests
except ImportError:
    raise SystemExit("requests is not installed. Run:  pip install requests")

import time

from requests.adapters import HTTPAdapter
from urllib3.util import Retry

CANDIDATE_HOSTS = ["https://httpbin.org", "https://httpbingo.org"]
TIMEOUT = 15


def make_session():
    """A Session that retries connection errors, read timeouts and 5xx."""
    retry = Retry(
        total=4,
        connect=3,
        read=3,
        backoff_factor=0.6,
        status_forcelist=[500, 502, 504],      # note: 503/429 left alone below
        allowed_methods=None,
        raise_on_status=False,
    )
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.headers["User-Agent"] = "python-basics-course/1.0"
    return session


SESSION = make_session()


def pick_host():
    for base in CANDIDATE_HOSTS:
        try:
            response = SESSION.get(f"{base}/get", timeout=TIMEOUT)
            if response.ok:
                response.json()
                return base
            print(f"  {base} returned {response.status_code}")
        except requests.exceptions.RequestException as err:
            print(f"  {base} unavailable ({type(err).__name__})")
        except ValueError:
            print(f"  {base} did not return JSON")
    return None


print("--- probing echo hosts ---")
BASE = pick_host()
if BASE is None:
    raise SystemExit("No echo service responded. Try again later.")
print("  using:", BASE)


# --------------------------------------------------------------------------
def demo_anatomy():
    """What a Response object carries."""
    response = SESSION.get(f"{BASE}/get", timeout=TIMEOUT)
    print("  status_code :", response.status_code)
    print("  reason      :", response.reason)
    print("  ok          :", response.ok)        # True for status < 400
    print("  encoding    :", response.encoding)
    print("  elapsed     :", f"{response.elapsed.total_seconds():.2f}s")
    print("  content-type:", response.headers["Content-Type"])
    print("  bytes       :", len(response.content))
    # .text is a decoded str, .content is raw bytes, .json() parses JSON
    print("  text[:50]   :", response.text[:50].replace("\n", " "))
    print("  json keys   :", sorted(response.json()))


def demo_status_branching():
    """Never assume 200. Branch on the status you actually got."""
    for code in (200, 301, 404, 429, 500):
        r = SESSION.get(f"{BASE}/status/{code}", timeout=TIMEOUT, allow_redirects=False)
        if r.status_code == 200:
            verdict = "success"
        elif 300 <= r.status_code < 400:
            verdict = "redirect"
        elif r.status_code == 404:
            verdict = "not found - check the URL"
        elif r.status_code == 429:
            verdict = "rate limited - back off and retry"
        elif r.status_code >= 500:
            verdict = "server error - retry later"
        else:
            verdict = "client error - fix the request"
        print(f"  asked for {code}, got {r.status_code} -> {verdict}")


def demo_raise_for_status():
    """raise_for_status() converts 4xx/5xx into an HTTPError."""
    try:
        r = SESSION.get(f"{BASE}/status/503", timeout=TIMEOUT)
        r.raise_for_status()
        print("  no error raised - status was", r.status_code)
    except requests.exceptions.HTTPError as err:
        print("  HTTPError:", err.response.status_code, err.response.reason)
        print("  the response is still attached at err.response")


def demo_non_json():
    """A non-JSON body breaks .json() - always guard it."""
    r = SESSION.get(f"{BASE}/html", timeout=TIMEOUT)
    try:
        r.json()
        print("  unexpectedly got JSON")
    except requests.exceptions.JSONDecodeError:
        print("  body is not JSON. content-type was:", r.headers["Content-Type"])
        print("  first 40 chars:", r.text[:40].strip())


def demo_safe_keys():
    """Missing keys are as common as bad status codes."""
    payload = SESSION.get(f"{BASE}/get", params={"a": 1}, timeout=TIMEOUT).json()
    print("  present key  :", payload.get("url"))
    print("  missing key  :", payload.get("total_count", "(not in response)"))
    print("  nested safely:", payload.get("headers", {}).get("Host", "unknown"))
    print("  payload['total_count'] would raise KeyError instead")


def demo_rate_limit_headers():
    """Servers tell you when to come back - read the headers."""
    r = SESSION.get(f"{BASE}/response-headers",
                    params={"X-RateLimit-Remaining": "0", "Retry-After": "30"},
                    timeout=TIMEOUT)
    print("  remaining  :", r.headers.get("X-RateLimit-Remaining"))
    print("  retry-after:", r.headers.get("Retry-After"), "seconds")


def demo_redirects():
    """requests follows redirects by default and records the hops."""
    r = SESSION.get(f"{BASE}/redirect/2", timeout=TIMEOUT)
    print("  followed :", len(r.history), "hops ->", [h.status_code for h in r.history])
    print("  final url:", r.url)

    r = SESSION.get(f"{BASE}/redirect/2", timeout=TIMEOUT, allow_redirects=False)
    print("  not followed:", r.status_code, "->", r.headers.get("Location"))


# --------------------------------------------------------------------------
# The pattern worth memorising: one function that handles the real failures.
# --------------------------------------------------------------------------
def fetch_json(url, *, params=None, retries=3, timeout=10):
    """GET `url` and return parsed JSON, or None if it could not be fetched."""
    for attempt in range(1, retries + 1):
        try:
            response = requests.get(url, params=params, timeout=timeout)

            # 429 and 5xx are worth retrying; other 4xx are the caller's fault.
            if response.status_code == 429 or response.status_code >= 500:
                wait = int(response.headers.get("Retry-After", 2 ** attempt))
                print(f"  attempt {attempt}: {response.status_code}, waiting {wait}s")
                if attempt < retries:
                    time.sleep(min(wait, 2))     # capped so the demo stays quick
                    continue
                return None

            response.raise_for_status()
            return response.json()

        except requests.exceptions.Timeout:
            print(f"  attempt {attempt}: timed out")
        except requests.exceptions.ConnectionError:
            print(f"  attempt {attempt}: connection failed")
        except requests.exceptions.HTTPError as err:
            print(f"  giving up: {err.response.status_code} is not retryable")
            return None
        except requests.exceptions.JSONDecodeError:
            print("  giving up: response was not JSON")
            return None

    return None


def demo_fetch_json():
    result = fetch_json(f"{BASE}/get", params={"ok": "yes"})
    print("  happy path      ->", result["args"] if result else None)
    print("  retryable 503   ->", fetch_json(f"{BASE}/status/503", retries=2))
    print("  non-retryable   ->", fetch_json(f"{BASE}/status/404"))
    print("  not JSON        ->", fetch_json(f"{BASE}/html"))


DEMOS = [
    ("response anatomy", demo_anatomy),
    ("branching on status", demo_status_branching),
    ("raise_for_status", demo_raise_for_status),
    ("parsing defensively", demo_non_json),
    ("reading the body safely", demo_safe_keys),
    ("rate limit headers", demo_rate_limit_headers),
    ("redirects", demo_redirects),
    ("fetch_json()", demo_fetch_json),
]

failed = []
for title, demo in DEMOS:
    print(f"\n--- {title} ---")
    try:
        demo()
    except requests.exceptions.RequestException as err:
        print(f"  skipped: {type(err).__name__} (the echo service is flaky)")
        failed.append(title)

print(f"\n{len(DEMOS) - len(failed)}/{len(DEMOS)} sections completed")
if failed:
    print("skipped:", ", ".join(failed), "- rerun to try again")

# --- Pagination: keep fetching until there is no next page ---
print("""
--- pagination pattern ---
  collected = []
  url = "https://api.example.com/users?page=1"
  while url:
      data = fetch_json(url)
      if not data:
          break
      collected.extend(data["results"])
      url = data.get("next")        # the API tells you the next page, or None""")
