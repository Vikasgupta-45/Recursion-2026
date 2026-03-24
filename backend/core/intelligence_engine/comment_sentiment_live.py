"""
Real comment text → sentiment split + simple 'why' copy for creators.
Uses Groq when available; otherwise a small keyword model.
"""

from __future__ import annotations

import json
import logging
import re
from typing import Any

logger = logging.getLogger(__name__)

_POS = frozenset(
    "love thanks thank great amazing awesome good helpful nice best perfect "
    "excellent wonderful brilliant incredible subscribe subscribed underrated "
    "fire goat legend deserved wow beautiful fantastic".split()
)
_NEG = frozenset(
    "hate worst bad terrible boring clickbait scam trash awful disappointed "
    "disappointing wrong stupid fake misleading waste annoying overrated "
    "cringe stop never".split()
)


def _keyword_sentiment(texts: list[str]) -> dict[str, Any]:
    pos = neg = neu = 0
    pos_examples: list[str] = []
    neg_examples: list[str] = []
    for t in texts:
        low = re.findall(r"[a-z']+", t.lower())
        hits_p = sum(1 for w in low if w in _POS)
        hits_n = sum(1 for w in low if w in _NEG)
        if hits_n > hits_p and hits_n > 0:
            neg += 1
            if len(neg_examples) < 3:
                neg_examples.append(t[:120])
        elif hits_p > 0:
            pos += 1
            if len(pos_examples) < 3:
                pos_examples.append(t[:120])
        else:
            neu += 1
    total = max(1, pos + neg + neu)
    return {
        "positive": round(pos / total, 3),
        "neutral": round(neu / total, 3),
        "negative": round(neg / total, 3),
        "why_positive_simple": (
            "People used a lot of warm or thankful words in these comments. That usually means the video "
            "gave them something they wanted — a clear answer, entertainment, or a relatable moment."
            if pos
            else "We did not see many clearly positive words in this sample. Either comments are short, mixed, or the video got less praise-style replies here."
        ),
        "why_negative_simple": (
            "Some comments used stronger unhappy words. That often happens when expectations did not match the title, "
            "the pacing felt off, or viewers disagreed with a take — not always a full 'hate' wave."
            if neg
            else "We barely saw strong negative words here. That is a good sign from this small sample."
        ),
        "why_neutral_simple": (
            "Many lines look neutral — questions, timestamps, or quick reactions. That is normal on YouTube and does not mean people dislike the video."
        ),
        "example_positive": pos_examples,
        "example_negative": neg_examples,
        "source": "youtube_api_keywords",
        "comments_analyzed": len(texts),
    }


def _parse_json_loose(raw: str) -> dict[str, Any] | None:
    s = (raw or "").strip()
    if s.startswith("```"):
        s = re.sub(r"^```(?:json)?\s*", "", s)
        s = re.sub(r"\s*```$", "", s)
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        m = re.search(r"\{[\s\S]*\}", s)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                pass
    return None


def analyze_comment_texts(texts: list[str], *, use_groq: bool) -> dict[str, Any]:
    """
    Returns comment_sentiment-shaped dict for analysis_panel (fractions sum ~1).
    """
    clean = [t.strip() for t in texts if t and len(t.strip()) > 1]
    if not clean:
        return {}

    if not use_groq:
        base = _keyword_sentiment(clean)
        return _wrap_creator_copy(base)

    try:
        from llm_client import get_llm_chat_model, get_llm_client

        client = get_llm_client()
        if not client:
            base = _keyword_sentiment(clean)
            return _wrap_creator_copy(base)

        lines = []
        for i, t in enumerate(clean[:55], 1):
            lines.append(f"{i}. {t[:200]}")
        blob = "\n".join(lines)
        model = get_llm_chat_model()
        prompt = (
            "You read real YouTube comments below. The creator is NOT technical.\n\n"
            "Tasks:\n"
            "1) Estimate what fraction of lines feel clearly positive, clearly negative, or neutral/mixed. "
            "Use your judgment (not strict word matching).\n"
            "2) In VERY simple English (short words), explain WHY the positive ones sound positive, and WHY the negative ones sound negative. "
            "Focus on reasons (they feel helped, entertained, misled, confused, etc.), not statistics.\n"
            "3) Pick up to 2 short example phrases for positive and 2 for negative (copy from the list, under 100 chars each).\n\n"
            "Comments:\n"
            f"{blob}\n\n"
            "Reply with ONLY valid JSON, no markdown:\n"
            '{"positive":0.0,"neutral":0.0,"negative":0.0,'
            '"why_positive":"...", "why_negative":"...", "why_neutral":"...", '
            '"example_positive":["..."],"example_negative":["..."]}'
        )
        resp = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=500,
            temperature=0.35,
        )
        raw = (resp.choices[0].message.content or "").strip()
        data = _parse_json_loose(raw)
        if not data:
            raise ValueError("groq json parse failed")

        p = float(data.get("positive", 0))
        n = float(data.get("negative", 0))
        u = float(data.get("neutral", 0))
        s = p + n + u
        if s <= 0:
            base = _keyword_sentiment(clean)
            return _wrap_creator_copy(base)
        p, n, u = p / s, n / s, u / s

        return {
            "positive": round(p, 3),
            "neutral": round(u, 3),
            "negative": round(n, 3),
            "note": f"We read {len(clean)} real comments from your recent videos (YouTube API).",
            "methodology": "Comments are public top-level replies we can pull with your API key. A language model sorted the mood in simple buckets.",
            "positive_logic": str(data.get("why_positive") or "")[:800],
            "negative_logic": str(data.get("why_negative") or "")[:800],
            "neutral_logic": str(data.get("why_neutral") or "")[:800],
            "example_positive": list(data.get("example_positive") or [])[:2],
            "example_negative": list(data.get("example_negative") or [])[:2],
            "source": "youtube_api_groq",
            "comments_analyzed": len(clean),
        }
    except Exception as e:
        logger.warning("Groq comment sentiment failed, using keywords: %s", e)
        base = _keyword_sentiment(clean)
        return _wrap_creator_copy(base)


def _wrap_creator_copy(base: dict[str, Any]) -> dict[str, Any]:
    return {
        "positive": base["positive"],
        "neutral": base["neutral"],
        "negative": base["negative"],
        "note": f"We read {base.get('comments_analyzed', 0)} real comments from your recent videos.",
        "methodology": "We used quick word patterns because the AI summary was unavailable. Turn on Groq in .env for richer explanations.",
        "positive_logic": base.get("why_positive_simple", ""),
        "negative_logic": base.get("why_negative_simple", ""),
        "neutral_logic": base.get("why_neutral_simple", ""),
        "example_positive": base.get("example_positive") or [],
        "example_negative": base.get("example_negative") or [],
        "source": base.get("source", "youtube_api_keywords"),
        "comments_analyzed": base.get("comments_analyzed", 0),
    }
