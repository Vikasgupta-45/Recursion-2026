"""
Viking Clip Generator - Viral Segment Scorer
Uses Groq's LLaMA model to identify viral-worthy segments from transcripts.
"""

import os
import json
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

SYSTEM_PROMPT = """You are a viral content expert and video editor. Your job is to analyze a video transcript and identify the 3 to 5 most viral-worthy segments.

Each segment MUST be between 30 and 60 seconds long.

For each segment, return:
- "start": start time in seconds (float)
- "end": end time in seconds (float)  
- "title": a catchy, clickbait-style title for the clip (string)
- "hook": a one-sentence hook describing why this segment is engaging (string)
- "score": virality score from 1-10 (integer)

Focus on segments that have:
- Emotional peaks (surprise, humor, anger, inspiration)
- Controversial or bold statements
- Storytelling moments with tension
- Quotable one-liners or punchlines
- Educational "aha!" moments

Return ONLY a valid JSON array of objects. No markdown, no explanation, no code fences. Just the raw JSON array."""


def _score_sync(transcript_text: str, segments: list) -> list:
    """Synchronous scoring using Groq LLaMA."""
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    # Build a timestamped transcript for the LLM
    timestamped = ""
    for seg in segments:
        start = seg.get("start", 0)
        end = seg.get("end", 0)
        text = seg.get("text", "")
        timestamped += f"[{start:.1f}s - {end:.1f}s] {text}\n"

    user_prompt = f"""Here is the timestamped transcript of a video:

{timestamped}

Identify the 3 to 5 most viral-worthy segments (each 30-60 seconds long). Return ONLY a JSON array."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.7,
        max_tokens=2000,
    )

    raw = response.choices[0].message.content.strip()

    # Clean potential markdown code fences
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw[:-3]
        raw = raw.strip()

    try:
        scored_segments = json.loads(raw)
    except json.JSONDecodeError:
        # Fallback: try to extract JSON array from the response
        start_idx = raw.find("[")
        end_idx = raw.rfind("]") + 1
        if start_idx != -1 and end_idx > start_idx:
            scored_segments = json.loads(raw[start_idx:end_idx])
        else:
            raise ValueError(f"Could not parse LLM response as JSON: {raw[:200]}")

    return scored_segments


async def score_segments(transcript_text: str, segments: list) -> list:
    """
    Score transcript segments for virality using Groq LLaMA.
    Returns list of viral segment dicts with start, end, title, hook, score.
    """
    return await asyncio.to_thread(_score_sync, transcript_text, segments)
