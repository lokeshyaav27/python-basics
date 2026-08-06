"""Working with PDF files.

Reading and writing PDFs needs a third-party library:
    pip install pypdf

This script still runs without it: it generates a small valid PDF using only
the standard library, then uses pypdf for the reading part if it is installed.
"""

from pathlib import Path

HERE = Path(__file__).parent
SAMPLE = HERE / "sample.pdf"


# --------------------------------------------------------------------------
# Part 1 - build a minimal PDF by hand (stdlib only)
# A PDF is a set of numbered objects plus a cross-reference table of their
# byte offsets. You would normally use reportlab or fpdf2 instead of this.
# --------------------------------------------------------------------------
def build_pdf(lines):
    def escape(text):
        return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")

    # A content stream: begin text, pick font/size, set leading, draw lines.
    content = "BT /F1 16 Tf 24 TL 72 760 Td\n"
    for line in lines:
        content += f"({escape(line)}) Tj T*\n"
    content += "ET"
    stream = content.encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]

    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"

    xref_start = len(out)
    out += f"xref\n0 {len(objects) + 1}\n".encode()
    out += b"0000000000 65535 f \n"
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\n"
        f"startxref\n{xref_start}\n%%EOF\n"
    ).encode()
    return bytes(out)


SAMPLE.write_bytes(build_pdf([
    "Module 3 - PDF Files",
    "",
    "This PDF was generated with the standard library.",
    "Install pypdf to extract text, merge and split files.",
    "Page 1 of 1",
]))
print(f"created {SAMPLE.name} ({SAMPLE.stat().st_size} bytes)")

# Every PDF starts with the magic bytes %PDF
print("header:", SAMPLE.read_bytes()[:8])


# --------------------------------------------------------------------------
# Part 2 - read it with pypdf
# --------------------------------------------------------------------------
try:
    from pypdf import PdfReader, PdfWriter
except ImportError:
    print("\npypdf is not installed - skipping the reading section.")
    print("Install it with:  pip install pypdf")
    raise SystemExit(0)

reader = PdfReader(SAMPLE)
print("\npages       :", len(reader.pages))
print("metadata    :", dict(reader.metadata or {}))
print("is encrypted:", reader.is_encrypted)

# --- Extracting text, page by page ---
print("\n--- extracted text ---")
for number, page in enumerate(reader.pages, start=1):
    text = page.extract_text() or ""
    print(f"[page {number}]")
    for line in text.splitlines():
        print("  ", line)

# --- Page geometry ---
box = reader.pages[0].mediabox
print(f"\npage size: {float(box.width):.0f} x {float(box.height):.0f} pt (A4)")

# --- Searching across the document ---
needle = "pypdf"
hits = [n for n, p in enumerate(reader.pages, 1) if needle in (p.extract_text() or "")]
print(f"'{needle}' found on pages: {hits or 'nowhere'}")

# --- Merging: build a 3-page file out of the same page repeated ---
MERGED = HERE / "merged.pdf"
writer = PdfWriter()
for _ in range(3):
    writer.append(SAMPLE)
with open(MERGED, "wb") as f:      # note: binary mode
    writer.write(f)
print(f"\nmerged into {MERGED.name}: {len(PdfReader(MERGED).pages)} pages")

# --- Splitting: pull one page into its own file ---
SPLIT = HERE / "page_two.pdf"
single = PdfWriter()
single.add_page(PdfReader(MERGED).pages[1])
with open(SPLIT, "wb") as f:
    single.write(f)
print(f"split page 2 into {SPLIT.name}: {len(PdfReader(SPLIT).pages)} page")

# --- Rotating and adding metadata ---
ROTATED = HERE / "rotated.pdf"
rot = PdfWriter()
page = PdfReader(SAMPLE).pages[0]
page.rotate(90)
rot.add_page(page)
rot.add_metadata({"/Title": "Rotated sample", "/Author": "Lokesh"})
with open(ROTATED, "wb") as f:
    rot.write(f)
print(f"\nwrote {ROTATED.name}, metadata:", dict(PdfReader(ROTATED).metadata))

# --- Password protecting a PDF ---
LOCKED = HERE / "locked.pdf"
secure = PdfWriter()
secure.add_page(PdfReader(SAMPLE).pages[0])
secure.encrypt("hunter2")
with open(LOCKED, "wb") as f:
    secure.write(f)

locked_reader = PdfReader(LOCKED)
print(f"\n{LOCKED.name} encrypted:", locked_reader.is_encrypted)
locked_reader.decrypt("hunter2")
print("after decrypt, text starts:", (locked_reader.pages[0].extract_text() or "")[:24])
