"""AI provider factory.

Every provider exposes one async method `generate(system, user, model) -> str`.
The OpenAI-compatible class covers OpenAI itself plus all OpenAI-compatible
endpoints (Mistral, Groq, Together, Perplexity, DeepSeek, LM Studio, Custom).
Anthropic, Google Gemini, Cohere, and Ollama have their own bespoke wrappers.
"""

from __future__ import annotations

import os
from abc import ABC, abstractmethod
from typing import Any

import httpx

from settings import get_provider_config


# ── Fallback model catalog (used when the live /v1/models endpoint is unreachable) ──
# When the user has a working API key, we ALWAYS prefer the live list over this.
PROVIDER_MODELS: dict[str, list[dict[str, str]]] = {
    "anthropic": [
        {"id": "claude-opus-4-7",   "label": "Claude Opus 4.7"},
        {"id": "claude-sonnet-4-6", "label": "Claude Sonnet 4.6"},
        {"id": "claude-haiku-4-5",  "label": "Claude Haiku 4.5"},
    ],
    "openai": [
        {"id": "gpt-4o",        "label": "GPT-4o"},
        {"id": "gpt-4o-mini",   "label": "GPT-4o mini (低コスト)"},
        {"id": "o1-preview",    "label": "o1-preview (推論特化)"},
        {"id": "o1-mini",       "label": "o1-mini"},
        {"id": "gpt-4-turbo",   "label": "GPT-4 Turbo"},
    ],
    "google": [
        {"id": "gemini-2.0-flash-exp",  "label": "Gemini 2.0 Flash"},
        {"id": "gemini-1.5-pro",        "label": "Gemini 1.5 Pro"},
        {"id": "gemini-1.5-flash",      "label": "Gemini 1.5 Flash (高速)"},
    ],
    "mistral": [
        {"id": "mistral-large-latest",  "label": "Mistral Large"},
        {"id": "mistral-medium-latest", "label": "Mistral Medium"},
        {"id": "open-mistral-nemo",     "label": "Mistral Nemo (軽量)"},
    ],
    "groq": [
        {"id": "llama-3.3-70b-versatile",  "label": "Llama 3.3 70B (超高速)"},
        {"id": "llama-3.1-8b-instant",     "label": "Llama 3.1 8B Instant"},
        {"id": "mixtral-8x7b-32768",       "label": "Mixtral 8x7B"},
        {"id": "gemma2-9b-it",             "label": "Gemma2 9B"},
    ],
    "together": [
        {"id": "meta-llama/Llama-3.3-70B-Instruct-Turbo", "label": "Llama 3.3 70B Turbo"},
        {"id": "deepseek-ai/DeepSeek-V3",                 "label": "DeepSeek V3"},
        {"id": "Qwen/QwQ-32B-Preview",                    "label": "QwQ 32B"},
    ],
    "perplexity": [
        {"id": "sonar-reasoning-pro", "label": "Sonar Reasoning Pro"},
        {"id": "sonar-reasoning",     "label": "Sonar Reasoning"},
        {"id": "sonar-pro",           "label": "Sonar Pro"},
        {"id": "sonar",               "label": "Sonar"},
    ],
    "cohere": [
        {"id": "command-r-plus", "label": "Command R+"},
        {"id": "command-r",      "label": "Command R"},
    ],
    "deepseek": [
        {"id": "deepseek-chat",     "label": "DeepSeek V3"},
        {"id": "deepseek-reasoner", "label": "DeepSeek R1 (推論特化)"},
    ],
    "ollama":   [],  # populated dynamically from /api/tags
    "lmstudio": [],  # populated dynamically from /v1/models
    "custom":   [],  # user defines model IDs as comma-separated list
}


# ──────────────────────────────────────────────────────────────────────────────
# Model scoring — used to rank "best" model per provider so the UI can
# auto-select a strong default once we have the live model list from the API.
# Higher score = more capable. 0 = not a chat model (filter out).
# ──────────────────────────────────────────────────────────────────────────────

