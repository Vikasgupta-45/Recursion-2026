"""Infer a short Google Trends query from recent video titles."""

from __future__ import annotations

import re
from collections import Counter

_STOP = frozenset(
    """
    the and for with from this that your you are can our has have was were will
    what when where which while who how why into over more most some such than
    then them these they their about after also back before being both each
    few other same such than very just like make many much part real said
    course crash full free best new all any get got let may not now one out
    see two way use day may its only own same so too
    """.split()
)


def infer_niche_keyword(titles: list[str], fallback: str = "machine learning") -> str:
    words: list[str] = []
    for t in titles:
        if not t:
            continue
        for w in re.findall(r"[a-zA-Z][a-zA-Z0-9+]{2,}", t.lower()):
            if w in _STOP or len(w) < 4:
                continue
            words.append(w)
    if not words:
        return fallback
    top = Counter(words).most_common(4)
    if len(top) >= 2 and top[0][0] != top[1][0]:
        a, b = top[0][0], top[1][0]
        if a in ("ai", "ml", "llm", "gpt"):
            return f"{a.upper()} {b}" if len(a) <= 3 else f"{a} {b}"
        return f"{a} {b}"
    return top[0][0] if top else fallback
