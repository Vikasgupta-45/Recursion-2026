import os
import re
from typing import Optional, Tuple
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

def extract_channel_id(url: str):
    """Simple regex to extract channel ID or handle from URL."""
    handle_match = re.search(r"@([\w.-]+)", url)
    if handle_match:
        return f"handle:{handle_match.group(1)}"
    
    id_match = re.search(r"channel/([\w-]+)", url)
    if id_match:
        return id_match.group(1)
    
    return None

def get_channel_info(channel_id: str):
    try:
        if channel_id.startswith("handle:"):
            handle = channel_id.replace("handle:", "")
            request = youtube.search().list(
                part="snippet",
                q=handle,
                type="channel",
                maxResults=1
            )
            response = request.execute()
            if not response.get("items"):
                return None
            channel_id = response["items"][0]["id"]["channelId"]

        request = youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            id=channel_id
        )
        response = request.execute()
        if not response.get("items"):
            return None
        return response["items"][0]
    except HttpError as e:
        print(f"Error fetching channel info: {e}")
        return None

def get_top_videos(channel_id: str, max_results=5):
    try:
        request = youtube.search().list(
            part="snippet",
            channelId=channel_id,
            order="viewCount",
            type="video",
            maxResults=max_results
        )
        response = request.execute()
        video_ids = [item["id"]["videoId"] for item in response["items"]]
        
        # Get video statistics
        video_request = youtube.videos().list(
            part="statistics,snippet",
            id=",".join(video_ids)
        )
        video_response = video_request.execute()
        return video_response["items"]
    except HttpError as e:
        print(f"Error fetching top videos: {e}")
        return []

def _channel_keywords_snippet(channel_item: dict) -> str:
    """Fallback text from channel metadata (not the title) — branding keywords + description."""
    parts = []
    branding = channel_item.get("brandingSettings", {}) or {}
    ch = branding.get("channel", {}) or {}
    kw = ch.get("keywords") or ""
    if kw and isinstance(kw, str):
        # YouTube stores keywords as space-separated; take first chunk only as weak fallback
        parts.append(kw.strip()[:200])
    desc = (channel_item.get("snippet") or {}).get("description") or ""
    if desc:
        # First line / sentence, strip URLs
        line = desc.split("\n")[0].strip()
        line = re.sub(r"https?://\S+", "", line).strip()[:180]
        if line:
            parts.append(line)
    return " ".join(p for p in parts if p).strip()


def build_competitor_search_query(
    genre: Optional[str],
    content_focus: Optional[str],
    channel_item: Optional[dict] = None,
) -> Tuple[str, str]:
    """
    Build YouTube channel search query from user intent (genre + content), not channel name.
    Returns (query_string, source) where source is 'user' or 'metadata_fallback'.
    """
    g = (genre or "").strip()
    c = (content_focus or "").strip()
    if g or c:
        q = " ".join(x for x in (g, c) if x)
        # YouTube search q works best under ~100 chars for channel discovery
        q = re.sub(r"\s+", " ", q)[:120].strip()
        return q, "user"

    if channel_item:
        fb = _channel_keywords_snippet(channel_item)
        if fb:
            return re.sub(r"\s+", " ", fb)[:120].strip(), "metadata_fallback"

    return "", "none"


def find_competitors(
    search_query: str,
    max_results: int = 8,
    exclude_channel_id: Optional[str] = None,
):
    """
    Search for channels by topic query. Excludes the analyzed channel from results.
    """
    if not search_query:
        return []

    try:
        request = youtube.search().list(
            part="snippet",
            q=search_query,
            type="channel",
            maxResults=max_results + 2,
        )
        response = request.execute()
        items = response.get("items") or []
        out = []
        seen = set()
        for item in items:
            cid = item.get("id", {}).get("channelId")
            if not cid or cid in seen:
                continue
            if exclude_channel_id and cid == exclude_channel_id:
                continue
            seen.add(cid)
            out.append(item)
            if len(out) >= max_results:
                break
        return out
    except HttpError as e:
        print(f"Error finding competitors: {e}")
        return []
