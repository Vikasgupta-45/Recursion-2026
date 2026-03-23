from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from channel_input.input_validator import ChannelInputRequest, validate_input
from data_collector.youtube_collector import fetch_youtube_metrics
from data_collector.trends_collector import fetch_trends_for_topic
from data_processing.feature_engineering import clean_timeseries_data, extract_features
from data_collector.ytdlp_collector import fetch_channel_content_ytdlp
from intelligence_engine.performance_analyzer import analyze_performance_drivers
from intelligence_engine.content_analyzer import get_content_insights
from opportunity_engine.gap_detector import detect_content_gaps
from opportunity_engine.trend_detector import fetch_macro_trends
from strategy_engine.strategy_agent import formulate_agentic_strategy
from prediction_engine.growth_predictor import predict_growth
from prediction_engine.subscriber_forecast import forecast_subscribers
from prediction_engine.engagement_forecast import forecast_engagement

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
        
    # MODULE 2: Collect Real Data
    metrics = {}
    ytdlp_content = {}
    if request.youtube_url:
        # Extract ID (Assuming ID passed directly for demo ease)
        channel_id_extracted = request.youtube_url.split("/")[-1]
        metrics = fetch_youtube_metrics(channel_id_extracted)
        if "error" in metrics:
            metrics = {
                "views": 1500000,
                "subscribers": 85000,
                "video_count": 210,
                "notice": metrics["error"]
            }
            
        # Fire our new yt-dlp collector to get deep content metrics purely from scraping
        ytdlp_content = fetch_channel_content_ytdlp(request.youtube_url)
            
    # Also fetch market trends for their niche (Hardcoded 'AI Tools' for demo)
    market_trend = fetch_trends_for_topic("AI automation")

    # MODULE 3: Process Data
    # For a real dataset, we'd pass the timeseries here. 
    # Generating mock timeseries to pass into our pandas pipeline to showcase M3.
    mock_timeseries = [
        {"date": "2026-03-01", "views": metrics.get("views", 1000) * 0.9, "likes": 500, "comments": 20},
        {"date": "2026-03-15", "views": metrics.get("views", 1000) * 0.95, "likes": 520, "comments": 25},
        {"date": "2026-03-30", "views": metrics.get("views", 1000), "likes": 650, "comments": 40}
    ]
    
    df_cleaned = clean_timeseries_data(mock_timeseries)
    engineered_features = extract_features(df_cleaned)

    # MODULE 4 & 5: Run AI Intelligence & Opportunity Models
    videos = ytdlp_content.get("latest_videos_metadata", [])
    if not videos: # Safe fallback for hackathon
        videos = [
            {"title": "Building a coding app", "views": 5000, "duration_seconds": 600},
            {"title": "React vs Vue", "views": 2000, "duration_seconds": 1200}
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
        {"date": row["date"].strftime("%Y-%m-%d") if hasattr(row["date"], "strftime") else row["date"],
         "views": row["views"],
         "subscribers": metrics.get("subscribers", 10000),
         "engagement_rate": row.get("engagement_rate", 0.0)}
        for row in df_cleaned.to_dict("records")
    ]

    view_forecast = predict_growth(views_ts, value_column="views", periods=60)
    subscriber_pred = forecast_subscribers(views_ts, periods=60)
    engagement_pred = forecast_engagement(views_ts, periods=60)

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
        }
    }
