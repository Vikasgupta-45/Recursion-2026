def detect_platform(input_string: str) -> str:
    """Detects the target platform based on the user's input string."""
    input_string = input_string.lower()
    if "youtube.com" in input_string or "youtu.be" in input_string:
        return "youtube"
    elif "instagram.com" in input_string or "ig:" in input_string:
        return "instagram"
    elif "twitter.com" in input_string or "x.com" in input_string:
        return "twitter"
    return "unknown"
