"""Exception handling - try / except / else / finally."""

# --- Basic try/except ---
try:
    result = 10 / 0
except ZeroDivisionError as err:
    print("Caught:", type(err).__name__, "-", err)

# --- Catch different errors differently ---
def parse_age(raw):
    try:
        age = int(raw)
    except ValueError:
        return "not a number"
    except TypeError:
        return "wrong type entirely"
    else:
        # runs only when no exception was raised
        return f"age is {age}"
    finally:
        # always runs - cleanup goes here
        pass


print()
for raw in ("40", "forty", None):
    print(f"  parse_age({raw!r:<8}) -> {parse_age(raw)}")

# --- Catching several types in one except ---
def safe_divide(a, b):
    try:
        return a / b
    except (ZeroDivisionError, TypeError) as err:
        return f"error: {err}"


print("\nsafe_divide(10, 2) :", safe_divide(10, 2))
print("safe_divide(10, 0) :", safe_divide(10, 0))
print("safe_divide(10,'x'):", safe_divide(10, "x"))

# --- finally always runs, even on an early return ---
def read_config(path):
    handle = None
    try:
        handle = open(path, encoding="utf-8")
        return handle.read()
    except FileNotFoundError:
        return "(config missing, using defaults)"
    finally:
        if handle:
            handle.close()
        print("  finally: cleanup done")


print("\nread_config:", read_config("no_such_file.ini"))

# --- `with` handles cleanup for you - prefer it over try/finally for files ---
try:
    with open("no_such_file.ini", encoding="utf-8") as f:
        print(f.read())
except FileNotFoundError as err:
    print("\nwith + except:", err)

# --- Raising your own exceptions ---
def set_age(age):
    if not isinstance(age, int):
        raise TypeError(f"age must be an int, got {type(age).__name__}")
    if age < 0:
        raise ValueError("age cannot be negative")
    return age


print()
for candidate in (40, -5, "40"):
    try:
        print(f"  set_age({candidate!r}) = {set_age(candidate)}")
    except (TypeError, ValueError) as err:
        print(f"  set_age({candidate!r}) raised {type(err).__name__}: {err}")


# --- Custom exception classes give callers something precise to catch ---
class InsufficientFundsError(Exception):
    """Raised when a withdrawal exceeds the available balance."""

    def __init__(self, balance, requested):
        self.shortfall = requested - balance
        super().__init__(f"short by {self.shortfall}")


def withdraw(balance, amount):
    if amount > balance:
        raise InsufficientFundsError(balance, amount)
    return balance - amount


try:
    withdraw(500, 800)
except InsufficientFundsError as err:
    print(f"\nInsufficientFundsError: {err} (shortfall={err.shortfall})")

# --- Re-raising after logging ---
def load_data():
    try:
        return int("not-a-number")
    except ValueError:
        print("\nlogging the failure, then re-raising")
        raise          # bare raise keeps the original traceback


try:
    load_data()
except ValueError as err:
    print("caller handled:", err)

# --- Anti-pattern: never silently swallow everything ---
# except:            <- catches KeyboardInterrupt/SystemExit too
#     pass           <- and hides real bugs
# Catch the narrowest exception you can actually handle.
print("\nRule of thumb: catch specific exceptions, and never `except: pass`.")
