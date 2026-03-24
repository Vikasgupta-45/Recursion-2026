"""
Creator-facing Analysis Panel payload: estimates and mocks where YouTube
does not expose data (retention, returning viewers, comments sentiment, etc.).
"""

from __future__ import annotations

import hashlib
import logging
import re
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from typing import Any

from prediction_engine.subscriber_forecast import forecast_subscribers

from intelligence_engine.comment_sentiment_live import analyze_comment_texts

logger = logging.getLogger(__name__)


def _stable_seed(*parts: str) -> int:
    h = hashlib.sha256("||".join(parts).encode()).hexdigest()
    return int(h[:8], 16)


def _comment_sentiment_split(channel_key: str, engagement_rate: float) -> dict[str, float]:
    """Heuristic split (no comment text in pipeline): bias positive when engagement is healthy."""
    seed = _stable_seed(channel_key, f"{engagement_rate:.4f}")
    base_pos = 0.42 + min(0.35, engagement_rate * 8)
    jitter = (seed % 17) / 100.0
    pos = min(0.85, max(0.25, base_pos + jitter - 0.08))
    neg = min(0.22, 0.08 + (seed % 13) / 100.0)
    neu = max(0.05, 1.0 - pos - neg)
    s = pos + neu + neg
    return {"positive": round(pos / s, 3), "neutral": round(neu / s, 3), "negative": round(neg / s, 3)}


def _comment_sentiment_with_logic(channel_key: str, engagement_rate: float, sentiment: dict[str, float]) -> dict[str, Any]:
    """Fallback when no comment text — simple language for creators."""
    pos = float(sentiment["positive"])
    neg = float(sentiment["negative"])
    neu = float(sentiment["neutral"])
    er_pct = engagement_rate * 100.0
    return {
        **sentiment,
        "note": "We could not load real comments (need YouTube API + videos with comment access). This pie is a rough guess from your engagement instead.",
        "methodology": "Guessed from likes and comments per view, not from reading comment text.",
        "positive_logic": (
            f"About **{pos:.0%}** is marked positive because your channel engagement is around **{er_pct:.1f}%**. "
            "When people tap like or comment a lot, we assume more of the crowd is having a good experience."
        ),
        "negative_logic": (
            f"About **{neg:.0%}** is marked negative as a small “things might be off” slice, even without reading comments. "
            "It is not saying people hate you — it leaves room for grumpy or confused viewers."
        ),
        "neutral_logic": (
            f"**{neu:.0%}** is neutral — quick notes, questions, or emojis that do not sound clearly happy or upset."
        ),
        "example_positive": [],
        "example_negative": [],
        "source": "engagement_estimate",
    }


def _audience_retention_curve(seed_s: str) -> list[dict[str, float]]:
    """Typical long-form decay; values are illustrative averages (% still watching)."""
    rnd = _stable_seed(seed_s, "retention")
    bump = (rnd % 7) / 100.0
    pts = []
    for i, t in enumerate([0, 10, 20, 30, 45, 60, 90, 120]):
        base = [100, 88, 76, 65, 52, 42, 32, 24][i]
        pts.append({"video_pct": float(t), "retention_pct": min(100, base + bump * (6 - i))})
    return pts


def _new_vs_returning(subs: int, total_views: int, video_count: int) -> dict[str, float]:
    if subs <= 0 or total_views <= 0:
        return {"new_viewers_pct": 62.0, "returning_viewers_pct": 38.0}
    ratio = total_views / max(subs, 1)
    # Higher views-per-sub → more anonymous / new traffic assumed
    new_pct = min(78, max(35, 55 + (ratio - 20) * 0.4))
    return {
        "new_viewers_pct": round(new_pct, 1),
        "returning_viewers_pct": round(100 - new_pct, 1),
    }


