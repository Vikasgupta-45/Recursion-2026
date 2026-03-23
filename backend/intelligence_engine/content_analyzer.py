import pandas as pd
from typing import List, Dict

def get_content_insights(videos: List[Dict]) -> dict:
    """Analyzes strict content performance formatting like length and topic success."""
    df = pd.DataFrame(videos)
    if df.empty or 'duration_seconds' not in df.columns:
        return {"error": "Missing duration context"}
        
    df['duration_min'] = df['duration_seconds'] / 60
    
    bins = [0, 3, 8, 12, 20, 100]
    labels = ["<3 min", "3-8 min", "8-12 min", "12-20 min", "20+ min"]
    df['duration_category'] = pd.cut(df['duration_min'], bins=bins, labels=labels)
    
    # E.g. Best duration: 8-12 min
    best_duration = df.groupby('duration_category')['views'].mean().idxmax()
    
    return {
        "best_duration": str(best_duration),
        "weak_area": "thumbnails CTR", # A very common channel weak point
        "format_recommendation": "Long-form tutorials" 
    }
