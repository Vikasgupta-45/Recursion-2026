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
