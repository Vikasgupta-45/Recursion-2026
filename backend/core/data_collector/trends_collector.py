import logging
import os
import random
import re
import time

from pytrends.request import TrendReq

logger = logging.getLogger(__name__)

# Use Mozilla CA bundle on Windows to reduce SSLEOF / handshake flakes.
try:
    import certifi

    _ca = certifi.where()
    if os.path.isfile(_ca):
        os.environ.setdefault("SSL_CERT_FILE", _ca)
        os.environ.setdefault("REQUESTS_CA_BUNDLE", _ca)
except Exception:
    pass

_UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/131.0.0.0 Safari/537.36"
)

_TRENDS_REQ_HEADERS = {
    "User-Agent": _UA,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def _is_transient(exc: BaseException) -> bool:
    """Return True for errors that are worth retrying (rate-limit OR SSL/connection)."""
    msg = str(exc).lower()
    if "429" in msg or "too many requests" in msg:
        return True
    # SSL handshake / connection-reset errors from Google
    if any(tok in msg for tok in ("ssl", "eof", "connection", "reset", "timeout", "max retries")):
        return True
    return False


def _friendly_error(exc: BaseException) -> str:
    msg = str(exc).lower()
    if "429" in msg or "too many requests" in msg:
        return (
            "Google Trends is temporarily busy. Wait 1–2 minutes and run analysis again."
        )
    if any(tok in msg for tok in ("ssl", "eof", "connection", "max retries")):
        return (
            "Google Trends blocked or dropped the connection (SSL/network). "
            "Try again in a minute; if it keeps happening, turn off VPN or "
            "check antivirus/firewall HTTPS scanning."
        )
    return str(exc)[:200]


def _fetch_once(keyword: str) -> dict:
    pytrend = TrendReq(
        hl="en-US",
        tz=360,
        timeout=(30, 60),
        retries=0,
        backoff_factor=0,
        requests_args={"headers": dict(_TRENDS_REQ_HEADERS)},
    )

    pytrend.build_payload(kw_list=[keyword], timeframe="today 3-m")
    df = pytrend.interest_over_time()

    if df.empty:
        return {"keyword": keyword, "error": "No trend data found", "current_score": None, "trend_data": {}}

    df = df.drop(columns=["isPartial"])
    recent_trends = df.tail(30).to_dict()[keyword]

    return {
        "keyword": keyword,
        "trend_data": recent_trends,
        "current_score": int(df[keyword].iloc[-1]),
    }


def _trend_series_max(res: dict) -> float:
    td = res.get("trend_data") or {}
    if not isinstance(td, dict) or not td:
        return -1.0
    try:
        return max(float(v) for v in td.values() if v is not None)
    except (TypeError, ValueError):
        return -1.0


def _broader_trend_queries(kw: str) -> list[str]:
    stop = frozenset(
        "the and for with from this that your course video full free best new day "
        "tips guide intro".split()
    )
    tokens = [t for t in re.split(r"\W+", (kw or "").lower()) if len(t) >= 4 and t not in stop]
    tokens.sort(key=len, reverse=True)
    seen: set[str] = set()
    alts: list[str] = []
    for t in tokens:
        if t not in seen:
            seen.add(t)
            alts.append(t)
    for fb in ("python programming", "data science", "machine learning"):
        if fb not in seen:
            seen.add(fb)
            alts.append(fb)
    return alts[:6]


def _expand_zero_trends(primary_kw: str, first: dict) -> dict:
    """Niche multi-word queries often return all-zero from Trends; try shorter / broader terms."""
    if first.get("error"):
        return first
    if _trend_series_max(first) > 0:
        return first
    for alt in _broader_trend_queries(primary_kw):
        if alt.lower() == (primary_kw or "").lower().strip():
            continue
        try:
            alt_res = _fetch_once(alt)
        except Exception:
            continue
        if alt_res.get("error"):
            continue
        if _trend_series_max(alt_res) > 0:
            alt_res["trends_broadened_from"] = primary_kw
            return alt_res
    first["trends_note"] = "Very low search interest for this exact phrase in Google Trends."
    return first


def fetch_trends_for_topic(keyword: str, retry_on_429: bool = True) -> dict:
    """
    Google Trends via pytrends.
    Retries on rate-limit (429) AND transient SSL / connection errors with backoff.
    """
    delays = (0.0, 4.0, 10.0, 20.0, 35.0)
    last_exc: BaseException | None = None

    for i, base_delay in enumerate(delays):
        if base_delay > 0:
            wait = base_delay + random.uniform(0.5, 2.0)
            logger.info("Google Trends retry %d/%d — waiting %.1fs", i, len(delays) - 1, wait)
            time.sleep(wait)
        elif i == 0:
            time.sleep(random.uniform(0.3, 1.0))

        try:
            return _expand_zero_trends(keyword, _fetch_once(keyword))
        except Exception as e:
            last_exc = e
            transient = _is_transient(e)
            logger.warning("Google Trends attempt %d failed (%s): %s", i + 1, "transient" if transient else "fatal", str(e)[:150])

            if not retry_on_429 and "429" in str(e).lower():
                return {
                    "keyword": keyword,
                    "current_score": None,
                    "trend_data": {},
                    "error": _friendly_error(e),
                    "raw_error": str(e)[:300],
                }
            # Retry transient errors; bail immediately on unexpected ones
            if transient and i < len(delays) - 1:
                continue
            if not transient:
                return {
                    "keyword": keyword,
                    "current_score": None,
                    "trend_data": {},
                    "error": _friendly_error(e),
                    "raw_error": str(e)[:300],
                }

    return {
        "keyword": keyword,
        "current_score": None,
        "trend_data": {},
        "error": _friendly_error(last_exc) if last_exc else "Trends unavailable",
        "raw_error": str(last_exc)[:300] if last_exc else "",
    }