def score_model(provider_id: str, model_id: str) -> int:
    """Return a 0-100 capability score for ranking. 0 means filter out."""
    if not model_id:
        return 0
    m = model_id.lower()
    score = 50  # baseline

    # Penalize deprecated / legacy date-stamped builds where a better alias exists.
    if any(x in m for x in [
        "deprecated", "legacy",
        "0301", "0613", "0314", "1106",
        "vision-preview", "instruct-0914",
    ]):
        score -= 30

    # Exclude embedding / audio / image-gen / safety models — we want chat completions only.
    if any(x in m for x in [
        "embed", "embedding",
        "tts", "whisper", "audio", "voice", "speech",
        "dall-e", "stable-diffusion", "imagen", "image-generation",
        "flash-image", "flash-image-preview",  # Gemini image-gen variants
        "veo", "lyria",                          # Google video/music models
        "guard", "moderation", "safety",
        "rerank",
        "live-",                                 # streaming/realtime variants
    ]):
        return 0

    # ── Anthropic ────────────────────────────────────────────────────────────
    if provider_id == "anthropic":
        if "opus-4" in m: score = 100
        elif "sonnet-4" in m: score = 90
        elif "haiku-4" in m: score = 80
        elif "opus-3" in m: score = 70
        elif "sonnet-3.5" in m or "sonnet-3-5" in m: score = 65
        elif "haiku-3.5" in m or "haiku-3-5" in m: score = 60
        elif "opus" in m: score = 55
        elif "sonnet" in m: score = 50
        elif "haiku" in m: score = 45

    # ── OpenAI ───────────────────────────────────────────────────────────────
    elif provider_id == "openai":
        if m.startswith("gpt-5"): score = 100
        elif m.startswith("o3") or m.startswith("o4"): score = 95
        elif "gpt-4.5" in m or "gpt-4-5" in m: score = 92
        elif m.startswith("o1") and "mini" not in m: score = 88
        elif "gpt-4o" in m and "mini" not in m: score = 85
        elif "o3-mini" in m or "o4-mini" in m: score = 80
        elif "o1-mini" in m: score = 75
        elif "gpt-4o-mini" in m: score = 70
        elif "gpt-4-turbo" in m: score = 65
        elif "gpt-4" in m: score = 55
        elif "gpt-3.5" in m: score = 30

    # ── Google Gemini ────────────────────────────────────────────────────────
    # Flash models are ranked above Pro because Pro requires paid plan
    # (free tier quota = 0 for Pro). Flash models work on free tier and
    # are still highly capable. Users with paid plans can manually pick Pro.
    elif provider_id == "google":
        # Penalize "lite" / "flash-8b" tiny variants
        if "flash-lite" in m or "flash-8b" in m: score = 50
        elif "2.5" in m and "flash" in m: score = 100
        elif "2.0" in m and "flash" in m: score = 92
        elif "1.5" in m and "flash" in m: score = 80
        elif "2.5" in m and "pro" in m: score = 75   # paid only — don't auto-pick
        elif "2.0" in m and "pro" in m: score = 70
        elif "1.5" in m and "pro" in m: score = 65

    # ── Mistral ──────────────────────────────────────────────────────────────
    elif provider_id == "mistral":
        if "large" in m: score = 90
        elif "medium" in m: score = 75
        elif "small" in m: score = 60
        elif "nemo" in m: score = 55
        elif "ministral" in m: score = 50

    # ── Groq (model availability changes; rank by base model) ────────────────
    elif provider_id == "groq":
        if "llama-3.3-70b" in m or "llama-3.1-70b" in m or "llama-4" in m: score = 90
        elif "llama-3.3" in m or "llama-3.1" in m: score = 80
        elif "deepseek" in m: score = 85
        elif "qwen" in m: score = 78
        elif "mixtral" in m: score = 75
        elif "8b" in m or "7b" in m: score = 50

    # ── DeepSeek ─────────────────────────────────────────────────────────────
    elif provider_id == "deepseek":
        if "reasoner" in m or "r1" in m: score = 95
        elif "chat" in m or "v3" in m: score = 85

    # ── Cohere ───────────────────────────────────────────────────────────────
    elif provider_id == "cohere":
        if "command-r-plus" in m: score = 90
        elif "command-r" in m: score = 75
        elif "command-light" in m: score = 50

    # ── Perplexity (Sonar) ───────────────────────────────────────────────────
    elif provider_id == "perplexity":
        if "reasoning-pro" in m: score = 95
        elif "reasoning" in m: score = 88
        elif "sonar-pro" in m: score = 85
        elif "sonar" in m: score = 75

    # ── Together (OSS routed) ────────────────────────────────────────────────
    elif provider_id == "together":
        if "405b" in m or "405" in m: score = 95
        elif "llama-3.3-70b" in m or "llama-4" in m: score = 90
        elif "deepseek-v3" in m or "deepseek-r1" in m: score = 88
        elif "qwen" in m and "72b" in m: score = 85
        elif "70b" in m: score = 80

    # ── Ollama / LM Studio: prefer larger params ─────────────────────────────
    elif provider_id in ("ollama", "lmstudio"):
        if "70b" in m or "72b" in m: score = 85
        elif "32b" in m or "34b" in m: score = 75
        elif "13b" in m or "14b" in m: score = 65
        elif "7b" in m or "8b" in m: score = 55
        elif "3b" in m or "1b" in m: score = 35

    return max(0, min(100, score))


