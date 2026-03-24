import json
import logging
import os
import re
import uuid
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import app_config

from auth.deps import get_current_user_optional, get_current_user_required
from auth.routes import router as auth_router
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from googleapiclient.errors import HttpError
from pydantic import BaseModel
from sqlalchemy.orm import Session
from channel_input.input_validator import ChannelInputRequest, validate_input
from data_collector.youtube_collector import (
    extract_video_id,
    fetch_channel_video_catalog,
    fetch_uploads_video_stats,
    fetch_videos_by_ids,
    fetch_youtube_metrics,
    resolve_channel_id,
)
from intelligence_engine.video_insights import compute_channel_benchmarks, full_video_insights
from data_collector.trends_collector import fetch_trends_for_topic
from data_processing.feature_engineering import clean_timeseries_data, extract_features
from data_processing.real_timeseries import video_rows_to_daily_timeseries
from data_collector.ytdlp_collector import (
    fetch_channel_catalog_ytdlp,
    fetch_channel_content_ytdlp,
    fetch_channel_videos_detailed,
    fetch_video_row_ytdlp,
)
from intelligence_engine.performance_analyzer import analyze_performance_drivers
from intelligence_engine.content_analyzer import get_content_insights
from intelligence_engine.niche_keyword import infer_niche_keyword
from intelligence_engine.analysis_panel import build_creator_analysis_panel
from intelligence_engine.groq_panel_plain import (
    build_snapshot_for_plain_language,
    generate_panel_ai_bundle,
)
from data_collector.youtube_comments import fetch_comments_for_videos
from intelligence_engine.thumbnail_ctr_predictor import predict_thumbnail_ctr_score
from opportunity_engine.gap_detector import detect_content_gaps
from opportunity_engine.trend_detector import fetch_macro_trends
from strategy_engine.strategy_agent import formulate_agentic_strategy
from prediction_engine.growth_predictor import predict_growth
from prediction_engine.subscriber_forecast import forecast_subscribers
from prediction_engine.engagement_forecast import forecast_engagement
from content_optimizer.pipeline import run_content_optimization
from planner.calendar_generator import build_30_day_plan
from database.crud import (
    create_analysis_run,
    get_analysis_run,
    get_latest_analysis_run_for_user,
    get_or_create_user_by_email,
    get_or_create_user_by_supabase_id,
    list_analysis_runs,
)
from database.models import User
from database.session import get_db, init_db
from competitor_analyzer.router import router as competitor_router

logger = logging.getLogger(__name__)


def _dates_for_ytdlp_flat_row(video: dict, idx: int) -> tuple[str, str]:
    """Real upload date from yt-dlp when present; else staggered synthetic dates (not all same day)."""
    ud = video.get("upload_date")
    if isinstance(ud, str) and len(ud) == 8 and ud.isdigit():
        d = f"{ud[:4]}-{ud[4:6]}-{ud[6:8]}"
        return d, f"{d}T12:00:00Z"
    ts = video.get("timestamp") or video.get("release_timestamp")
    try:
        if ts is not None:
            dt = datetime.fromtimestamp(int(ts), tz=timezone.utc)
            d = dt.strftime("%Y-%m-%d")
            return d, dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    except (TypeError, ValueError, OSError):
        pass
    base = datetime.now(timezone.utc).date() - timedelta(days=5 * (idx + 1))
    d = base.isoformat()
    return d, f"{d}T12:00:00Z"


