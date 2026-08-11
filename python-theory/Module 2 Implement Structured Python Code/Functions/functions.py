"""Functions - reusable blocks of logic."""


# --- Simplest form ---
def greet(name):
    """Return a greeting. This line is the docstring."""
    return f"Hello, {name}!"


print(greet("Lokesh"))
print("docstring:", greet.__doc__)


# --- Default arguments ---
def power(base, exponent=2):
    return base ** exponent


print("\npower(5)    =", power(5))        # uses default
print("power(5, 3) =", power(5, 3))


# --- Keyword arguments make calls self-documenting ---
def create_user(name, role="viewer", active=True):
    return {"name": name, "role": role, "active": active}


print("\n", create_user("Priya", role="admin"))
print(" ", create_user(name="Amit", active=False))


# --- *args: any number of positional arguments (a tuple) ---
def total(*numbers):
    return sum(numbers)


print("\ntotal(1, 2, 3)       =", total(1, 2, 3))
print("total(*[4, 5, 6, 7]) =", total(*[4, 5, 6, 7]))


# --- **kwargs: any number of keyword arguments (a dict) ---
def describe(**details):
    return ", ".join(f"{k}={v}" for k, v in details.items())


print("\ndescribe:", describe(name="Lokesh", city="Ahmedabad", age=40))


# --- Everything combined, in the required order ---
def log_event(event, *tags, level="INFO", **extra):
    return f"[{level}] {event} tags={tags} extra={extra}"


print("\n", log_event("login", "auth", "web", level="WARN", user="lokesh"))


# --- Returning multiple values (really a tuple) ---
def stats(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)


low, high, avg = stats([4, 8, 15, 16, 23, 42])
print(f"\nlow={low} high={high} avg={avg:.2f}")


# --- Scope: local vs global ---
counter = 0


def increment():
    global counter          # needed to rebind a module-level name
    counter += 1


increment()
increment()
print("\nglobal counter:", counter)


def shadow_demo():
    counter = 100           # a *new* local variable, global untouched
    return counter


print("local shadow:", shadow_demo(), "| global still:", counter)


# --- The mutable-default-argument trap ---
def bad_append(item, bucket=[]):        # created ONCE, shared across calls
    bucket.append(item)
    return bucket


print("\nbad :", bad_append("a"), bad_append("b"))    # ['a'] then ['a', 'b']!


def good_append(item, bucket=None):     # the correct pattern
    if bucket is None:
        bucket = []
    bucket.append(item)
    return bucket


print("good:", good_append("a"), good_append("b"))


# --- Functions are objects: pass them around ---
def apply_twice(func, value):
    return func(func(value))


print("\napply_twice(double, 3) =", apply_twice(lambda n: n * 2, 3))


# --- lambda: a tiny anonymous function, useful as a `key` ---
people = [("Lokesh", 40), ("Priya", 32), ("Amit", 47)]
print("sorted by age:", sorted(people, key=lambda p: p[1]))


# --- Recursion: a function that calls itself (needs a base case) ---
def factorial(n):
    if n <= 1:              # base case stops the recursion
        return 1
    return n * factorial(n - 1)


print("\nfactorial(5) =", factorial(5))