def best_model(provider_id: str, models: list) -> str:
    """Return the highest-scoring model id from a list of dicts or strings."""
    if not models:
        return ""
    def _id(m):
        return m["id"] if isinstance(m, dict) else m
    scored = sorted(models, key=lambda m: score_model(provider_id, _id(m)), reverse=True)
    return _id(scored[0])

# Providers whose OpenAI-compatible endpoint accepts the JSON-mode response_format.
# OpenAI itself supports it; some compat providers reject it with 400.
_JSON_MODE_PROVIDERS = {"openai", "groq", "together", "deepseek", "mistral"}


def _wrap(provider_id: str, exc: Exception) -> RuntimeError:
    """Return a uniform RuntimeError that the API layer can surface to the UI."""
    if isinstance(exc, httpx.HTTPStatusError):
        status = exc.response.status_code
        try:
            body = exc.response.text[:500]
        except Exception:
            body = ""
        return RuntimeError(f"{provider_id}: HTTP {status} — {body}")
    return RuntimeError(f"{provider_id}: {type(exc).__name__}: {exc}")


class BaseProvider(ABC):
    provider_id: str = ""

    @abstractmethod
    async def generate(self, system: str, user: str, model: str) -> str: ...

    async def list_models_live(self) -> list[dict]:
        """Fetch the live model list from the provider's /models endpoint.

        Returns [{"id": str, "label": str, "score": int}, ...] or [] on
        failure. Subclasses override this; the default returns [] so the
        caller falls back to PROVIDER_MODELS.
        """
        return []

    async def _post_json(
        self,
        url: str,
        payload: dict[str, Any],
        headers: dict[str, str],
        timeout: int = 90,
    ) -> dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                r = await client.post(url, json=payload, headers=headers)
                r.raise_for_status()
                return r.json()
        except Exception as e:
            raise _wrap(self.provider_id or "provider", e) from e


# ── Anthropic ────────────────────────────────────────────────────────────────
class AnthropicProvider(BaseProvider):
    provider_id = "anthropic"

    async def generate(self, system: str, user: str, model: str) -> str:
        cfg = get_provider_config("anthropic")
        key = (cfg.get("api_key") or os.getenv("ANTHROPIC_API_KEY", "")).strip()
        if not key:
            raise RuntimeError("anthropic: API key is not configured")
        data = await self._post_json(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            payload={
                "model": model,
                "max_tokens": 4096,
                "system": system,
                "messages": [{"role": "user", "content": user}],
            },
        )
        try:
            return data["content"][0]["text"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"anthropic: unexpected response shape: {e}") from e

    async def list_models_live(self) -> list[dict]:
        cfg = get_provider_config("anthropic")
        key = (cfg.get("api_key") or os.getenv("ANTHROPIC_API_KEY", "")).strip()
        if not key:
            return []
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    "https://api.anthropic.com/v1/models",
                    headers={
                        "x-api-key": key,
                        "anthropic-version": "2023-06-01",
                    },
                )
                if r.status_code != 200:
                    return []
                items = r.json().get("data", [])
                out: list[dict] = []
                for m in items:
                    mid = m.get("id", "")
                    s = score_model("anthropic", mid)
                    if s <= 0:
                        continue
                    out.append({
                        "id": mid,
                        "label": m.get("display_name", mid),
                        "score": s,
                    })
                return out
        except Exception:
            return []


