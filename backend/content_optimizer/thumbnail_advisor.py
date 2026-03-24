"""
Thumbnail guidance derived from titles + keywords (LLM when available).
"""

from __future__ import annotations

import json
from typing import Any

from content_optimizer.keyword_engine import keyword_phrases_only
from llm_client import get_llm_chat_model, get_llm_client


def advise_thumbnail(
    videos: list[dict],
    primary_keyword: str = "",
    use_llm: bool = True,
) -> dict[str, Any]:
    titles = [str(v.get("title") or "") for v in videos[:8]]
    kws = keyword_phrases_only(" ".join(titles), top_n=10)
    pk = primary_keyword or (kws[0] if kws else "video")

    base = {
        "text_overlay": f"{pk[:40].upper()} — bold sans-serif",
        "color_palette": ["#FF0000", "#FFFFFF", "#111111"],
        "composition": "Face or product left third, high-contrast right third for text",
        "contrast_rule": "WCAG-friendly: white text on dark bar or black text on yellow strip",
        "safe_zone": "Keep key elements inside central 80% (mobile crop safe)",
        "image_prompt_for_generator": (
            f"YouTube thumbnail, expressive face or product hero, bold text '{pk}', "
            "high saturation, shallow depth of field, 1280x720, no small text"
        ),
    }

    client = get_llm_client() if use_llm else None
    if client:
        try:
            r = client.chat.completions.create(
                model=get_llm_chat_model(),
                messages=[
                    {
                        "role": "system",
                        "content": "JSON only: text_overlay, color_palette (3 hex), "
                        "composition (str), image_prompt_for_generator (str).",
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {"titles": titles, "keywords": kws, "primary": pk},
                            ensure_ascii=False,
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.6,
            )
            data = json.loads(r.choices[0].message.content or "{}")
            if data:
                base.update({k: data[k] for k in data if k in base or k == "image_prompt_for_generator"})
        except Exception:
            pass

    return base
