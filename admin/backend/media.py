"""Media upload and listing for the admin panel."""

import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

UPLOAD_DIR = Path("/project/site/assets/images/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg",
    ".mp4", ".webm", ".mov",
}
MAX_SIZE_MB = 50


async def save_upload(file: UploadFile) -> dict:
    """Save an uploaded file to the uploads directory."""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type {ext} not allowed")

    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest = UPLOAD_DIR / unique_name

    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)

    size_mb = dest.stat().st_size / (1024 * 1024)
    if size_mb > MAX_SIZE_MB:
        dest.unlink()
        raise ValueError(f"File too large ({size_mb:.1f}MB, max {MAX_SIZE_MB}MB)")

    return {
        "url": f"/assets/images/uploads/{unique_name}",
        "filename": unique_name,
        "original": file.filename,
        "size_mb": round(size_mb, 2),
        "type": "video" if ext in {".mp4", ".webm", ".mov"} else "image",
    }


def list_uploads() -> list:
    """List all uploaded files, newest first."""
    if not UPLOAD_DIR.exists():
        return []

    files = []
    for f in sorted(
        UPLOAD_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True
    ):
        if f.suffix.lower() in ALLOWED_EXTENSIONS:
            files.append(
                {
                    "url": f"/assets/images/uploads/{f.name}",
                    "filename": f.name,
                    "size_mb": round(f.stat().st_size / (1024 * 1024), 2),
                    "type": (
                        "video"
                        if f.suffix.lower() in {".mp4", ".webm", ".mov"}
                        else "image"
                    ),
                }
            )
    return files
