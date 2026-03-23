"""
Actionable subtasks per calendar slot.
"""

from __future__ import annotations


def tasks_for_slot(content_type: str, topic_hint: str) -> list[str]:
    t = (topic_hint or "this topic").strip()
    ct = (content_type or "").lower()
    if "short" in ct or "reel" in ct:
        return [
            f"Outline 45s beat sheet for: {t}",
            "Film vertical 9:16, captions burned in",
            "Export 3 hook variants (first 2s)",
            "Post + pin comment with CTA",
        ]
    if "community" in ct:
        return [
            "Draft poll + discussion question around " + t,
            "Schedule post on community tab / Stories",
            "Reply to top 10 comments in first hour",
        ]
    return [
        f"Research outline + primary keyword targets for: {t}",
        "Script intro hook (first 30s) + pattern interrupts",
        "Film A-roll, collect B-roll, record voiceover",
        "Edit, color grade, mix audio, add chapters",
        "Upload, set end screens, publish + first-hour analytics check",
    ]
