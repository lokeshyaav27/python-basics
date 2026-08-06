"""Reading and writing CSV files with the stdlib `csv` module."""

import csv
from pathlib import Path

HERE = Path(__file__).parent
CSV_PATH = HERE / "employees.csv"

ROWS = [
    {"name": "Lokesh", "role": "Developer", "salary": 90000, "city": "Ahmedabad"},
    {"name": "Priya", "role": "Designer", "salary": 85000, "city": "Pune"},
    {"name": "Amit", "role": "QA Engineer", "salary": 70000, "city": "Ahmedabad"},
    {"name": "Sara", "role": "Developer", "salary": 95000, "city": "Bengaluru"},
]

# --- Writing with DictWriter ---
# newline="" is REQUIRED on Windows, otherwise you get blank lines between rows.
with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=["name", "role", "salary", "city"])
    writer.writeheader()
    writer.writerows(ROWS)

print("wrote", CSV_PATH.name)
print("\n--- raw file ---")
print(CSV_PATH.read_text(encoding="utf-8"), end="")

# --- Reading with DictReader: each row becomes a dict keyed by header ---
print("\n--- DictReader ---")
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    employees = list(reader)      # materialise so we can reuse it

for emp in employees:
    print(f"  {emp['name']:<8} {emp['role']:<12} {emp['city']}")

# IMPORTANT: every CSV value comes back as a string. Convert explicitly.
print("\nsalary type from CSV:", type(employees[0]["salary"]).__name__)
for emp in employees:
    emp["salary"] = int(emp["salary"])
print("after conversion    :", type(employees[0]["salary"]).__name__)

# --- Reading with reader(): each row is a plain list ---
print("\n--- reader() ---")
with open(CSV_PATH, newline="", encoding="utf-8") as f:
    rows = list(csv.reader(f))
print("  header:", rows[0])
print("  first :", rows[1])

# --- Analysing the data with plain Python ---
total = sum(e["salary"] for e in employees)
print(f"\ntotal payroll : {total:,}")
print(f"average salary: {total / len(employees):,.0f}")
print("highest paid  :", max(employees, key=lambda e: e["salary"])["name"])

devs = [e for e in employees if e["role"] == "Developer"]
print("developers    :", [e["name"] for e in devs])

by_city = {}
for emp in employees:
    by_city.setdefault(emp["city"], []).append(emp["name"])
print("grouped by city:", by_city)

# --- Writing a derived report ---
REPORT = HERE / "salary_report.csv"
with open(REPORT, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["name", "salary", "monthly", "band"])
    for emp in sorted(employees, key=lambda e: -e["salary"]):
        band = "senior" if emp["salary"] >= 90000 else "mid"
        writer.writerow([emp["name"], emp["salary"], round(emp["salary"] / 12), band])

print("\n--- salary_report.csv ---")
print(REPORT.read_text(encoding="utf-8"), end="")

# --- Other delimiters (TSV, semicolon-separated European CSV) ---
TSV = HERE / "employees.tsv"
with open(TSV, "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f, delimiter="\t")
    writer.writerow(["name", "role"])
    writer.writerows([[e["name"], e["role"]] for e in employees])
print("\nfirst TSV line:", TSV.read_text(encoding="utf-8").splitlines()[1])

# --- Quoting handles commas inside values automatically ---
TRICKY = HERE / "tricky.csv"
with open(TRICKY, "w", newline="", encoding="utf-8") as f:
    csv.writer(f).writerow(["Doe, John", 'He said "hi"', "line1\nline2"])
print("\nquoted output:", TRICKY.read_text(encoding="utf-8").replace("\n", "\\n"))
with open(TRICKY, newline="", encoding="utf-8") as f:
    print("read back    :", next(csv.reader(f)))
