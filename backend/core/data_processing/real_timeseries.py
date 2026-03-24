"""
Build daily time-series for Module 7 from real per-video API / yt-dlp rows.
"""

from __future__ import annotations

from typing import Any

import numpy as np
import pandas as pd


def video_rows_to_daily_timeseries(
    rows: list[dict[str, Any]],
    current_subscribers: int,
) -> list[dict[str, Any]]:
    """
    Aggregate multiple uploads on the same day; add engagement_rate and a
    monotonic subscriber *proxy* series (API does not expose historical subs).
    """
    if not rows:
        return []

    df = pd.DataFrame(rows)
    df["date"] = pd.to_datetime(df["date"])
    for col in ("views", "likes", "comments"):
        if col not in df.columns:
            df[col] = 0
    daily = (
        df.groupby(df["date"].dt.normalize(), as_index=False)
        .agg({"views": "sum", "likes": "sum", "comments": "sum"})
        .sort_values("date")
    )
    daily["engagement_rate"] = (daily["likes"] + daily["comments"]) / daily["views"].replace(
        0, np.nan
    )
    daily["engagement_rate"] = daily["engagement_rate"].fillna(0.0).clip(lower=0.0)

    subs = int(max(current_subscribers, 0))
    if subs > 0 and len(daily) > 0:
        cv = daily["views"].cumsum()
        total = float(cv.iloc[-1]) or 1.0
        ratio = (cv / total) ** 0.42
        daily["subscribers"] = (ratio * subs).clip(lower=1.0).round().astype(int)
        daily.iloc[-1, daily.columns.get_loc("subscribers")] = subs
    else:
        daily["subscribers"] = max(subs, 1)

    out = []
    for _, r in daily.iterrows():
        out.append(
            {
                "date": r["date"].strftime("%Y-%m-%d"),
                "views": float(r["views"]),
                "likes": float(r["likes"]),
                "comments": float(r["comments"]),
                "engagement_rate": float(r["engagement_rate"]),
                "subscribers": int(r["subscribers"]),
            }
        )
    return out
