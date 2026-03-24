"""
Load environment from predictable paths (uvicorn CWD is often wrong on Windows).
Only non-empty values from each file are applied so YOUTUBE_API_KEY= alone never wipes a key.
"""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import dotenv_values

_BACKEND_ROOT = Path(__file__).resolve().parent
_REPO_ROOT = _BACKEND_ROOT.parent


def _merge_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for key, val in dotenv_values(path).items():
        if not key:
            continue
        if val is None:
            continue
        s = str(val).strip().strip('"').strip("'")
        if not s:
            continue
        os.environ[key] = s


# Later files override earlier keys only when the new value is non-empty
_merge_env_file(_REPO_ROOT / ".env")
_merge_env_file(Path.cwd() / ".env")
_merge_env_file(_BACKEND_ROOT / ".env")


def get_youtube_api_key() -> str | None:
    for name in (
        "YOUTUBE_API_KEY",
        "YOUTUBE_DATA_API_KEY",
        "GOOGLE_API_KEY",
        "YT_API_KEY",
    ):
        raw = os.getenv(name, "")
        v = raw.strip().strip('"').strip("'")
        if v and not v.startswith("your_"):
            return v
    return None


def get_gemini_api_key() -> str | None:
    raw = os.getenv("GEMINI_API_KEY", "")
    v = raw.strip().strip('"').strip("'")
    if v and not v.startswith("your_"):
        return v
    return None
