from datetime import datetime, timezone
import re

import yt_dlp


def normalize_channel_to_videos_url(channel_url: str) -> str:
    """
    Channel home pages often resolve to tab entries (Videos / Shorts / Live) with no stats.
    Force the uploads feed: /@handle/videos or /channel/UC…/videos
    """
    u = channel_url.strip().rstrip("/")
    u = re.sub(r"[?#].*$", "", u)
    if not u.startswith("http"):
        if re.match(r"^UC[\w-]{22}$", u):
            u = f"https://www.youtube.com/channel/{u}"
        else:
            h = u.lstrip("@")
            u = f"https://www.youtube.com/@{h}"
    low = u.lower()
    if "youtube.com" not in low or "/watch" in low or "list=" in low:
        return u
    if re.search(r"/(videos|shorts|streams)(/)?$", u, re.I):
        return u

    base = r"https?://(?:www\.|m\.)?youtube\.com"
    # /@handle[/tabs…] → /@handle/videos (never append "/videos" onto /playlists etc.)
    m = re.match(rf"(?i)^({base}/@([^/?#]+))(?:/.*)?$", u)
    if m:
        return f"{m.group(1)}/videos"
    m = re.match(rf"(?i)^({base}/channel/([^/?#]+))(?:/.*)?$", u)
    if m:
        return f"{m.group(1)}/videos"
    m = re.match(rf"(?i)^({base}/(?:c|user)/([^/?#]+))(?:/.*)?$", u)
    if m:
        return f"{m.group(1)}/videos"
    return u


def _is_channel_tab_placeholder(entry: dict) -> bool:
    """YouTube sometimes returns tab rows instead of real videos on the wrong URL."""
    t = (entry.get("title") or "").strip()
    if not t:
        return True
    for suf in (" - Videos", " - Shorts", " - Live", " - Playlists", " - Posts"):
        if t.endswith(suf):
            return True
    return False


def fetch_channel_content_ytdlp(channel_url: str, max_videos: int = 12, flat: bool = False) -> dict:
    """
    Latest uploads. flat=True uses extract_flat (much faster, fewer fields).
    """
    target = normalize_channel_to_videos_url(channel_url)

    ydl_opts = {
        "quiet": True,
        "extract_flat": "in_playlist" if flat else False,
        "playlistend": max_videos,
        "ignoreerrors": True,
        "skip_download": True,
        "noprogress": True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)

            entries = info.get("entries")
            if entries is None:
                videos = [info] if info and info.get("id") else []
            else:
                videos = [e for e in entries if e and isinstance(e, dict)]

            collected_content = []
            for video in videos:
                if _is_channel_tab_placeholder(video):
                    continue
                vid = video.get("id")
                title = video.get("title")
                if not title:
                    continue
                collected_content.append(
                    {
                        "title": title,
                        "video_id": vid,
                        "video_url": video.get("webpage_url") or video.get("url"),
                        "views": int(video.get("view_count") or 0),
                        "duration_seconds": int(video.get("duration") or 0),
                        "upload_date": video.get("upload_date"),
                        "timestamp": video.get("timestamp") or video.get("release_timestamp"),
                    }
                )

            ch_name = (
                info.get("uploader")
                or info.get("channel")
                or info.get("uploader_id")
                or ""
            )
            if not ch_name and info.get("title"):
                ch_name = str(info["title"]).replace(" - Videos", "").strip()

            return {
                "channel_name": ch_name or "Unknown",
                "channel_description": info.get("description") or "",
                "latest_videos_metadata": collected_content,
                "resolved_url": target,
            }
    except Exception as e:
        return {"error": f"yt-dlp failed: {str(e)}"}


def fetch_channel_videos_detailed(channel_url: str, max_videos: int = 15, flat: bool = True) -> list[dict]:
    """
    Upload dates, views, likes, comments per video. flat=True is faster but may lack some fields.
    """
    target = normalize_channel_to_videos_url(channel_url)

    ydl_opts = {
        "quiet": True,
        "extract_flat": "in_playlist" if flat else False,
        "playlistend": max_videos,
        "ignoreerrors": True,
        "skip_download": True,
        "noprogress": True,
    }
    out: list[dict] = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)
            entries = info.get("entries") or [info]
            for video in entries:
                if not video or not isinstance(video, dict):
                    continue
                if _is_channel_tab_placeholder(video):
                    continue
                ts = video.get("timestamp") or video.get("release_timestamp")
                upload_date = video.get("upload_date")
                if upload_date and len(str(upload_date)) == 8:
                    ds = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
                elif ts:
                    ds = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                else:
                    continue
                dur = int(video.get("duration") or 0)
                out.append(
                    {
                        "date": ds,
                        "views": int(video.get("view_count") or 0),
                        "likes": int(video.get("like_count") or 0),
                        "comments": int(video.get("comment_count") or 0),
                        "title": video.get("title") or "",
                        "video_id": video.get("id") or video.get("url"),
                        "duration_seconds": dur,
                        "published_at": f"{ds}T12:00:00Z",
                    }
                )
        out.sort(key=lambda x: x["date"])
        return out
    except Exception:
        return []


