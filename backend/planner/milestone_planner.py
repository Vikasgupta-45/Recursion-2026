"""
Week-level milestones tied to forecast growth when available.
"""

from __future__ import annotations

from typing import Any


def weekly_milestones(
    horizon_days: int,
    subscriber_forecast: dict[str, Any] | None,
    video_ideas: list[dict],
) -> list[dict[str, Any]]:
    weeks = max(1, (horizon_days + 6) // 7)
    primary = (video_ideas[0].get("topic") if video_ideas else "flagship video") or "flagship video"

    pred = subscriber_forecast or {}
    growth = pred.get("growth_pct")
    summary = pred.get("summary")

    out: list[dict[str, Any]] = []
    for w in range(1, weeks + 1):
        goal = f"Week {w}: ship {2 if w <= 2 else 1} core pieces; double down on {primary[:50]}"
        if w == 1:
            goal = f"Week 1: baseline analytics + publish flagship on {primary[:40]}"
        if w == weeks:
            goal = f"Week {w}: retrospective + plan next 30 days from learnings"
        row: dict[str, Any] = {
            "week": w,
            "milestone_title": goal,
            "success_metric": "Watch-time hours + new subs vs prior week",
        }
        if growth is not None and w == weeks:
            row["forecast_context"] = summary or f"Modeled ~{growth}% growth over horizon"
        out.append(row)
    return out
