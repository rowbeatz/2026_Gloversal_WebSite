"""Gloversal Admin Panel — FastAPI backend.

Serves the API and static frontend at /admin.
"""

import json
import re
from typing import Any, List, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile as FastAPIUpload, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from ai_providers import PROVIDER_MODELS, get_provider, known_providers
from auth import authenticate_user, create_token, get_current_user
from content import read_content, write_content
from build_runner import run_build, git_push
from playground import generate_content, get_available_models, import_url
from media import save_upload, list_uploads
from settings import DEFAULT_SETTINGS, load_settings, save_settings

app = FastAPI(title="Gloversal Admin", version="1.0.0")

# CORS — allow all origins for local dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VALID_SECTIONS = {"insights", "speaking", "cases"}


# ───────────────────────── Models ─────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class DateLabel(BaseModel):
    ja: str = ""
    en: str = ""


class BilingualText(BaseModel):
    ja: str = ""
    en: str = ""


class ContentItem(BaseModel):
    slug: str = ""
    date: str = ""
    dateLabel: DateLabel = DateLabel()
    tag: str = ""
    title: BilingualText = BilingualText()
    excerpt: BilingualText = BilingualText()
    body: BilingualText = BilingualText()
    embed: str = ""
    thumbnail: str = ""
    images: List[str] = []
    video: str = ""
    seo_keywords: List[str] = []
    seo_title: str = ""
    seo_description: str = ""
    og_image: str = ""
    reading_time: int = 0
    sources: List[str] = []
    share_text: str = ""


class BuildRequest(BaseModel):
    commit_msg: str = "chore(admin): content update"


class PlaygroundRequest(BaseModel):
    input: str
    section_hint: str = ""
    provider: str = ""
    model: str = ""


class TestProviderRequest(BaseModel):
    provider: str
    model: str = ""


class ImportURLRequest(BaseModel):
    url: str


# ───────────────────────── Auth ─────────────────────────

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    if not authenticate_user(req.username, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    token = create_token(req.username)
    return {"access_token": token, "token_type": "bearer"}


# ───────────────────────── Content CRUD ─────────────────────────

def _validate_section(section: str):
    if section not in VALID_SECTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid section '{section}'. Must be one of: {', '.join(sorted(VALID_SECTIONS))}",
        )


