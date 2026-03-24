"""
SEO tags + description outline from real titles, keywords, and trends text.
"""

from __future__ import annotations

import json
from typing import Any

from content_optimizer.keyword_engine import keyword_phrases_only
from llm_client import get_llm_chat_model, get_llm_client


def build_seo_package(
    videos: list[dict],
    niche_trend_summary: str = "",
    title_suggestions: list[str] | None = None,
    extra_keywords: list[str] | None = None,
    use_llm: bool = True,
) -> dict[str, Any]:
    titles = [str(v.get("title") or "") for v in videos]
    corpus = " ".join(titles) + " " + (niche_trend_summary or "")
    phrases = keyword_phrases_only(corpus, top_n=25)
    if extra_keywords:
        phrases = list(dict.fromkeys([*extra_keywords, *phrases]))[:30]

    tags = phrases[:15]
    primary = tags[0] if tags else "creator"

    description = (
        f"Hook: why this video matters for audiences interested in {primary}.\n"
        f"Timestamps: intro → core tutorial → examples → summary.\n"
        f"CTA: subscribe for weekly {primary} content.\n"
        f"Related searches: {', '.join(tags[1:6])}."
    )

    llm_seo: dict[str, Any] | None = None
    client = get_llm_client() if use_llm else None
    if client:
        try:
            r = client.chat.completions.create(
                model=get_llm_chat_model(),
                messages=[
                    {
                        "role": "system",
                        "content": "Return JSON only with keys: tags (array str), "
                        "description_optimized (str), search_queries (array str).",
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "video_titles": titles[:15],
                                "yake_keywords": phrases[:20],
                                "trend_context": niche_trend_summary[:500],
                                "candidate_titles": (title_suggestions or [])[:6],
                            },
                            ensure_ascii=False,
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
            )
            llm_seo = json.loads(r.choices[0].message.content or "{}")
        except Exception:
            llm_seo = None

    if llm_seo:
        tags = llm_seo.get("tags") or tags
        description = llm_seo.get("description_optimized") or description

    return {
        "suggested_tags": tags[:15],
        "description_outline": description,
        "primary_keyword": primary,
        "llm_seo": llm_seo,
    }
