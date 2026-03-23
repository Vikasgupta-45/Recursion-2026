def generate_video_ideas(gaps: list) -> list:
    """Takes mathematical NLP gaps and converts them into production ideas."""
    ideas = []
    
    if gaps:
        # Heaviest gap becomes the primary Trend video
        primary_gap = gaps[0].get("topic_opportunity", "Industry Trend")
        ideas.append({
            "format": "Trend video",
            "topic": f"The ultimate guide to {primary_gap}",
            "priority": "High"
        })
        
    if len(gaps) > 1:
        # Second gap becomes a short
        secondary_gap = gaps[1].get("topic_opportunity", "Quick Tip")
        ideas.append({
            "format": "Short video",
            "topic": f"3 secrets about {secondary_gap} you didn't know",
            "priority": "Medium"
        })
        
    # Always recommend a core pillar piece based on channel history
    ideas.append({
        "format": "Long tutorial",
        "topic": "Deep dive into your core channel niche",
        "priority": "Medium"
    })
    
    return ideas
