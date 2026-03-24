"""Derived metrics for competitor / creator channels (last N uploads)."""

from __future__ import annotations

import re
import statistics
from collections import Counter
from datetime import datetime, timezone
from typing import Any


def _parse_pub(s: str | None) -> datetime | None:
    if not s:
        return None
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        return datetime.fromisoformat(s.replace("Z", "+00:00"))
    except ValueError:
        return None


def channel_age_weeks(published_at: str | None) -> float:
    dt = _parse_pub(published_at)
    if not dt:
        return 52.0
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    now = datetime.now(timezone.utc)
    delta = max((now - dt).total_seconds(), 86400.0)
    return delta / (7 * 86400)


def compute_video_metrics(
    channel_row: dict[str, Any],
    videos: list[dict[str, Any]],
) -> dict[str, Any]:
    """
    videos: rows from _video_rows_from_api_items (views, likes, comments, duration_seconds, published_at, tags, title).
    """
    vc = max(int(channel_row.get("video_count") or 0), 1)
    total_views = int(channel_row.get("view_count") or 0)
    subs = max(int(channel_row.get("subscriber_count") or 0), 0)

    avg_views_channel = total_views / vc

    vids = list(videos)
    views_list = [max(int(v.get("views") or 0), 0) for v in vids]
    n = len(views_list)

    median_views = float(statistics.median(views_list)) if views_list else 0.0

    eng_rates: list[float] = []
    for v in vids:
        vi = max(int(v.get("views") or 0), 0)
        lk = int(v.get("likes") or 0)
        cm = int(v.get("comments") or 0)
        eng_rates.append((lk + cm) / max(vi, 1))
    engagement_rate = float(statistics.mean(eng_rates)) if eng_rates else 0.0

    hit_rate = 0.0
    if views_list:
        hit_rate = sum(1 for x in views_list if x > avg_views_channel) / len(views_list) * 100.0

    flop_rate = 0.0
    if views_list:
        flop_rate = sum(1 for x in views_list if x < 1000) / len(views_list) * 100.0

    # Newest first for momentum split
    sorted_by_pub = sorted(
        vids,
        key=lambda x: (x.get("published_at") or ""),
        reverse=True,
    )
    sv = [max(int(x.get("views") or 0), 0) for x in sorted_by_pub]

    momentum = 0.0
    if len(sv) >= 20:
        last10 = sv[:10]
        prev10 = sv[10:20]
        pavg = statistics.mean(prev10)
        momentum = ((statistics.mean(last10) - pavg) / max(pavg, 1.0)) * 100.0
    elif len(sv) >= 4:
        half = len(sv) // 2
        last = sv[:half]
        prev = sv[half:]
        pavg = statistics.mean(prev)
        momentum = ((statistics.mean(last) - pavg) / max(pavg, 1.0)) * 100.0

    weeks = channel_age_weeks(channel_row.get("published_at"))
    uploads_per_week = vc / max(weeks, 0.01)

    dur_sec = [int(v.get("duration_seconds") or 0) for v in vids]
    shorts_ratio = 0.0
    if dur_sec:
        shorts_ratio = sum(1 for d in dur_sec if d < 120) / len(dur_sec) * 100.0

    avg_video_length_min = 0.0
    if dur_sec:
        avg_video_length_min = round(statistics.mean(dur_sec) / 60.0, 2)

    weekdays: list[int] = []
    for v in vids:
        dt = _parse_pub(v.get("published_at"))
        if dt:
            weekdays.append(dt.weekday())
    day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    most_common_upload_day = ""
    if weekdays:
        mode = max(set(weekdays), key=weekdays.count)
        most_common_upload_day = day_names[mode]

    views_per_sub = (total_views / max(subs, 1)) if subs else float(total_views)

    consistency_score = _consistency_score(vids)

    return {
        "channel_title": channel_row.get("title"),
        "channel_id": channel_row.get("channel_id"),
        "subscriber_count": subs,
        "total_views": total_views,
        "video_count": int(channel_row.get("video_count") or 0),
        "channel_created_at": channel_row.get("published_at"),
        "avg_views": round(avg_views_channel, 2),
        "median_views": round(median_views, 2),
        "engagement_rate": round(engagement_rate, 6),
        "hit_rate_pct": round(hit_rate, 2),
        "flop_rate_pct": round(flop_rate, 2),
        "momentum_pct": round(momentum, 2),
        "uploads_per_week": round(uploads_per_week, 4),
        "shorts_ratio_pct": round(shorts_ratio, 2),
        "avg_video_length_minutes": avg_video_length_min,
        "most_common_upload_day": most_common_upload_day,
        "views_per_subscriber": round(views_per_sub, 4),
        "consistency_score": consistency_score,
        "sample_video_count": n,
    }


