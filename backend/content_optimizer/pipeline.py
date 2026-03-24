"""
Module 8 orchestration — runs all optimizers on real video + trend context.
"""

from __future__ import annotations

from typing import Any

from content_optimizer.seo_optimizer import build_seo_package
from content_optimizer.thumbnail_advisor import advise_thumbnail
from content_optimizer.title_optimizer import suggest_title_variants


def run_content_optimization(
    videos: list[dict],
    channel_description: str = "",
    niche_trend_summary: str = "",
    niche_tags: list[str] | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    titles_pack = suggest_title_variants(
        videos,
        channel_description=channel_description,
        niche_tags=niche_tags,
        use_llm=use_llm,
    )
    seo = build_seo_package(
        videos,
        niche_trend_summary=niche_trend_summary,
        title_suggestions=titles_pack.get("title_suggestions"),
        extra_keywords=titles_pack.get("keyword_phrases_for_seo"),
        use_llm=use_llm,
    )
    thumb = advise_thumbnail(
        videos,
        primary_keyword=seo.get("primary_keyword") or "",
        use_llm=use_llm,
    )
    return {
        "title_optimization": titles_pack,
        "seo": seo,
        "thumbnail": thumb,
    }
