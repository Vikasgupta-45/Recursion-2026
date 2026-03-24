"""
Viking Clip Generator - YouTube Video Downloader
Uses yt-dlp to download YouTube videos as .mp4 files.
"""

import os
import uuid
import time
import asyncio
import yt_dlp
import imageio_ffmpeg

UPLOADS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")


def _download_sync(url: str, job_id: str) -> dict:
    """Synchronous download function to run in a thread."""
    job_dir = os.path.join(UPLOADS_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    output_path = os.path.join(job_dir, "source.mp4")
    ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()

    ydl_opts = {
        # Prefer a single pre-merged mp4 to avoid Windows file-lock issues during merge.
        # Falls back to best available format if no single mp4 is available.
        "format": "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best",
        "outtmpl": output_path,
        "merge_output_format": "mp4",
        "ffmpeg_location": ffmpeg_path,
        "quiet": True,
        "no_warnings": True,
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        title = info.get("title", "Unknown Video")

    # Handle Windows file-lock: if yt-dlp left a .temp file, retry rename
    temp_path = output_path + ".temp.mp4"
    if not os.path.exists(output_path) and os.path.exists(temp_path):
        for attempt in range(5):
            try:
                time.sleep(1)
                os.rename(temp_path, output_path)
                break
            except PermissionError:
                if attempt == 4:
                    raise

    # Also check for other temp patterns yt-dlp might use
    if not os.path.exists(output_path):
        for f in os.listdir(job_dir):
            if f.endswith(".mp4") and f != "source.mp4":
                os.rename(os.path.join(job_dir, f), output_path)
                break

    return {
        "video_path": output_path,
        "title": title,
        "job_id": job_id,
        "job_dir": job_dir,
    }


async def download_video(url: str) -> dict:
    """
    Download a YouTube video as .mp4.
    Returns dict with video_path, title, job_id, job_dir.
    """
    job_id = str(uuid.uuid4())
    result = await asyncio.to_thread(_download_sync, url, job_id)
    return result
