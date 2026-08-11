"""Reading and writing text files.

Everything happens in a `sample_data/` folder next to this script,
so the example is safe to run repeatedly.
"""

from pathlib import Path

HERE = Path(__file__).parent
DATA_DIR = HERE / "sample_data"
DATA_DIR.mkdir(exist_ok=True)
NOTES = DATA_DIR / "notes.txt"

# --- Writing: "w" creates or TRUNCATES the file ---
# Always use `with` - it closes the file even if an error is raised.
# Always pass encoding="utf-8" on Windows, or you get the system codepage.
with open(NOTES, "w", encoding="utf-8") as f:
    f.write("Line one\n")
    f.write("Line two\n")
    f.writelines(["Line three\n", "Line four\n"])

print("wrote:", NOTES.name, f"({NOTES.stat().st_size} bytes)")

# --- Appending: "a" adds to the end ---
with open(NOTES, "a", encoding="utf-8") as f:
    f.write("Appended line\n")

# --- Reading the whole file at once ---
with open(NOTES, encoding="utf-8") as f:      # "r" is the default mode
    content = f.read()
print("\n--- read() ---")
print(content, end="")

# --- Reading into a list of lines ---
with open(NOTES, encoding="utf-8") as f:
    lines = f.readlines()
print("\nreadlines ->", len(lines), "lines")
print("stripped  ->", [line.strip() for line in lines])

# --- Reading line by line: memory-friendly for large files ---
print("\n--- line by line ---")
with open(NOTES, encoding="utf-8") as f:
    for number, line in enumerate(f, start=1):
        print(f"  {number}: {line.rstrip()}")

# --- Pathlib shortcuts for small files ---
QUICK = DATA_DIR / "quick.txt"
QUICK.write_text("Written via pathlib\n", encoding="utf-8")
print("\npathlib read_text:", QUICK.read_text(encoding="utf-8").strip())

# --- "x" mode fails if the file already exists (no accidental overwrite) ---
try:
    with open(NOTES, "x", encoding="utf-8") as f:
        f.write("never gets here")
except FileExistsError:
    print("\n'x' mode refused to overwrite an existing file")

# --- Reading a file that does not exist ---
try:
    open(DATA_DIR / "missing.txt", encoding="utf-8")
except FileNotFoundError as err:
    print("FileNotFoundError:", err.filename)

# --- Binary mode: no encoding, you get bytes ---
BLOB = DATA_DIR / "blob.bin"
BLOB.write_bytes(b"\x89PNG\r\n\x1a\n")
header = BLOB.read_bytes()
print("\nbinary bytes:", header)
print("is a PNG header:", header.startswith(b"\x89PNG"))

# --- A tiny practical task: filter a file into a new one ---
LOG = DATA_DIR / "app.log"
LOG.write_text(
    "INFO  server started\n"
    "ERROR db connection failed\n"
    "INFO  retrying\n"
    "ERROR timeout after 30s\n",
    encoding="utf-8",
)

ERRORS = DATA_DIR / "errors.log"
with open(LOG, encoding="utf-8") as src, open(ERRORS, "w", encoding="utf-8") as dst:
    error_count = 0
    for line in src:
        if line.startswith("ERROR"):
            dst.write(line)
            error_count += 1

print(f"\nextracted {error_count} error lines into {ERRORS.name}")
print(ERRORS.read_text(encoding="utf-8"), end="")

# --- Cleaning up (comment out if you want to inspect the files) ---
# import shutil; shutil.rmtree(DATA_DIR)
print(f"\nFiles left in {DATA_DIR.name}/:", sorted(p.name for p in DATA_DIR.iterdir()))
