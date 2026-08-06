"""Using a package - run:  python main.py

Folder layout:
    Packages/
        main.py              <- you are here
        mathkit/             <- the package
            __init__.py      <- makes it a package; defines the public API
            geometry.py      <- a submodule
            stats.py         <- another submodule
"""

# --- Importing the package runs mathkit/__init__.py exactly once ---
import mathkit

print("\npackage version:", mathkit.__version__)
print("package path   :", mathkit.__path__[0].split("\\")[-1])

# --- Names re-exported by __init__ are available at the top level ---
print("\narea_of_circle(3)     :", round(mathkit.area_of_circle(3), 2))
print("area_of_rectangle(4,5):", mathkit.area_of_rectangle(4, 5))

# --- Or import them directly ---
from mathkit import mean, median, spread

scores = [88, 92, 79, 95, 71, 84]
print("\nscores :", scores)
print("mean   :", round(mean(scores), 2))
print("median :", median(scores))
print("spread :", spread(scores))

# --- You can also reach into a submodule explicitly ---
from mathkit import geometry
from mathkit.stats import mean as stats_mean

print("\nvia submodule    :", round(geometry.perimeter_of_circle(2), 2))
print("aliased import   :", round(stats_mean([1, 2, 3, 4]), 2))
print("same function?   :", stats_mean is mean)

# --- The public API, as declared by __all__ ---
print("\n__all__:", mathkit.__all__)

# --- Submodules not imported by __init__ are not attributes until imported ---
import sys

print("\nloaded submodules:", sorted(m for m in sys.modules if m.startswith("mathkit")))

# --- A quick sanity check of the whole package ---
print("\n--- checks ---")
checks = [
    ("circle area r=1 is pi", abs(mathkit.area_of_circle(1) - 3.14159) < 0.001),
    ("rectangle 4x5 is 20", mathkit.area_of_rectangle(4, 5) == 20),
    ("median of even count", median([1, 2, 3, 4]) == 2.5),
    ("median of odd count", median([3, 1, 2]) == 2),
    ("spread", spread([10, 4, 7]) == 6),
]
for label, passed in checks:
    print(f"  {'PASS' if passed else 'FAIL'}  {label}")

# --- Errors bubble up from submodules as usual ---
try:
    mathkit.area_of_circle(-1)
except ValueError as err:
    print("\nValueError from geometry:", err)

try:
    mean([])
except ValueError as err:
    print("ValueError from stats  :", err)

# --- Packaging notes ---
print("""
To turn this into an installable package, add a pyproject.toml beside mathkit/:

    [project]
    name = "mathkit"
    version = "0.1.0"
    requires-python = ">=3.10"

    [build-system]
    requires = ["setuptools>=61"]
    build-backend = "setuptools.build_meta"

Then install it in editable mode so imports work from anywhere:
    pip install -e .""")
