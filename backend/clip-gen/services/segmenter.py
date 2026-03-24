"""
Viking Clip Generator - FFmpeg Segmenter
Handles audio extraction and video clip cutting using FFmpeg.
Uses subprocess.run via asyncio.to_thread for Windows compatibility.
"""

import os
import asyncio
import subprocess
import imageio_ffmpeg


def _get_ffmpeg_path() -> str:
    """Get the FFmpeg binary path from imageio-ffmpeg."""
    return imageio_ffmpeg.get_ffmpeg_exe()


def _extract_audio_sync(video_path: str, output_path: str) -> str:
    """Extract audio from video as WAV (sync)."""
    ffmpeg = _get_ffmpeg_path()
    cmd = [
        ffmpeg, "-i", video_path,
        "-vn",                      # no video
        "-acodec", "pcm_s16le",     # WAV format
        "-ar", "16000",             # 16kHz sample rate (optimal for Whisper)
        "-ac", "1",                 # mono
        "-y",                       # overwrite
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return output_path


def _cut_clip_sync(video_path: str, start: float, end: float, output_path: str) -> str:
    """Cut a clip from the video at given timestamps (sync)."""
    ffmpeg = _get_ffmpeg_path()
    duration = end - start
    cmd = [
        ffmpeg,
        "-ss", str(start),
        "-i", video_path,
        "-t", str(duration),
        "-c:v", "libx264",
        "-c:a", "aac",
        "-avoid_negative_ts", "make_zero",
        "-y",
        output_path,
    ]
    subprocess.run(cmd, capture_output=True, check=True)
    return output_path


async def extract_audio(video_path: str, output_path: str) -> str:
    """
    Extract audio from video file as WAV.
    Returns the output audio file path.
    """
    return await asyncio.to_thread(_extract_audio_sync, video_path, output_path)


async def cut_clip(video_path: str, start: float, end: float, output_path: str) -> str:
    """
    Cut a clip from the source video.
    Returns the output clip file path.
    """
    return await asyncio.to_thread(_cut_clip_sync, video_path, start, end, output_path)
