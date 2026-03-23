import os
import tempfile
import asyncio
from groq import AsyncGroq
import ffmpeg
import imageio_ffmpeg
from dotenv import load_dotenv

# Ensure environment is loaded
load_dotenv(override=True)

# Get ffmpeg binary path from imageio-ffmpeg
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

async def extract_audio_for_transcription(video_path: str) -> str:
    """
    Extracts highly compressed mono audio from the video suitable for Whisper.
    target: 32k bitrate mp3 (roughly 14.4MB per hour of audio), ensuring it fits within Groq 25MB limit.
    """
    video_dir = os.path.dirname(video_path)
    audio_path = os.path.join(video_dir, "audio.mp3")
    
    if os.path.exists(audio_path):
        return audio_path
        
    def run_ffmpeg():
        (
            ffmpeg
            .input(video_path)
            .output(audio_path, ac=1, ar=16000, audio_bitrate='32k', map='0:a:0') # Mono, 16kHz, 32kbps
            .overwrite_output()
            .run(cmd=FFMPEG_EXE, quiet=True)
        )
    
    await asyncio.to_thread(run_ffmpeg)
    return audio_path

async def transcribe_video(video_path: str) -> dict:
    """
    Transcribes video audio using Groq Whisper.
    """
    client = AsyncGroq(api_key=os.environ.get("GROQ_API_KEY"))
    audio_path = await extract_audio_for_transcription(video_path)
    
    # Retry logic for transient 500 errors
    for attempt in range(3):
        try:
            with open(audio_path, "rb") as file:
                transcription = await client.audio.transcriptions.create(
                    file=(os.path.basename(audio_path), file.read()),
                    model="whisper-large-v3-turbo",
                    response_format="verbose_json",
                )
            return transcription.model_dump() if hasattr(transcription, 'model_dump') else dict(transcription)
        except Exception as e:
            if "500" in str(e) and attempt < 2:
                print(f"Groq 500 error, retrying attempt {attempt + 1}...")
                await asyncio.sleep(2 ** attempt)
                continue
            raise e
    
    return {}
