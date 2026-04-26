"""Media URL helpers — extract YouTube/Vimeo IDs, derive thumbnails,
and normalize legacy thumbnail/video/images fields into a unified media[]
shape used by the admin editor and the static-page renderer.

Single source of truth for "how do we turn an arbitrary media reference
into something we know how to render".
"""
import re
from typing import Optional

YOUTUBE_PATTERNS = [
    r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/v/|youtube\.com/shorts/)([A-Za-z0-9_-]{11})",
]
VIMEO_PATTERNS = [
    r"vimeo\.com/(?:video/|channels/[^/]+/)?(\d+)",
    r"player\.vimeo\.com/video/(\d+)",
]


def youtube_id(url: str) -> Optional[str]:
    if not url:
        return None
    for p in YOUTUBE_PATTERNS:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def vimeo_id(url: str) -> Optional[str]:
    if not url:
        return None
    for p in VIMEO_PATTERNS:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


def youtube_thumb(video_id: str, quality: str = "maxresdefault") -> str:
    """Return YouTube thumbnail URL.

    Quality choices: maxresdefault, hqdefault, mqdefault, sddefault.
    """
    return f"https://i.ytimg.com/vi/{video_id}/{quality}.jpg"


def detect_media_type(url: str) -> dict:
    """Given any URL, return a dict with keys
    {type, id, src, poster, alt, title} describing its rendered shape.

    type ∈ {"image", "video", "youtube", "vimeo"}
    """
    if not url:
        return {"type": "image", "id": "", "src": "", "poster": "", "alt": "", "title": ""}

    yid = youtube_id(url)
    if yid:
        return {
            "type": "youtube",
            "id": yid,
            "src": "",
            "poster": youtube_thumb(yid),
            "alt": "",
            "title": "",
        }
    vid = vimeo_id(url)
    if vid:
        return {
            "type": "vimeo",
            "id": vid,
            "src": "",
            "poster": "",
            "alt": "",
            "title": "",
        }
    # Otherwise assume direct file
    if any(url.lower().endswith(ext) for ext in [".mp4", ".webm", ".mov"]):
        return {
            "type": "video",
            "id": "",
            "src": url,
            "poster": "",
            "alt": "",
            "title": "",
        }
    return {
        "type": "image",
        "id": "",
        "src": url,
        "poster": "",
        "alt": "",
        "title": "",
    }


def _coerce_media_dict(m) -> dict:
    """Make sure each media entry has the full set of keys we render against."""
    if not isinstance(m, dict):
        return {"type": "image", "id": "", "src": "", "poster": "", "alt": "", "title": ""}
    return {
        "type": m.get("type", "image") or "image",
        "id": m.get("id", "") or "",
        "src": m.get("src", "") or "",
        "poster": m.get("poster", "") or "",
        "alt": m.get("alt", "") or "",
        "title": m.get("title", "") or "",
    }


def normalize_legacy(item: dict) -> list:
    """Build a media[] from an item dict.

    If the item already has a non-empty media[] field, return that as-is
    (with full key coverage). Otherwise, derive media[] from the legacy
    thumbnail/video/images fields so existing content keeps rendering.
    """
    existing = item.get("media") if isinstance(item, dict) else None
    if existing:
        return [_coerce_media_dict(m) for m in existing]

    media = []

    # Title for alt text fallback
    title = ""
    raw_title = item.get("title", "") if isinstance(item, dict) else ""
    if isinstance(raw_title, dict):
        title = raw_title.get("ja") or raw_title.get("en") or ""
    elif isinstance(raw_title, str):
        title = raw_title

    thumb = item.get("thumbnail", "") if isinstance(item, dict) else ""
    if thumb:
        media.append({
            "type": "image",
            "src": thumb,
            "id": "",
            "poster": "",
            "alt": title,
            "title": "",
        })

    video = item.get("video", "") if isinstance(item, dict) else ""
    if video:
        media.append(detect_media_type(video))

    images = item.get("images", []) if isinstance(item, dict) else []
    if images:
        for img in images:
            if img:
                media.append({
                    "type": "image",
                    "src": img,
                    "id": "",
                    "poster": "",
                    "alt": "",
                    "title": "",
                })

    return media