def _subscriber_horizons(views_ts: list[dict[str, Any]]) -> dict[str, Any]:
    out: dict[str, Any] = {"forecast_90d": [], "milestones": {}}
    if not views_ts:
        return out
    try:
        r = forecast_subscribers(views_ts, periods=90)
    except Exception as e:
        logger.warning("subscriber 90d panel forecast failed: %s", e)
        return out
    if r.get("error") or not r.get("forecast"):
        return out
    fc = r["forecast"]
    out["forecast_90d"] = fc
    for day in (30, 60, 90):
        idx = min(day, len(fc)) - 1
        if idx >= 0:
            out["milestones"][f"day_{day}"] = round(float(fc[idx]["yhat"]), 0)
    out["current_subscribers"] = r.get("current_value")
    out["summary_90d"] = r.get("summary", "")
    return out


def _momentum_score(
    weekly_growth_pct: float | None,
    engagement_rate: float | None,
    growth_pct_views: float | None,
) -> dict[str, Any]:
    wg = float(weekly_growth_pct or 0)
    er = float(engagement_rate or 0)
    gv = float(growth_pct_views or 0)
    raw = 48 + wg * 1.1 + er * 420 + gv * 0.15
    score = int(max(0, min(100, round(raw))))
    if wg > 0.5 or gv > 2:
        trend = "accelerating"
        arrow = "up"
    elif wg < -0.5 or gv < -2:
        trend = "decelerating"
        arrow = "down"
    else:
        trend = "steady"
        arrow = "flat"
    return {"score": score, "trend": trend, "arrow": arrow}


def _upload_calendar_rows(video_stat_rows: list[dict[str, Any]], days: int = 90) -> list[dict[str, Any]]:
    end = date.today()
    start = end - timedelta(days=days - 1)
    counts: dict[str, int] = {}
    for r in video_stat_rows:
        d = r.get("date") or (r.get("published_at") or "")[:10]
        if not d or not isinstance(d, str):
            continue
        try:
            ds = datetime.strptime(d[:10], "%Y-%m-%d").date()
        except ValueError:
            continue
        if ds < start or ds > end:
            continue
        k = ds.isoformat()
        counts[k] = counts.get(k, 0) + 1
    out = []
    d = start
    while d <= end:
        k = d.isoformat()
        out.append({"date": k, "uploads": counts.get(k, 0)})
        d += timedelta(days=1)
    return out


