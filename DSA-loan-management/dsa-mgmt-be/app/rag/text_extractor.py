from pathlib import Path
from typing import List, Dict, Any, Optional
try:
    import pymupdf as fitz
except ImportError:
    import fitz  # Fallback for older PyMuPDF versions
from app.rag.config import rag_config


def extract_chunks_from_file(
    file_path: Path,
    chunk_size: Optional[int] = None,
    chunk_overlap: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """
    Extracts text from PDF or text documents and returns overlapping chunks with page metadata.
    """
    size = chunk_size or rag_config.chunk_size
    overlap = chunk_overlap or rag_config.chunk_overlap

    chunks: List[Dict[str, Any]] = []
    if not file_path.exists():
        return chunks

    ext = file_path.suffix.lower()

    if ext == ".pdf":
        try:
            doc = fitz.open(str(file_path))
            for page_idx, page in enumerate(doc):
                page_text = page.get_text().strip()
                if not page_text:
                    continue

                # Split page text into overlapping windows
                start = 0
                while start < len(page_text):
                    end = start + size
                    chunk = page_text[start:end].strip()
                    if chunk:
                        chunks.append({
                            "text": chunk,
                            "page_number": page_idx + 1,
                        })
                    start += (size - overlap)
            doc.close()
        except Exception as e:
            print(f"[RAG] Error reading PDF {file_path}: {e}")
    else:
        # Text/DOC files
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read().strip()
            if content:
                start = 0
                chunk_idx = 1
                while start < len(content):
                    end = start + size
                    chunk = content[start:end].strip()
                    if chunk:
                        chunks.append({
                            "text": chunk,
                            "page_number": chunk_idx,
                        })
                        chunk_idx += 1
                    start += (size - overlap)
        except Exception as e:
            print(f"[RAG] Error reading text document {file_path}: {e}")

    return chunks
