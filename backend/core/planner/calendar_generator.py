"""
30-day rolling content calendar from strategy ideas + best posting day.
"""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from .milestone_planner import weekly_milestones
from .task_generator import tasks_for_slot

_DAY_INDEX = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}

_ROTATION = [
    ("AI long-form video", "Long-form video"),
    ("Short reel", "Short / Shorts"),
    ("Community post", "Community post"),
    ("Short reel", "Short / Shorts"),
    ("Deep tutorial", "Long-form video"),
    ("Behind the scenes", "Community post"),
    ("Trend reaction", "Short / Shorts"),
]


def _next_date_for_weekday(start: date, target_weekday: int) -> date:
    """First occurrence of target_weekday on or after start (Mon=0)."""
    delta = (target_weekday - start.weekday()) % 7
    return start + timedelta(days=delta)


def build_30_day_plan(
    video_ideas: list[dict],
    best_posting_day: str = "Saturday",
    start: date | None = None,
    subscriber_forecast: dict[str, Any] | None = None,
) -> dict[str, Any]:
    start = start or date.today()
    target_wd = _DAY_INDEX.get((best_posting_day or "Saturday").lower(), 5)

    idea_topics = [str(i.get("topic") or i.get("format") or "Content piece") for i in video_ideas]
    if not idea_topics:
        idea_topics = ["Channel pillar content", "Quick win short", "Community update"]

    days_out: list[dict[str, Any]] = []
    for i in range(30):
        d = start + timedelta(days=i)
        label, ctype = _ROTATION[i % len(_ROTATION)]
        topic = idea_topics[i % len(idea_topics)]
        if d.weekday() == target_wd and i > 0:
            ctype = "Long-form video"
            topic = idea_topics[0]

        entry = {
            "day_index": i + 1,
            "date": d.isoformat(),
            "weekday": d.strftime("%A"),
            "content_type": ctype,
            "title_hint": f"{label}: {topic}"[:120],
            "tasks": tasks_for_slot(ctype, topic),
        }
        days_out.append(entry)

    milestones = weekly_milestones(30, subscriber_forecast, video_ideas)

    return {
        "horizon_days": 30,
        "start_date": start.isoformat(),
        "best_posting_day": best_posting_day,
        "days": days_out,
        "milestones": milestones,
    }