def _rpm_by_format(videos: list[dict[str, Any]]) -> list[dict[str, Any]]:
    buckets: dict[str, list[int]] = {"Shorts (<1m)": [], "Tutorials / long": [], "Mid-form": []}
    for v in videos:
        ds = int(v.get("duration_seconds") or 0)
        vi = int(v.get("views") or 0)
        if ds < 60:
            buckets["Shorts (<1m)"].append(vi)
        elif ds > 1200:
            buckets["Tutorials / long"].append(vi)
        else:
            buckets["Mid-form"].append(vi)

    def est_rpm(views_list: list[int]) -> float:
        if not views_list:
            return 3.2
        med = sorted(views_list)[len(views_list) // 2]
        # illustrative: higher median views → slightly lower RPM (scale)
        base = 5.5 - min(3.0, med / 500_000)
        return round(max(1.2, min(12.0, base)), 2)

    return [
        {"format": name, "estimated_rpm_usd": est_rpm(vs), "videos_in_sample": len(vs)}
        for name, vs in buckets.items()
    ]


def _sponsorship_readiness(
    subs: int,
    avg_views: float,
    engagement_rate: float,
    niche_keyword: str,
) -> dict[str, Any]:
    s = 12
    s += min(28, subs / 15_000)
    s += min(25, avg_views / 25_000)
    s += min(22, engagement_rate * 500)
    if len(niche_keyword) > 6:
        s += 5
    score = int(max(0, min(100, round(s))))
    tier = "Emerging"
    if score >= 75:
        tier = "Strong"
    elif score >= 50:
        tier = "Good"
    return {
        "score": score,
        "tier": tier,
        "factors": [
            f"Audience scale (~{subs:,} subs)",
            f"Typical reach (~{avg_views:,.0f} views/video in sample)",
            f"Engagement signal (~{engagement_rate * 100:.2f}%)",
        ],
    }


def _title_keyword_frequency(videos: list[dict[str, Any]], top_n: int = 12) -> list[dict[str, Any]]:
    stop = frozenset(
        "the and for with from this that your you are can our has have was were will what when "
        "how why into more most some than then them they their about also just like make many "
        "much part real new all any get not now one out see use day only too course full free best".split()
    )
    words: list[str] = []
    for v in videos:
        t = str(v.get("title") or "").lower()
        for w in re.findall(r"[a-zA-Z][a-zA-Z0-9+]{3,}", t):
            if w not in stop:
                words.append(w)
    ctr = Counter(words)
    return [{"term": w, "count": c} for w, c in ctr.most_common(top_n)]


def _hook_strength(videos: list[dict[str, Any]]) -> dict[str, Any]:
    """Proxy: shorter videos with high views-per-minute → stronger hook assumption."""
    scores = []
    for v in videos:
        dur = max(60, int(v.get("duration_seconds") or 600))
        views = int(v.get("views") or 0)
        vpm = views / (dur / 60.0)
        # normalize roughly 0–100
        h = min(100, max(15, 22 + (vpm / 500) ** 0.5 * 15))
        scores.append(h)
    avg = sum(scores) / len(scores) if scores else 45.0
    return {
        "hook_strength_score": round(avg, 1),
        "note": "Estimated from views-per-minute vs duration (no 30s retention data in feed).",
    }


def _competitor_benchmark_stub(
    metrics: dict[str, Any],
    videos: list[dict[str, Any]],
    engineered: dict[str, Any],
) -> dict[str, Any]:
    subs = int(metrics.get("subscribers") or 0)
    vc = int(metrics.get("video_count") or len(videos) or 1)
    avg_len = 0.0
    if videos:
        avg_len = sum(int(v.get("duration_seconds") or 0) for v in videos) / len(videos) / 60.0
    uploads_per_week = min(7, max(0.5, len(videos) / 4))  # sample proxy
    niche_avg_len = max(8, avg_len * 0.92 + 3)
    niche_uploads = max(0.8, uploads_per_week * 0.85)
    niche_eng = max(0.01, (engineered.get("avg_engagement_rate_30d") or 0.03) * 0.95)
    return {
        "you": {
            "avg_video_length_min": round(avg_len, 1),
            "uploads_per_week_est": round(uploads_per_week, 2),
            "engagement_rate": round(float(engineered.get("avg_engagement_rate_30d") or 0), 4),
        },
        "niche_average_est": {
            "avg_video_length_min": round(niche_avg_len, 1),
            "uploads_per_week_est": round(niche_uploads, 2),
            "engagement_rate": round(niche_eng, 4),
        },
        "note": "Niche averages are illustrative benchmarks for context (not live competitor pulls).",
    }


def _topic_gaps_list(
    detected_gaps: list[Any],
    niche_keyword: str,
    channel_title: str,
    use_llm: bool,
) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for g in detected_gaps[:5]:
        if isinstance(g, dict):
            t = str(g.get("topic_opportunity") or g.get("title") or "")
            if t:
                out.append({"topic": t, "source": "gap_detector"})
        elif isinstance(g, str) and g:
            out.append({"topic": g, "source": "gap_detector"})
    if len(out) >= 5:
        return out[:5]
    if use_llm:
        try:
            from llm_client import get_llm_chat_model, get_llm_client

            client = get_llm_client()
            if client:
                model = get_llm_chat_model()
                prompt = (
                    f"Channel niche keyword: {niche_keyword}. Channel: {channel_title}.\n"
                    "List exactly 5 short trending video topic ideas this channel is underserving. "
                    "One topic per line, no numbering, max 8 words each."
                )
                resp = client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=200,
                    temperature=0.7,
                )
                text = (resp.choices[0].message.content or "").strip()
                for line in text.splitlines():
                    line = line.strip().lstrip("0123456789.-) ")
                    if 8 < len(line) < 120:
                        out.append({"topic": line, "source": "llm"})
                    if len(out) >= 5:
                        break
        except Exception as e:
            logger.warning("topic gaps LLM failed: %s", e)
    while len(out) < 5:
        out.append(
            {
                "topic": f"Deep-dive on {niche_keyword} for practitioners",
                "source": "fallback",
            }
        )
    return out[:5]


