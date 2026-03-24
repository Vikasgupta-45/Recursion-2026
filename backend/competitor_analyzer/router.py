"""FastAPI routes: /api/competitor/analyse, /api/competitor/suggest."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from competitor_analyzer.discover import discover_competitors
from competitor_analyzer.rate_limit import get_remaining
from competitor_analyzer.service import run_competitor_analysis

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/competitor", tags=["competitor"])


class CompetitorAnalyseBody(BaseModel):
    competitor_url: str = Field(..., min_length=3)
    my_channel_id: str = Field(..., min_length=6)


@router.post("/analyse")
def api_competitor_analyse(body: CompetitorAnalyseBody) -> dict[str, Any]:
    try:
        return run_competitor_analysis(
            competitor_url=body.competitor_url.strip(),
            my_channel_id=body.my_channel_id.strip(),
        )
    except ValueError as e:
        msg = str(e)
        if "limit reached" in msg.lower():
            raise HTTPException(status_code=429, detail=msg) from e
        raise HTTPException(status_code=400, detail=msg) from e
    except Exception as e:
        logger.exception("competitor analyse failed: %s", e)
        raise HTTPException(status_code=502, detail=str(e)[:500]) from e


@router.get("/suggest")
def api_competitor_suggest(
    my_channel_id: str = Query(..., min_length=6, description="Your channel id (UC…) — required for auto-discovery"),
    tags: str = Query(
        "",
        description="Optional comma-separated tags (e.g. from analysis) merged with content signals",
    ),
    channel_context: str = Query(
        "",
        max_length=450,
        description="Optional: your language, niche, format (e.g. 'Hindi Python tutorials 12 min'). Improves matches.",
    ),
) -> dict[str, Any]:
    parts = [t.strip() for t in tags.split(",") if t.strip()]
    ctx = channel_context.strip() or None
    return discover_competitors(
        my_channel_id.strip(),
        extra_tags=parts or None,
        channel_context=ctx,
        max_suggestions=8,
    )


@router.get("/quota")
def api_competitor_quota(my_channel_id: str = Query(..., min_length=6)) -> dict[str, Any]:
    return {
        "remaining_today": get_remaining(my_channel_id.strip()),
        "max_per_day": 20,
    }
