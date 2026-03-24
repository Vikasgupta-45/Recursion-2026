"""
OpenAI-compatible chat client: Groq (preferred) or OpenAI.

Set GROQ_API_KEY for free-tier Groq inference, or OPENAI_API_KEY for OpenAI.
"""

from __future__ import annotations

import os

import app_config  # noqa: F401 — ensures backend/.env is loaded

GROQ_BASE_URL = "https://api.groq.com/openai/v1"


def get_llm_client():
    """
    Returns an OpenAI SDK client pointing at Groq or OpenAI, or None if no key.
    """
    try:
        from openai import OpenAI
    except ImportError:
        return None

    gsk = os.getenv("GROQ_API_KEY", "").strip()
    if gsk:
        return OpenAI(api_key=gsk, base_url=GROQ_BASE_URL)

    osk = os.getenv("OPENAI_API_KEY", "").strip()
    if osk:
        return OpenAI(api_key=osk)

    return None


def get_llm_chat_model() -> str:
    """Model id for chat.completions (provider-specific)."""
    if os.getenv("GROQ_API_KEY", "").strip():
        return os.getenv("GROQ_CHAT_MODEL", "llama-3.1-8b-instant")
    return os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
