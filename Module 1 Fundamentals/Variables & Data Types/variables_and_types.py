"""Variables and the built-in data types."""

# --- Variables are names bound to objects; no type declaration needed. ---
name = "Lokesh"          # str
age = 40                 # int
height = 5.9             # float
is_learning = True       # bool
nickname = None          # NoneType - "no value"

print(name, age, height, is_learning, nickname)

# --- type() tells you what an object is ---
for value in (name, age, height, is_learning, nickname):
    print(f"{str(value):<10} -> {type(value).__name__}")

# --- Numbers ---
print("\n7 / 2  =", 7 / 2)     # true division -> float
print("7 // 2 =", 7 // 2)      # floor division -> int
print("7 % 2  =", 7 % 2)       # remainder
print("2 ** 10 =", 2 ** 10)    # power

# --- Type conversion (casting) ---
print("\nint('42') + 8 =", int("42") + 8)
print("str(3.14) * 2 =", str(3.14) * 2)
print("float('2.5') =", float("2.5"))
print("bool('') =", bool(""), "| bool('hi') =", bool("hi"))

# --- Multiple assignment and swapping ---
x, y = 10, 20
x, y = y, x
print("\nAfter swap: x =", x, "y =", y)

# --- Mutable vs immutable ---
numbers = [1, 2, 3]     # list is mutable - can change in place
numbers.append(4)
print("\nMutable list:", numbers)

point = (1, 2)          # tuple is immutable
try:
    point[0] = 99
except TypeError as err:
    print("Immutable tuple:", err)

# --- f-strings are the preferred way to format output ---
print(f"\n{name} is {age} years old and {height}m tall.")
print(f"Formatted to 1 decimal: {height:.1f}")
