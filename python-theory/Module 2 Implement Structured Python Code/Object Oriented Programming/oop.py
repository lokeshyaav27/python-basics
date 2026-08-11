"""Object Oriented Programming - classes, inheritance, dunder methods."""


# --- A class is a blueprint; an instance is one concrete object ---
class Employee:
    """A company employee."""

    # Class attribute - shared by every instance
    company = "Azilen"
    count = 0

    def __init__(self, name, role, salary):
        # Instance attributes - unique per object
        self.name = name
        self.role = role
        self.salary = salary
        Employee.count += 1

    # Instance method - `self` is the object it was called on
    def describe(self):
        return f"{self.name} works as a {self.role} at {self.company}"

    def raise_salary(self, percent):
        self.salary = round(self.salary * (1 + percent / 100))
        return self.salary

    # __str__ controls what print() shows
    def __str__(self):
        return f"{self.name} ({self.role})"

    # __repr__ is for developers / debugging
    def __repr__(self):
        return f"Employee(name={self.name!r}, role={self.role!r}, salary={self.salary})"

    # __eq__ defines what == means for this type
    def __eq__(self, other):
        return isinstance(other, Employee) and self.name == other.name


dev = Employee("Lokesh", "Developer", 90000)
qa = Employee("Amit", "QA Engineer", 70000)

print(dev.describe())
print("print()  ->", dev)
print("repr()   ->", repr(dev))
print("after 10% raise:", dev.raise_salary(10))
print("instances created:", Employee.count)
print("equality by name:", dev == Employee("Lokesh", "Architect", 120000))


# --- Inheritance: reuse and extend ---
class Manager(Employee):
    def __init__(self, name, salary, reports=None):
        super().__init__(name, "Manager", salary)   # run the parent __init__
        self.reports = reports or []

    def add_report(self, employee):
        self.reports.append(employee)

    # Overriding a parent method
    def describe(self):
        base = super().describe()
        return f"{base}, leading {len(self.reports)} people"


boss = Manager("Priya", 150000)
boss.add_report(dev)
boss.add_report(qa)

print("\n" + boss.describe())
print("isinstance(boss, Employee):", isinstance(boss, Employee))
print("issubclass(Manager, Employee):", issubclass(Manager, Employee))


# --- Polymorphism: same call, different behaviour ---
print("\npolymorphic loop:")
for person in (dev, qa, boss):
    print("  -", person.describe())


# --- Encapsulation: a leading underscore signals "internal" ---
class BankAccount:
    def __init__(self, owner, balance=0):
        self.owner = owner
        self._balance = balance          # convention: don't touch from outside

    def deposit(self, amount):
        if amount <= 0:
            raise ValueError("deposit must be positive")
        self._balance += amount

    # @property exposes a computed value as if it were an attribute
    @property
    def balance(self):
        return self._balance

    @property
    def formatted(self):
        return f"Rs {self._balance:,}"


acct = BankAccount("Lokesh", 5000)
acct.deposit(2500)
print("\nbalance   :", acct.balance)       # no parentheses - it's a property
print("formatted :", acct.formatted)


# --- Class methods and static methods ---
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius

    @classmethod
    def from_fahrenheit(cls, f):
        """An alternative constructor."""
        return cls((f - 32) * 5 / 9)

    @staticmethod
    def is_freezing(celsius):
        """No access to self or cls - just a related utility."""
        return celsius <= 0


print("\nfrom_fahrenheit(98.6):", round(Temperature.from_fahrenheit(98.6).celsius, 1), "C")
print("is_freezing(-3)      :", Temperature.is_freezing(-3))


# --- dataclass: boilerplate-free classes for holding data ---
from dataclasses import dataclass, field


@dataclass
class Product:
    name: str
    price: float
    tags: list = field(default_factory=list)   # never use a bare [] default

    @property
    def price_with_tax(self):
        return round(self.price * 1.18, 2)


item = Product("Laptop", 55000, ["electronics"])
print("\ndataclass repr:", item)
print("auto equality  :", item == Product("Laptop", 55000, ["electronics"]))
print("with tax       :", item.price_with_tax)
