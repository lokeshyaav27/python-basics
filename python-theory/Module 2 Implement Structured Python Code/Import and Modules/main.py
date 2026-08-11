"""Import and modules - the different ways to bring code in.

Run from this folder:  python main.py
"""

# --- 1. Import the whole module, use a qualified name (clearest) ---
import text_utils

print("slugify:", text_utils.slugify("Learning Python for AI!"))
print("VOWELS :", text_utils.VOWELS)

# --- 2. Import specific names directly ---
from text_utils import count_vowels, truncate

print("\ncount_vowels:", count_vowels("Education"))
print("truncate    :", truncate("A fairly long sentence here"))

# --- 3. Import with an alias (common for long or conventional names) ---
import text_utils as tu

print("\nvia alias:", tu.slugify("Module 2 - Structured Code"))

# NOTE: avoid `from text_utils import *` - it hides where names came from.

# --- Standard library modules work the same way ---
import math
import random
from datetime import date, timedelta

print("\nmath.pi         :", round(math.pi, 4))
print("math.sqrt(144)  :", math.sqrt(144))
print("math.ceil(4.1)  :", math.ceil(4.1))

random.seed(42)  # a fixed seed makes random output repeatable
print("\nrandom.randint  :", random.randint(1, 100))
print("random.choice   :", random.choice(["Python", "SQL", "Docker"]))

today = date(2026, 8, 6)
print("\ntoday           :", today)
print("in 30 days      :", today + timedelta(days=30))
print("formatted       :", today.strftime("%d %B %Y"))

# --- Inspecting a module ---
print("\ntext_utils.__name__:", text_utils.__name__)
print("its public functions:",
      [n for n in dir(text_utils) if not n.startswith("_") and callable(getattr(text_utils, n))])

# --- Why `if __name__ == "__main__"` matters ---
# When you run this file, __name__ here is "__main__".
# Inside text_utils, __name__ is "text_utils", so its self-test stayed quiet.
print("\n__name__ in this file:", __name__)
