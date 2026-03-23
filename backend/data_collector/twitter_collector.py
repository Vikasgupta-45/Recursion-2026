import os
import requests

def fetch_twitter_metrics(handle: str):
    """Fetches real metrics using Twitter APIs (X API v2)."""
    bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
    if not bearer_token:
        return {"error": "Missing Twitter credentials"}
        
    headers = {"Authorization": f"Bearer {bearer_token}"}
    url = f"https://api.twitter.com/2/users/by/username/{handle}?user.fields=public_metrics"
    
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return {"error": "Twitter API Request Failed"}
        
    metrics = response.json().get('data', {}).get('public_metrics', {})
    
    return {
        "platform": "twitter",
        "handle": handle,
        "followers": metrics.get('followers_count', 0),
        "following": metrics.get('following_count', 0),
        "tweet_count": metrics.get('tweet_count', 0)
    }
