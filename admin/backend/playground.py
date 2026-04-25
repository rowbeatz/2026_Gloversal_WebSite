"""AI-powered content generation via the multi-provider factory.

The legacy hardcoded Anthropic/OpenAI logic has been replaced with the
provider factory in `ai_providers`. Provider + model are resolved in this
order:
  1. Explicit `provider_id` / `model_id` from the API caller.
  2. `default_provider` / `default_model` from settings.json.
"""

from __future__ import annotations

import json
from typing import Any

import httpx

from ai_providers import (
    PROVIDER_MODELS,
    OllamaProvider,
    get_provider,
)
from settings import get_provider_config, load_settings


SYSTEM_PROMPT = """You are an expert content strategist for Gloversal, Inc. — a healthcare strategy consulting firm based in Tokyo, Japan, with US and European reach. Gloversal bridges medical AI, healthtech, and hospital business development.

Your task: transform rough input (notes, transcripts, ideas, any language) into structured, publication-ready content.

Content quality principles to apply (Princeton GEO methods):
1. Include specific statistics and data points (+29% AEO lift)
2. Include expert-level analysis or quotable insights (+41% AI citation lift)
3. Reference or imply credible industry sources (+28% AI citation lift)
4. Structure with clear H2/H3 sections for scannability
5. Use concrete examples from Japan healthcare market context
6. Body: 400-600 words in each language

Output ONLY valid JSON, no markdown fences. Schema:
{
  "suggested_section": "insights|speaking|cases",
  "reasoning": "one sentence why this section",
  "slug": "kebab-case-max-5-words",
  "tag": "Short Tag (2-3 words)",
  "date": "YYYY-MM",
  "dateLabel": {"ja": "YYYY年M月", "en": "Month YYYY"},
  "title": {"ja": "日本語タイトル", "en": "English Title"},
  "excerpt": {"ja": "日本語要約2文", "en": "English excerpt 2 sentences"},
  "body": {"ja": "<h2>...</h2><p>...</p>", "en": "<h2>...</h2><p>...</p>"},
  "seo_keywords": ["kw1", "kw2", "kw3"],
  "seo_description": "155-char meta description in English",
  "share_text": "SNS share copy in English (under 280 chars)",
  "sources": []
}"""


