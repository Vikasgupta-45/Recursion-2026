"""
Module 7 — Subscriber Forecast (subscriber_forecast.py)

Specialised wrapper around the growth predictor that focuses on subscriber
count projections with milestone detection (e.g. "on track to hit 100k").
"""

import math
from typing import List, Dict, Any

from prediction_engine.growth_predictor import predict_growth


MILESTONES = [1_000, 5_000, 10_000, 25_000, 50_000, 100_000,
              250_000, 500_000, 1_000_000]


def _next_milestone(current: float) -> int | None:
    for m in MILESTONES:
        if current < m:
            return m
    return None


def _days_to_milestone(forecast: List[Dict], target: int) -> int | None:
    """Scan forecast records to find the first day yhat crosses ``target``."""
    for i, record in enumerate(forecast):
        if record["yhat"] >= target:
            return i + 1
    return None


def forecast_subscribers(
    timeseries: List[Dict[str, Any]],
    periods: int = 60,
) -> Dict[str, Any]:
    """
    Predict subscriber growth.

    Parameters
    ----------
    timeseries : list of dicts with keys ``date`` and ``subscribers``.
    periods : forecast horizon in days.

    Returns
    -------
    dict with full forecast plus milestone projections.
    """
    result = predict_growth(timeseries, value_column="subscribers", periods=periods)

    if "error" in result:
        return result

    current = result["current_value"]
    predicted = result["predicted_value"]

    milestone = _next_milestone(current)
    days_needed = None
    if milestone and result.get("forecast"):
        days_needed = _days_to_milestone(result["forecast"], milestone)

    result["metric"] = "subscribers"
    result["next_milestone"] = milestone
    result["days_to_milestone"] = days_needed
    result["milestone_reachable"] = days_needed is not None

    result["summary"] = (
        f"Current: {_fmt(current)} subscribers. "
        f"Predicted: {_fmt(predicted)} in {periods} days "
        f"({result['growth_pct']:+.1f}%)."
    )
    if milestone:
        if days_needed:
            result["summary"] += f" On track to hit {_fmt(milestone)} in ~{days_needed} days."
        else:
            result["summary"] += f" {_fmt(milestone)} milestone not reached within {periods}-day window."

    return result


def _fmt(n: float) -> str:
    """Human-friendly number: 14200 → '14.2k', 1500000 → '1.5M'."""
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}k"
    return str(int(n))
