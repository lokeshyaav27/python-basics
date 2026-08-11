"""mathkit - a small example package.

A package is a folder containing __init__.py. The __init__ file runs when the
package is first imported, and is where you shape the public API so callers
can write `from mathkit import area_of_circle` instead of digging through
`mathkit.geometry.area_of_circle`.
"""

__version__ = "0.1.0"

# Re-export the names we want callers to use. The leading dot means
# "from a module inside THIS package" (a relative import).
from .geometry import area_of_circle, area_of_rectangle, perimeter_of_circle
from .stats import mean, median, spread

__all__ = [
    "area_of_circle",
    "area_of_rectangle",
    "perimeter_of_circle",
    "mean",
    "median",
    "spread",
]

print(f"[mathkit __init__ ran - version {__version__}]")
