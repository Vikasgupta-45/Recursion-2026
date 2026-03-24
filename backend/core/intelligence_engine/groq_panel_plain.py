"""
Groq/OpenAI: plain-language captions per widget + a channel digest (headline + bullets).
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

PLAIN_KEYS = [
    "comment_sentiment",
    "retention",
    "new_vs_returning",
    "best_posting_day",
    "duration_views",
    "drivers",
    "subscriber_forecast",
    "views_forecast",
    "momentum",
    "upload_calendar",
    "rpm",
    "sponsorship",
    "benchmark",
    "keywords",
    "hook",
    "topic_gaps",
]


def _parse_json_loose(raw: str) -> dict[str, Any] | None:
    s = (raw or "").strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", s)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    return None


def generate_panel_ai_bundle(
    snapshot: dict[str, Any],
    *,
    use_llm: bool,
) -> tuple[dict[str, str], dict[str, Any]]:
    """
    Returns (plain_language, ai_digest).
    ai_digest: headline, bullets (list[str]), priority (one thing to do first).
    """
    plain: dict[str, str] = {}
    digest: dict[str, Any] = {"headline": "", "bullets": [], "priority": ""}
    if not use_llm:
        return plain, digest

    try:
        from llm_client import get_llm_chat_model, get_llm_client

        client = get_llm_client()
        if not client:
            return plain, digest

        model = get_llm_chat_model()
        payload = json.dumps(snapshot, default=str)[:11000]
        prompt = (
            "You are a YouTube coach. The creator is NOT technical.\n\n"
            "PART A — digest (most important):\n"
            "- headline: ONE short sentence (max 18 words) on how this channel is doing overall and why it matters.\n"
            "- bullets: EXACTLY 5 strings. Each must be a concrete, actionable insight for their content strategy "
            "(what to double down on, what to test, posting or format). No generic advice like 'keep uploading'.\n"
            "- priority: ONE sentence — the single smartest move they should make this week based on the data.\n\n"
            "PART B — plain_language object:\n"
            "For EACH key below, 2 short sentences max. Simple words only. "
            "Explain WHY things look this way for THEIR channel — not how to read charts. "
            "No jargon: no Pearson, Gini, API, regression, Prophet, correlation, percentile.\n"
            "Keys: "
            + ", ".join(f'"{k}"' for k in PLAIN_KEYS)
            + ".\n\n"
            f"Data JSON:\n{payload}\n\n"
            "Reply with ONLY valid JSON of this shape:\n"
            '{"digest":{"headline":"...","bullets":["...","...","...","...","..."],"priority":"..."},'
            '"plain_language":{"comment_sentiment":"...", ...}}\n'
        )
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2200,
            temperature=0.4,
        )
        raw = (resp.choices[0].message.content or "").strip()
        data = _parse_json_loose(raw)
        if not isinstance(data, dict):
            return plain, digest

        d = data.get("digest")
        if isinstance(d, dict):
            h = d.get("headline")
            if isinstance(h, str) and h.strip():
                digest["headline"] = h.strip()[:240]
            bl = d.get("bullets")
            if isinstance(bl, list):
                digest["bullets"] = [str(x).strip() for x in bl if str(x).strip()][:5]
            pr = d.get("priority")
            if isinstance(pr, str) and pr.strip():
                digest["priority"] = pr.strip()[:400]

        pl = data.get("plain_language")
        if isinstance(pl, dict):
            for k in PLAIN_KEYS:
                v = pl.get(k)
                if isinstance(v, str) and v.strip():
                    plain[k] = v.strip()[:1200]

        return plain, digest
    except Exception as e:
        logger.warning("panel AI bundle failed: %s", e)
        return plain, digest


def generate_plain_language_captions(snapshot: dict[str, Any], *, use_llm: bool) -> dict[str, str]:
    """Backward-compatible: captions only."""
    p, _ = generate_panel_ai_bundle(snapshot, use_llm=use_llm)
    return p


def build_snapshot_for_plain_language(
    *,
    channel_title: str,
    metrics: dict[str, Any],
    performance: dict[str, Any],
    content_insights: dict[str, Any],
    panel: dict[str, Any],
    views_forecast: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Small JSON safe blob for the LLM."""
    cs = panel.get("comment_sentiment") if isinstance(panel.get("comment_sentiment"), dict) else {}
    vf = views_forecast if isinstance(views_forecast, dict) else {}
    return {
        "channel": channel_title,
        "subscribers": metrics.get("subscribers"),
        "total_views": metrics.get("views"),
        "comment_sentiment_pct": {
            "positive": cs.get("positive"),
            "neutral": cs.get("neutral"),
            "negative": cs.get("negative"),
            "source": cs.get("source"),
            "samples": (cs.get("example_positive") or [])[:2],
        },
        "best_posting_day": performance.get("best_posting_day"),
        "posting_note": (performance.get("best_posting_day_rationale") or "")[:400],
        "top_driver": performance.get("top_feature_driver"),
        "duration_correlation": (performance.get("duration_vs_views") or {}).get("correlation_pearson"),
        "duration_narrative": (performance.get("duration_vs_views") or {}).get("narrative", "")[:400],
        "content": {
            "best_duration": content_insights.get("best_duration"),
            "format_tip": content_insights.get("format_recommendation"),
        },
        "momentum": panel.get("momentum"),
        "new_vs_returning": panel.get("new_vs_returning_viewers"),
        "views_forecast_growth_pct": vf.get("growth_pct"),
        "upload_days_with_uploads": sum(
            1
            for r in (panel.get("upload_consistency_calendar") or [])
            if isinstance(r, dict) and int(r.get("uploads") or 0) > 0
        ),
        "rpm_formats": panel.get("rpm_by_content_type"),
        "sponsor": panel.get("sponsorship_readiness"),
        "hook": panel.get("hook_strength"),
        "top_keywords": (panel.get("keyword_frequency_top_videos") or [])[:6],
        "topic_ideas": (panel.get("topic_gap_finder") or [])[:5],
    }
