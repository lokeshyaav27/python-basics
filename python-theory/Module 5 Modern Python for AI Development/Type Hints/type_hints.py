"""Type hints - documentation the tooling can check.

Python does NOT enforce these at runtime. Their value is in your editor's
autocomplete and in a static checker:
    pip install mypy
    mypy type_hints.py
"""

from collections.abc import Callable, Iterable, Sequence
from dataclasses import dataclass
from typing import Any, Literal, Optional, Protocol, TypedDict, TypeVar

# --- Variables ---
name: str = "Lokesh"
age: int = 40
height: float = 5.9
active: bool = True

# --- Built-in generics (Python 3.9+ style - no typing.List needed) ---
skills: list[str] = ["Python", "SQL"]
scores: dict[str, int] = {"python": 92, "sql": 85}
point: tuple[float, float] = (1.5, 2.5)
row: tuple[str, int, bool] = ("Lokesh", 40, True)
tags: set[str] = {"ai", "backend"}
matrix: list[list[int]] = [[1, 2], [3, 4]]


# --- Functions: arguments and return type ---
def greet(name: str, excited: bool = False) -> str:
    return f"Hello, {name}{'!' if excited else '.'}"


def total(numbers: Iterable[float]) -> float:
    return sum(numbers)


def log(message: str) -> None:          # None = returns nothing useful
    print("  log:", message)


print("greet:", greet("Lokesh", excited=True))
print("total:", total([1, 2, 3.5]))
log("hints are just annotations")


# --- Optional / None: `X | None` is the modern spelling ---
def find_user(user_id: int) -> dict[str, Any] | None:
    users = {1: {"name": "Lokesh"}, 2: {"name": "Priya"}}
    return users.get(user_id)


# Optional[str] is the older, equivalent form of `str | None`
def middle_name(full: str) -> Optional[str]:
    parts = full.split()
    return parts[1] if len(parts) == 3 else None


print("\nfind_user(1) :", find_user(1))
print("find_user(9) :", find_user(9))
print("middle_name  :", middle_name("Lokesh Kumar Yadav"))


# --- Union of several types ---
def to_number(value: str | int | float) -> float:
    return float(value)


print("\nto_number('3.5'):", to_number("3.5"))


# --- Callable: a function passed as an argument ---
def apply(func: Callable[[int], int], values: Sequence[int]) -> list[int]:
    return [func(v) for v in values]


print("apply(double)   :", apply(lambda n: n * 2, [1, 2, 3]))


# --- Literal: only these exact values are allowed ---
def set_mode(mode: Literal["read", "write", "append"]) -> str:
    return f"mode set to {mode}"


print("set_mode        :", set_mode("write"))
# set_mode("delete")  <- mypy: Argument 1 has incompatible type


# --- TypeVar: generic code that keeps the caller's type ---
T = TypeVar("T")


def first_or(items: Sequence[T], fallback: T) -> T:
    return items[0] if items else fallback


print("\nfirst_or([3,4], 0):", first_or([3, 4], 0))       # inferred as int
print("first_or([], 'na'):", first_or([], "na"))          # inferred as str


# --- TypedDict: the shape of a JSON-ish dict ---
class UserRecord(TypedDict):
    id: int
    name: str
    active: bool


def summarise(user: UserRecord) -> str:
    status = "active" if user["active"] else "inactive"
    return f"#{user['id']} {user['name']} ({status})"


record: UserRecord = {"id": 7, "name": "Amit", "active": True}
print("\nTypedDict:", summarise(record))


# --- Protocol: structural typing ("if it has .area(), it fits") ---
class HasArea(Protocol):
    def area(self) -> float: ...


@dataclass
class Circle:
    radius: float

    def area(self) -> float:
        return 3.14159 * self.radius ** 2


@dataclass
class Square:
    side: float

    def area(self) -> float:
        return self.side ** 2


def total_area(shapes: Iterable[HasArea]) -> float:
    return sum(shape.area() for shape in shapes)


# Circle and Square never mention HasArea - they just match its shape.
print("\ntotal_area:", round(total_area([Circle(1), Square(2)]), 2))


# --- Dataclasses use annotations to build the class ---
@dataclass
class Employee:
    name: str
    role: str
    salary: float
    skills: list[str]

    def annual_cost(self, overhead: float = 1.3) -> float:
        return round(self.salary * overhead, 2)


emp = Employee("Lokesh", "Developer", 90000, ["Python"])
print("\ndataclass   :", emp)
print("annual_cost :", emp.annual_cost())


# --- Hints are NOT enforced at runtime ---
def add(a: int, b: int) -> int:
    return a + b


print("\nadd('a', 'b') =", add("a", "b"), "  <- runs fine, but mypy flags it")
print("annotations   :", add.__annotations__)
print("class hints   :", Employee.__annotations__)

# --- Forward references: quote a name not defined yet ---
class Node:
    def __init__(self, value: int, nxt: "Node | None" = None) -> None:
        self.value = value
        self.next = nxt

    def chain(self) -> list[int]:
        values, node = [], self
        while node is not None:
            values.append(node.value)
            node = node.next
        return values


print("\nlinked list:", Node(1, Node(2, Node(3))).chain())
