"""Tuples - ordered, immutable collections."""

point = (3, 7)
person = ("Lokesh", 40, "Ahmedabad")
single = ("only",)          # note the trailing comma - without it, it's a str!
empty = ()

print("point :", point)
print("person:", person)
print("single:", single, type(single).__name__)
print("empty :", empty)

# --- Access and slicing work like lists ---
print("\nperson[0]  :", person[0])
print("person[-1] :", person[-1])
print("person[:2] :", person[:2])
print("length     :", len(person))

# --- Immutable: no append, no item assignment ---
try:
    person[1] = 41
except TypeError as err:
    print("\nCannot modify:", err)

# --- Unpacking is the main reason tuples are everywhere ---
name, age, city = person
print(f"\nUnpacked: {name}, {age}, {city}")

x, y = point
print("x =", x, "| y =", y)

first, *rest = (1, 2, 3, 4, 5)      # star catches the remainder
print("first:", first, "| rest:", rest)

# --- Functions return tuples to give back several values ---
def min_max_avg(numbers):
    return min(numbers), max(numbers), sum(numbers) / len(numbers)


low, high, avg = min_max_avg([4, 8, 15, 16, 23, 42])
print(f"\nlow={low} high={high} avg={avg:.2f}")

# --- Swapping uses a tuple under the hood ---
a, b = 1, 2
a, b = b, a
print("\nswapped:", a, b)

# --- Tuples are hashable, so they can be dict keys or set members ---
grid = {(0, 0): "start", (2, 3): "treasure"}
print("\ngrid[(2, 3)] =", grid[(2, 3)])
print("set of points:", {(1, 1), (1, 1), (2, 2)})

# A list cannot be a dict key:
try:
    {[0, 0]: "nope"}
except TypeError as err:
    print("list as key ->", err)

# --- namedtuple: a tuple with named fields ---
from collections import namedtuple

Employee = namedtuple("Employee", ["name", "role", "salary"])
emp = Employee("Lokesh", "Developer", 90000)
print(f"\n{emp.name} works as {emp.role}")
print("still a tuple:", emp[0], "| as dict:", emp._asdict())

# --- Converting between list and tuple ---
print("\nto list :", list(point))
print("to tuple:", tuple([9, 8, 7]))
