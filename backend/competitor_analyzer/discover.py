"""Auto-discover similar channels from content signals (language, tags, topics, format) — not channel name."""

from __future__ import annotations

import logging
import re
from collections import Counter
from typing import Any

from competitor_analyzer.youtube_data import (
    fetch_channel_full,
    fetch_last_n_upload_video_ids,
    fetch_videos_batch,
    search_similar_channels,
)

logger = logging.getLogger(__name__)

_CATEGORY_LABELS: dict[str, str] = {
    "1": "film",
    "2": "autos",
    "10": "music",
    "15": "pets",
    "17": "sports",
    "19": "travel",
    "20": "gaming",
    "22": "vlog",
    "23": "comedy",
    "24": "entertainment",
    "25": "news",
    "26": "how to",
    "27": "education",
    "28": "science",
    "29": "nonprofit",
}

# ISO-ish codes → English search words (helps YouTube search find same-language creators)
_LANG_FOR_SEARCH: dict[str, str] = {
    "en": "english",
    "hi": "hindi",
    "es": "spanish",
    "pt": "portuguese",
    "fr": "french",
    "de": "german",
    "it": "italian",
    "ja": "japanese",
    "ko": "korean",
    "zh": "chinese",
    "ar": "arabic",
    "tr": "turkish",
    "ru": "russian",
    "nl": "dutch",
    "pl": "polish",
    "id": "indonesian",
    "vi": "vietnamese",
    "th": "thai",
    "ta": "tamil",
    "te": "telugu",
    "mr": "marathi",
    "bn": "bengali",
    "ur": "urdu",
    "gu": "gujarati",
    "kn": "kannada",
    "ml": "malayalam",
}

_STOP = {
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "as",
    "is",
    "was",
    "with",
    "by",
    "from",
    "my",
    "our",
    "your",
    "how",
    "what",
    "why",
    "episode",
    "part",
    "official",
    "channel",
    "video",
    "new",
    "vs",
    "v",
    "day",
    "week",
    "full",
    "hd",
    "4k",
    "2024",
    "2025",
    "2026",
    "subscribe",
    "watch",
    "click",
    "link",
    "description",
}


