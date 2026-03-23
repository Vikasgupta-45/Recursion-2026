"""
Title variants from real channel corpus + YAKE + optional LLM polish.
"""

from __future__ import annotations

import json
import os
from typing import Any

from content_optimizer.keyword_engine import extract_keywords, keyword_phrases_only


def _best_performer_title(videos: list[dict]) -> str | None:
    if not videos:
        return None
    ranked = sorted(
        videos,
        key=lambda v: int(v.get("views") or 0),
        reverse=True,
    )
    t = ranked[0].get("title")
    return str(t) if t else None


def suggest_title_variants(
    videos: list[dict],
    channel_description: str = "",
    niche_tags: list[str] | None = None,
) -> dict[str, Any]:
    titles = [str(v.get("title") or "") for v in videos if v.get("title")]
    corpus = " ".join(titles + [channel_description or ""])
    niche_tags = niche_tags or []
    if niche_tags:
        corpus += " " + " ".join(niche_tags)

    kw_rows = extract_keywords(corpus, top_n=14)
    phrases = [r["phrase"] for r in kw_rows[:8]]

    top_title = _best_performer_title(videos)
    templates: list[str] = []
    if phrases:
        p0, p1 = phrases[0], phrases[1] if len(phrases) > 1 else "tutorial"
        templates = [
            f"{p0.title()}: complete guide ({p1})",
            f"Why {p0} matters in 2026 — {p1} explained",
            f"I tried {p0} for 30 days — honest results",
        ]
    if top_title:
        templates.append(f"{top_title} (Part 2 — deeper dive)")

    llm_variants: list[str] = []
    rationale: list[str] = []
    if os.getenv("OPENAI_API_KEY"):
        try:
            from openai import OpenAI

            client = OpenAI()
            prompt = (
                "Given these real video titles from one channel, propose 5 distinct "
                "YouTube title variants (max 70 chars each). Return JSON only: "
                '{"titles": [...], "rationale": ["why each works"]}\n\n'
                f"TITLES:\n{json.dumps(titles[:12], ensure_ascii=False)}\n"
                f"KEYWORDS: {phrases}\n"
            )
            r = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a YouTube growth editor. JSON only."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.7,
            )
            payload = json.loads(r.choices[0].message.content or "{}")
            llm_variants = payload.get("titles") or []
            rationale = payload.get("rationale") or []
        except Exception:
            pass

    merged = list(dict.fromkeys([*llm_variants, *templates]))[:8]
    return {
        "source_top_video_title": top_title,
        "extracted_keywords": kw_rows,
        "title_suggestions": merged,
        "keyword_phrases_for_seo": keyword_phrases_only(corpus, top_n=20),
        "llm_rationale": rationale,
    }
