"""Working with strings."""

text = "  Learning Python for AI  "

# --- Cleaning and case ---
print("original :", repr(text))
print("strip    :", repr(text.strip()))
print("upper    :", text.strip().upper())
print("lower    :", text.strip().lower())
print("title    :", text.strip().title())

clean = text.strip()

# --- Indexing and slicing (0-based; end is exclusive) ---
print("\nfirst char :", clean[0])
print("last char  :", clean[-1])
print("first 8    :", clean[:8])
print("last 2     :", clean[-2:])
print("every 2nd  :", clean[::2])
print("reversed   :", clean[::-1])

# --- Searching and testing ---
print("\nlength        :", len(clean))
print("'Python' in?  :", "Python" in clean)
print("index of 'Py' :", clean.find("Python"))
print("count of 'n'  :", clean.count("n"))
print("startswith    :", clean.startswith("Learning"))
print("endswith      :", clean.endswith("AI"))

# --- Splitting and joining ---
words = clean.split()                    # split on whitespace
print("\nwords    :", words)
print("joined   :", "-".join(words))
csv_row = "name,age,city"
print("split ',':", csv_row.split(","))

# --- Replacing ---
print("\nreplace:", clean.replace("Python", "Py"))

# --- Formatting: f-strings ---
user, score = "Lokesh", 92.4567
print(f"\n{user} scored {score:.2f}%")
print(f"padded    : |{user:>12}| |{user:<12}| |{user:^12}|")
print(f"as percent: {0.876:.1%}")

# --- Multi-line strings and escapes ---
block = """Line one
Line two
Line three"""
print("\n" + block)
print("Tab:\tDone | Quote: \"quoted\" | Backslash: \\")

# --- Strings are immutable: methods return new strings ---
original = "hello"
shouted = original.upper()
print(f"\noriginal is still {original!r}, new value is {shouted!r}")
