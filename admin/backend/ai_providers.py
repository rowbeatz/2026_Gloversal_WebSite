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


# ── Hardcoded model catalog (overridable per-provider via Custom + dynamic for local) ──
PROVIDER_MODELS: dict[str, list[dict[str, str]]] = {
    "anthropic": [
        {"id": "claude-opus-4-7",            "label": "Claude Opus 4.7 (最高精度)"},
        {"id": "claude-sonnet-4-6",          "label": "Claude Sonnet 4.6 (バランス)"},
        {"id": "claude-haiku-4-5-20251001",  "label": "Claude Haiku 4.5 (高速・低コスト)"},
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
        {"id": "llama-3.1-sonar-large-128k-online", "label": "Sonar Large (Web検索付き)"},
        {"id": "llama-3.1-sonar-small-128k-online", "label": "Sonar Small (Web検索付き)"},
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
        base = self._base()
        try:
            async with httpx.AsyncClient(timeout=5) as c:
                r = await c.get(f"{base}/api/tags")
                r.raise_for_status()
                return [m["name"] for m in r.json().get("models", [])]
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
