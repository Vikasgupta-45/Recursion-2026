"""In-memory daily rate limit per creator channel id (competitor analyses)."""

from __future__ import annotations

from datetime import datetime, timezone

# my_channel_id -> (utc_date_str, count)
_store: dict[str, tuple[str, int]] = {}

MAX_PER_DAY = 20


def _today_utc() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def get_remaining(user_key: str) -> int:
    k = (user_key or "").strip()
    if not k:
        return 0
    day, n = _store.get(k, ("", 0))
    if day != _today_utc():
        return MAX_PER_DAY
    return max(0, MAX_PER_DAY - n)


def assert_can_analyze(user_key: str) -> None:
    k = (user_key or "").strip()
    if not k:
        raise ValueError("my_channel_id is required for rate limiting")
    today = _today_utc()
    day, n = _store.get(k, ("", 0))
    if day != today:
        n = 0
    if n >= MAX_PER_DAY:
        raise ValueError(
            f"Daily competitor analysis limit reached ({MAX_PER_DAY}/day). Try again tomorrow."
        )


def record_success(user_key: str) -> None:
    k = (user_key or "").strip()
    if not k:
        return
    today = _today_utc()
    day, n = _store.get(k, ("", 0))
    if day != today:
        n = 0
    _store[k] = (today, n + 1)
