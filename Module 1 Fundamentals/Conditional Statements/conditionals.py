"""Conditional statements - if / elif / else."""

score = 78

# --- Basic if / elif / else ---
if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"

print(f"score {score} -> grade {grade}")

# --- Comparison operators ---
a, b = 10, 20
print("\n a == b :", a == b)
print(" a != b :", a != b)
print(" a <  b :", a < b)
print(" a >= 10:", a >= 10)

# --- Logical operators: and / or / not ---
age, has_licence = 22, True
if age >= 18 and has_licence:
    print("\nMay drive")

if not has_licence or age < 18:
    print("May not drive")
else:
    print("Cleared to drive")

# --- Chained comparisons read like maths ---
temperature = 24
if 20 <= temperature <= 30:
    print(f"\n{temperature}C is comfortable")

# --- Truthiness: empty things are False ---
for value in ("", "text", [], [1], {}, {"k": 1}, 0, 42, None):
    print(f"  bool({value!r:<10}) = {bool(value)}")

# --- Guard against empty input ---
names = []
if names:
    print("\nfirst name:", names[0])
else:
    print("\nNo names provided")

# --- Ternary (conditional expression) ---
status = "adult" if age >= 18 else "minor"
print("\nstatus:", status)

# --- Nested conditions ---
username, password = "admin", "secret123"
if username == "admin":
    if len(password) >= 8:
        print("\nLogin OK")
    else:
        print("\nPassword too short")
else:
    print("\nUnknown user")

# --- match / case (Python 3.10+), a structured alternative to long elif chains ---
def describe_status(code):
    match code:
        case 200 | 201:
            return "Success"
        case 400:
            return "Bad request"
        case 401 | 403:
            return "Not allowed"
        case 404:
            return "Not found"
        case code if code >= 500:
            return "Server error"
        case _:
            return "Unknown"


print()
for code in (200, 404, 403, 503, 302):
    print(f"  HTTP {code} -> {describe_status(code)}")

# --- pass is a no-op placeholder when you need a body ---
if score > 100:
    pass  # impossible here; keeps the block syntactically valid
