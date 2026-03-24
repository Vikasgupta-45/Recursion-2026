"""YouTube Data API v3 helpers for competitor analysis."""

from __future__ import annotations

import logging
from typing import Any

import app_config
from data_collector.youtube_collector import (
    _video_rows_from_api_items,
    resolve_channel_id,
)
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)


def fetch_channel_full(channel_id: str) -> dict[str, Any]:
    """channels.list: snippet, statistics, contentDetails."""
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        raise ValueError("YOUTUBE_API_KEY is not configured")
    yt = build("youtube", "v3", developerKey=api_key)
    resp = (
        yt.channels()
        .list(part="snippet,statistics,contentDetails", id=channel_id)
        .execute()
    )
    items = resp.get("items") or []
    if not items:
        raise ValueError("Channel not found")
    it = items[0]
    sn = it.get("snippet") or {}
    st = it.get("statistics") or {}
    cd = it.get("contentDetails") or {}
    uploads = (cd.get("relatedPlaylists") or {}).get("uploads")
    return {
        "channel_id": channel_id,
        "title": sn.get("title") or "",
        "description": (sn.get("description") or "")[:500],
        "published_at": sn.get("publishedAt"),
        "custom_url": sn.get("customUrl"),
        "subscriber_count": int(st.get("subscriberCount", 0) or 0),
        "view_count": int(st.get("viewCount", 0) or 0),
        "video_count": int(st.get("videoCount", 0) or 0),
        "hidden_subscriber_count": st.get("hiddenSubscriberCount") == "true",
        "uploads_playlist_id": uploads,
    }


def fetch_last_n_upload_video_ids(uploads_playlist_id: str, n: int) -> list[str]:
    api_key = app_config.get_youtube_api_key()
    if not api_key or not uploads_playlist_id:
        return []
    yt = build("youtube", "v3", developerKey=api_key)
    out: list[str] = []
    page_token = None
    while len(out) < n:
        req = (
            yt.playlistItems()
            .list(
                part="contentDetails",
                playlistId=uploads_playlist_id,
                maxResults=min(50, n - len(out)),
                pageToken=page_token or "",
            )
            .execute()
        )
        for row in req.get("items") or []:
            vid = (row.get("contentDetails") or {}).get("videoId")
            if vid:
                out.append(vid)
        page_token = req.get("nextPageToken")
        if not page_token:
            break
    return out[:n]


def fetch_videos_batch(video_ids: list[str]) -> list[dict[str, Any]]:
    if not video_ids:
        return []
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        return []
    yt = build("youtube", "v3", developerKey=api_key)
    all_rows: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = (
            yt.videos()
            .list(part="snippet,statistics,contentDetails", id=",".join(batch))
            .execute()
        )
        all_rows.extend(_video_rows_from_api_items(resp.get("items") or []))
    # preserve order of video_ids
    by_id = {r["video_id"]: r for r in all_rows}
    return [by_id[i] for i in video_ids if i in by_id]


def resolve_competitor_channel_id(competitor_url: str) -> str:
    """Resolve URL / handle / UC id via existing helper + search when needed."""
    raw = (competitor_url or "").strip()
    if not raw:
        raise ValueError("competitor_url is required")
    cid = resolve_channel_id(raw)
    if cid:
        return cid
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        raise ValueError("Could not resolve channel (set YOUTUBE_API_KEY and use a valid channel URL)")
    yt = build("youtube", "v3", developerKey=api_key)
    # Last resort: search by query string from URL
    q = raw
    if "youtube.com" in raw or "youtu.be" in raw:
        q = raw.split("/")[-1].split("?")[0] or raw
    try:
        r = yt.search().list(part="snippet", q=q, type="channel", maxResults=3).execute()
        items = r.get("items") or []
        if items:
            return items[0]["snippet"]["channelId"]
    except HttpError as e:
        logger.warning("competitor search failed: %s", e)
    raise ValueError("Could not resolve competitor channel from URL")


def search_similar_channels(
    query: str,
    exclude_channel_id: str | None,
    max_results: int = 8,
) -> list[dict[str, Any]]:
    api_key = app_config.get_youtube_api_key()
    if not api_key or not query.strip():
        return []
    yt = build("youtube", "v3", developerKey=api_key)
    try:
        r = yt.search().list(
            part="snippet",
            q=query.strip()[:80],
            type="channel",
            maxResults=max_results,
        ).execute()
    except HttpError as e:
        logger.warning("channel suggest search failed: %s", e)
        return []
    ex = (exclude_channel_id or "").strip()
    out: list[dict[str, Any]] = []
    for it in r.get("items") or []:
        sn = it.get("snippet") or {}
        cid = sn.get("channelId")
        if not cid or cid == ex:
            continue
        thumbs = sn.get("thumbnails") or {}
        thumb = (
            (thumbs.get("high") or {}).get("url")
            or (thumbs.get("medium") or {}).get("url")
            or (thumbs.get("default") or {}).get("url")
        )
        out.append(
            {
                "channel_id": cid,
                "title": sn.get("title") or "",
                "description": (sn.get("description") or "")[:160],
                "thumbnail_url": thumb,
            }
        )
        if len(out) >= max_results:
            break
    return out[:max_results]
