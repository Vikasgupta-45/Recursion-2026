import os
import re
from typing import Any


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
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()


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
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return None
    youtube = build("youtube", "v3", developerKey=api_key)
    m = re.search(r"youtube\.com/channel/([^/?#]+)", raw)
    if m:
        return m.group(1)
    m = re.search(r"youtube\.com/@([^/?#]+)", raw)
    if m:
        handle = m.group(1)
        r = youtube.channels().list(forHandle=handle, part="id").execute()
        if r.get("items"):
            return r["items"][0]["id"]
    m = re.search(r"youtube\.com/(?:c|user)/([^/?#]+)", raw)
    if m:
        r = youtube.search().list(
            part="snippet", q=m.group(1), type="channel", maxResults=1
        ).execute()
        items = r.get("items") or []
        if items:
            return items[0]["snippet"]["channelId"]
    return None


def fetch_uploads_video_stats(channel_id: str, max_videos: int = 90) -> list[dict[str, Any]]:
    """
    Real YouTube Data API: latest uploads with published date, views, likes, comments.
    """
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return []
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
        req = youtube.playlistItems().list(
            part="contentDetails",
            playlistId=uploads,
            maxResults=min(50, max_videos - len(video_ids)),
            pageToken=page_token or "",
        )
        pl = req.execute()
        for item in pl.get("items", []):
            vid = item["contentDetails"]["videoId"]
            video_ids.append(vid)
        page_token = pl.get("nextPageToken")
        if not page_token:
            break

    if not video_ids:
        return []

    out: list[dict[str, Any]] = []
    for i in range(0, len(video_ids), 50):
        batch = video_ids[i : i + 50]
        resp = (
            youtube.videos()
            .list(part="statistics,snippet,contentDetails", id=",".join(batch))
            .execute()
        )
        for v in resp.get("items", []):
            sn = v["snippet"]
            st = v["statistics"]
            cd = v.get("contentDetails") or {}
            pub = sn["publishedAt"][:10]
            out.append(
                {
                    "date": pub,
                    "views": int(st.get("viewCount", 0)),
                    "likes": int(st.get("likeCount", 0)),
                    "comments": int(st.get("commentCount", 0)),
                    "title": sn.get("title", ""),
                    "video_id": v["id"],
                    "duration_seconds": _iso8601_duration_seconds(
                        cd.get("duration") or ""
                    ),
                    "published_at": sn.get("publishedAt"),
                }
            )
    out.sort(key=lambda x: x["date"])
    return out


def fetch_youtube_metrics(channel_id: str) -> dict:
    """Fetches real views/subscribers using YouTube Data API v3."""
    api_key = os.getenv("YOUTUBE_API_KEY")
    if not api_key:
        return {"error": "Missing YOUTUBE_API_KEY in environment variables. Using Mock."}
    youtube = build('youtube', 'v3', developerKey=api_key)
    
    request = youtube.channels().list(
        part="statistics,snippet",
        id=channel_id
    )
    response = request.execute()
    
    if not response.get('items'):
        return {"error": "Channel not found"}
        
    stats = response['items'][0]['statistics']
    snippet = response['items'][0]['snippet']
    
    return {
        "channel_title": snippet.get('title'),
        "views": int(stats.get('viewCount', 0)),
        "subscribers": int(stats.get('subscriberCount', 0)),
        "video_count": int(stats.get('videoCount', 0)),
        "platform": "youtube"
    }
