"""
Three distinct thumbnail concepts (angles + image prompts) for A/B/C testing on YouTube.
"""

from __future__ import annotations

import json
from typing import Any

from content_optimizer.keyword_engine import keyword_phrases_only
from llm_client import get_llm_chat_model, get_llm_client


def _default_triplet(title: str, primary: str) -> list[dict[str, Any]]:
    t = (title or "Video")[:48]
    p = (primary or "topic")[:32]
    return [
        {
            "id": "A",
            "label": "Curiosity gap",
            "angle": "Tease the outcome without showing the full payoff; bold question or stat.",
            "text_overlay_hint": f"WHAT IF {p.upper()}?",
            "composition": "Face or object on left, dark gradient right third for text.",
            "image_prompt_for_generator": (
                f"YouTube thumbnail 1280x720, high contrast, expressive reaction, "
                f"mystery hook about '{t}', bold short text, saturated colors"
            ),
        },
        {
            "id": "B",
            "label": "Proof / result",
            "angle": "Show the end state: dashboard, before/after, or trophy moment.",
            "text_overlay_hint": f"{p.upper()} — RESULTS",
            "composition": "Screenshot or product hero center; yellow or red accent bar for text.",
            "image_prompt_for_generator": (
                f"YouTube thumbnail 1280x720, crisp UI or tangible result for '{t}', "
                "clean typography, trustworthy lighting"
            ),
        },
        {
            "id": "C",
            "label": "Authority / story",
            "angle": "Personal stake: 'I tested…', 'honest take', subtle emotion.",
            "text_overlay_hint": f"I TRIED {p.upper()}",
            "composition": "Talking-head friendly framing; warm background blur.",
            "image_prompt_for_generator": (
                f"YouTube thumbnail 1280x720, authentic creator vibe, story-led hook for '{t}', "
                "readable face, minimal text"
            ),
        },
    ]


def generate_three_thumbnail_concepts(
    focus_video: dict[str, Any],
    peer_titles: list[str],
    primary_keyword: str = "",
    use_llm: bool = True,
) -> dict[str, Any]:
    title = str(focus_video.get("title") or "")
    titles_ctx = [title, *peer_titles[:10]]
    kws = keyword_phrases_only(" ".join(titles_ctx), top_n=12)
    pk = primary_keyword or (kws[0] if kws else "video")
    variants = _default_triplet(title, pk)

    client = get_llm_client() if use_llm else None
    if client:
        try:
            r = client.chat.completions.create(
                model=get_llm_chat_model(),
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Return JSON only: { \"variants\": [ "
                            "{ \"id\": \"A\"|\"B\"|\"C\", \"label\": str, \"angle\": str, "
                            "\"text_overlay_hint\": str, \"composition\": str, "
                            "\"image_prompt_for_generator\": str } ] } "
                            "Exactly 3 objects, distinct creative angles for the same video."
                        ),
                    },
                    {
                        "role": "user",
                        "content": json.dumps(
                            {
                                "video_title": title,
                                "peer_titles": peer_titles[:12],
                                "keywords": kws,
                                "primary": pk,
                            },
                            ensure_ascii=False,
                        ),
                    },
                ],
                response_format={"type": "json_object"},
                temperature=0.75,
            )
            data = json.loads(r.choices[0].message.content or "{}")
            arr = data.get("variants")
            if isinstance(arr, list) and len(arr) >= 3:
                cleaned: list[dict[str, Any]] = []
                for i, item in enumerate(arr[:3]):
                    if not isinstance(item, dict):
                        continue
                    vid = str(item.get("id") or ["A", "B", "C"][i]).upper()[:1]
                    if vid not in ("A", "B", "C"):
                        vid = ["A", "B", "C"][i]
                    cleaned.append(
                        {
                            "id": vid,
                            "label": str(item.get("label") or variants[i]["label"]),
                            "angle": str(item.get("angle") or variants[i]["angle"]),
                            "text_overlay_hint": str(
                                item.get("text_overlay_hint") or variants[i]["text_overlay_hint"]
                            ),
                            "composition": str(item.get("composition") or variants[i]["composition"]),
                            "image_prompt_for_generator": str(
                                item.get("image_prompt_for_generator")
                                or variants[i]["image_prompt_for_generator"]
                            ),
                        }
                    )
                if len(cleaned) == 3:
                    variants = cleaned
        except Exception:
            pass

    return {"primary_keyword": pk, "keywords_context": kws[:8], "variants": variants}
