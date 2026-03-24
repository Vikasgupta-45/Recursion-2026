def parse_frontend_payload(raw_json: dict) -> dict:
    """Standardizes disparate inputs into a clean format."""
    return {
        "youtube": raw_json.get("youtube_url", "").strip(),
        "instagram": raw_json.get("instagram_handle", "").replace("@", ""),
        "twitter": raw_json.get("twitter_handle", "").replace("@", "")
    }
