import logging
import re
from typing import Any

import app_config
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def _iso8601_duration_seconds(duration: str) -> int:
    if not duration or not duration.startswith("P"):
        return 0
    h = re.search(r"(\d+)H", duration)
    m = re.search(r"(\d+)M", duration)
    s = re.search(r"(\d+)S", duration)
    return (
        (int(h.group(1)) * 3600 if h else 0)
        + (int(m.group(1)) * 60 if m else 0)
        + (int(s.group(1)) if s else 0)
    )


def extract_video_id(url_or_id: str) -> str | None:
    """11-char video id or watch/shorts URL → id."""
    s = (url_or_id or "").strip()
    if re.match(r"^[\w-]{11}$", s):
        return s
    m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", s)
    return m.group(1) if m else None


def resolve_channel_id(youtube_url_or_id: str) -> str | None:
    """
    Resolve a channel URL or raw id to a canonical UC... channel id.
    Requires YOUTUBE_API_KEY for @handle resolution.
    """
    raw = (youtube_url_or_id or "").strip()
    if not raw:
        return None
    if re.match(r"^UC[\w-]{22}$", raw):
        return raw
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        return None
    youtube = build("youtube", "v3", developerKey=api_key)
    m = re.search(r"youtube\.com/channel/([^/?#]+)", raw)
    if m:
        return m.group(1)
    m = re.search(r"youtube\.com/@([^/?#]+)", raw)
    if m:
        handle = m.group(1)
        try:
            r = youtube.channels().list(forHandle=handle, part="id").execute()
        except HttpError:
            return None
        except Exception as e:
            logger.warning("YouTube API unreachable resolving @%s: %s", handle, str(e)[:120])
            return None
        if r.get("items"):
            return r["items"][0]["id"]
        # forHandle can be empty for some handles; fall back to channel search
        try:
            r2 = youtube.search().list(
                part="snippet", q=handle, type="channel", maxResults=5
            ).execute()
            want = handle.lower().lstrip("@")
            for it in r2.get("items") or []:
                sn = it.get("snippet") or {}
                cu = (sn.get("customUrl") or "").lower().lstrip("@")
                cid = sn.get("channelId")
                if cid and cu == want:
                    return cid
            items2 = r2.get("items") or []
            if items2:
                return items2[0]["snippet"]["channelId"]
        except HttpError:
            return None
        except Exception as e:
            logger.warning("YouTube search fallback for @%s: %s", handle, str(e)[:120])
            return None
    m = re.search(r"youtube\.com/(?:c|user)/([^/?#]+)", raw)
    if m:
        try:
            r = youtube.search().list(
                part="snippet", q=m.group(1), type="channel", maxResults=1
            ).execute()
        except HttpError:
            return None
        except Exception as e:
            logger.warning("YouTube API unreachable (search channel): %s", str(e)[:120])
            return None
        items = r.get("items") or []
        if items:
            return items[0]["snippet"]["channelId"]
    return None


def _video_rows_from_api_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for v in items:
        vid = v.get("id")
        sn = v.get("snippet") or {}
        if not vid or not sn:
            continue
        st = v.get("statistics") or {}
        cd = v.get("contentDetails") or {}
        thumbs = sn.get("thumbnails") or {}
        thumb_url = (
            (thumbs.get("high") or {}).get("url")
            or (thumbs.get("medium") or {}).get("url")
            or (thumbs.get("default") or {}).get("url")
        )
        def _num(x: Any) -> int:
            try:
                if x is None or x == "":
                    return 0
                return int(x)
            except (TypeError, ValueError):
                return 0

        out.append(
            {
                "video_id": vid,
                "title": sn.get("title", ""),
                "description": sn.get("description", ""),
                "tags": sn.get("tags") or [],
                "category_id": sn.get("categoryId"),
                "published_at": sn.get("publishedAt"),
                "date": (sn.get("publishedAt") or "")[:10],
                "views": _num(st.get("viewCount")),
                "likes": _num(st.get("likeCount")),
                "comments": _num(st.get("commentCount")),
                "duration_seconds": _iso8601_duration_seconds(cd.get("duration") or ""),
                "thumbnail_url": thumb_url,
            }
        )
    return out


