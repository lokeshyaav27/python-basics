"""Lists - ordered, mutable collections."""

skills = ["React", "Node", "Python"]
print("skills:", skills, "| length:", len(skills))

# --- Adding items ---
skills.append("SQL")                    # one item at the end
skills.insert(0, "JavaScript")          # at a position
skills.extend(["Docker", "Git"])        # several items
print("\nafter adding:", skills)

# --- Removing items ---
skills.remove("Node")                   # by value (first match)
last = skills.pop()                     # removes and returns the last
print("after removing:", skills, "| popped:", last)
del skills[0]                           # by index
print("after del[0]  :", skills)

# --- Access and slicing ---
print("\nfirst :", skills[0])
print("last  :", skills[-1])
print("2..3  :", skills[1:3])

# --- Searching ---
print("\n'Python' in list :", "Python" in skills)
print("index of 'Python':", skills.index("Python"))
print("count of 'SQL'   :", skills.count("SQL"))

# --- Sorting ---
scores = [42, 7, 19, 88, 3]
print("\nsorted copy   :", sorted(scores))       # new list
print("original kept :", scores)
scores.sort(reverse=True)                        # in place
print("sorted in place (desc):", scores)
print("sorted by length:", sorted(skills, key=len))

# --- Looping ---
print("\nenumerate:")
for i, skill in enumerate(skills, start=1):
    print(f"  {i}. {skill}")

# --- List comprehensions: the Pythonic transform/filter ---
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [n * n for n in numbers]
evens = [n for n in numbers if n % 2 == 0]
labels = [f"{n} is {'even' if n % 2 == 0 else 'odd'}" for n in numbers[:4]]
print("\nsquares:", squares)
print("evens  :", evens)
print("labels :", labels)

# --- Useful aggregates ---
print("\nsum:", sum(numbers), "| min:", min(numbers), "| max:", max(numbers))

# --- Copying: lists are references! ---
a = [1, 2, 3]
b = a                # same object
c = a.copy()         # independent copy (or a[:] / list(a))
a.append(4)
print("\na:", a, "| b (alias):", b, "| c (copy):", c)

# --- Nested lists ---
matrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
print("\nmatrix[1][2] =", matrix[1][2])
flat = [value for row in matrix for value in row]
print("flattened   :", flat)
