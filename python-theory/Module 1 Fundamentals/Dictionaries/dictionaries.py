"""Dictionaries - key/value mappings."""

employee = {
    "name": "Lokesh",
    "age": 40,
    "skills": ["React", "Node", "Python"],
    "active": True,
}

print("employee:", employee)
print("keys  :", list(employee.keys()))
print("values:", list(employee.values()))

# --- Reading values ---
print("\nname       :", employee["name"])
print("get('city'):", employee.get("city"))                 # None, no error
print("get default:", employee.get("city", "Unknown"))

try:
    employee["city"]
except KeyError as err:
    print("Missing key raises KeyError:", err)

# --- Adding and updating ---
employee["city"] = "Ahmedabad"          # new key
employee["age"] = 41                    # overwrite
employee.update({"role": "Developer", "active": False})
print("\nafter updates:", employee)

# --- Removing ---
removed = employee.pop("active")
print("\npopped 'active' ->", removed)
employee.setdefault("country", "India")  # only sets if missing
print("after setdefault:", employee)

# --- Membership checks look at keys ---
print("\n'name' in employee   :", "name" in employee)
print("'salary' in employee :", "salary" in employee)

# --- Looping ---
print("\nitems():")
for key, value in employee.items():
    print(f"  {key:<8}: {value}")

# --- Nested data - the shape of most JSON / API responses ---
company = {
    "name": "Azilen",
    "teams": {
        "ai": {"lead": "Lokesh", "size": 4},
        "web": {"lead": "Priya", "size": 7},
    },
}
print("\nai lead   :", company["teams"]["ai"]["lead"])
print("web size  :", company["teams"]["web"]["size"])
# Safe deep access when keys may be missing:
print("safe miss :", company.get("teams", {}).get("mobile", {}).get("lead", "n/a"))

# --- Dict comprehension ---
prices = {"pen": 10, "notebook": 45, "bag": 800}
with_tax = {item: round(cost * 1.18, 2) for item, cost in prices.items()}
cheap = {item: cost for item, cost in prices.items() if cost < 100}
print("\nwith 18% tax:", with_tax)
print("under 100   :", cheap)

# --- Sorting a dict by value ---
by_price = dict(sorted(prices.items(), key=lambda pair: pair[1], reverse=True))
print("\nsorted by price desc:", by_price)

# --- Counting with a dict ---
text = "the quick brown fox jumps over the lazy dog the end"
counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
print("\nword counts (top 3):", sorted(counts.items(), key=lambda p: -p[1])[:3])

# collections.Counter does this for you
from collections import Counter

print("Counter    :", Counter(text.split()).most_common(3))

# --- Merging dicts (Python 3.9+) ---
defaults = {"theme": "light", "lang": "en"}
user_prefs = {"theme": "dark"}
print("\nmerged:", defaults | user_prefs)
