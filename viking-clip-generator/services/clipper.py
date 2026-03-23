import os
import asyncio
import ffmpeg
import imageio_ffmpeg

# Get ffmpeg binary path from imageio-ffmpeg
FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()

async def extract_single_clip(source_video: str, clip: dict, index: int, output_dir: str):
    start = clip['start']
    end = clip['end']
    duration = end - start
    
    clip_filename = f"clip_{index}.mp4"
    clip_path = os.path.join(output_dir, clip_filename)
    
    thumbnail_filename = f"thumb_{index}.jpg"
    thumbnail_path = os.path.join(output_dir, thumbnail_filename)
    
    # Calculate midpoint for thumbnail
    midpoint = start + (duration / 2)
    
    def run_cutting():
        # Fast extraction using -ss before -i and re-encoding for exact cuts
        (
            ffmpeg
            .input(source_video, ss=start, t=duration)
            .output(clip_path, c='copy') # copy stream is faster, but cuts at keyframes. If precision needed: .output(c_v='libx264', c_a='aac')
            .overwrite_output()
            .run(cmd=FFMPEG_EXE, quiet=True)
        )
        
        # Extract thumbnail
        try:
            (
                ffmpeg
                .input(source_video, ss=midpoint)
                .output(thumbnail_path, vframes=1)
                .overwrite_output()
                .run(cmd=FFMPEG_EXE, quiet=True)
            )
        except Exception as e:
            print(f"Failed to extract thumbnail: {e}")
            
    await asyncio.to_thread(run_cutting)
    
    # Re-encode if copy failed or was inaccurate (sometimes happens with MP4)
    if not os.path.exists(clip_path) or os.path.getsize(clip_path) == 0:
        def precise_cut():
            (
                ffmpeg
                .input(source_video, ss=start, t=duration)
                .output(clip_path, vcodec='libx264', acodec='aac')
                .overwrite_output()
                .run(cmd=FFMPEG_EXE, quiet=True)
            )
        await asyncio.to_thread(precise_cut)
    
    # Modify clip dict to include URLs
    job_id_folder = os.path.basename(os.path.dirname(output_dir))
    clip['video_url'] = f"/uploads/{job_id_folder}/clips/{clip_filename}"
    clip['thumbnail_url'] = f"/uploads/{job_id_folder}/clips/{thumbnail_filename}"
    
    return clip

async def extract_clips(source_video: str, top_clips: list, job_id: str) -> list:
    """
    Extracts the finalized clips using ffmpeg.
    Returns the list of processed clips with their static URLs.
    """
    output_dir = f"uploads/{job_id}/clips"
    os.makedirs(output_dir, exist_ok=True)
    
    tasks = []
    for i, clip in enumerate(top_clips, 1):
        tasks.append(extract_single_clip(source_video, clip, i, output_dir))
        
    final_clips = await asyncio.gather(*tasks)
    return final_clips