def _consistency_score(vids: list[dict[str, Any]]) -> float:
    dates: list[datetime] = []
    for v in vids:
        dt = _parse_pub(v.get("published_at"))
        if dt:
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            dates.append(dt)
    if len(dates) < 2:
        return 5.0
    dates.sort()
    gaps = [(dates[i] - dates[i - 1]).total_seconds() / 86400.0 for i in range(1, len(dates))]
    if not gaps:
        return 5.0
    mean_g = statistics.mean(gaps)
    if mean_g <= 0:
        return 5.0
    try:
        std_g = statistics.stdev(gaps) if len(gaps) > 1 else 0.0
    except statistics.StatisticsError:
        std_g = 0.0
    cv = std_g / mean_g
    # Lower variation in gaps → higher score (0–10)
    raw = 10.0 * (1.0 - min(cv, 1.0))
    return round(max(0.0, min(10.0, raw)), 2)


def title_and_publishing_signals(videos: list[dict[str, Any]]) -> dict[str, Any]:
    """Lightweight title/pattern stats for comparative prompts (no ML)."""
    if not videos:
        return {
            "videos_analyzed": 0,
            "avg_title_length_chars": 0,
            "avg_title_words": 0,
            "pct_titles_with_number": 0.0,
            "pct_titles_with_question_mark": 0.0,
            "pct_titles_with_bracket_or_paren": 0.0,
            "top_title_words": [],
        }

    lengths = []
    words_n = []
    num_hit = q_hit = br_hit = 0
    wc: Counter[str] = Counter()

    for v in videos:
        title = (v.get("title") or "").strip()
        if not title:
            continue
        lengths.append(len(title))
        parts = re.findall(r"[a-zA-Z][a-zA-Z']+", title.lower())
        words_n.append(len(parts))
        for p in parts:
            if len(p) > 2 and p not in {
                "the",
                "and",
                "for",
                "you",
                "how",
                "why",
                "what",
                "this",
                "that",
                "with",
                "from",
                "your",
                "are",
                "our",
                "new",
                "get",
            }:
                wc[p] += 1
        if re.search(r"\d", title):
            num_hit += 1
        if "?" in title:
            q_hit += 1
        if re.search(r"[\[\(]", title):
            br_hit += 1

    n = max(len(lengths), 1)
    return {
        "videos_analyzed": len(lengths),
        "avg_title_length_chars": round(sum(lengths) / n, 1),
        "avg_title_words": round(sum(words_n) / max(len(words_n), 1), 2),
        "pct_titles_with_number": round(num_hit / n * 100, 1),
        "pct_titles_with_question_mark": round(q_hit / n * 100, 1),
        "pct_titles_with_bracket_or_paren": round(br_hit / n * 100, 1),
        "top_title_words": [w for w, _ in wc.most_common(12)],
    }


def compact_videos_for_prompt(videos: list[dict[str, Any]], limit: int = 20) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for v in videos[:limit]:
        sec = int(v.get("duration_seconds") or 0)
        tags = v.get("tags") or []
        if not isinstance(tags, list):
            tags = []
        out.append(
            {
                "title": v.get("title"),
                "views": int(v.get("views") or 0),
                "likes": int(v.get("likes") or 0),
                "comments": int(v.get("comments") or 0),
                "duration_minutes": round(sec / 60.0, 2),
                "published_at": v.get("published_at"),
                "tags": tags[:15],
            }
        )
    return out
