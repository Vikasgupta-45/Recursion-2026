from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from services.youtube_service import (
    extract_channel_id,
    get_channel_info,
    get_top_videos,
    find_competitors,
    build_competitor_search_query,
)
from services.analysis_engine import calculate_engagement, generate_suggestions

class AnalysisRequest(BaseModel):
    channel_url: str
    # Competitors are matched by these fields (genre + what you create), NOT by channel name.
    genre: Optional[str] = Field(default=None, description="e.g. Education, Tech, Gaming")
    content_focus: Optional[str] = Field(
        default=None,
        description="What your videos are about (topics, audience, style)",
    )

@app.post("/analyze")
async def analyze_channel(request: AnalysisRequest):
    try:
        channel_id_data = extract_channel_id(request.channel_url)
        if not channel_id_data:
            raise HTTPException(status_code=400, detail="Invalid YouTube URL")
        
        # Get my channel info
        my_info = get_channel_info(channel_id_data)
        if not my_info:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        my_id = my_info["id"]
        snippet = my_info["snippet"]
        stats = my_info["statistics"]
        
        # Get my top videos
        my_videos = get_top_videos(my_id, max_results=3)
        my_engagement = [calculate_engagement(v) for v in my_videos]
        avg_my_engagement = sum(my_engagement) / len(my_engagement) if my_engagement else 0
        avg_my_engagement = round(avg_my_engagement, 2)

        search_q, search_source = build_competitor_search_query(
            request.genre,
            request.content_focus,
            my_info,
        )
        if not search_q:
            search_q = "content creator"
            search_source = "default_fallback"

        competitors = find_competitors(search_q, max_results=10, exclude_channel_id=my_id)
        
        comp_data = []
        if competitors:
            # Batch get competitor channel stats
            comp_ids = [c["id"]["channelId"] for c in competitors if "id" in c and "channelId" in c["id"]]
            from services.youtube_service import youtube
            comp_info_resp = youtube.channels().list(part="snippet,statistics", id=",".join(comp_ids)).execute()
            comp_info_map = {item["id"]: item for item in comp_info_resp.get("items", [])}

            for c_id in comp_ids:
                c_info = comp_info_map.get(c_id)
                if c_info:
                    # Get top videos for each competitor (unfortunately sequential, limit to 2 for speed)
                    c_videos = get_top_videos(c_id, max_results=2)
                    c_engagement = [calculate_engagement(v) for v in c_videos]
                    avg_c_engagement = sum(c_engagement) / len(c_engagement) if c_engagement else 0
                    
                    subs_count = int(c_info["statistics"].get("subscriberCount", 0))
                    
                    comp_data.append({
                        "id": c_id,
                        "title": c_info["snippet"]["title"],
                        "subscribers": str(subs_count),
                        "avg_engagement": round(avg_c_engagement, 2),
                        "thumbnail": c_info["snippet"]["thumbnails"]["default"]["url"],
                        "_score": subs_count * avg_c_engagement
                    })

            # Sort by best parameters (high subscribers and high engagement)
            comp_data.sort(key=lambda x: x["_score"], reverse=True)
            # Return only top 5 best creators
            comp_data = comp_data[:5]
            
            # Clean up internal score
            for comp in comp_data:
                del comp["_score"]

        # Generate suggestions using Grok
        suggestions = generate_suggestions(
            {"title": snippet["title"], "avg_engagement": avg_my_engagement},
            comp_data
        )

        return {
            "status": "success",
            "competitor_search": {
                "query": search_q,
                "source": search_source,
            },
            "my_channel": {
                "title": snippet["title"],
                "subscribers": stats.get("subscriberCount", 0),
                "avg_engagement": avg_my_engagement,
                "thumbnail": snippet["thumbnails"]["default"]["url"]
            },
            "competitors": comp_data,
            "suggestions": suggestions
        }
    except Exception as e:
        print(f"Server Error: {e}")
        import traceback
        traceback.print_exc()
        
        # Fallback to mock data for demonstration if it's a connection/DNS issue
        if "youtube.googleapis.com" in str(e) or "Unable to find the server" in str(e):
            print("Falling back to MOCK DATA due to connection issue.")
            return {
                "status": "success",
                "mocked": True,
                "competitor_search": {"query": request.genre or "tech", "source": "mock_fallback"},
                "my_channel": {
                    "title": "Your Awesome Channel",
                    "subscribers": "1,240",
                    "avg_engagement": 4.5,
                    "thumbnail": "https://via.placeholder.com/150"
                },
                "competitors": [
                    {"id": "c1", "title": "Top Tech Competitor", "subscribers": "500k", "avg_engagement": 8.2, "thumbnail": "https://via.placeholder.com/150"},
                    {"id": "c2", "title": "Daily AI News", "subscribers": "120k", "avg_engagement": 5.4, "thumbnail": "https://via.placeholder.com/150"}
                ],
                "suggestions": [
                    "Mock Suggestion: Your engagement is healthy, but competitors are using more short-form content.",
                    "Mock Suggestion: Focus on AI and Automation trends for late 2026."
                ]
            }
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5050)
