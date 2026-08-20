import os
from io import BytesIO
from pathlib import Path
from typing import Optional, Tuple
from uuid import uuid4
from PIL import Image
from fastapi import HTTPException, UploadFile


def get_storage_path(subfolder: str) -> Path:
    """
    Returns the absolute path to a subfolder inside dsa-file-storage and ensures it exists.
    """
    project_root = Path(__file__).resolve().parents[2]
    storage = project_root / 'dsa-file-storage' / subfolder
    storage.mkdir(parents=True, exist_ok=True)
    return storage


def validate_and_save_image(
    file: UploadFile,
    subfolder: str,
    max_size_mb: int = 3,
    target_ratio: Optional[float] = None,
    ratio_tolerance: float = 0.08,
) -> str:
    """
    Validates image file size, integrity, and optional aspect ratio, then saves it to disk.
    Returns the generated unique filename.
    """
    contents = file.file.read()
    size_limit = max_size_mb * 1024 * 1024
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail=f"File too large; max {max_size_mb}MB")

    try:
        img = Image.open(BytesIO(contents))
        width, height = img.size
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file")

    if target_ratio is not None and height > 0:
        ratio = width / height
        if abs(ratio - target_ratio) > ratio_tolerance:
            raise HTTPException(
                status_code=400,
                detail=f"Image aspect ratio must be ~{target_ratio:.2f} (width:height). Detected ratio: {ratio:.2f}",
            )

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    fname = f"{uuid4().hex}{ext}"
    storage = get_storage_path(subfolder)
    with open(storage / fname, "wb") as f:
        f.write(contents)
    return fname


def validate_and_save_document(
    file: UploadFile,
    subfolder: str,
    max_size_mb: int = 25,
    allowed_extensions: Tuple[str, ...] = (".pdf", ".txt", ".doc", ".docx"),
) -> str:
    """
    Validates document file size and allowed extension, then saves it to disk.
    Returns the generated unique filename.
    """
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="File is required")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        ext_list = ", ".join([e.upper().replace(".", "") for e in allowed_extensions])
        raise HTTPException(status_code=400, detail=f"Only {ext_list} documents are accepted")

    contents = file.file.read()
    size_limit = max_size_mb * 1024 * 1024
    if len(contents) > size_limit:
        raise HTTPException(status_code=400, detail=f"Document too large; max {max_size_mb}MB")

    fname = f"{uuid4().hex}{ext}"
    storage = get_storage_path(subfolder)
    with open(storage / fname, "wb") as f:
        f.write(contents)
    return fname


def delete_storage_file(filename: str, subfolder: str) -> bool:
    """
    Safely deletes a file from the specified storage subfolder if it exists.
    """
    try:
        storage = get_storage_path(subfolder)
        file_path = storage / filename
        if file_path.exists():
            file_path.unlink()
            return True
    except Exception:
        pass
    return False
