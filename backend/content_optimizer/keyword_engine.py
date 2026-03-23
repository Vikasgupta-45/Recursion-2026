"""
NLP keyword extraction (YAKE — unsupervised, no external model download).
"""

from __future__ import annotations

from typing import Any


def extract_keywords(text: str, top_n: int = 18, language: str = "en") -> list[dict[str, Any]]:
    if not text or not str(text).strip():
        return []
    try:
        import yake

        extractor = yake.KeywordExtractor(
            lan=language,
            n=3,
            dedupLim=0.7,
            top=top_n,
        )
        raw = extractor.extract_keywords(text)
        return [{"phrase": str(k), "score": float(s)} for k, s in raw]
    except Exception:
        return _fallback_keywords(text, top_n)


def _fallback_keywords(text: str, top_n: int) -> list[dict[str, Any]]:
    from collections import Counter
    import re

    tokens = re.findall(r"[a-zA-Z][a-zA-Z+]{2,}", text.lower())
    stop = {
        "the", "and", "for", "you", "this", "that", "with", "from", "your", "how",
        "what", "when", "why", "are", "was", "has", "have", "not", "but", "our",
        "all", "can", "will", "just", "get", "new", "one", "out", "about", "into",
    }
    filtered = [t for t in tokens if t not in stop]
    counts = Counter(filtered)
    top = counts.most_common(top_n)
    return [{"phrase": w, "score": 1.0 / (1 + i)} for i, (w, _) in enumerate(top)]


def keyword_phrases_only(text: str, top_n: int = 15) -> list[str]:
    return [x["phrase"] for x in extract_keywords(text, top_n=top_n)]
