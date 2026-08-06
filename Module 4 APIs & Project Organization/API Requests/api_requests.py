"""Making HTTP requests with the `requests` library.

    pip install requests

`requests` is not in the standard library, but it is the de-facto standard for
HTTP in Python. Compare this with the urllib version in API Fundamentals.

The free echo service used here is genuinely unreliable, so this script uses a
retrying Session and tolerates a failed section instead of crashing - which is
itself the lesson: real networks fail, and your code has to expect it.
"""

try:
    import requests
except ImportError:
    raise SystemExit("requests is not installed. Run:  pip install requests")

from requests.adapters import HTTPAdapter
from urllib3.util import Retry

CANDIDATE_HOSTS = ["https://httpbin.org", "https://httpbingo.org"]
TIMEOUT = 15            # seconds - ALWAYS set this; there is no default


def first(value):
    """httpbin echoes strings; httpbingo echoes single-item lists."""
    return value[0] if isinstance(value, list) else value


def make_session():
    """A Session that reuses connections AND retries transient failures."""
    retry = Retry(
        total=4,
        connect=3,
        read=3,                                   # retry read timeouts too
        backoff_factor=0.6,                       # 0.6s, 1.2s, 2.4s, 4.8s
        status_forcelist=[429, 500, 502, 503, 504],
        allowed_methods=None,                     # None = retry every method
        raise_on_status=False,
    )
    session = requests.Session()
    session.mount("https://", HTTPAdapter(max_retries=retry))
    session.mount("http://", HTTPAdapter(max_retries=retry))
    session.headers["User-Agent"] = "python-basics-course/1.0"
    return session


SESSION = make_session()


def pick_host():
    for base in CANDIDATE_HOSTS:
        try:
            response = SESSION.get(f"{base}/get", timeout=TIMEOUT)
            if response.ok:
                response.json()          # must be real JSON, not an error page
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
# Each demo is a small function so one network hiccup cannot kill the rest.
# --------------------------------------------------------------------------
def demo_get():
    """GET with query parameters - pass params= and requests encodes it."""
    response = SESSION.get(
        f"{BASE}/get",
        params={"course": "python", "module": 4, "topic": "api requests"},
        timeout=TIMEOUT,
    )
    print("  final url :", response.url)
    print("  status    :", response.status_code, response.reason)
    print("  args seen :", {k: first(v) for k, v in response.json()["args"].items()})


def demo_headers():
    """Custom headers - auth tokens, content negotiation."""
    response = SESSION.get(
        f"{BASE}/headers",
        headers={
            "Authorization": "Bearer fake-token-123",
            "Accept": "application/json",
        },
        timeout=TIMEOUT,
    )
    echoed = response.json()["headers"]
    for key in ("Authorization", "Accept", "User-Agent"):
        print(f"  {key:<15}: {first(echoed.get(key))}")


def demo_post_json():
    """POST a JSON body: use json=, which sets Content-Type for you."""
    response = SESSION.post(
        f"{BASE}/post",
        json={"name": "Lokesh", "role": "Developer", "skills": ["Python", "SQL"]},
        timeout=TIMEOUT,
    )
    body = response.json()
    print("  status      :", response.status_code)
    print("  echoed json :", body["json"])
    print("  content-type:", first(body["headers"]["Content-Type"]))


def demo_post_form():
    """POST a form body: use data= instead of json=."""
    response = SESSION.post(
        f"{BASE}/post",
        data={"username": "lokesh", "password": "secret"},
        timeout=TIMEOUT,
    )
    body = response.json()
    print("  form seen   :", {k: first(v) for k, v in body["form"].items()})
    print("  content-type:", first(body["headers"]["Content-Type"]))


def demo_other_methods():
    """PUT replaces, PATCH updates part, DELETE removes."""
    print("  PUT   ->", SESSION.put(f"{BASE}/put", json={"v": 2}, timeout=TIMEOUT).status_code)
    print("  PATCH ->", SESSION.patch(f"{BASE}/patch", json={"v": 3}, timeout=TIMEOUT).status_code)
    print("  DELETE->", SESSION.delete(f"{BASE}/delete", timeout=TIMEOUT).status_code)


def demo_upload():
    """Multipart file upload - pass files= with (name, content, mimetype)."""
    files = {"report": ("notes.txt", b"line one\nline two\n", "text/plain")}
    response = SESSION.post(f"{BASE}/post", files=files, timeout=TIMEOUT)
    print("  files seen:", list(response.json()["files"]))


def demo_basic_auth():
    """HTTP basic auth via auth=(user, password)."""
    url = f"{BASE}/basic-auth/lokesh/hunter2"
    ok = SESSION.get(url, auth=("lokesh", "hunter2"), timeout=TIMEOUT)
    print("  with auth   :", ok.status_code, "| body:", ok.json())
    # A bare Session has no credentials, so this is a 401.
    print("  without auth:", requests.get(url, timeout=TIMEOUT).status_code, "(401)")


def demo_session():
    """A Session shares headers, params and cookies across calls."""
    with requests.Session() as session:
        session.headers.update({"Authorization": "Bearer shared-token"})
        session.params = {"tenant": "azilen"}

        args = session.get(f"{BASE}/get", timeout=TIMEOUT).json()["args"]
        headers = session.get(f"{BASE}/headers", timeout=TIMEOUT).json()["headers"]

        print("  params applied to every call:", {k: first(v) for k, v in args.items()})
        print("  header applied to every call:", first(headers["Authorization"]))
    print("  it also reuses the TCP connection, so repeat calls are faster")


def demo_timeout():
    """A timeout raises an exception; it does not return a response."""
    try:
        # Deliberately a plain requests.get: no retries to muddy the result.
        requests.get(f"{BASE}/delay/5", timeout=1)
        print("  no timeout - the server answered faster than expected")
    except requests.exceptions.Timeout:
        print("  Timeout raised after 1s, as requested")
    print("  without timeout=, a hung server would block this script forever")


def demo_streaming():
    """stream=True avoids loading a large body into memory at once."""
    with SESSION.get(f"{BASE}/bytes/2048", stream=True, timeout=TIMEOUT) as response:
        downloaded = sum(len(chunk) for chunk in response.iter_content(chunk_size=512))
    print("  streamed", downloaded, "bytes in 512-byte chunks")


DEMOS = [
    ("GET with params", demo_get),
    ("custom headers", demo_headers),
    ("POST json=", demo_post_json),
    ("POST data= (form)", demo_post_form),
    ("PUT / PATCH / DELETE", demo_other_methods),
    ("file upload", demo_upload),
    ("basic auth", demo_basic_auth),
    ("session", demo_session),
    ("timeout", demo_timeout),
    ("streaming", demo_streaming),
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
