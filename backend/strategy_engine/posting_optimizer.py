def optimize_weekly_schedule(best_day: str, video_ideas: list) -> dict:
    """Agent that maps optimal content to the days of the week."""
    schedule = {}
    
    # Identify video weights
    trend_video = next((v for v in video_ideas if v["format"] == "Trend video"), None)
    short_video = next((v for v in video_ideas if v["format"] == "Short video"), None)
    long_video = next((v for v in video_ideas if v["format"] == "Long tutorial"), None)

    # Core logic: heaviest traffic potential drops on empirically Best Day
    if trend_video:
        schedule[best_day] = trend_video
        
    schedule["Monday"] = short_video if short_video else {"format": "Short video", "topic": "Brief update"}
    
    mid_week = "Wednesday" if best_day != "Wednesday" else "Thursday"
    schedule[mid_week] = long_video if long_video else {"format": "Community post", "topic": "Behind the scenes"}
    
    return schedule
