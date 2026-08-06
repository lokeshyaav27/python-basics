"""A script to practise your IDE's debugger.

Try this in VS Code:
  1. Click in the gutter on line 20 to set a breakpoint (red dot).
  2. Press F5 and pick "Python File".
  3. Hover over `total` and `item` to inspect values.
  4. F10 = step over, F11 = step into, F5 = continue.

There is also a bug below on purpose - find it with the debugger.
"""


def cart_total(items):
    """Sum the price * qty of every item in a shopping cart."""
    total = 0
    for item in items:
        line_total = item["price"] * item["qty"]
        total += line_total  # <-- put a breakpoint here
    return total


cart = [
    {"name": "Notebook", "price": 3.50, "qty": 2},
    {"name": "Pen", "price": 1.25, "qty": 4},
    {"name": "Backpack", "price": 29.99, "qty": 1},
]

print("Items:", len(cart))
print("Total:", cart_total(cart))

# `breakpoint()` drops you into the debugger without touching the gutter.
# Uncomment the next line and run from a terminal to try it.
# breakpoint()
