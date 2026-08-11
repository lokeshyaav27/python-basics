"""Loops - for and while."""

# --- for over a list ---
skills = ["Python", "SQL", "Docker"]
print("skills:")
for skill in skills:
    print("  -", skill)

# --- range(): stop / start,stop / start,stop,step ---
print("\nrange(5)       :", list(range(5)))
print("range(2, 6)    :", list(range(2, 6)))
print("range(0, 10, 3):", list(range(0, 10, 3)))
print("countdown      :", list(range(5, 0, -1)))

# --- enumerate() gives you the index too ---
print("\nnumbered:")
for index, skill in enumerate(skills, start=1):
    print(f"  {index}. {skill}")

# --- zip() walks two sequences together ---
names = ["Lokesh", "Priya", "Amit"]
roles = ["Developer", "Designer", "QA"]
print("\npairs:")
for name, role in zip(names, roles):
    print(f"  {name:<8} -> {role}")

# --- Looping over a dict ---
prices = {"pen": 10, "notebook": 45, "bag": 800}
print("\nprices:")
for item, cost in prices.items():
    print(f"  {item:<9} {cost:>4}")

# --- while: repeat until a condition changes ---
# Always change the condition variable inside the loop, or it never ends.
count = 3
print("\nwhile countdown:")
while count > 0:
    print("  ", count)
    count -= 1
print("  liftoff! count =", count)

# --- break stops the loop early ---
print("\nfind first number over 50:")
for number in [12, 7, 63, 88, 4]:
    if number > 50:
        print("  found:", number)
        break

# --- continue skips to the next iteration ---
print("\nodd numbers only:")
for number in range(1, 11):
    if number % 2 == 0:
        continue
    print("  ", number, end="")
print()

# --- for/else: else runs only if the loop was NOT broken ---
target = 99
for number in [12, 7, 63, 88, 4]:
    if number == target:
        print(f"\n{target} found")
        break
else:
    print(f"\n{target} not in the list")

# --- Nested loops ---
print("\n3x3 multiplication table:")
for row in range(1, 4):
    line = [f"{row * col:3}" for col in range(1, 4)]
    print("  " + "".join(line))

# --- Accumulator pattern ---
total = 0
for cost in prices.values():
    total += cost
print("\ntotal:", total, "| sum() shortcut:", sum(prices.values()))

# --- Infinite loop with a break (menu/input pattern) ---
attempts = 0
while True:
    attempts += 1
    if attempts >= 3:
        print("\nstopped after", attempts, "attempts")
        break