# ── OpenAI-compatible (OpenAI / Mistral / Groq / Together / Perplexity / DeepSeek / LM Studio / Custom) ──
class OpenAICompatProvider(BaseProvider):
    def __init__(self, provider_id: str, default_base: str):
        self.provider_id = provider_id
        self.default_base = default_base

    def _resolve(self) -> tuple[str, str]:
        cfg = get_provider_config(self.provider_id)
        key = (cfg.get("api_key") or os.getenv(f"{self.provider_id.upper()}_API_KEY", "")).strip()
        base = (cfg.get("base_url") or self.default_base or "").rstrip("/")
        return key, base

    async def generate(self, system: str, user: str, model: str) -> str:
        key, base = self._resolve()
        if not base:
            raise RuntimeError(f"{self.provider_id}: base URL is not configured")

        url = f"{base}/chat/completions"
        headers: dict[str, str] = {"Content-Type": "application/json"}
        # LM Studio / fully-local custom servers do not require auth — only set
        # the header when we actually have a key.
        if key:
            headers["Authorization"] = f"Bearer {key}"

        payload: dict[str, Any] = {
            "model": model,
            "max_tokens": 4096,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user",   "content": user},
            ],
        }
        if self.provider_id in _JSON_MODE_PROVIDERS:
            payload["response_format"] = {"type": "json_object"}

        # Try once; if json_object is rejected, retry without it.
        try:
            data = await self._post_json(url, payload, headers)
        except RuntimeError as e:
            if "response_format" in payload and "HTTP 400" in str(e):
                payload.pop("response_format", None)
                data = await self._post_json(url, payload, headers)
            else:
                raise

        try:
            return data["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"{self.provider_id}: unexpected response shape: {e}") from e

    async def list_models_live(self) -> list[dict]:
        # Perplexity does not expose a /models endpoint — return [] so the
        # caller falls back to the static catalog.
        if self.provider_id == "perplexity":
            return []
        # Custom provider with comma-separated user IDs is not a /models call.
        if self.provider_id == "custom":
            cfg = get_provider_config("custom")
            ids = (cfg.get("model_ids") or "").strip()
            if not ids:
                return []
            return [
                {"id": mid.strip(), "label": mid.strip(), "score": 50}
                for mid in ids.split(",") if mid.strip()
            ]

        key, base = self._resolve()
        if not base:
            return []
        # LM Studio / local / custom servers don't require auth — only require
        # a key for true cloud providers.
        if self.provider_id not in ("lmstudio",) and not key:
            return []

        headers: dict[str, str] = {}
        if key:
            headers["Authorization"] = f"Bearer {key}"

        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(f"{base}/models", headers=headers)
                if r.status_code != 200:
                    return []
                payload = r.json()
                items = payload.get("data") or payload.get("models") or []
                out: list[dict] = []
                for m in items:
                    mid = m.get("id") if isinstance(m, dict) else str(m)
                    if not mid:
                        continue
                    s = score_model(self.provider_id, mid)
                    if s <= 0:
                        continue
                    label = mid
                    if isinstance(m, dict):
                        label = m.get("display_name") or m.get("name") or mid
                    out.append({"id": mid, "label": label, "score": s})
                return out
        except Exception:
            return []


# ── Google Gemini ─────────────────────────────────────────────────────────────
class GoogleProvider(BaseProvider):
    provider_id = "google"

    async def generate(self, system: str, user: str, model: str) -> str:
        cfg = get_provider_config("google")
        key = (cfg.get("api_key") or os.getenv("GOOGLE_API_KEY", "")).strip()
        if not key:
            raise RuntimeError("google: API key is not configured")

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={key}"
        )
        data = await self._post_json(
            url,
            headers={"Content-Type": "application/json"},
            payload={
                "system_instruction": {"parts": [{"text": system}]},
                "contents": [{"role": "user", "parts": [{"text": user}]}],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "maxOutputTokens": 4096,
                },
            },
        )
        try:
            parts = data["candidates"][0]["content"]["parts"]
            # Gemini may return multiple parts; concatenate text fields.
            return "".join(p.get("text", "") for p in parts)
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"google: unexpected response shape: {e}") from e

    async def list_models_live(self) -> list[dict]:
        cfg = get_provider_config("google")
        key = (cfg.get("api_key") or os.getenv("GOOGLE_API_KEY", "")).strip()
        if not key:
            return []
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
                )
                if r.status_code != 200:
                    return []
                items = r.json().get("models", [])
                out: list[dict] = []
                for m in items:
                    name = (m.get("name") or "").replace("models/", "")
                    if not name:
                        continue
                    if "generateContent" not in m.get("supportedGenerationMethods", []):
                        continue
                    if any(x in name for x in ["embed", "aqa", "vision-latest"]):
                        continue
                    s = score_model("google", name)
                    if s <= 0:
                        continue
                    out.append({
                        "id": name,
                        "label": m.get("displayName", name),
                        "score": s,
                    })
                return out
        except Exception:
            return []