def _norm_lang(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    s = raw.strip().replace("_", "-").lower()
    if not s:
        return None
    return s.split("-")[0][:8]


def _lang_search_word(code: str | None) -> str | None:
    if not code:
        return None
    return _LANG_FOR_SEARCH.get(code.lower())


def _tokens(text: str) -> list[str]:
    """Word tokens across scripts (YouTube titles/descriptions)."""
    return [
        t.lower()
        for t in re.findall(r"[\w']{3,}", text or "", flags=re.UNICODE)
        if t.lower() not in _STOP and not t.isdigit()
    ]


def _parse_user_context(raw: str | None) -> list[str]:
    if not raw or not str(raw).strip():
        return []
    parts = re.split(r"[,;\n]+", str(raw))
    out: list[str] = []
    seen: set[str] = set()
    for p in parts:
        s = " ".join(p.split())[:100]
        if len(s) < 2:
            continue
        k = s.lower()
        if k in seen:
            continue
        seen.add(k)
        out.append(s)
    return out[:10]


def _content_format_label(rows: list[dict[str, Any]]) -> str:
    """Infer shorts vs long-form mix from durations."""
    if not rows:
        return "mixed"
    shorts = longs = 0
    for r in rows:
        sec = int(r.get("duration_seconds") or 0)
        if sec <= 0:
            continue
        if sec < 120:
            shorts += 1
        elif sec >= 480:
            longs += 1
    n = shorts + longs
    if n < 3:
        return "mixed"
    if shorts / max(len(rows), 1) >= 0.45:
        return "mostly_shorts"
    if longs / max(len(rows), 1) >= 0.4:
        return "mostly_longform"
    return "mixed"


def derive_niche_signals(channel_id: str) -> tuple[list[str], dict[str, Any]]:
    """
    Content-first signals: tags, title tokens, categories, description hints,
    dominant upload language, format. Does NOT inject channel display name into keywords.
    """
    ch = fetch_channel_full(channel_id)
    uploads = ch.get("uploads_playlist_id")
    meta: dict[str, Any] = {
        "channel_title": ch.get("title") or "",
        "country": ch.get("country"),
        "top_tags": [],
        "categories": [],
        "title_phrases": [],
        "description_phrases": [],
        "dominant_audio_language": None,
        "language_search_term": None,
        "content_format": "mixed",
    }
    if not uploads:
        return ([], meta)

    vids = fetch_last_n_upload_video_ids(uploads, 15)
    rows = fetch_videos_batch(vids)

    tag_counter: Counter[str] = Counter()
    cat_counter: Counter[str] = Counter()
    title_words: Counter[str] = Counter()
    desc_words: Counter[str] = Counter()
    lang_counter: Counter[str] = Counter()

    for r in rows:
        tags = r.get("tags") or []
        if isinstance(tags, list):
            for t in tags:
                if isinstance(t, str) and len(t.strip()) > 1:
                    tag_counter[t.strip().lower()[:60]] += 3
        title = r.get("title") or ""
        for w in _tokens(title):
            title_words[w.lower()] += 1
        desc = (r.get("description") or "")[:200]
        for w in _tokens(desc):
            desc_words[w.lower()] += 1
        cid = r.get("category_id")
        if cid:
            lab = _CATEGORY_LABELS.get(str(cid), "")
            if lab:
                cat_counter[lab] += 1
        al = _norm_lang(r.get("default_audio_language")) or _norm_lang(r.get("default_language"))
        if al:
            lang_counter[al] += 1

    top_tags = [t for t, _ in tag_counter.most_common(14)]
    top_cats = [c for c, _ in cat_counter.most_common(2)]
    top_title_words = [w for w, _ in title_words.most_common(12)]
    top_desc_words = [w for w, _ in desc_words.most_common(8)]

    dominant_lang = lang_counter.most_common(1)[0][0] if lang_counter else None
    lang_word = _lang_search_word(dominant_lang)
    meta["dominant_audio_language"] = dominant_lang
    meta["language_search_term"] = lang_word
    meta["content_format"] = _content_format_label(rows)
    meta["top_tags"] = top_tags[:10]
    meta["categories"] = top_cats
    meta["title_phrases"] = top_title_words[:10]
    meta["description_phrases"] = top_desc_words[:8]

    ordered: list[str] = []
    seen: set[str] = set()

    def push(x: str) -> None:
        x = " ".join(x.split()).strip()
        if len(x) < 2 or x.lower() in seen:
            return
        seen.add(x.lower())
        ordered.append(x)

    for t in top_tags:
        push(t)
    for w in top_title_words:
        push(w)
    for w in top_desc_words:
        push(w)
    for c in top_cats:
        push(c)

    return (ordered[:20], meta)


def _build_content_queries(
    keywords: list[str],
    *,
    lang_word: str | None,
    dominant_category: str | None,
    content_format: str,
    user_phrases: list[str],
    max_queries: int = 5,
) -> list[str]:
    """
    Queries are built from topic/language/format — never from channel brand name.
    """
    qs: list[str] = []
    k = keywords

    # User-described niche first (strongest intent)
    for phrase in user_phrases[:2]:
        if phrase:
            qs.append(phrase[:80])

    if lang_word and len(k) >= 2:
        qs.append(f"{lang_word} {' '.join(k[:5])}")
    if lang_word and dominant_category and len(k) >= 1:
        qs.append(f"{lang_word} {dominant_category} {' '.join(k[:3])}")

    if dominant_category and k:
        qs.append(f"{dominant_category} {' '.join(k[:5])}")

    if content_format == "mostly_shorts" and k:
        qs.append(f"shorts {' '.join(k[:4])}")
    elif content_format == "mostly_longform" and k:
        qs.append(f"long form {' '.join(k[:5])}")

    if len(k) >= 4:
        qs.append(" ".join(k[:6]))
    if len(k) >= 9:
        qs.append(" ".join(k[4:10]))

    out: list[str] = []
    seen_q: set[str] = set()
    for q in qs:
        qn = " ".join(q.split())[:80]
        if len(qn) < 3 or qn.lower() in seen_q:
            continue
        seen_q.add(qn.lower())
        out.append(qn)
    return out[:max_queries]


def discover_competitors(
    my_channel_id: str,
    extra_tags: list[str] | None = None,
    channel_context: str | None = None,
    max_suggestions: int = 8,
) -> dict[str, Any]:
    """
    Merge optional user description + API tags with upload-derived content signals.
    """
    cid = (my_channel_id or "").strip()
    if not cid:
        return {"suggestions": [], "query_used": "", "signals_used": {}, "queries_tried": []}

    user_phrases = _parse_user_context(channel_context)

    try:
        derived, signals_meta = derive_niche_signals(cid)
    except Exception as e:
        logger.warning("derive_niche_signals failed: %s", e)
        return {
            "suggestions": [],
            "query_used": "",
            "signals_used": {},
            "queries_tried": [],
            "discover_error": str(e)[:240],
        }

    extra = [t.strip() for t in (extra_tags or []) if t and str(t).strip()]
    merged: list[str] = []
    seen: set[str] = set()
    # User phrases as whole tokens first, then tags, then derived content tokens
    for x in user_phrases + extra + derived:
        k = x.strip().lower()
        if len(k) < 2 or k in seen:
            continue
        seen.add(k)
        merged.append(x.strip())

    dominant_cat = signals_meta["categories"][0] if signals_meta.get("categories") else None
    queries = _build_content_queries(
        merged,
        lang_word=signals_meta.get("language_search_term"),
        dominant_category=dominant_cat,
        content_format=str(signals_meta.get("content_format") or "mixed"),
        user_phrases=user_phrases,
    )

    if not queries and merged:
        queries = [" ".join(merged[:6])]
    if not queries and user_phrases:
        queries = [user_phrases[0][:80]]

    if not queries:
        return {
            "suggestions": [],
            "query_used": "",
            "signals_used": {**signals_meta, "merged_keywords": merged[:12], "user_context_parsed": user_phrases},
            "queries_tried": [],
        }

    exclude = cid
    collected: dict[str, dict[str, Any]] = {}
    for q in queries:
        batch = search_similar_channels(q, exclude_channel_id=exclude, max_results=10)
        for b in batch:
            oid = b.get("channel_id")
            if not oid or oid == exclude:
                continue
            if oid not in collected:
                collected[oid] = {**b, "match_hint": q}
            if len(collected) >= max_suggestions:
                break
        if len(collected) >= max_suggestions:
            break

    suggestions = list(collected.values())[:max_suggestions]
    primary = queries[0] if queries else ""

    return {
        "suggestions": suggestions,
        "query_used": primary,
        "queries_tried": queries,
        "signals_used": {
            "channel_title": signals_meta.get("channel_title"),
            "country": signals_meta.get("country"),
            "dominant_audio_language": signals_meta.get("dominant_audio_language"),
            "language_search_term": signals_meta.get("language_search_term"),
            "content_format": signals_meta.get("content_format"),
            "top_tags": signals_meta.get("top_tags"),
            "from_titles": signals_meta.get("title_phrases"),
            "from_descriptions": signals_meta.get("description_phrases"),
            "categories": signals_meta.get("categories"),
            "merged_keywords": merged[:14],
            "user_context_parsed": user_phrases,
        },
    }