def fetch_channel_video_catalog(channel_id: str, max_videos: int = 500) -> list[dict[str, Any]]:
    """
    Paginate uploads playlist; return rich rows for catalog UI + analytics.
    max_videos capped at 500 for quota safety (hackathon default).
    """
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        return []
    max_videos = min(max(1, max_videos), 500)
    youtube = build("youtube", "v3", developerKey=api_key)
    ch = youtube.channels().list(part="contentDetails", id=channel_id).execute()
    if not ch.get("items"):
        return []
    uploads = ch["items"][0]["contentDetails"]["relatedPlaylists"].get("uploads")
    if not uploads:
        return []

    video_ids: list[str] = []
    page_token = None
    while len(video_ids) < max_videos:
        pl = (
            youtube.playlistItems()
            .list(
                part="contentDetails",
                playlistId=uploads,
                maxResults=min(50, max_videos - len(video_ids)),
                pageToken=page_token or "",
            )
            .execute()
        )
        for item in pl.get("items", []):
            cd = item.get("contentDetails") or {}
            vid = cd.get("videoId")
            if vid:
                video_ids.append(vid)
        page_token = pl.get("nextPageToken")
        if not page_token:
            break

    if not video_ids:
        return []

    all_rows: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = (
            youtube.videos()
            .list(part="statistics,snippet,contentDetails", id=",".join(batch))
            .execute()
        )
        all_rows.extend(_video_rows_from_api_items(resp.get("items") or []))

    all_rows.sort(key=lambda x: x.get("published_at") or "")
    return all_rows


def fetch_videos_by_ids(video_ids: list[str]) -> list[dict[str, Any]]:
    """Batch fetch up to 50 ids (caller should chunk)."""
    api_key = app_config.get_youtube_api_key()
    if not api_key or not video_ids:
        return []
    youtube = build("youtube", "v3", developerKey=api_key)
    resp = (
        youtube.videos()
        .list(part="statistics,snippet,contentDetails", id=",".join(video_ids[:50]))
        .execute()
    )
    return _video_rows_from_api_items(resp.get("items") or [])


def fetch_uploads_video_stats(channel_id: str, max_videos: int = 90) -> list[dict[str, Any]]:
    """Alias for time-series pipeline: same catalog, trimmed fields compatible with older code."""
    rows = fetch_channel_video_catalog(channel_id, max_videos=max_videos)
    return [
        {
            "date": r["date"],
            "views": r["views"],
            "likes": r["likes"],
            "comments": r["comments"],
            "title": r["title"],
            "video_id": r["video_id"],
            "duration_seconds": r["duration_seconds"],
            "published_at": r["published_at"],
        }
        for r in rows
    ]


def fetch_youtube_metrics(channel_id: str) -> dict:
    """Fetches real views/subscribers using YouTube Data API v3."""
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        return {
            "error": "No YouTube Data API key in backend/.env (use YOUTUBE_API_KEY).",
        }
    youtube = build("youtube", "v3", developerKey=api_key)

    request = youtube.channels().list(part="statistics,snippet", id=channel_id)
    try:
        response = request.execute()
    except HttpError as e:
        return {"error": str(e)[:240]}
    except Exception as e:
        msg = str(e)[:240]
        logger.warning("fetch_youtube_metrics network error: %s", msg)
        return {
            "error": msg or "Cannot reach YouTube Data API (check internet / DNS / firewall).",
        }

    if not response.get("items"):
        return {"error": "Channel not found"}

    stats = response["items"][0]["statistics"]
    snippet = response["items"][0]["snippet"]

    return {
        "channel_title": snippet.get("title"),
        "views": int(stats.get("viewCount", 0)),
        "subscribers": int(stats.get("subscriberCount", 0)),
        "video_count": int(stats.get("videoCount", 0)),
        "platform": "youtube",
    }