def _youtube_http_error_message(e: HttpError) -> str:
    detail = str(e)
    raw = getattr(e, "content", None) or b""
    if raw:
        try:
            data = json.loads(raw.decode("utf-8"))
            detail = data.get("error", {}).get("message", detail)
        except Exception:
            pass
    return detail


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="Project Growth Engine API", lifespan=lifespan)
app.include_router(auth_router)
app.include_router(competitor_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:8081",
        "http://127.0.0.1:8081",
        "http://localhost:8082",
        "http://127.0.0.1:8082",
        "http://localhost:8083",
        "http://127.0.0.1:8083",
        "http://localhost:5083",
        "http://127.0.0.1:5083",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    analysis_run_id: str | None = None
    creator_snapshot: dict | None = None

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Growth Engine Backend running"}


@app.get("/api/env-check")
def api_env_check():
    """Debug: confirms whether the server process loaded a YouTube key (value is never returned)."""
    return {
        "youtube_api_key_loaded": bool(app_config.get_youtube_api_key()),
        "env_file_hint": "backend/.env or repo-root .env next to the backend folder",
    }


class ChannelVideosRequest(BaseModel):
    youtube_url: str
    max_videos: int = 50


class VideoInsightsRequest(BaseModel):
    youtube_url: str
    video_id: str
    use_llm: bool = True
    max_videos_for_bench: int = 500


@app.post("/api/channel/videos")
def api_channel_videos(body: ChannelVideosRequest):
    """
    Channel video catalog via YouTube Data API v3 when available; otherwise yt-dlp (same shape).
    """
    try:
        return _api_channel_videos_impl(body)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled error in /api/channel/videos")
        raise HTTPException(status_code=502, detail=f"Video list failed: {str(exc)[:300]}") from exc


def _api_channel_videos_impl(body: ChannelVideosRequest):
    url = (body.youtube_url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="youtube_url is required")
    cap = max(1, min(body.max_videos, 500))

    catalog: list = []
    met: dict = {}
    notice: str | None = None
    channel_uc: str | None = None
    data_source = "youtube_data_api_v3"

    if not app_config.get_youtube_api_key():
        notice = "No YouTube API key in env — using yt-dlp for the video list."
    else:
        try:
            channel_uc = resolve_channel_id(url)
        except HttpError as e:
            notice = _youtube_http_error_message(e)
            logger.warning("resolve_channel_id failed: %s", notice)

    if channel_uc:
        try:
            catalog = fetch_channel_video_catalog(channel_uc, max_videos=cap)
            met = fetch_youtube_metrics(channel_uc)
            if isinstance(met, dict) and met.get("error"):
                notice = (notice + "; " if notice else "") + str(met["error"])
        except HttpError as e:
            extra = _youtube_http_error_message(e)
            notice = (notice + "; " if notice else "") + extra
            catalog = []

    ytdlp_meta: dict = {}
    if not catalog:
        ytdlp_meta = fetch_channel_catalog_ytdlp(url, max_videos=cap)
        if ytdlp_meta.get("error"):
            raise HTTPException(
                status_code=502,
                detail=(
                    f"Could not load videos. YouTube API: {notice or 'n/a'}. "
                    f"yt-dlp: {ytdlp_meta['error']}"
                ),
            )
        catalog = ytdlp_meta.get("videos") or []
        data_source = "ytdlp_metadata"
        channel_uc = channel_uc or ytdlp_meta.get("channel_id") or "ytdlp"
        api_hint = (
            "YouTube Data API v3 is blocked or not enabled for this key "
            "(Google Cloud → APIs & Services → enable YouTube Data API v3)."
            if app_config.get_youtube_api_key()
            else ""
        )
        fallback = "Video list loaded via yt-dlp." + (" " + api_hint if api_hint else "")
        notice = (notice + " — " if notice else "") + fallback

    bench = compute_channel_benchmarks(catalog) if catalog else {}
    ch_title = None
    if isinstance(met, dict):
        ch_title = met.get("channel_title")
    if not ch_title:
        ch_title = ytdlp_meta.get("channel_title")
    return {
        "status": "ok",
        "channel_id": channel_uc,
        "data_source": data_source,
        "channel_title": ch_title,
        "benchmarks": bench,
        "videos": catalog,
        "youtube_api_notice": notice,
        "video_count_returned": len(catalog),
    }


@app.post("/api/video/insights")
def api_video_insights(body: VideoInsightsRequest):
    """
    Per-video overview, rule-based checklist, and optional LLM coaching vs channel benchmarks.
    """
    url = (body.youtube_url or "").strip()
    if not url:
        raise HTTPException(status_code=400, detail="youtube_url is required")

    vid = extract_video_id(body.video_id.strip()) or body.video_id.strip()
    if not re.match(r"^[\w-]{11}$", vid):
        raise HTTPException(status_code=400, detail="Invalid video_id or watch URL.")

    bench_cap = max(1, min(body.max_videos_for_bench, 500))
    channel_uc: str | None = None
    catalog: list = []

    if app_config.get_youtube_api_key():
        try:
            channel_uc = resolve_channel_id(url)
        except HttpError:
            channel_uc = None

    if channel_uc:
        try:
            catalog = fetch_channel_video_catalog(channel_uc, max_videos=bench_cap)
        except HttpError:
            catalog = []

    if not catalog:
        y = fetch_channel_catalog_ytdlp(url, max_videos=bench_cap)
        catalog = y.get("videos") or []
        channel_uc = channel_uc or y.get("channel_id") or "ytdlp"

    benchmarks = compute_channel_benchmarks(catalog) if catalog else {}

    video_row = next((v for v in catalog if v.get("video_id") == vid), None)
    if not video_row and app_config.get_youtube_api_key():
        try:
            fetched = fetch_videos_by_ids([vid])
            video_row = fetched[0] if fetched else None
        except HttpError:
            video_row = None
    if not video_row:
        video_row = fetch_video_row_ytdlp(vid)
    if not video_row:
        raise HTTPException(status_code=404, detail="Video not found or not accessible.")

    if not benchmarks:
        benchmarks = compute_channel_benchmarks([video_row])

    return full_video_insights(video_row, benchmarks, use_llm=body.use_llm)


class ThumbnailCtrRequest(BaseModel):
    image_url: str


@app.post("/api/predict/thumbnail-ctr")
def api_thumbnail_ctr(body: ThumbnailCtrRequest):
    """CTR-style score: Groq vision (free) → Gemini (free tier) → OpenAI → heuristic."""
    return predict_thumbnail_ctr_score(body.image_url)


@app.post("/api/analyze", response_model=AnalysisResponse)
def analyze_channel(
    request: ChannelInputRequest,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    """
    Module 1 to 3 Flow: Validate -> Collect Data -> Process & Engineer Features
    """
    try:
        return _run_analysis(request, db, current_user=current_user)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unhandled error in /api/analyze")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(exc)[:300]}") from exc


def _run_analysis(request: ChannelInputRequest, db: Session, current_user: User | None = None):
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

    fast = bool(request.fast_mode)
    ytdlp_preview_n = 4 if fast else 10
    ytdlp_detailed_n = 8 if fast else 40
    uploads_max_n = 12 if fast else 72
    forecast_periods = 14 if fast else 60
    use_llm = not fast
    intel_video_tail = 8 if fast else 30

    _mock_metrics = {
        "views": 1500000,
        "subscribers": 85000,
        "video_count": 210,
        "notice": "YouTube Data API unavailable — using fallback stats.",
    }

    if request.youtube_url:
        has_api = bool(app_config.get_youtube_api_key())
        if has_api and not fast:
            channel_uc = resolve_channel_id(request.youtube_url)
        elif has_api:
            channel_uc = resolve_channel_id(request.youtube_url)

        if fast:
            # Fast mode: single flat yt-dlp call only, skip API calls that will fail
            try:
                ytdlp_content = fetch_channel_content_ytdlp(
                    request.youtube_url, max_videos=ytdlp_preview_n, flat=True
                )
            except Exception as exc:
                logger.warning("yt-dlp preview failed: %s", exc)
                ytdlp_content = {"error": str(exc)}
            metrics = _mock_metrics
            if channel_uc:
                try:
                    m = fetch_youtube_metrics(channel_uc)
                    if "error" not in m:
                        metrics = m
                except Exception:
                    pass
        else:
            def _load_metrics() -> dict:
                if not channel_uc:
                    return _mock_metrics
                try:
                    m = fetch_youtube_metrics(channel_uc)
                except Exception as exc:
                    logger.warning("fetch_youtube_metrics failed: %s", exc)
                    return {**_mock_metrics, "notice": str(exc)[:200]}
                if "error" in m:
                    return {**_mock_metrics, "notice": m["error"]}
                return m

            def _load_ytdlp_preview() -> dict:
                try:
                    return fetch_channel_content_ytdlp(request.youtube_url, max_videos=ytdlp_preview_n)
                except Exception as exc:
                    logger.warning("fetch_channel_content_ytdlp failed: %s", exc)
                    return {"error": str(exc)}

            def _load_upload_stats() -> list:
                if not channel_uc:
                    return []
                try:
                    return fetch_uploads_video_stats(channel_uc, max_videos=uploads_max_n)
                except Exception as exc:
                    logger.warning("fetch_uploads_video_stats failed: %s", exc)
                    return []

            with ThreadPoolExecutor(max_workers=3) as pool:
                fut_m = pool.submit(_load_metrics)
                fut_y = pool.submit(_load_ytdlp_preview)
                fut_u = pool.submit(_load_upload_stats)
                metrics = fut_m.result()
                ytdlp_content = fut_y.result()
                video_stat_rows = fut_u.result()

        if video_stat_rows:
            ts_source = "youtube_data_api_v3"
        # Skip slow fetch_channel_videos_detailed — use flat data from preview instead
        if not video_stat_rows:
            yt_meta = ytdlp_content.get("latest_videos_metadata") or []
            for i, v in enumerate(yt_meta):
                d_str, pub = _dates_for_ytdlp_flat_row(v, i)
                vws = int(v.get("views") or 0)
                # Flat scrape rarely includes likes; use mild priors so series + engagement aren’t all zeros
                likes = max(0, int(vws * 0.032))
                comments = max(0, int(vws * 0.0012))
                video_stat_rows.append({
                    "date": d_str,
                    "views": vws,
                    "likes": likes,
                    "comments": comments,
                    "title": v.get("title", ""),
                    "video_id": v.get("video_id", ""),
                    "duration_seconds": int(v.get("duration_seconds") or 600),
                    "published_at": pub,
                })
            if video_stat_rows:
                ts_source = "ytdlp_flat"

    niche_keyword_used = "machine learning"
    if isinstance(ytdlp_content, dict):
        _titles = [
            str(v.get("title") or "")
            for v in (ytdlp_content.get("latest_videos_metadata") or [])[:24]
            if v.get("title")
        ]
        if _titles:
            niche_keyword_used = infer_niche_keyword(_titles)
    if fast:
        market_trend = {
            "keyword": niche_keyword_used,
            "current_score": None,
            "trend_data": {},
            "note": "skipped in fast mode",
        }
    else:
        try:
            market_trend = fetch_trends_for_topic(niche_keyword_used)
        except Exception as e:
            logger.warning("Google Trends failed: %s", e)
            market_trend = {
                "keyword": niche_keyword_used,
                "current_score": None,
                "trend_data": {},
                "error": str(e)[:240],
            }

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
                "likes": int(r.get("likes") or 0),
                "comments": int(r.get("comments") or 0),
            }
            for r in sorted(video_stat_rows, key=lambda x: x["date"])[-intel_video_tail:]
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
        gaps=detected_gaps,
        use_llm=use_llm,
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

    view_forecast = predict_growth(
        views_ts, value_column="views", periods=forecast_periods
    )
    subscriber_pred = forecast_subscribers(views_ts, periods=forecast_periods)
    engagement_pred = forecast_engagement(views_ts, periods=forecast_periods)

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
        use_llm=use_llm,
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

    use_llm_nlp = bool(
        os.getenv("GROQ_API_KEY", "").strip() or os.getenv("OPENAI_API_KEY", "").strip()
    )
    yt_comment_entries: list = []
    if not fast:
        try:
            rows_c: list = []
            for r in video_stat_rows or []:
                if not isinstance(r, dict) or not r.get("video_id"):
                    continue
                v_raw = str(r["video_id"]).strip()
                vid_norm = extract_video_id(v_raw) or (v_raw if len(v_raw) == 11 else "")
                if len(vid_norm) == 11:
                    rows_c.append(r)
            rows_c.sort(key=lambda x: str(x.get("date") or x.get("published_at") or ""), reverse=True)
            vid_order: list[str] = []
            seen_vid: set[str] = set()
            for r in rows_c:
                v_raw = str(r["video_id"]).strip()
                v = extract_video_id(v_raw) or (v_raw if len(v_raw) == 11 else "")
                if len(v) != 11:
                    continue
                if v not in seen_vid:
                    seen_vid.add(v)
                    vid_order.append(v)
                if len(vid_order) >= 3:
                    break
            if len(vid_order) < 3 and isinstance(ytdlp_content, dict):
                for v in (ytdlp_content.get("latest_videos_metadata") or [])[:12]:
                    if not isinstance(v, dict):
                        continue
                    vid_raw = str(v.get("video_id") or "").strip()
                    vid = extract_video_id(vid_raw) or (vid_raw if len(vid_raw) == 11 else "")
                    if len(vid) == 11 and vid not in seen_vid:
                        seen_vid.add(vid)
                        vid_order.append(vid)
                    if len(vid_order) >= 3:
                        break
            if vid_order:
                yt_comment_entries = fetch_comments_for_videos(vid_order)
        except Exception as e:
            logger.warning("YouTube comment fetch skipped: %s", e)

    analysis_panel_bundle = build_creator_analysis_panel(
        videos=videos,
        video_stat_rows=video_stat_rows,
        metrics=metrics,
        engineered_features=engineered_features,
        _subscriber_forecast=subscriber_pred,
        views_forecast=view_forecast,
        views_timeseries=views_ts,
        detected_gaps=detected_gaps,
        niche_keyword=niche_keyword_used,
        content_optimization=content_opt,
        channel_title=str(metrics.get("channel_title") or ytdlp_content.get("channel_name") or ""),
        use_llm=use_llm,
        yt_comment_entries=yt_comment_entries or None,
        use_groq_nlp=use_llm_nlp,
    )

    try:
        snap = build_snapshot_for_plain_language(
            channel_title=str(metrics.get("channel_title") or ytdlp_content.get("channel_name") or ""),
            metrics=metrics if isinstance(metrics, dict) else {},
            performance=performance_analysis if isinstance(performance_analysis, dict) else {},
            content_insights=content_insights if isinstance(content_insights, dict) else {},
            panel=analysis_panel_bundle,
            views_forecast=view_forecast if isinstance(view_forecast, dict) else {},
        )
        caps, digest = generate_panel_ai_bundle(snap, use_llm=use_llm_nlp)
        if caps:
            analysis_panel_bundle["plain_language"] = caps
        if digest.get("headline") or digest.get("bullets") or digest.get("priority"):
            analysis_panel_bundle["ai_digest"] = digest
    except Exception as e:
        logger.warning("plain_language captions failed: %s", e)

    yt_meta = ytdlp_content.get("latest_videos_metadata") or []
    yt_video_count = len(yt_meta) if isinstance(yt_meta, list) else 0
    api_vcount = metrics.get("video_count")
    if metrics.get("notice") and yt_video_count > 0:
        resolved_video_count = yt_video_count
    elif api_vcount is not None:
        resolved_video_count = int(api_vcount)
    else:
        resolved_video_count = yt_video_count

    totals_verified = not bool(metrics.get("notice"))
    perf_err = performance_analysis.get("error") if isinstance(performance_analysis, dict) else None

    # OUTPUT: Standard JSON format as requested
    out: dict = {
        "status": "success",
        "channel_metrics": {
            "total_views": metrics.get("views"),
            "subscribers": metrics.get("subscribers"),
            "video_count": resolved_video_count,
            "channel_title": metrics.get("channel_title") or ytdlp_content.get("channel_name"),
            "growth_features": engineered_features,
            "youtube_api_fallback": bool(metrics.get("notice")),
            "youtube_api_notice": metrics.get("notice"),
            "data_quality": {
                "channel_totals": "verified" if totals_verified else "estimated",
                "timeseries": ts_source,
                "upload_sample_size": yt_video_count,
            },
        },
        "content_metrics": {
            "video_count": resolved_video_count,
            "niche_trend": market_trend,
            "ytdlp_scraped_data": ytdlp_content,
        },
        "audience_metrics": {
            "avg_engagement": engineered_features.get("avg_engagement_rate_30d")
        },
        "intelligence_insights": {
            "performance_drivers": performance_analysis,
            "content_insights": content_insights,
            "analysis_panel": analysis_panel_bundle,
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
        "creator_snapshot": {
            "trends_query": niche_keyword_used,
            "best_posting_day": performance_analysis.get("best_posting_day"),
            "top_signal": performance_analysis.get("top_feature_driver"),
            "best_duration_range": content_insights.get("best_duration"),
            "format_tip": content_insights.get("format_recommendation"),
            "uploads_in_sample": yt_video_count,
            "insights_ready": not bool(perf_err),
        },
        "analysis_run_id": None,
    }

    import numpy as np
    def convert_numpy_types(obj):
        if isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return [convert_numpy_types(i) for i in obj]
        elif isinstance(obj, dict):
            return {k: convert_numpy_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [convert_numpy_types(i) for i in obj]
        return obj
    
    out = convert_numpy_types(out)

    if request.persist:
        try:
            user_db_id: int | None = None
            if current_user is not None:
                user_db_id = current_user.id
            else:
                user_db_id = get_or_create_user_by_supabase_id(db, request.supabase_user_id)
                if user_db_id is None:
                    user_db_id = get_or_create_user_by_email(db, request.user_email)
            to_store = {k: v for k, v in out.items() if k != "analysis_run_id"}
            run = create_analysis_run(
                db,
                result=to_store,
                youtube_url=request.youtube_url,
                channel_id_uc=channel_uc,
                timeseries_source=ts_source,
                user_id=user_db_id,
            )
            out["analysis_run_id"] = str(run.id)
        except Exception as e:
            logger.exception("Failed to persist analysis run: %s", e)

    return out


class AnalysisRunListItem(BaseModel):
    id: str
    created_at: str
    youtube_url: str | None
    channel_id_uc: str | None
    timeseries_source: str | None
    user_id: int | None


@app.get("/api/analyses", response_model=list[AnalysisRunListItem])
def api_list_analyses(
    limit: int = 20,
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    rows = list_analysis_runs(db, limit=min(limit, 100), user_id=user_id)
    return [
        AnalysisRunListItem(
            id=str(r.id),
            created_at=r.created_at.isoformat() if r.created_at else "",
            youtube_url=r.youtube_url,
            channel_id_uc=r.channel_id_uc,
            timeseries_source=r.timeseries_source,
            user_id=r.user_id,
        )
        for r in rows
    ]


@app.get("/api/analyses/me", response_model=list[AnalysisRunListItem])
def api_list_my_analyses(
    limit: int = 50,
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    rows = list_analysis_runs(db, limit=min(limit, 100), user_id=user.id)
    return [
        AnalysisRunListItem(
            id=str(r.id),
            created_at=r.created_at.isoformat() if r.created_at else "",
            youtube_url=r.youtube_url,
            channel_id_uc=r.channel_id_uc,
            timeseries_source=r.timeseries_source,
            user_id=r.user_id,
        )
        for r in rows
    ]


class LatestAnalysisResponse(BaseModel):
    run: AnalysisRunListItem
    result: dict
    youtube_url: str | None = None


@app.get("/api/analyses/me/latest", response_model=LatestAnalysisResponse)
def api_get_my_latest_analysis(
    user: User = Depends(get_current_user_required),
    db: Session = Depends(get_db),
):
    row = get_latest_analysis_run_for_user(db, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="No saved analyses yet")
    return LatestAnalysisResponse(
        run=AnalysisRunListItem(
            id=str(row.id),
            created_at=row.created_at.isoformat() if row.created_at else "",
            youtube_url=row.youtube_url,
            channel_id_uc=row.channel_id_uc,
            timeseries_source=row.timeseries_source,
            user_id=row.user_id,
        ),
        result=row.result_json,
        youtube_url=row.youtube_url,
    )


@app.get("/api/analyses/{run_id}")
def api_get_analysis(
    run_id: str,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_current_user_optional),
):
    try:
        uid = uuid.UUID(run_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid analysis run id")
    row = get_analysis_run(db, uid)
    if not row:
        raise HTTPException(status_code=404, detail="Analysis run not found")
    if row.user_id is not None:
        if current_user is None or row.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your analysis run")
    return row.result_json
