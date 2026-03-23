from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from channel_input.input_validator import ChannelInputRequest, validate_input
from data_collector.youtube_collector import (
    fetch_youtube_metrics,
    fetch_uploads_video_stats,
    resolve_channel_id,
)
from data_collector.trends_collector import fetch_trends_for_topic
from data_processing.feature_engineering import clean_timeseries_data, extract_features
from data_processing.real_timeseries import video_rows_to_daily_timeseries
from data_collector.ytdlp_collector import (
    fetch_channel_content_ytdlp,
    fetch_channel_videos_detailed,
)
from intelligence_engine.performance_analyzer import analyze_performance_drivers
from intelligence_engine.content_analyzer import get_content_insights
from opportunity_engine.gap_detector import detect_content_gaps
from opportunity_engine.trend_detector import fetch_macro_trends
from strategy_engine.strategy_agent import formulate_agentic_strategy
from prediction_engine.growth_predictor import predict_growth
from prediction_engine.subscriber_forecast import forecast_subscribers
from prediction_engine.engagement_forecast import forecast_engagement
from content_optimizer.pipeline import run_content_optimization
from planner.calendar_generator import build_30_day_plan

app = FastAPI(title="Project Growth Engine API")

class AnalysisResponse(BaseModel):
    status: str
    channel_metrics: dict
    content_metrics: dict
    audience_metrics: dict
    intelligence_insights: dict
    opportunities: list
    ai_strategy: dict
    predictions: dict
    content_optimization: dict
    content_calendar: dict

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Growth Engine Backend running"}

