"""Anatomy of a well-formed module.

A module is a single .py file. This one shows the conventions that make a
module pleasant to import: a docstring, constants, __all__, private helpers,
and a __main__ guard.

Import it:            import temperature
Run it as a script:   python temperature.py 37
"""

# --- Dunder metadata, read by tools and humans ---
__version__ = "1.0.0"
__author__ = "Lokesh"

# --- __all__ declares the public API: what `from temperature import *` gives,
#     and what readers should treat as supported. ---
__all__ = ["ABSOLUTE_ZERO_C", "to_fahrenheit", "to_celsius", "describe"]

# --- Module-level constants: UPPER_SNAKE_CASE ---
ABSOLUTE_ZERO_C = -273.15
_FREEZING_C = 0.0          # leading underscore = internal, not part of the API


# --- Private helper: not exported, not documented for callers ---
def _validate(celsius):
    if not isinstance(celsius, (int, float)):
        raise TypeError(f"expected a number, got {type(celsius).__name__}")
    if celsius < ABSOLUTE_ZERO_C:
        raise ValueError(f"{celsius}C is below absolute zero")
    return float(celsius)


# --- Public functions ---
def to_fahrenheit(celsius):
    """Convert Celsius to Fahrenheit.

    >>> to_fahrenheit(100)
    212.0
    """
    return _validate(celsius) * 9 / 5 + 32


def to_celsius(fahrenheit):
    """Convert Fahrenheit to Celsius."""
    return (fahrenheit - 32) * 5 / 9


def describe(celsius):
    """Return a human-readable description of a temperature."""
    c = _validate(celsius)
    if c <= _FREEZING_C:
        label = "freezing"
    elif c < 15:
        label = "cold"
    elif c < 28:
        label = "comfortable"
    elif c < 38:
        label = "hot"
    else:
        label = "dangerous"
    return f"{c:.1f}C ({to_fahrenheit(c):.1f}F) is {label}"


# --- Module-level code runs ONCE, on first import. Keep it cheap and
#     side-effect free - no network calls, no file writes. ---
LOADED_AS = __name__


# --- The __main__ guard: this block runs only when the file is executed
#     directly, never on import. It is where a module's CLI or self-test lives.
def _main(argv):
    if len(argv) > 1:
        value = float(argv[1])
        print(describe(value))
    else:
        print(f"temperature module v{__version__}")
        print("__name__ is:", __name__)
        for sample in (-10, 0, 22, 35, 45):
            print(" ", describe(sample))
        print("\nPass a number to convert:  python temperature.py 37")


if __name__ == "__main__":
    import sys

    _main(sys.argv)
