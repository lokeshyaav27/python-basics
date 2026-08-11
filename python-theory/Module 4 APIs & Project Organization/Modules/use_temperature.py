"""Importing the temperature module - run:  python use_temperature.py"""

import temperature
from temperature import ABSOLUTE_ZERO_C, describe

# --- Qualified access ---
print("module version:", temperature.__version__)
print("module doc    :", temperature.__doc__.splitlines()[0])
print("to_fahrenheit(37):", round(temperature.to_fahrenheit(37), 1))

# --- Direct names ---
print("\nabsolute zero :", ABSOLUTE_ZERO_C)
print("describe(22)  :", describe(22))

# --- Notice what __name__ was during the import ---
print("\nmodule saw __name__ as:", temperature.LOADED_AS)
print("so its _main() did NOT run")

# --- __all__ controls `import *` and documents the public surface ---
print("\npublic API (__all__):", temperature.__all__)
print("private helper still reachable, but you should not use it:",
      temperature._validate(10))

# --- Where did Python find it? ---
print("\nloaded from:", temperature.__file__)

# --- Modules are cached in sys.modules: importing twice is free ---
import sys

print("cached in sys.modules:", "temperature" in sys.modules)
import temperature as again          # no re-execution, same object
print("same object on re-import:", again is temperature)

# --- Errors surface as normal exceptions ---
try:
    temperature.to_fahrenheit("hot")
except TypeError as err:
    print("\nTypeError:", err)

try:
    temperature.describe(-300)
except ValueError as err:
    print("ValueError:", err)
