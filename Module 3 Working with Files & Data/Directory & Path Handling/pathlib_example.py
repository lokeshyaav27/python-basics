"""Directories and paths with `pathlib` (the modern replacement for os.path)."""

import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent
print("this file :", Path(__file__).name)
print("folder    :", HERE)

# --- Building paths: use / instead of string concatenation ---
# It picks the right separator for the OS automatically.
target = HERE / "workspace" / "reports" / "q3.txt"
print("\njoined path :", target)
print("as posix    :", target.as_posix())

# --- Path components ---
print("\nname     :", target.name)
print("stem     :", target.stem)
print("suffix   :", target.suffix)
print("parent   :", target.parent.name)
print("parents  :", [p.name for p in target.parents][:3])
print("parts    :", target.parts[-3:])

# --- Changing pieces of a path ---
print("\nwith_suffix('.md') :", target.with_suffix(".md").name)
print("with_name('q4.txt'):", target.with_name("q4.txt").name)

# --- Creating directories ---
WORKSPACE = HERE / "workspace"
(WORKSPACE / "reports").mkdir(parents=True, exist_ok=True)   # parents=True = mkdir -p
(WORKSPACE / "logs").mkdir(exist_ok=True)                    # exist_ok = no error if present
(WORKSPACE / "archive" / "2025").mkdir(parents=True, exist_ok=True)
print("\ncreated workspace/ tree")

# --- Create some files to explore ---
(WORKSPACE / "reports" / "q3.txt").write_text("Q3 revenue: 120000\n", encoding="utf-8")
(WORKSPACE / "reports" / "q4.txt").write_text("Q4 revenue: 145000\n", encoding="utf-8")
(WORKSPACE / "reports" / "summary.md").write_text("# Summary\n", encoding="utf-8")
(WORKSPACE / "logs" / "app.log").write_text("INFO started\n", encoding="utf-8")
(WORKSPACE / "archive" / "2025" / "old.txt").write_text("archived\n", encoding="utf-8")
(WORKSPACE / "notes.txt").write_text("top level note\n", encoding="utf-8")

# --- Existence and type checks ---
print("\nexists()  :", WORKSPACE.exists())
print("is_dir()  :", WORKSPACE.is_dir())
print("is_file() :", (WORKSPACE / "notes.txt").is_file())
print("missing   :", (WORKSPACE / "nope.txt").exists())

# --- Listing one level: iterdir() ---
print("\niterdir() on workspace/:")
for item in sorted(WORKSPACE.iterdir()):
    kind = "DIR " if item.is_dir() else "FILE"
    print(f"  {kind} {item.name}")

# --- glob(): one level, with a pattern ---
print("\nglob('*.txt') in workspace/     :", [p.name for p in WORKSPACE.glob("*.txt")])
print("glob('reports/*.txt')           :", [p.name for p in WORKSPACE.glob("reports/*.txt")])

# --- rglob() / '**': recursive search ---
print("\nrglob('*.txt') everywhere:")
for path in sorted(WORKSPACE.rglob("*.txt")):
    print("  ", path.relative_to(WORKSPACE))

all_files = [p for p in WORKSPACE.rglob("*") if p.is_file()]
print("\ntotal files:", len(all_files))
print("total bytes:", sum(p.stat().st_size for p in all_files))

# --- File metadata via stat() ---
from datetime import datetime

report = WORKSPACE / "reports" / "q4.txt"
info = report.stat()
print(f"\n{report.name}: {info.st_size} bytes, "
      f"modified {datetime.fromtimestamp(info.st_mtime):%Y-%m-%d %H:%M}")

# --- Grouping files by extension ---
by_ext = {}
for path in all_files:
    by_ext.setdefault(path.suffix or "(none)", []).append(path.name)
print("\nby extension:", by_ext)

# --- Copying, moving, renaming ---
copied = WORKSPACE / "logs" / "app.log.bak"
shutil.copy2(WORKSPACE / "logs" / "app.log", copied)     # copy2 keeps timestamps
print("\ncopied  :", copied.name)

moved = WORKSPACE / "archive" / "notes.txt"
(WORKSPACE / "notes.txt").rename(moved)                  # rename == move
print("moved   :", moved.relative_to(WORKSPACE))

renamed = moved.with_name("notes_archived.txt")
moved.rename(renamed)
print("renamed :", renamed.name)

# --- Deleting ---
copied.unlink()                       # delete a file
print("\ndeleted :", copied.name)
(WORKSPACE / "empty_dir").mkdir(exist_ok=True)
(WORKSPACE / "empty_dir").rmdir()     # only works on an EMPTY directory
print("rmdir'd empty_dir")
# unlink(missing_ok=True) avoids an error when the file is already gone
(WORKSPACE / "ghost.txt").unlink(missing_ok=True)

# --- Absolute vs relative, and cwd ---
print("\ncwd()         :", Path.cwd())
print("home()        :", Path.home())
print("relative form :", report.relative_to(HERE))
print("is_absolute   :", report.is_absolute())

# --- Cross-platform note ---
print("\nBackslashes in Windows strings need care:")
print(r"  raw string: r'C:\Users\lokesh'  <- recommended")
print("  pathlib avoids the problem entirely:", Path("C:/") / "Users" / "lokesh")

# --- Recursively removing the whole tree ---
shutil.rmtree(WORKSPACE)
print("\ncleaned up workspace/ - exists now:", WORKSPACE.exists())
