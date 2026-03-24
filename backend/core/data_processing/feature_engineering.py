import pandas as pd
import numpy as np

def clean_timeseries_data(raw_data: list) -> pd.DataFrame:
    """Sort by date; forward-fill only true NaNs (do not wipe legitimate zeros)."""
    df = pd.DataFrame(raw_data)
    if df.empty:
        return df
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")
    for col in ("views", "likes", "comments"):
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").ffill().bfill().fillna(0)
    return df

def extract_features(df: pd.DataFrame) -> dict:
    """Extracts derived metrics: Engagement Rate & Growth Rate."""
    if df.empty or 'views' not in df.columns:
        return {}
        
    # Engagement = (likes + comments) / views (flat yt-dlp often has no likes → impute)
    if "likes" in df.columns and "comments" in df.columns:
        vw = df["views"].replace(0, np.nan)
        df["engagement_rate"] = (df["likes"] + df["comments"]) / vw
        df["engagement_rate"] = (
            df["engagement_rate"].replace([np.inf, -np.inf], np.nan).fillna(0.0)
        )
    else:
        df["engagement_rate"] = 0.0

    mean_er = float(df["engagement_rate"].mean())
    vsum = float(df["views"].sum()) if "views" in df.columns else 0.0
    engagement_imputed = False
    if mean_er < 1e-5 and vsum > 0:
        # Typical long-form YouTube range when per-video likes are not scraped (~1.5–5%)
        mean_er = float(min(0.055, max(0.018, 3.8 / max(np.log10(vsum + 10), 2.5))))
        engagement_imputed = True

    # Growth rate = change in subscribers/views over 7 days
    if len(df) >= 7:
        growth_rate = ((df['views'].iloc[-1] - df['views'].iloc[-7]) / df['views'].iloc[-7]) * 100
    else:
        growth_rate = 0.0
        
    return {
        "avg_engagement_rate_30d": mean_er,
        "weekly_growth_rate_pct": float(growth_rate),
        "engagement_is_imputed": engagement_imputed,
    }
