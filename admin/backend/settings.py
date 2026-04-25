"""Settings persistence for AI provider configuration.

Settings are stored at /project/admin/settings.json (host-mounted volume), so
changes made through the admin UI survive container restarts without rebuilds.
On first load, environment variables (ANTHROPIC_API_KEY, OPENAI_API_KEY, etc.)
are migrated into settings.json so existing .env-based deployments keep working.
"""

from __future__ import annotations

import copy
import json
import os
from pathlib import Path
from typing import Any

SETTINGS_FILE = Path("/project/admin/settings.json")

# Map of provider id -> environment variable that holds the API key (legacy / fallback).
ENV_KEY_MAP: dict[str, str] = {
    "anthropic":  "ANTHROPIC_API_KEY",
    "openai":     "OPENAI_API_KEY",
    "google":     "GOOGLE_API_KEY",
    "mistral":    "MISTRAL_API_KEY",
    "groq":       "GROQ_API_KEY",
    "together":   "TOGETHER_API_KEY",
    "perplexity": "PERPLEXITY_API_KEY",
    "cohere":     "COHERE_API_KEY",
    "deepseek":   "DEEPSEEK_API_KEY",
}

DEFAULT_SETTINGS: dict[str, Any] = {
    "providers": {
        "anthropic":  {"api_key": "", "enabled": False},
        "openai":     {"api_key": "", "enabled": False},
        "google":     {"api_key": "", "enabled": False},
        "mistral":    {"api_key": "", "enabled": False},
        "groq":       {"api_key": "", "enabled": False},
        "together":   {"api_key": "", "enabled": False},
        "perplexity": {"api_key": "", "enabled": False},
        "cohere":     {"api_key": "", "enabled": False},
        "deepseek":   {"api_key": "", "enabled": False},
        "ollama":     {"base_url": "http://host.docker.internal:11434", "enabled": False},
        "lmstudio":   {"base_url": "http://host.docker.internal:1234/v1", "enabled": False},
        "custom":     {"api_key": "", "base_url": "", "model_ids": "", "enabled": False},
    },
    "default_provider": "anthropic",
    "default_model": "claude-sonnet-4-6",
}


def _migrate_from_env(base: dict[str, Any]) -> dict[str, Any]:
    """Pre-populate api keys from environment variables (legacy .env support).

    Only fills empty fields; never overwrites a value the user already set.
    """
    seeded = copy.deepcopy(base)
    providers = seeded.setdefault("providers", {})
    for pid, env_name in ENV_KEY_MAP.items():
        env_val = os.getenv(env_name, "").strip()
        if not env_val:
            continue
        cfg = providers.setdefault(pid, {})
        if not cfg.get("api_key"):
            cfg["api_key"] = env_val
            cfg["enabled"] = True
    # Honor AI_MODEL env override for backward compatibility.
    ai_model = os.getenv("AI_MODEL", "").strip()
    if ai_model and not seeded.get("default_model"):
        seeded["default_model"] = ai_model
    return seeded


def load_settings() -> dict[str, Any]:
    """Read settings.json. If it doesn't exist, seed it from env and persist."""
    if SETTINGS_FILE.exists():
        try:
            data = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
            # Ensure every provider id from defaults is present (forward-compat).
            providers = data.setdefault("providers", {})
            for pid, default_cfg in DEFAULT_SETTINGS["providers"].items():
                if pid not in providers:
                    providers[pid] = copy.deepcopy(default_cfg)
                else:
                    # Backfill any new keys we added later (e.g., model_ids).
                    for k, v in default_cfg.items():
                        providers[pid].setdefault(k, v)
            data.setdefault("default_provider", DEFAULT_SETTINGS["default_provider"])
            data.setdefault("default_model", DEFAULT_SETTINGS["default_model"])
            return data
        except Exception:
            # Corrupt file — fall through to seeded defaults rather than crashing.
            pass

    seeded = _migrate_from_env(DEFAULT_SETTINGS)
    try:
        save_settings(seeded)
    except Exception:
        # If we can't write (e.g., permissions), still return the in-memory copy
        # so the app continues to work.
        pass
    return seeded


def save_settings(data: dict[str, Any]) -> None:
    """Atomically write settings.json."""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = SETTINGS_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(SETTINGS_FILE)


def get_provider_config(provider_id: str) -> dict[str, Any]:
    """Return the stored config dict for a single provider (empty dict if unknown)."""
    s = load_settings()
    return s.get("providers", {}).get(provider_id, {})
