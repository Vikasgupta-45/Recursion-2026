from datetime import datetime, timezone

import yt_dlp

def fetch_channel_content_ytdlp(channel_url: str, max_videos: int = 5) -> dict:
    """
    Fetches rich video metadata for the latest videos from a channel using yt-dlp.
    Completely bypasses any API rate limits or Developer Keys!
    """
    # Attempt to format URL robustly if a pure handle is entered
    if not channel_url.startswith("http"):
        if channel_url.startswith("@") or channel_url.startswith("UC"):
             channel_url = f"https://www.youtube.com/{channel_url}"
        else:
             channel_url = f"https://www.youtube.com/@{channel_url}"

    ydl_opts = {
        'quiet': True,
        'extract_flat': True, # Gets flat metadata incredibly fast without downloading videos
        'playlistend': max_videos # Only fetch the first N videos
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)
            
            if 'entries' not in info:
                videos = [info]
            else:
                videos = list(info['entries'])
                
            collected_content = []
            for video in videos:
                if not video: continue
                collected_content.append({
                    "title": video.get('title'),
                    "video_url": video.get('url'),
                    "views": video.get('view_count', 0),
                    "duration_seconds": video.get('duration', 0)
                })
                
            return {
                "channel_name": info.get('title', 'Unknown'),
                "channel_description": info.get('description', ''),
                "latest_videos_metadata": collected_content
            }
    except Exception as e:
        return {"error": f"yt-dlp failed: {str(e)}"}


def fetch_channel_videos_detailed(channel_url: str, max_videos: int = 50) -> list[dict]:
    """
    Non-flat extraction: real upload dates, views, duration per video (no API key).
    Slower than fetch_channel_content_ytdlp but needed for time-series when API is unavailable.
    """
    if not channel_url.startswith("http"):
        if channel_url.startswith("@") or channel_url.startswith("UC"):
            channel_url = f"https://www.youtube.com/{channel_url}"
        else:
            channel_url = f"https://www.youtube.com/@{channel_url}"

    ydl_opts = {
        "quiet": True,
        "extract_flat": False,
        "playlistend": max_videos,
        "ignoreerrors": True,
        "skip_download": True,
    }
    out: list[dict] = []
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(channel_url, download=False)
            entries = info.get("entries") or [info]
            for video in entries:
                if not video or not isinstance(video, dict):
                    continue
                ts = video.get("timestamp") or video.get("release_timestamp")
                upload_date = video.get("upload_date")
                if upload_date and len(str(upload_date)) == 8:
                    ds = f"{upload_date[:4]}-{upload_date[4:6]}-{upload_date[6:8]}"
                elif ts:
                    ds = datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
                else:
                    continue
                out.append(
                    {
                        "date": ds,
                        "views": int(video.get("view_count") or 0),
                        "likes": int(video.get("like_count") or 0),
                        "comments": int(video.get("comment_count") or 0),
                        "title": video.get("title") or "",
                        "video_id": video.get("id") or video.get("url"),
                    }
                )
        out.sort(key=lambda x: x["date"])
        return out
    except Exception:
        return []