# ── Cohere v2 ─────────────────────────────────────────────────────────────────
class CohereProvider(BaseProvider):
    provider_id = "cohere"

    async def generate(self, system: str, user: str, model: str) -> str:
        cfg = get_provider_config("cohere")
        key = (cfg.get("api_key") or os.getenv("COHERE_API_KEY", "")).strip()
        if not key:
            raise RuntimeError("cohere: API key is not configured")

        data = await self._post_json(
            "https://api.cohere.com/v2/chat",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            payload={
                "model": model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
            },
        )
        try:
            return data["message"]["content"][0]["text"]
        except (KeyError, IndexError, TypeError) as e:
            raise RuntimeError(f"cohere: unexpected response shape: {e}") from e

    async def list_models_live(self) -> list[dict]:
        cfg = get_provider_config("cohere")
        key = (cfg.get("api_key") or os.getenv("COHERE_API_KEY", "")).strip()
        if not key:
            return []
        try:
            async with httpx.AsyncClient(timeout=15) as c:
                r = await c.get(
                    "https://api.cohere.com/v1/models",
                    headers={"Authorization": f"Bearer {key}"},
                    params={"endpoint": "chat", "page_size": 100},
                )
                if r.status_code != 200:
                    return []
                items = r.json().get("models", [])
                out: list[dict] = []
                for m in items:
                    name = m.get("name", "")
                    if not name:
                        continue
                    endpoints = m.get("endpoints", []) or []
                    if endpoints and "chat" not in endpoints:
                        continue
                    s = score_model("cohere", name)
                    if s <= 0:
                        continue
                    out.append({"id": name, "label": name, "score": s})
                return out
        except Exception:
            return []


# ── Ollama (local) ────────────────────────────────────────────────────────────
class OllamaProvider(BaseProvider):
    provider_id = "ollama"

    def _base(self) -> str:
        cfg = get_provider_config("ollama")
        return (cfg.get("base_url") or "http://host.docker.internal:11434").rstrip("/")

    async def generate(self, system: str, user: str, model: str) -> str:
        base = self._base()
        data = await self._post_json(
            f"{base}/api/chat",
            headers={"Content-Type": "application/json"},
            payload={
                "model": model,
                "stream": False,
                "format": "json",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
            },
            timeout=180,  # local models can be slow on CPU
        )
        try:
            return data["message"]["content"]
        except (KeyError, TypeError) as e:
            raise RuntimeError(f"ollama: unexpected response shape: {e}") from e

    async def list_models(self) -> list[str]:
        """Legacy plain-string listing kept for backward compatibility."""
        base = self._base()
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{base}/api/tags")
                r.raise_for_status()
                return [m["name"] for m in r.json().get("models", [])]
        except Exception:
            return []

    async def list_models_live(self) -> list[dict]:
        base = self._base()
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{base}/api/tags")
                if r.status_code != 200:
                    return []
                return [
                    {
                        "id": m["name"],
                        "label": m["name"],
                        "score": score_model("ollama", m["name"]),
                    }
                    for m in r.json().get("models", [])
                    if m.get("name")
                ]
        except Exception:
            return []


# ── Factory registry ──────────────────────────────────────────────────────────
_REGISTRY: dict[str, BaseProvider] = {
    "anthropic":  AnthropicProvider(),
    "openai":     OpenAICompatProvider("openai",     "https://api.openai.com/v1"),
    "google":     GoogleProvider(),
    "mistral":    OpenAICompatProvider("mistral",    "https://api.mistral.ai/v1"),
    "groq":       OpenAICompatProvider("groq",       "https://api.groq.com/openai/v1"),
    "together":   OpenAICompatProvider("together",   "https://api.together.xyz/v1"),
    "perplexity": OpenAICompatProvider("perplexity", "https://api.perplexity.ai"),
    "cohere":     CohereProvider(),
    "deepseek":   OpenAICompatProvider("deepseek",   "https://api.deepseek.com/v1"),
    "ollama":     OllamaProvider(),
    "lmstudio":   OpenAICompatProvider("lmstudio",   "http://host.docker.internal:1234/v1"),
    "custom":     OpenAICompatProvider("custom",     ""),
}


def get_provider(provider_id: str) -> BaseProvider:
    if provider_id not in _REGISTRY:
        raise ValueError(f"Unknown provider: {provider_id}")
    return _REGISTRY[provider_id]


def known_providers() -> list[str]:
    return list(_REGISTRY.keys())
