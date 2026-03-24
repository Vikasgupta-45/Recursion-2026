"""
Viking Clip Generator - Pipeline Orchestrator
Coordinates the full clip generation flow:
Download -> Extract Audio -> Transcribe -> Score -> Cut Clips
"""

import os
from services.downloader import download_video
from services.segmenter import extract_audio, cut_clip
from services.transcriber import transcribe_audio
from services.scorer import score_segments


async def generate_clips(url: str, status_callback=None) -> dict:
    """
    Full pipeline: download, transcribe, score, and cut viral clips.
    
    Args:
        url: YouTube video URL
        status_callback: async callable(stage: str, message: str) for progress updates
    
    Returns:
        dict with job_id, title, and list of clip objects
    """
    async def update_status(stage: str, message: str):
        if status_callback:
            await status_callback(stage, message)

    # ── Step 1: Download ──────────────────────────────────────────────
    await update_status("downloading", "Downloading video from YouTube...")
    download_result = await download_video(url)
    video_path = download_result["video_path"]
    job_id = download_result["job_id"]
    job_dir = download_result["job_dir"]
    title = download_result["title"]

    # ── Step 2: Extract Audio ─────────────────────────────────────────
    await update_status("extracting", "Extracting audio track...")
    audio_path = os.path.join(job_dir, "audio.wav")
    await extract_audio(video_path, audio_path)

    # ── Step 3: Transcribe ────────────────────────────────────────────
    await update_status("transcribing", "Transcribing audio with Groq Whisper...")
    transcript = await transcribe_audio(audio_path)

    # ── Step 4: Score Segments ────────────────────────────────────────
    await update_status("scoring", "AI is finding viral moments...")
    viral_segments = await score_segments(transcript["text"], transcript["segments"])

    # ── Step 5: Cut Clips ─────────────────────────────────────────────
    await update_status("clipping", "Cutting viral clips...")
    clips = []
    for i, segment in enumerate(viral_segments):
        clip_filename = f"clip_{i + 1}.mp4"
        clip_path = os.path.join(job_dir, clip_filename)
        await cut_clip(video_path, segment["start"], segment["end"], clip_path)

        clips.append({
            "index": i + 1,
            "title": segment.get("title", f"Clip {i + 1}"),
            "hook": segment.get("hook", ""),
            "score": segment.get("score", 0),
            "start": segment["start"],
            "end": segment["end"],
            "filename": clip_filename,
            "url": f"/uploads/{job_id}/{clip_filename}",
        })

    await update_status("done", "All clips generated successfully!")

    return {
        "job_id": job_id,
        "title": title,
        "clips": clips,
    }
