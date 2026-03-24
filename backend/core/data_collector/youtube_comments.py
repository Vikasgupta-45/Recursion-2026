"""Fetch public top-level comments via YouTube Data API v3 (commentThreads.list)."""

from __future__ import annotations

import html
import logging
import re
from typing import Any

import app_config
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

logger = logging.getLogger(__name__)

_TAG_RE = re.compile(r"<[^>]+>")


def _strip_comment_html(s: str) -> str:
    t = html.unescape(s or "")
    t = _TAG_RE.sub("", t)
    return " ".join(t.split()).strip()


def fetch_comments_for_videos(
    video_ids: list[str],
    *,
    max_videos: int = 5,
    max_per_video: int = 25,
    max_total: int = 100,
) -> list[dict[str, Any]]:
    """
    Pull top-level comments for the first N unique video ids (recent uploads first in caller order).
    Returns [{ "video_id", "text", "author": optional }].
    """
    out: list[dict[str, Any]] = []
    api_key = app_config.get_youtube_api_key()
    if not api_key:
        return out

    seen: set[str] = set()
    ordered: list[str] = []
    for vid in video_ids:
        v = (vid or "").strip()
        if len(v) != 11 or v in seen:
            continue
        seen.add(v)
        ordered.append(v)
        if len(ordered) >= max_videos:
            break

    if not ordered:
        return out

    youtube = build("youtube", "v3", developerKey=api_key)
    for vid in ordered:
        if len(out) >= max_total:
            break
        try:
            resp = (
                youtube.commentThreads()
                .list(
                    part="snippet",
                    videoId=vid,
                    maxResults=min(max_per_video, 100),
                    textFormat="plainText",
                    order="relevance",
                )
                .execute()
            )
        except HttpError as e:
            logger.info("No comments or API error for video %s: %s", vid, e)
            continue
        except Exception as e:
            logger.warning("commentThreads.list failed for %s: %s", vid, e)
            continue

        for item in resp.get("items") or []:
            if len(out) >= max_total:
                break
            top = (item.get("snippet") or {}).get("topLevelComment") or {}
            sn = top.get("snippet") or {}
            raw = sn.get("textDisplay") or sn.get("textOriginal") or ""
            text = _strip_comment_html(str(raw))
            if not text or len(text) < 2:
                continue
            if len(text) > 400:
                text = text[:397] + "..."
            out.append(
                {
                    "video_id": vid,
                    "text": text,
                    "author": (sn.get("authorDisplayName") or "")[:80] or None,
                }
            )

    return out
