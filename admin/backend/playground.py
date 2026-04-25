"""AI-powered content generation using Anthropic Claude API (primary) with OpenAI fallback."""

import json
import os

import httpx

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
AI_MODEL = os.getenv("AI_MODEL", "claude-haiku-4-5-20251001")

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


async def generate_content(user_input: str, section_hint: str = "") -> dict:
    """Call Claude API and return structured content dict."""
    hint = f"\n\nSection hint from user: {section_hint}" if section_hint else ""
    user_message = f"Transform this into Gloversal content:{hint}\n\n---\n{user_input}\n---"

    if ANTHROPIC_API_KEY:
        return await _call_anthropic(user_message)
    elif OPENAI_API_KEY:
        return await _call_openai(user_message)
    else:
        raise ValueError(
            "No AI API key configured. Set ANTHROPIC_API_KEY or OPENAI_API_KEY in .env"
        )


async def _call_anthropic(user_message: str) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": AI_MODEL,
                "max_tokens": 4096,
                "system": SYSTEM_PROMPT,
                "messages": [{"role": "user", "content": user_message}],
            },
        )
        resp.raise_for_status()
        text = resp.json()["content"][0]["text"]
        return json.loads(text)


async def _call_openai(user_message: str) -> dict:
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
            },
        )
        resp.raise_for_status()
        return json.loads(resp.json()["choices"][0]["message"]["content"])


# -- oEmbed SNS import --------------------------------------------------------

OEMBED_ENDPOINTS = {
    "youtube.com": "https://www.youtube.com/oembed?url={url}&format=json",
    "youtu.be": "https://www.youtube.com/oembed?url={url}&format=json",
    "twitter.com": "https://publish.twitter.com/oembed?url={url}",
    "x.com": "https://publish.twitter.com/oembed?url={url}",
    "instagram.com": "https://graph.facebook.com/v18.0/instagram_oembed?url={url}",
    "bsky.app": "https://embed.bsky.app/oembed?url={url}",
    "linkedin.com": None,  # LinkedIn has no public oEmbed; fall back to iframe
    "threads.net": None,  # Threads oEmbed not public yet
    "substack.com": None,  # Substack: build iframe from URL pattern
    "note.com": None,  # note: build iframe from URL pattern
}


async def import_url(url: str) -> dict:
    """Fetch oEmbed or build embed code from SNS URL.

    Returns {embed, thumbnail, title, platform}.
    """
    lower = url.lower()
    result = {
        "embed": "",
        "thumbnail": "",
        "title": "",
        "platform": "unknown",
        "url": url,
    }

    # Determine platform
    for domain, endpoint_tpl in OEMBED_ENDPOINTS.items():
        if domain in lower:
            result["platform"] = domain.split(".")[0]
            if endpoint_tpl:
                endpoint = endpoint_tpl.format(url=url)
                try:
                    async with httpx.AsyncClient(timeout=15) as client:
                        r = await client.get(
                            endpoint,
                            headers={"User-Agent": "Gloversal/1.0"},
                        )
                        if r.status_code == 200:
                            data = r.json()
                            result["embed"] = data.get("html", "")
                            result["thumbnail"] = data.get("thumbnail_url", "")
                            result["title"] = data.get("title", "")
                except Exception:
                    pass  # fall through to manual iframe
            # Manual iframe fallbacks
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