def build_creator_analysis_panel(
    *,
    videos: list[dict[str, Any]],
    video_stat_rows: list[dict[str, Any]],
    metrics: dict[str, Any],
    engineered_features: dict[str, Any],
    _subscriber_forecast: dict[str, Any],
    views_forecast: dict[str, Any],
    views_timeseries: list[dict[str, Any]],
    detected_gaps: list[Any],
    niche_keyword: str,
    content_optimization: dict[str, Any],
    channel_title: str,
    use_llm: bool,
    yt_comment_entries: list[dict[str, Any]] | None = None,
    use_groq_nlp: bool = False,
) -> dict[str, Any]:
    ch_key = channel_title or niche_keyword or "channel"
    eng = float(engineered_features.get("avg_engagement_rate_30d") or 0)
    subs = int(metrics.get("subscribers") or 0)
    tv = int(metrics.get("views") or 0)
    vc = max(1, int(metrics.get("video_count") or len(videos) or 1))
    avg_views = tv / vc if vc else 0

    if yt_comment_entries:
        texts = [str(x.get("text") or "") for x in yt_comment_entries if x.get("text")]
        live = analyze_comment_texts(texts, use_groq=use_groq_nlp)
        if live:
            sentiment = live
        else:
            sentiment = _comment_sentiment_with_logic(ch_key, eng, _comment_sentiment_split(ch_key, eng))
    else:
        sentiment = _comment_sentiment_with_logic(ch_key, eng, _comment_sentiment_split(ch_key, eng))
    retention = _audience_retention_curve(ch_key)
    nvr = _new_vs_returning(subs, tv, vc)
    sub_horizons = _subscriber_horizons(views_timeseries)
    wg = engineered_features.get("weekly_growth_rate_pct")
    gv = views_forecast.get("growth_pct") if isinstance(views_forecast, dict) else None
    momentum = _momentum_score(
        float(wg) if wg is not None else None,
        eng,
        float(gv) if gv is not None else None,
    )
    upload_cal = _upload_calendar_rows(video_stat_rows)
    rpm = _rpm_by_format(videos)
    sponsor = _sponsorship_readiness(subs, avg_views, eng, niche_keyword)
    kw_freq = _title_keyword_frequency(videos)
    hook = _hook_strength(videos)
    bench = _competitor_benchmark_stub(metrics, videos, engineered_features)
    topics = _topic_gaps_list(detected_gaps, niche_keyword, channel_title, use_llm)

    thumb_ab = content_optimization.get("thumbnail") if isinstance(content_optimization, dict) else {}
    title_pack = content_optimization.get("title_optimization") if isinstance(content_optimization, dict) else {}

    return {
        "comment_sentiment": sentiment,
        "audience_retention_curve": retention,
        "new_vs_returning_viewers": nvr,
        "subscriber_growth_horizons": sub_horizons,
        "momentum": momentum,
        "upload_consistency_calendar": upload_cal,
        "rpm_by_content_type": rpm,
        "sponsorship_readiness": sponsor,
        "title_thumbnail_intel": {
            "thumbnail_tips": thumb_ab if isinstance(thumb_ab, dict) else {},
            "title_variants_hint": (
                (title_pack.get("title_suggestions") or title_pack.get("variants") or [])[:3]
                if isinstance(title_pack, dict)
                else []
            ),
        },
        "keyword_frequency_top_videos": kw_freq,
        "hook_strength": hook,
        "competitor_benchmark": bench,
        "topic_gap_finder": topics,
    }
