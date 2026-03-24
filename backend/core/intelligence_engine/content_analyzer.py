import pandas as pd
from typing import List, Dict, Any


def get_content_insights(videos: List[Dict]) -> dict:
    """Duration buckets, best-performing band, and narrative evidence for the Analysis Panel."""
    df = pd.DataFrame(videos)
    if df.empty or "duration_seconds" not in df.columns:
        return {"error": "Missing duration context"}

    df["duration_min"] = df["duration_seconds"] / 60

    bins = [0, 3, 8, 12, 20, 1000]
    labels = ["<3 min", "3-8 min", "8-12 min", "12-20 min", "20+ min"]
    df["duration_category"] = pd.cut(df["duration_min"], bins=bins, labels=labels)

    try:
        grouped = df.groupby("duration_category", observed=False)["views"]
        means = grouped.mean()
        counts = grouped.count()
        best_duration = str(means.idxmax()) if not means.isna().all() else "Unknown"
    except Exception:
        means = pd.Series(dtype=float)
        counts = pd.Series(dtype=int)
        best_duration = "Unknown"

    bucket_breakdown: List[Dict[str, Any]] = []
    for cat in labels:
        sub = df[df["duration_category"] == cat]
        if len(sub) == 0:
            continue
        v = sub["views"].fillna(0).astype(float)
        bucket_breakdown.append(
            {
                "bucket": cat,
                "count": int(len(sub)),
                "mean_views": round(float(v.mean()), 1),
                "median_views": round(float(v.median()), 1),
                "share_of_views_pct": round(float(v.sum() / max(df["views"].fillna(0).sum(), 1)) * 100, 1),
            }
        )
    bucket_breakdown.sort(key=lambda x: -x["mean_views"])

    median_views_all = float(df["views"].median()) if len(df) else 0.0
    best_bucket_row = bucket_breakdown[0] if bucket_breakdown else None
    why_best = ""
    if best_bucket_row:
        why_best = (
            f"Mean views peak in **{best_bucket_row['bucket']}** (~{best_bucket_row['mean_views']:,.0f} avg over "
            f"{best_bucket_row['count']} video(s)), vs channel median ~{median_views_all:,.0f} views/video in this sample. "
            "That band is where packaging + runtime + topic appear most aligned for your current audience."
        )

    weak_area = "thumbnails CTR"
    format_rec = "Long-form tutorials"
    if best_duration in ("<3 min", "3-8 min"):
        format_rec = "Punchy short-to-mid videos with strong hooks"
    elif best_duration in ("8-12 min", "12-20 min"):
        format_rec = "Standard long-form explainers and structured tutorials"

    return {
        "best_duration": str(best_duration),
        "weak_area": weak_area,
        "format_recommendation": format_rec,
        "bucket_breakdown": bucket_breakdown,
        "selection_rationale": why_best
        or "Not enough spread across duration bands to contrast buckets — upload a wider mix to sharpen recommendations.",
        "weak_area_why": (
            "Thumbnail CTR is the highest-leverage surface we can flag without your private Studio CTR exports: "
            "it gates impressions before watch time. Pair title tests with bold, readable faces or objects and "
            "one clear keyword aligned with search intent."
        ),
        "format_recommendation_why": (
            f"We bias format advice toward **{best_duration}** because that bucket carries the highest mean views "
            "in your recent tail — holding topic constant, doubling down on proven length reduces format risk."
        ),
        "data_selection_note": (
            "Buckets use fixed minute edges (3 / 8 / 12 / 20) so you can compare to industry heuristics; "
            "adjust cadence if your niche standard is longer (e.g. podcasts)."
        ),
    }
