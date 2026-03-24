"""Orchestrate competitor fetch, metrics, and Gemini report."""

from __future__ import annotations

from typing import Any

from competitor_analyzer.compare import build_metric_comparison
from competitor_analyzer.gemini_client import generate_competitor_report
from competitor_analyzer.metrics import (
    compact_videos_for_prompt,
    compute_video_metrics,
    title_and_publishing_signals,
)
from competitor_analyzer.rate_limit import assert_can_analyze, record_success
from competitor_analyzer.youtube_data import (
    fetch_channel_full,
    fetch_last_n_upload_video_ids,
    fetch_videos_batch,
    resolve_competitor_channel_id,
)


def run_competitor_analysis(competitor_url: str, my_channel_id: str) -> dict[str, Any]:
    my_id = (my_channel_id or "").strip()
    if not my_id:
        raise ValueError("my_channel_id is required")
    if not my_id.startswith("UC") or len(my_id) < 10:
        raise ValueError("my_channel_id must be a valid YouTube channel id (UC…)")

    assert_can_analyze(my_id)

    comp_id = resolve_competitor_channel_id(competitor_url)
    if comp_id == my_id:
        raise ValueError("Competitor channel cannot be the same as your channel")

    comp_ch = fetch_channel_full(comp_id)
    uploads = comp_ch.get("uploads_playlist_id")
    if not uploads:
        raise ValueError("Competitor channel has no uploads playlist")

    comp_vids = fetch_last_n_upload_video_ids(uploads, 20)
    comp_rows = fetch_videos_batch(comp_vids)
    comp_metrics = compute_video_metrics(comp_ch, comp_rows)

    my_ch = fetch_channel_full(my_id)
    my_uploads = my_ch.get("uploads_playlist_id")
    my_rows: list[dict[str, Any]] = []
    if my_uploads:
        my_vid_ids = fetch_last_n_upload_video_ids(my_uploads, 20)
        my_rows = fetch_videos_batch(my_vid_ids)
    my_metrics = compute_video_metrics(my_ch, my_rows)

    cname = str(my_ch.get("title") or "You")
    comp_name = str(comp_ch.get("title") or "Competitor")
    comparison = build_metric_comparison(my_metrics, comp_metrics, cname, comp_name)

    gemini_payload = {
        "analysis_brief": (
            "Compare these two channels in the SAME niche. The creator wants to know: "
            "(1) exactly what the competitor does better that drives more traction on the same topics/game, "
            "(2) what the creator is doing wrong or under-optimizing vs the competitor, with evidence from metrics and titles/tags, "
            "(3) concrete fixes. Ground every claim in the numbers and video lists provided."
        ),
        "deterministic_comparison": comparison,
        "competitor": {
            "channel": {k: v for k, v in comp_ch.items() if k != "description"},
            "computed_metrics": comp_metrics,
            "title_patterns": title_and_publishing_signals(comp_rows),
            "recent_videos": compact_videos_for_prompt(comp_rows, 20),
        },
        "creator_you": {
            "channel": {k: v for k, v in my_ch.items() if k != "description"},
            "computed_metrics": my_metrics,
            "title_patterns": title_and_publishing_signals(my_rows),
            "recent_videos": compact_videos_for_prompt(my_rows, 20),
        },
    }

    report = generate_competitor_report(gemini_payload)
    record_success(my_id)

    return {
        "status": "success",
        "report": report,
        "metrics": {
            "competitor": comp_metrics,
            "creator": my_metrics,
            "comparison": comparison,
            "competitor_channel": {
                "channel_id": comp_ch.get("channel_id"),
                "title": comp_ch.get("title"),
            },
            "creator_channel": {
                "channel_id": my_ch.get("channel_id"),
                "title": my_ch.get("title"),
            },
        },
    }
