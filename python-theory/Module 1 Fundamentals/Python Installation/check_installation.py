"""Verify your Python installation.

Run:  python check_installation.py
"""

import platform
import sys

print("Python version :", sys.version.split()[0])
print("Full version   :", sys.version)
print("Executable     :", sys.executable)
print("Platform       :", platform.system(), platform.release())
print("Architecture   :", platform.machine())

# Python 3.8+ is the practical minimum for modern libraries.
if sys.version_info >= (3, 10):
    print("\nOK - you are on a modern Python.")
else:
    print("\nWarning - consider upgrading to Python 3.10 or newer.")

# sys.path is where Python looks for modules you import.
print("\nFirst 3 entries of sys.path:")
for entry in sys.path[:3]:
    print("  -", entry or "(current directory)")
