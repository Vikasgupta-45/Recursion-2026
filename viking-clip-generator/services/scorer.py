import os
import json
import asyncio
from groq import AsyncGroq
from dotenv import load_dotenv

# Ensure environment is loaded
load_dotenv(override=True)

async def score_single_clip(clip: dict):
    # Initialize client locally to ensure env is ready
    client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
    
    prompt = f"""
    You are an expert social media manager evaluating video clips for virality on platforms like TikTok, YouTube Shorts, and Instagram Reels.
    
    Evaluate the following transcript snippet from a video. The duration is approximately {clip['end'] - clip['start']:.1f} seconds.
    
    Transcript:
    "{clip['text']}"
    
    Analyze the clip and provide a JSON response EXACTLY matching this schema, with no markdown formatting or extra text:
    {{
        "virality_score": [1-10 integer, how likely this is to go viral],
        "hook_score": [1-10 integer, how strong the first 3 seconds grab attention],
        "engagement_score": [1-10 integer, how likely people will comment or share],
        "title": "[A short, extremely catchy title for the clip]",
        "reasoning": "[1-2 sentence explanation of your scores]"
    }}
    """
    
    # Retry logic for transient 500 errors
    for attempt in range(3):
        try:
            completion = await client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
                max_tokens=256,
                response_format={"type": "json_object"}
            )
            
            result_text = completion.choices[0].message.content
            scored_data = json.loads(result_text)
            
            # Calculate a total score
            total = scored_data.get('virality_score', 0) + scored_data.get('hook_score', 0) + scored_data.get('engagement_score', 0)
            
            return {
                **clip,
                "scores": scored_data,
                "total_score": total,
                "title": scored_data.get("title", "Generated Clip")
            }
        except Exception as e:
            if "500" in str(e) and attempt < 2:
                print(f"Groq 500 error during scoring, retrying attempt {attempt + 1}...")
                await asyncio.sleep(2 ** attempt)
                continue
            
            print(f"Error scoring clip: {e}")
            return {
                **clip,
                "scores": {},
                "total_score": 0,
                "title": f"Clip {clip['start']:.1f}s - {clip['end']:.1f}s"
            }
    
    return {}

async def score_clips(candidates: list) -> list:
    """
    Takes a list of candidate clips and scores them concurrently using the LLM.
    """
    tasks = [score_single_clip(clip) for clip in candidates]
    scored_clips = await asyncio.gather(*tasks)
    return scored_clips
