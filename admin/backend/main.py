"""Gloversal Admin Panel — FastAPI backend.

Serves the API and static frontend at /admin.
"""

import re

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from auth import authenticate_user, create_token, get_current_user
from content import read_content, write_content
from build_runner import run_build, git_push

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


class BuildRequest(BaseModel):
    commit_msg: str = "chore(admin): content update"


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


# ───────────────────────── Static + Root redirect ─────────────────────────

@app.get("/")
async def root():
    return RedirectResponse(url="/admin/login.html")


# Mount static files last so API routes take precedence
app.mount("/admin", StaticFiles(directory="/app/static", html=True), name="static")
