import os
import yt_dlp
import asyncio
import imageio_ffmpeg
import time

# Get ffmpeg binary path from imageio-ffmpeg
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

async def download_youtube_video(url: str, job_id: str) -> str:
    """
    Downloads a YouTube video to a local file using yt-dlp.
    Returns the path to the downloaded video.
    """
    output_dir = f"uploads/{job_id}"
    os.makedirs(output_dir, exist_ok=True)
    
    # Use a specific template that yt-dlp respects
    output_template = f"{output_dir}/source.%(ext)s"
    
    ydl_opts = {
        'format': 'best[ext=mp4]/best',
        'outtmpl': output_template,
        'merge_output_format': 'mp4',
        'quiet': False,
        'no_warnings': True,
        'ffmpeg_location': FFMPEG_EXE,
        'nocheckcertificate': True,
        'nopart': True, # Download directly to output
        'socket_timeout': 30,
        'retries': 10,
        'fragment_retries': 10,
        'windowsfilenames': True,
        'extractor_args': {
            'youtube': {
                'player_client': ['android_vr', 'web_embedded'],
            }
        },
        'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'cookiefile': 'yt-cookies.txt',

    }
    
    def extract():
        # Retry logic for Windows file locks
        for attempt in range(3):
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    info = ydl.extract_info(url, download=True)
                    filename = ydl.prepare_filename(info)
                    # Small sleep to let Windows release file handles
                    time.sleep(2)
                    return filename
            except Exception as e:
                if "WinError 32" in str(e) and attempt < 2:
                    print(f"Windows file lock error, retrying download attempt {attempt + 1}...")
                    time.sleep(3)
                    continue
                raise e

    video_path = await asyncio.to_thread(extract)
    
    # Priority check for source.mp4 (final merged result)
    mp4_path = os.path.join(output_dir, "source.mp4")
    if os.path.exists(mp4_path):
        return mp4_path
        
    if os.path.exists(video_path):
        return video_path
            
    # Fallback scan
    for file in os.listdir(output_dir):
        if file.startswith("source."):
            return os.path.join(output_dir, file)
            
    raise Exception("Download failed: No output file found")
