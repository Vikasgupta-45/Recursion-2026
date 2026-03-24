"""CTR-style thumbnail score: free Groq vision → free Gemini → paid OpenAI → heuristic."""

from __future__ import annotations

import hashlib
import json
import logging
import os
import re

import requests

import app_config  # noqa: F401
from llm_client import GROQ_BASE_URL

logger = logging.getLogger(__name__)

_VISION_PROMPT = (
    "You are a YouTube growth analyst. Look at this thumbnail image. "
    "Estimate a predicted relative CTR score from 0-100 vs a generic talking-head thumbnail "
    "in the same niche. Consider contrast, face visibility, text readability, curiosity gap. "
    'Reply with JSON only: {"ctr_score": <int 0-100>, "summary": "<one sentence>"}'
)


def _parse_json_score(raw: str) -> dict | None:
    m = re.search(r"\{[\s\S]*\}", raw.strip())
    if not m:
        return None
    try:
        data = json.loads(m.group())
        score = int(data.get("ctr_score", 50))
        score = max(0, min(100, score))
        return {"ctr_score": score, "summary": str(data.get("summary", ""))}
    except (json.JSONDecodeError, TypeError, ValueError):
        return None


def _fetch_image_bytes(url: str) -> tuple[bytes, str]:
    r = requests.get(
        url,
        timeout=25,
        headers={"User-Agent": "Mozilla/5.0 (compatible; LuminThumbBot/1.0)"},
    )
    r.raise_for_status()
    mime = (r.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip().lower()
    if not mime.startswith("image/"):
        mime = "image/jpeg"
    return r.content, mime


def _groq_vision_score(image_url: str) -> dict | None:
    gsk = os.getenv("GROQ_API_KEY", "").strip()
    if not gsk:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=gsk, base_url=GROQ_BASE_URL)
        model = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _VISION_PROMPT},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=200,
        )
        raw = (resp.choices[0].message.content or "").strip()
        parsed = _parse_json_score(raw)
        if parsed:
            return {
                **parsed,
                "model": model,
                "source": "groq_vision",
            }
    except Exception as e:
        logger.warning("Groq vision thumbnail score failed: %s", e)
    return None


def _gemini_vision_score(image_url: str) -> dict | None:
    key = (
        os.getenv("GEMINI_API_KEY", "").strip()
        or os.getenv("GOOGLE_AI_API_KEY", "").strip()
    )
    if not key:
        return None
    try:
        import google.generativeai as genai
    except ImportError:
        logger.warning("google-generativeai not installed; pip install google-generativeai for free Gemini vision.")
        return None
    try:
        data, mime = _fetch_image_bytes(image_url)
        genai.configure(api_key=key)
        model_name = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")
        model = genai.GenerativeModel(model_name)
        response = model.generate_content(
            [_VISION_PROMPT, {"mime_type": mime, "data": data}],
        )
        raw = (response.text or "").strip()
        parsed = _parse_json_score(raw)
        if parsed:
            return {**parsed, "model": model_name, "source": "gemini_vision"}
    except Exception as e:
        logger.warning("Gemini vision thumbnail score failed: %s", e)
    return None


def _openai_vision_score(image_url: str) -> dict | None:
    osk = os.getenv("OPENAI_API_KEY", "").strip()
    if not osk:
        return None
    try:
        from openai import OpenAI

        client = OpenAI(api_key=osk)
        model = os.getenv("OPENAI_VISION_MODEL", "gpt-4o-mini")
        resp = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": _VISION_PROMPT},
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                }
            ],
            max_tokens=200,
        )
        raw = (resp.choices[0].message.content or "").strip()
        parsed = _parse_json_score(raw)
        if parsed:
            return {**parsed, "model": model, "source": "openai_vision"}
    except Exception as e:
        logger.warning("OpenAI vision thumbnail score failed: %s", e)
    return None


def _heuristic_score(image_url: str) -> tuple[int, str]:
    h = int(hashlib.sha256(image_url.encode()).hexdigest()[:6], 16)
    base = 42 + (h % 38)
    note = (
        "Heuristic only. For free vision scoring: set GROQ_API_KEY (Groq vision) or "
        "GEMINI_API_KEY from https://aistudio.google.com/apikey (Gemini free tier)."
    )
    return base, note


def predict_thumbnail_ctr_score(image_url: str) -> dict:
    url = (image_url or "").strip()
    if not url.startswith(("http://", "https://")):
        return {"error": "image_url must be http(s)", "ctr_score": None}

    for fn in (_groq_vision_score, _gemini_vision_score, _openai_vision_score):
        out = fn(url)
        if out:
            return out

    score, note = _heuristic_score(url)
    return {
        "ctr_score": score,
        "summary": note,
        "source": "heuristic",
    }
