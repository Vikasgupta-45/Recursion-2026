"""
Per-video analytics and improvement suggestions (rules + optional Groq).
Uses only public Data API fields — not YouTube Studio internals.
"""

from __future__ import annotations

import json
import math
from datetime import datetime, timezone
from typing import Any

from llm_client import get_llm_chat_model, get_llm_client


def compute_channel_benchmarks(videos: list[dict[str, Any]]) -> dict[str, Any]:
    if not videos:
        return {}
    views = [int(v.get("views") or 0) for v in videos]
    durs = [int(v.get("duration_seconds") or 0) for v in videos if int(v.get("duration_seconds") or 0) > 0]
    eng_rates: list[float] = []
    for v in videos:
        vi = int(v.get("views") or 0)
        if vi <= 0:
            continue
        eng_rates.append((int(v.get("likes") or 0) + int(v.get("comments") or 0)) / vi)
    views_sorted = sorted(views)
    n = len(views_sorted)

    def pct(p: float) -> float:
        if not views_sorted:
            return 0.0
        i = min(n - 1, max(0, int(p * n)))
        return float(views_sorted[i])

    return {
        "video_count": n,
        "median_views": float(views_sorted[n // 2]) if views_sorted else 0.0,
        "p25_views": pct(0.25),
        "p75_views": pct(0.75),
        "max_views": float(max(views)) if views else 0.0,
        "median_duration_sec": float(sorted(durs)[len(durs) // 2]) if durs else 0.0,
        "median_engagement_rate": float(sorted(eng_rates)[len(eng_rates) // 2]) if eng_rates else 0.0,
    }


def _days_since_publish(published_at: str | None) -> float:
    if not published_at:
        return 1.0
    try:
        raw = published_at.replace("Z", "+00:00")
        dt = datetime.fromisoformat(raw)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - dt
        return max(1.0, delta.total_seconds() / 86400.0)
    except Exception:
        return 1.0


def rule_based_tips(video: dict[str, Any], bench: dict[str, Any]) -> list[str]:
    tips: list[str] = []
    title = str(video.get("title") or "")
    views = int(video.get("views") or 0)
    likes = int(video.get("likes") or 0)
    comments = int(video.get("comments") or 0)
    dur = int(video.get("duration_seconds") or 0)
    med_v = float(bench.get("median_views") or 0)
    med_e = float(bench.get("median_engagement_rate") or 0)
    days = _days_since_publish(video.get("published_at"))
    vpd = views / days

    eng = (likes + comments) / max(views, 1)

    if len(title) < 35:
        tips.append("Title is short: test a longer, specific title with a clear outcome or number (still under ~70 characters).")
    if len(title) > 70:
        tips.append("Title may truncate on mobile: tighten to ~60–70 characters while keeping the hook.")

    if med_v > 0 and views < med_v * 0.5:
        tips.append(
            f"This video is below your channel median views (~{med_v:,.0f}). Compare thumbnail and first 30s hook to your top performers."
        )
    elif med_v > 0 and views > med_v * 1.5:
        tips.append("Strong performer vs your median: consider a follow-up, sequel, or Short teasing this topic.")

    if med_e > 0 and eng < med_e * 0.7:
        tips.append("Engagement (likes+comments)/views is below your typical video: add a pinned comment question or clearer CTA.")

    if dur > 0 and dur < 120:
        tips.append("Very short format: ensure the hook is instant; consider a companion long-form if the topic supports depth.")
    if dur > 1800:
        tips.append("Long video: add chapters in description and a strong cold open to protect retention.")

    if vpd < med_v / 30 and med_v > 0:
        tips.append("Views/day is low early on: refresh thumbnail text contrast and test an alternate title for the first 48h if possible.")

    if not tips:
        tips.append("Keep iterating: A/B test thumbnails and titles on your next upload using this video as a baseline.")
    return tips[:8]


def build_video_overview(video: dict[str, Any], bench: dict[str, Any]) -> dict[str, Any]:
    views = int(video.get("views") or 0)
    likes = int(video.get("likes") or 0)
    comments = int(video.get("comments") or 0)
    dur = int(video.get("duration_seconds") or 0)
    days = _days_since_publish(video.get("published_at"))
    eng = (likes + comments) / max(views, 1)
    med_v = float(bench.get("median_views") or 0)
    percentile = 50.0
    if med_v > 0:
        ratio = views / max(med_v, 1)
        percentile = min(99.0, max(1.0, 50.0 * ratio))

    vid = video.get("video_id")
    return {
        "video_id": vid,
        "title": video.get("title"),
        "published_at": video.get("published_at"),
        "duration_seconds": dur,
        "duration_label": _fmt_duration(dur),
        "views": views,
        "likes": likes,
        "comments": comments,
        "engagement_rate": round(eng, 6),
        "views_per_day": round(views / days, 2),
        "approx_performance_vs_median": "above" if views >= med_v else "below",
        "estimated_percentile_vs_channel": round(percentile, 1),
        "description_preview": (str(video.get("description") or "")[:280] + "…")
        if len(str(video.get("description") or "")) > 280
        else (video.get("description") or ""),
        "tags": video.get("tags") or [],
        "category_id": video.get("category_id"),
        "thumbnail_url": video.get("thumbnail_url"),
        "watch_url": f"https://www.youtube.com/watch?v={vid}" if vid else None,
    }


def _fmt_duration(sec: int) -> str:
    if sec <= 0:
        return "—"
    m, s = divmod(sec, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def groq_improvement_narrative(video: dict[str, Any], bench: dict[str, Any], rules: list[str]) -> str | None:
    client = get_llm_client()
    if not client:
        return None
    try:
        overview = build_video_overview(video, bench)
        r = client.chat.completions.create(
            model=get_llm_chat_model(),
            messages=[
                {
                    "role": "system",
                    "content": "You are a YouTube coach. Give 4–6 bullet points of actionable advice. "
                    "Use only public metrics (views, likes, comments, duration, title). No promises of results.",
                },
                {
                    "role": "user",
                    "content": json.dumps(
                        {"overview": overview, "rule_hints": rules, "channel_benchmarks": bench},
                        ensure_ascii=False,
                    )[:8000],
                },
            ],
            temperature=0.55,
            max_tokens=512,
        )
        return (r.choices[0].message.content or "").strip() or None
    except Exception:
        return None


def full_video_insights(
    video: dict[str, Any],
    benchmarks: dict[str, Any],
    use_llm: bool = True,
) -> dict[str, Any]:
    bench = benchmarks if benchmarks else compute_channel_benchmarks([video])
    rules = rule_based_tips(video, bench)
    overview = build_video_overview(video, bench)
    llm_text = groq_improvement_narrative(video, bench, rules) if use_llm else None
    return {
        "overview": overview,
        "channel_benchmarks": bench,
        "improvement_checklist": rules,
        "ai_coach": llm_text,
    }
