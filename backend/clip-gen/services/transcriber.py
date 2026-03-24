"""
Viking Clip Generator - Audio Transcriber
Uses Groq's whisper-large-v3-turbo for high-speed transcription.
"""

import os
import asyncio
from groq import Groq
from dotenv import load_dotenv

load_dotenv()


def _transcribe_sync(audio_path: str) -> dict:
    """Synchronous transcription using Groq Whisper."""
    client = Groq(api_key=os.getenv("GROQ_API_KEY"))

    with open(audio_path, "rb") as audio_file:
        transcription = client.audio.transcriptions.create(
            file=(os.path.basename(audio_path), audio_file.read()),
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["segment"],
        )

    segments = []
    if hasattr(transcription, "segments") and transcription.segments:
        for seg in transcription.segments:
            segments.append({
                "start": seg.get("start", seg.start) if hasattr(seg, "start") else seg.get("start", 0),
                "end": seg.get("end", seg.end) if hasattr(seg, "end") else seg.get("end", 0),
                "text": seg.get("text", seg.text) if hasattr(seg, "text") else seg.get("text", ""),
            })

    return {
        "text": transcription.text,
        "segments": segments,
    }


async def transcribe_audio(audio_path: str) -> dict:
    """
    Transcribe audio using Groq Whisper.
    Returns dict with full text and timestamped segments.
    """
    return await asyncio.to_thread(_transcribe_sync, audio_path)