def _slugify(text: str) -> str:
    """Generate a kebab-case slug from text."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


@app.get("/api/content/{section}")
async def list_content(section: str, _user: str = Depends(get_current_user)):
    _validate_section(section)
    data = read_content()
    items = data.get(section, [])
    return {"section": section, "items": items}


@app.post("/api/content/{section}")
async def create_content(section: str, item: ContentItem, _user: str = Depends(get_current_user)):
    _validate_section(section)
    data = read_content()
    items = data.get(section, [])

    # Auto-generate slug from English title if not provided
    if not item.slug:
        if item.title.en:
            item.slug = _slugify(item.title.en)
        else:
            raise HTTPException(status_code=400, detail="Slug or English title is required")

    # Check for duplicate slug
    if any(existing.get("slug") == item.slug for existing in items):
        raise HTTPException(status_code=409, detail=f"Slug '{item.slug}' already exists in {section}")

    new_item = item.model_dump()
    items.insert(0, new_item)  # newest first
    data[section] = items
    write_content(data)
    return {"status": "created", "slug": item.slug}


@app.put("/api/content/{section}/{slug}")
async def update_content(section: str, slug: str, item: ContentItem, _user: str = Depends(get_current_user)):
    _validate_section(section)
    data = read_content()
    items = data.get(section, [])

    for i, existing in enumerate(items):
        if existing.get("slug") == slug:
            updated = item.model_dump()
            updated["slug"] = slug  # preserve original slug
            items[i] = updated
            data[section] = items
            write_content(data)
            return {"status": "updated", "slug": slug}

    raise HTTPException(status_code=404, detail=f"Item '{slug}' not found in {section}")


@app.delete("/api/content/{section}/{slug}")
async def delete_content(section: str, slug: str, _user: str = Depends(get_current_user)):
    _validate_section(section)
    data = read_content()
    items = data.get(section, [])

    for i, existing in enumerate(items):
        if existing.get("slug") == slug:
            items.pop(i)
            data[section] = items
            write_content(data)
            return {"status": "deleted", "slug": slug}

    raise HTTPException(status_code=404, detail=f"Item '{slug}' not found in {section}")


# ───────────────────────── Build / Deploy ─────────────────────────

@app.post("/api/build")
async def build_site(_user: str = Depends(get_current_user)):
    result = run_build()
    return result


@app.post("/api/deploy")
async def deploy_site(req: BuildRequest = BuildRequest(), _user: str = Depends(get_current_user)):
    build_result = run_build()
    if build_result["returncode"] != 0:
        return {"build": build_result, "deploy": None, "error": "Build failed"}
    deploy_result = git_push(req.commit_msg)
    return {"build": build_result, "deploy": deploy_result}


# ───────────────────────── AI Playground ─────────────────────────

@app.post("/api/playground/generate")
async def playground_generate(req: PlaygroundRequest, _user: str = Depends(get_current_user)):
    try:
        result = await generate_content(
            req.input, req.section_hint, req.provider, req.model
        )
        provider_used = req.provider or load_settings().get("default_provider", "")
        model_used = req.model or load_settings().get("default_model", "")
        return {
            "status": "ok",
            "content": result,
            "provider": provider_used,
            "model": model_used,
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI API error: {str(e)}")


@app.post("/api/playground/import-url")
async def playground_import(req: ImportURLRequest, _user: str = Depends(get_current_user)):
    result = await import_url(req.url)
    return result


# ───────────────────────── Media Upload ─────────────────────────

@app.post("/api/media/upload")
async def media_upload(file: FastAPIUpload = File(...), _user: str = Depends(get_current_user)):
    try:
        result = await save_upload(file)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/media/list")
async def media_list(_user: str = Depends(get_current_user)):
    return {"files": list_uploads()}


# ───────────────────────── Settings ─────────────────────────

_KEY_FIELDS = {"api_key"}  # fields that should be masked when read by the UI


def _mask_secret(value: str) -> str:
    if not isinstance(value, str) or not value:
        return ""
    return "••••" + value[-4:] if len(value) > 4 else "••••"


@app.get("/api/settings")
async def get_settings(_user: str = Depends(get_current_user)):
    s = load_settings()
    masked = json.loads(json.dumps(s))  # deep copy via JSON roundtrip
    for prov, cfg in masked.get("providers", {}).items():
        for field in _KEY_FIELDS:
            if field in cfg and cfg[field]:
                cfg[field] = _mask_secret(cfg[field])
    return masked


@app.post("/api/settings")
async def update_settings(data: dict, _user: str = Depends(get_current_user)):
    current = load_settings()
    incoming_providers = (data or {}).get("providers", {}) or {}

    for prov, cfg in incoming_providers.items():
        if not isinstance(cfg, dict):
            continue
        bucket = current["providers"].setdefault(prov, {})
        for k, v in cfg.items():
            # Preserve the existing key if the UI sent back the masked placeholder.
            if k in _KEY_FIELDS and isinstance(v, str) and v.startswith("••••"):
                continue
            bucket[k] = v

    if "default_provider" in (data or {}):
        current["default_provider"] = data["default_provider"]
    if "default_model" in (data or {}):
        current["default_model"] = data["default_model"]

    try:
        save_settings(current)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"Failed to persist settings: {e}")
    return {"status": "saved"}


# ───────────────────────── AI provider / model discovery ─────────────────────────

@app.get("/api/ai/providers")
async def list_providers(_user: str = Depends(get_current_user)):
    s = load_settings()
    result = []
    for pid in known_providers():
        cfg = s.get("providers", {}).get(pid, {})
        models = PROVIDER_MODELS.get(pid, [])
        # "configured" means: has either an api_key or a base_url set.
        has_key = bool((cfg.get("api_key") or "").strip())
        has_url = bool((cfg.get("base_url") or "").strip())
        result.append({
            "id": pid,
            "enabled": bool(cfg.get("enabled", False)),
            "configured": has_key or has_url,
            "has_key": has_key,
            "has_base_url": has_url,
            "models": models,
            "dynamic_models": pid in {"ollama", "lmstudio", "custom"},
        })
    return {
        "providers": result,
        "default_provider": s.get("default_provider", ""),
        "default_model": s.get("default_model", ""),
    }


@app.get("/api/ai/models/{provider_id}")
async def list_models(provider_id: str, _user: str = Depends(get_current_user)):
    if provider_id not in PROVIDER_MODELS:
        raise HTTPException(status_code=404, detail=f"Unknown provider: {provider_id}")
    models = await get_available_models(provider_id)
    return {"provider": provider_id, "models": models}


@app.post("/api/ai/test")
async def test_provider(req: TestProviderRequest, _user: str = Depends(get_current_user)):
    try:
        provider = get_provider(req.provider)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Pick a sensible default model if the caller didn't specify one.
    model = req.model.strip()
    if not model:
        models = await get_available_models(req.provider)
        if not models:
            return {
                "status": "error",
                "error": f"No model available for {req.provider}. Configure model_ids or pull/download one.",
            }
        model = models[0]

    try:
        text = await provider.generate(
            "You are a test assistant. Reply with valid JSON only.",
            'Say hello in JSON: {"message": "..."}',
            model,
        )
        return {"status": "ok", "model": model, "response": (text or "")[:300]}
    except Exception as e:
        return {"status": "error", "model": model, "error": str(e)}


# ───────────────────────── Static + Root redirect ─────────────────────────

@app.get("/")
async def root():
    return RedirectResponse(url="/admin/login.html")


# Mount static files last so API routes take precedence
app.mount("/admin", StaticFiles(directory="/app/static", html=True), name="static")