def _strip_fences(text: str) -> str:
    """Some models ignore the no-fence instruction. Strip them defensively."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Drop the opening fence line (```json or ```)
        first_nl = cleaned.find("\n")
        if first_nl != -1:
            cleaned = cleaned[first_nl + 1 :]
        # Drop the trailing fence
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()
    return cleaned


def _extract_json_object(text: str) -> str:
    """Best-effort isolate the first JSON object in a response."""
    if not text:
        return text
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start : end + 1]
    return text


async def generate_content(
    user_input: str,
    section_hint: str = "",
    provider_id: str = "",
    model_id: str = "",
) -> dict[str, Any]:
    """Generate structured content using the configured AI provider."""
    s = load_settings()
    pid = (provider_id or s.get("default_provider") or "anthropic").strip()
    mid = (model_id or s.get("default_model") or "claude-haiku-4-5-20251001").strip()

    if not mid:
        raise ValueError(f"No model selected for provider '{pid}'")

    hint = f"\n\nSection hint from user: {section_hint}" if section_hint else ""
    user_message = (
        f"Transform this into Gloversal content:{hint}\n\n---\n{user_input}\n---"
    )

    provider = get_provider(pid)
    raw = await provider.generate(SYSTEM_PROMPT, user_message, mid)

    cleaned = _strip_fences(raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try harder: pull out the outermost {...} block.
        try:
            return json.loads(_extract_json_object(cleaned))
        except json.JSONDecodeError as e:
            preview = cleaned[:300].replace("\n", " ")
            raise RuntimeError(
                f"{pid}: model did not return valid JSON. Preview: {preview!r} ({e})"
            ) from e


async def get_available_models(provider_id: str) -> list[str]:
    """Return a list of model ids for a provider.

    Local providers (Ollama, LM Studio) are queried at runtime; the Custom
    provider returns the user's manually-entered comma-separated list; all
    cloud providers return the curated catalog.
    """
    pid = provider_id.strip()
    if pid == "ollama":
        return await OllamaProvider().list_models()

    if pid == "lmstudio":
        cfg = get_provider_config("lmstudio")
        base = (cfg.get("base_url") or "http://host.docker.internal:1234/v1").rstrip("/")
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{base}/models")
                r.raise_for_status()
                return [m["id"] for m in r.json().get("data", [])]
        except Exception:
            return []

    if pid == "custom":
        cfg = get_provider_config("custom")
        ids = cfg.get("model_ids", "") or ""
        return [m.strip() for m in ids.split(",") if m.strip()]

    return [m["id"] for m in PROVIDER_MODELS.get(pid, [])]


# ── oEmbed SNS import (unchanged from original) ──────────────────────────────

OEMBED_ENDPOINTS: dict[str, str | None] = {
    "youtube.com": "https://www.youtube.com/oembed?url={url}&format=json",
    "youtu.be":    "https://www.youtube.com/oembed?url={url}&format=json",
    "twitter.com": "https://publish.twitter.com/oembed?url={url}",
    "x.com":       "https://publish.twitter.com/oembed?url={url}",
    "instagram.com": "https://graph.facebook.com/v18.0/instagram_oembed?url={url}",
    "bsky.app":    "https://embed.bsky.app/oembed?url={url}",
    "linkedin.com": None,  # LinkedIn has no public oEmbed; fall back to iframe
    "threads.net":  None,  # Threads oEmbed not public yet
    "substack.com": None,  # Substack: build iframe from URL pattern
    "note.com":     None,  # note: build iframe from URL pattern
}


async def import_url(url: str) -> dict[str, Any]:
    """Fetch oEmbed or build embed code from SNS URL.

    Returns {embed, thumbnail, title, platform, url}.
    """
    lower = url.lower()
    result: dict[str, Any] = {
        "embed": "",
        "thumbnail": "",
        "title": "",
        "platform": "unknown",
        "url": url,
    }

    for domain, endpoint_tpl in OEMBED_ENDPOINTS.items():
        if domain in lower:
            result["platform"] = domain.split(".")[0]
            if endpoint_tpl:
                endpoint = endpoint_tpl.format(url=url)
                try:
                    async with httpx.AsyncClient(timeout=15) as client:
                        r = await client.get(
                            endpoint, headers={"User-Agent": "Gloversal/1.0"}
                        )
                        if r.status_code == 200:
                            data = r.json()
                            result["embed"] = data.get("html", "")
                            result["thumbnail"] = data.get("thumbnail_url", "")
                            result["title"] = data.get("title", "")
                except Exception:
                    pass  # fall through to manual iframe
            if not result["embed"]:
                result["embed"] = _build_manual_embed(url, result["platform"])
            break

    return result


def _build_manual_embed(url: str, platform: str) -> str:
    if platform == "linkedin":
        return (
            f'<iframe src="https://www.linkedin.com/embed/feed/update/'
            f'{url.split("/")[-1]}" height="399" width="504" '
            f'frameborder="0" allowfullscreen></iframe>'
        )
    if platform == "substack":
        embed_url = url.replace("/p/", "/p/embed/") if "/p/" in url else url
        return (
            f'<iframe src="{embed_url}" width="100%" height="320" '
            f'style="border:none;background:white;" frameborder="0"></iframe>'
        )
    if platform == "note":
        return (
            f'<iframe class="note-embed" src="{url}/embed" '
            f'style="border:0;display:block;max-width:99%;width:494px;'
            f'height:400px;margin:10px auto;" loading="lazy" '
            f'frameborder="0" scrolling="no"></iframe>'
            f'<script async src="https://note.com/scripts/embed.js" '
            f'charset="utf-8"></script>'
        )
    if platform == "threads":
        return (
            f'<blockquote class="text-post-media" '
            f'data-text-post-permalink="{url}" data-text-post-version="0" '
            f'id="ig-tp-embed"><a href="{url}">View on Threads</a></blockquote>'
            f'<script async src="https://www.threads.net/embed/postEmbed.js">'
            f"</script>"
        )
    return f'<iframe src="{url}" width="100%" height="400" frameborder="0"></iframe>'
