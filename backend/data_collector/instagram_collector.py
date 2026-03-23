import requests
import os

def fetch_instagram_metrics(handle: str):
    """
    Fetches real Instagram Graph API data.
    Requires IG Business Account and Developer API keys.
    """
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN")
    ig_account_id = os.getenv("IG_BUSINESS_ACCOUNT_ID")
    
    if not token or not ig_account_id:
        return {"error": "Missing IG credentials"}
        
    url = f"https://graph.facebook.com/v19.0/{ig_account_id}?fields=business_discovery.username({handle}){{followers_count,media_count}}&access_token={token}"
    
    response = requests.get(url)
    if response.status_code != 200:
        return {"error": "Graph API Request Failed"}
        
    data = response.json()
    biz_discovery = data.get('business_discovery', {})
    
    return {
        "platform": "instagram",
        "handle": handle,
        "followers": biz_discovery.get('followers_count', 0),
        "posts": biz_discovery.get('media_count', 0)
    }
