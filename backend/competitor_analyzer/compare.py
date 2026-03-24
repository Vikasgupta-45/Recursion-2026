"""Deterministic creator vs competitor metric comparison for UI + LLM context."""

from __future__ import annotations

from typing import Any


def _f(x: Any) -> float:
    try:
        return float(x)
    except (TypeError, ValueError):
        return 0.0


def _winner_you_higher(you: float, them: float, eps_ratio: float = 0.03) -> str:
    if you <= 0 and them <= 0:
        return "tie"
    base = max(abs(you), abs(them), 1e-9)
    if abs(you - them) / base < eps_ratio:
        return "tie"
    return "you" if you > them else "competitor"


def _winner_you_lower(you: float, them: float, eps_ratio: float = 0.05) -> str:
    """Lower is better (e.g. flop rate)."""
    if you <= 0 and them <= 0:
        return "tie"
    base = max(abs(you), abs(them), 1e-9)
    if abs(you - them) / base < eps_ratio:
        return "tie"
    return "you" if you < them else "competitor"


def build_metric_comparison(
    creator_metrics: dict[str, Any],
    competitor_metrics: dict[str, Any],
    creator_name: str,
    competitor_name: str,
) -> dict[str, Any]:
    """
    Row-wise winners for dashboard table + Gemini grounding.
    delta_pct: positive => competitor higher (when higher_is_better), or you worse.
    """
    defs: list[tuple[str, str, str, bool]] = [
        ("median_views", "Median views (last 20)", "views", True),
        ("engagement_rate", "Engagement (likes+comments / views)", "rate", True),
        ("hit_rate_pct", "Hit rate (% uploads above channel avg views)", "percent", True),
        ("momentum_pct", "Momentum (recent vs older batch)", "percent", True),
        ("uploads_per_week", "Uploads per week (lifetime pace)", "pace", True),
        ("consistency_score", "Upload consistency (0–10)", "score", True),
        ("views_per_subscriber", "Views per subscriber (library)", "ratio", True),
        ("avg_video_length_minutes", "Avg length last 20 (min)", "minutes", True),
        ("shorts_ratio_pct", "Shorts share last 20 (<2 min)", "percent", True),
        ("flop_rate_pct", "Flop rate (<1k views)", "percent", False),
    ]

    rows: list[dict[str, Any]] = []
    you_w = they_w = ties = 0

    for key, label, _kind, higher_is_better in defs:
        y = _f(creator_metrics.get(key))
        t = _f(competitor_metrics.get(key))
        if higher_is_better:
            w = _winner_you_higher(y, t)
            denom = max(y, 1e-9)
            delta_pct = round(((t - y) / denom) * 100, 2) if denom else 0.0
        else:
            w = _winner_you_lower(y, t)
            denom = max(t, 1e-9)
            delta_pct = round(((y - t) / denom) * 100, 2) if denom else 0.0

        if w == "you":
            you_w += 1
        elif w == "competitor":
            they_w += 1
        else:
            ties += 1

        rows.append(
            {
                "key": key,
                "label": label,
                "you": y,
                "competitor": t,
                "winner": w,
                "higher_is_better": higher_is_better,
                "delta_pct": delta_pct,
            }
        )

    return {
        "creator_label": creator_name or "You",
        "competitor_label": competitor_name or "Competitor",
        "metric_rows": rows,
        "win_counts": {"you": you_w, "competitor": they_w, "tie": ties},
    }
