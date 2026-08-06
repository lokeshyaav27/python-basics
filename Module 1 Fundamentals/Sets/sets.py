"""Sets - unordered collections of unique items."""

skills = {"Python", "React", "SQL", "Python"}   # duplicate is dropped
print("skills:", skills, "| length:", len(skills))

empty = set()          # {} would create an empty dict, not a set
print("empty set:", empty)

# --- Deduplicating a list is the most common real use ---
emails = ["a@x.com", "b@x.com", "a@x.com", "c@x.com", "b@x.com"]
print("\nunique emails:", set(emails))
print("count:", len(set(emails)), "of", len(emails))

# --- Adding and removing ---
skills.add("Docker")
skills.update(["Git", "Linux"])
skills.discard("SQL")          # no error if missing
skills.remove("React")         # KeyError if missing
print("\nafter edits:", sorted(skills))

# --- Membership testing is very fast (O(1) average) ---
print("\n'Python' in skills:", "Python" in skills)
print("'Java'   in skills:", "Java" in skills)

# --- Set algebra ---
frontend = {"HTML", "CSS", "JavaScript", "React"}
backend = {"Python", "SQL", "JavaScript", "Node"}

print("\nunion        :", sorted(frontend | backend))
print("intersection :", sorted(frontend & backend))
print("difference   :", sorted(frontend - backend))
print("symmetric    :", sorted(frontend ^ backend))

# Method form reads better in some code:
print("\nunion()        :", sorted(frontend.union(backend)))
print("intersection() :", sorted(frontend.intersection(backend)))

# --- Subset / superset / disjoint ---
juniors = {"HTML", "CSS"}
print("\njuniors subset of frontend :", juniors.issubset(frontend))
print("frontend superset of juniors:", frontend.issuperset(juniors))
print("frontend disjoint from {'Go'}:", frontend.isdisjoint({"Go"}))

# --- Sets are unordered: no indexing ---
try:
    frontend[0]
except TypeError as err:
    print("\nNo indexing:", err)

# --- Set comprehension ---
lengths = {len(s) for s in backend}
print("\ndistinct skill-name lengths:", sorted(lengths))

# --- frozenset: an immutable set, so it can be a dict key ---
combo = frozenset({"Python", "SQL"})
stacks = {combo: "data stack"}
print("\nfrozenset key ->", stacks[frozenset({"SQL", "Python"})])