@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_channel(request: ChannelInputRequest):
    """
    Module 1 to 3 Flow: Validate -> Collect Data -> Process & Engineer Features
    """
    # MODULE 1: Validate Input
    try:
        validate_input(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # MODULE 2: Collect Real Data (YouTube Data API + yt-dlp)
    metrics = {}
    ytdlp_content = {}
    video_stat_rows: list = []
    channel_uc: str | None = None
    ts_source = "synthetic_fallback"

    if request.youtube_url:
        channel_uc = resolve_channel_id(request.youtube_url)
        lookup_id = channel_uc or request.youtube_url.split("/")[-1].split("?")[0]
        metrics = fetch_youtube_metrics(lookup_id)
        if "error" in metrics:
            metrics = {
                "views": 1500000,
                "subscribers": 85000,
                "video_count": 210,
                "notice": metrics["error"],
            }

        ytdlp_content = fetch_channel_content_ytdlp(request.youtube_url, max_videos=12)

        if channel_uc:
            video_stat_rows = fetch_uploads_video_stats(channel_uc, max_videos=90)
            if video_stat_rows:
                ts_source = "youtube_data_api_v3"
        if not video_stat_rows:
            video_stat_rows = fetch_channel_videos_detailed(request.youtube_url, max_videos=50)
            if video_stat_rows:
                ts_source = "ytdlp_metadata"

    # Also fetch market trends for their niche (real Google Trends)
    market_trend = fetch_trends_for_topic("AI automation")

    # MODULE 3: Process Data — daily series from real uploads when available
    subs = int(metrics.get("subscribers") or 0)
    if video_stat_rows:
        raw_ts = video_rows_to_daily_timeseries(video_stat_rows, subs)
    else:
        raw_ts = []

    if not raw_ts:
        ts_source = "synthetic_fallback"
        raw_ts = [
            {"date": "2026-03-01", "views": metrics.get("views", 1000) * 0.9, "likes": 500, "comments": 20},
            {"date": "2026-03-15", "views": metrics.get("views", 1000) * 0.95, "likes": 520, "comments": 25},
            {"date": "2026-03-30", "views": metrics.get("views", 1000), "likes": 650, "comments": 40},
        ]

    df_cleaned = clean_timeseries_data(raw_ts)
    engineered_features = extract_features(df_cleaned)

    # MODULE 4 & 5: real recent videos for intelligence
    if video_stat_rows:
        videos = [
            {
                "title": r.get("title", ""),
                "views": int(r.get("views") or 0),
                "duration_seconds": int(r.get("duration_seconds") or 0) or 600,
                "published_at": r.get("published_at") or f"{r['date']}T12:00:00Z",
            }
            for r in sorted(video_stat_rows, key=lambda x: x["date"])[-30:]
        ]
    else:
        videos = ytdlp_content.get("latest_videos_metadata", [])
    if not videos:
        videos = [
            {"title": "Building a coding app", "views": 5000, "duration_seconds": 600, "published_at": "2026-03-01T12:00:00Z"},
            {"title": "React vs Vue", "views": 2000, "duration_seconds": 1200, "published_at": "2026-03-05T12:00:00Z"},
            {"title": "AI Agents for Beginners", "views": 8500, "duration_seconds": 950, "published_at": "2026-03-10T12:00:00Z"}
        ]
    
    performance_analysis = analyze_performance_drivers(videos)
    content_insights = get_content_insights(videos)
    
    creator_titles = [v.get("title", "") for v in videos]
    market_trends = fetch_macro_trends()
    detected_gaps = detect_content_gaps(creator_titles, market_trends)
    
    # MODULE 6: Strategy Generation Engine
    agentic_strategy = formulate_agentic_strategy(
        intelligence_insights={"performance_drivers": performance_analysis},
        gaps=detected_gaps
    )

    # MODULE 7: Predictive Growth Model
    views_ts = [
        {
            "date": row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], "strftime") else row["date"],
            "views": row["views"],
            "subscribers": float(row.get("subscribers", metrics.get("subscribers") or 10000)),
            "engagement_rate": float(row.get("engagement_rate", 0.0)),
        }
        for row in df_cleaned.to_dict("records")
    ]

    view_forecast = predict_growth(views_ts, value_column="views", periods=60)
    subscriber_pred = forecast_subscribers(views_ts, periods=60)
    engagement_pred = forecast_engagement(views_ts, periods=60)

    # MODULE 8: Content optimization (YAKE + optional OpenAI)
    trend_blurb = ""
    if isinstance(market_trend, dict):
        trend_blurb = (
            f"keyword={market_trend.get('keyword')} "
            f"current_interest={market_trend.get('current_score')}"
        )
    content_opt = run_content_optimization(
        videos=videos,
        channel_description=str(ytdlp_content.get("channel_description") or ""),
        niche_trend_summary=trend_blurb,
        niche_tags=["AI", "automation", "creator economy"],
    )

    # MODULE 9: 30-day calendar from strategy + best day + subscriber outlook
    content_plan = agentic_strategy.get("weekly_strategy") or {}
    video_ideas = []
    for _day, payload in (content_plan.items() if isinstance(content_plan, dict) else []):
        if isinstance(payload, dict):
            video_ideas.append(
                {"format": payload.get("format", ""), "topic": payload.get("topic", "")}
            )
    if not video_ideas:
        video_ideas = [
            {"format": "Long-form", "topic": "Flagship tutorial"},
            {"format": "Short", "topic": "Quick tip"},
        ]
    calendar = build_30_day_plan(
        video_ideas=video_ideas,
        best_posting_day=performance_analysis.get("best_posting_day", "Saturday"),
        subscriber_forecast=subscriber_pred,
    )

    # OUTPUT: Standard JSON format as requested
    return {
        "status": "success",
        "channel_metrics": {
            "total_views": metrics.get("views"),
            "subscribers": metrics.get("subscribers"),
            "growth_features": engineered_features
        },
        "content_metrics": {
            "video_count": metrics.get("video_count"),
            "niche_trend": market_trend,
            "ytdlp_scraped_data": ytdlp_content
        },
        "audience_metrics": {
            "avg_engagement": engineered_features.get("avg_engagement_rate_30d")
        },
        "intelligence_insights": {
            "performance_drivers": performance_analysis,
            "content_insights": content_insights
        },
        "opportunities": detected_gaps,
        "ai_strategy": agentic_strategy,
        "predictions": {
            "views_forecast": view_forecast,
            "subscriber_forecast": subscriber_pred,
            "engagement_forecast": engagement_pred,
            "timeseries_source": ts_source,
        },
        "content_optimization": content_opt,
        "content_calendar": calendar,
    }
