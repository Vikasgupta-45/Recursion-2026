"""
Module 7 — Engagement Forecast (engagement_forecast.py)

Forecasts engagement_rate over time and flags anomalies (sudden drops or
spikes) so the strategy agent can react.
"""

from typing import List, Dict, Any

import numpy as np
import pandas as pd

from prediction_engine.growth_predictor import predict_growth


def _detect_anomalies(series: pd.Series, z_threshold: float = 2.0) -> List[Dict[str, Any]]:
    """Flag dates where engagement deviates > ``z_threshold`` std from mean."""
    mean = series.mean()
    std = series.std()
    if std == 0:
        return []

    anomalies = []
    for date, val in series.items():
        z = (val - mean) / std
        if abs(z) >= z_threshold:
            anomalies.append({
                "date": pd.Timestamp(date).strftime("%Y-%m-%d"),
                "engagement_rate": round(float(val), 4),
                "z_score": round(float(z), 2),
                "type": "spike" if z > 0 else "drop",
            })
    return anomalies


def forecast_engagement(
    timeseries: List[Dict[str, Any]],
    periods: int = 60,
) -> Dict[str, Any]:
    """
    Predict engagement rate trajectory and surface historical anomalies.

    Parameters
    ----------
    timeseries : list of dicts with keys ``date`` and ``engagement_rate``.
    periods : forecast horizon in days.

    Returns
    -------
    dict with forecast, anomalies, and health classification.
    """
    result = predict_growth(timeseries, value_column="engagement_rate", periods=periods)

    if "error" in result:
        return result

    # Classify trend direction
    if result["forecast"]:
        first_half = np.mean([r["yhat"] for r in result["forecast"][:periods // 2]])
        second_half = np.mean([r["yhat"] for r in result["forecast"][periods // 2:]])
        if second_half > first_half * 1.05:
            trend = "improving"
        elif second_half < first_half * 0.95:
            trend = "declining"
        else:
            trend = "stable"
    else:
        trend = "unknown"

    # Anomaly detection on historical data
    df = pd.DataFrame(timeseries)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date").set_index("date")
    anomalies = _detect_anomalies(df["engagement_rate"]) if "engagement_rate" in df.columns else []

    result["metric"] = "engagement_rate"
    result["trend"] = trend
    result["anomalies"] = anomalies
    result["anomaly_count"] = len(anomalies)

    current = result["current_value"]
    predicted = result["predicted_value"]
    result["summary"] = (
        f"Engagement rate is {trend}. "
        f"Current: {current:.4f}, predicted: {predicted:.4f} in {periods} days. "
        f"{len(anomalies)} anomalies detected in historical data."
    )

    return result
