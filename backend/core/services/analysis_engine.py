import os
import requests
from dotenv import load_dotenv

load_dotenv()

GROK_API_KEY = os.getenv("GROK_API_KEY")

def calculate_engagement(video):
    stats = video.get("statistics", {})
    views = int(stats.get("viewCount", 0))
    likes = int(stats.get("likeCount", 0))
    comments = int(stats.get("commentCount", 0))
    
    if views == 0:
        return 0
    
    # Simple engagement formula: (Likes + Comments) / Views
    engagement = ((likes + comments) / views) * 100
    return round(engagement, 2)

def generate_suggestions(my_info, competitors_data):
    """Use Grok API to generate intelligent suggestions."""
    if not GROK_API_KEY:
        return ["Your engagement is lower than competitors.", "Focus on trending topics."]
    
    comp_list = ", ".join([c["title"] for c in competitors_data])
    prompt = (
        f"Analyze my YouTube channel '{my_info['title']}' vs competitors: {comp_list}. "
        f"My engagement is {my_info['avg_engagement']}%. Provide 3 concise actionable tips "
        "to improve engagement and identify content gaps based on global trends."
    )
    
    try:
        response = requests.post(
            "https://api.x.ai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "grok-beta",
                "messages": [
                    {"role": "system", "content": "You are a YouTube growth expert."},
                    {"role": "user", "content": prompt}
                ]
            }
        )
        data = response.json()
        raw_content = data["choices"][0]["message"]["content"]
        # Basic parsing of the response content into a list
        points = [p.strip() for p in raw_content.split('\n') if p.strip() and (p.strip()[0].isdigit() or p.strip().startswith('-'))]
        return points[:5] if points else [raw_content]
    except Exception as e:
        print(f"Grok API error: {e}")
        return ["AI analysis currently unavailable. Please check back later."]
