"""A small module of text helpers, imported by main.py.

A "module" is just a .py file. Anything defined at the top level of this file
can be imported by other files.
"""

# Module-level constant - importers see this as text_utils.VOWELS
VOWELS = "aeiou"


def slugify(text):
    """Turn 'Hello World!' into 'hello-world'."""
    cleaned = "".join(ch if ch.isalnum() or ch.isspace() else "" for ch in text)
    return "-".join(cleaned.lower().split())


def count_vowels(text):
    """Count vowels in text, case-insensitive."""
    return sum(1 for ch in text.lower() if ch in VOWELS)


def truncate(text, limit=20):
    """Shorten text to `limit` characters, adding an ellipsis."""
    return text if len(text) <= limit else text[: limit - 3] + "..."


# This block runs only when the file is executed directly
# (python text_utils.py), NOT when it is imported. Handy for quick self-tests.
if __name__ == "__main__":
    print("Self-test of text_utils")
    print(" slugify     :", slugify("Learning Python for AI!"))
    print(" count_vowels:", count_vowels("Education"))
    print(" truncate    :", truncate("A fairly long sentence here"))