def _catalog_row_from_ytdlp_entry(video: dict) -> dict | None:
    if not video or not isinstance(video, dict):
        return None
    if _is_channel_tab_placeholder(video):
        return None
    vid = video.get("id")
    # Flat extraction may provide URL instead of ID
    if not vid:
        url = video.get("url") or ""
        m = re.search(r"(?:v=|youtu\.be/|shorts/)([\w-]{11})", str(url))
        vid = m.group(1) if m else url
    title = video.get("title")
    if not vid or not title:
        return None
    vid = str(vid)
    if len(vid) != 11:
        return None
    upload_date = video.get("upload_date")
    if upload_date and len(str(upload_date)) == 8:
        ud = str(upload_date)
        ds = f"{ud[:4]}-{ud[4:6]}-{ud[6:8]}"
    else:
        ts = video.get("timestamp") or video.get("release_timestamp")
        if ts:
            ds = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
        else:
            ds = ""
    published = f"{ds}T12:00:00Z" if ds else ""
    views = int(video.get("view_count") or 0)
    # Flat mode may lack like/comment counts — estimate from views
    likes = int(video.get("like_count") or 0) or max(0, int(views * 0.032))
    comments = int(video.get("comment_count") or 0) or max(0, int(views * 0.0012))
    return {
        "video_id": vid,
        "title": title,
        "description": (video.get("description") or "")[:5000],
        "tags": [],
        "category_id": None,
        "published_at": published,
        "date": ds,
        "views": views,
        "likes": likes,
        "comments": comments,
        "duration_seconds": int(video.get("duration") or 0),
        "thumbnail_url": f"https://img.youtube.com/vi/{vid}/mqdefault.jpg",
    }


def fetch_channel_catalog_ytdlp(channel_url: str, max_videos: int = 50) -> dict:
    """
    One yt-dlp pass: video rows in the same shape as YouTube Data API catalog + channel hints.
    Used when the Data API is disabled, rate-limited, or blocked for the key.
    Uses extract_flat for speed — gets metadata from playlist page without loading each video.
    """
    target = normalize_channel_to_videos_url(channel_url)
    max_videos = min(max(1, max_videos), 200)
    ydl_opts = {
        "quiet": True,
        "extract_flat": "in_playlist",
        "playlistend": max_videos,
        "ignoreerrors": True,
        "skip_download": True,
        "noprogress": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(target, download=False)
    except Exception as e:
        return {"error": str(e), "videos": [], "channel_title": None, "channel_id": None}

    ch_title = (
        info.get("uploader")
        or info.get("channel")
        or info.get("uploader_id")
        or (str(info.get("title", "")).replace(" - Videos", "").strip() or None)
    )
    ch_id = info.get("channel_id") or info.get("uploader_id")
    if ch_id and not str(ch_id).startswith("UC"):
        ch_id = None

    entries = info.get("entries") or [info]
    videos: list[dict] = []
    for entry in entries:
        row = _catalog_row_from_ytdlp_entry(entry)
        if row:
            videos.append(row)
    videos.sort(key=lambda x: x.get("published_at") or "")
    return {
        "videos": videos,
        "channel_title": ch_title,
        "channel_id": ch_id,
        "resolved_url": target,
    }


def fetch_video_row_ytdlp(video_id: str) -> dict | None:
    """Single video metadata when Data API videos.list is unavailable."""
    vid = (video_id or "").strip()
    if len(vid) != 11:
        return None
    url = f"https://www.youtube.com/watch?v={vid}"
    ydl_opts = {
        "quiet": True,
        "extract_flat": False,
        "ignoreerrors": True,
        "skip_download": True,
        "noprogress": True,
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
    except Exception:
        return None
    if not info or not isinstance(info, dict):
        return None
    return _catalog_row_from_ytdlp_entry(info)
