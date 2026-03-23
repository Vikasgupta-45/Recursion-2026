import os
from googleapiclient.discovery import build
from dotenv import load_dotenv

load_dotenv()

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
