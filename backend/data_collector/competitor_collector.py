from data_collector.youtube_collector import fetch_youtube_metrics

def analyze_competitors(competitor_yt_ids: list) -> list:
    """Runs a batch collection on an array of competitor channel IDs."""
    results = []
    for cid in competitor_yt_ids:
        data = fetch_youtube_metrics(cid)
        if "error" not in data:
            results.append(data)
    return results
