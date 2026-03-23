import os
import uuid
import asyncio
from typing import Optional
from fastapi import APIRouter, File, UploadFile, Form, BackgroundTasks, HTTPException
from pydantic import BaseModel

from services import downloader, transcriber, segmenter, scorer, clipper

router = APIRouter()

# In-memory store for background job statuses
jobs_db = {}

class ProcessRequest(BaseModel):
    youtube_url: Optional[str] = None

async def pipeline_task(job_id: str, youtube_url: Optional[str] = None, file_path: Optional[str] = None):
    try:
        jobs_db[job_id]["status"] = "downloading"
        
        # 1. Download or Prep Source Video
        if youtube_url:
            source_video = await downloader.download_youtube_video(youtube_url, job_id)
        elif file_path:
            source_video = file_path
        else:
            raise Exception("No video source provided")
            
        jobs_db[job_id]["status"] = "transcribing"
        
        # 2. Transcribe Video Audio (Using Groq Whisper)
        transcript_data = await transcriber.transcribe_video(source_video)
        
        jobs_db[job_id]["status"] = "segmenting"
        
        # 3. Segment Transcript into Candidate Clips
        candidates = await segmenter.segment_transcript(transcript_data)
        
        jobs_db[job_id]["status"] = "scoring"
        
        # 4. Score Candidates with LLM (Groq Llama 3)
        scored_clips = await scorer.score_clips(candidates)
        
        # Filter and sort top clips
        eligible_clips = [c for c in scored_clips if c.get('total_score', 0) >= 20]
        top_clips = sorted(eligible_clips, key=lambda x: x.get('total_score', 0), reverse=True)
        top_clips = top_clips[:5]
                           
        if not top_clips and scored_clips:
            # Fallback: just take the top 3 regardless of score if none met threshold
            top_clips = sorted(scored_clips, key=lambda x: x.get('total_score', 0), reverse=True)[:3]

        jobs_db[job_id]["status"] = "clipping"
        
        # 5. Extract Clips and Thumbnails
        final_clips = await clipper.extract_clips(source_video, top_clips, job_id)
        
        jobs_db[job_id]["status"] = "completed"
        jobs_db[job_id]["clips"] = final_clips
        
        # Cleanup could happen here
        
    except Exception as e:
        print(f"Error in pipeline for {job_id}: {e}")
        jobs_db[job_id]["status"] = "failed"
        jobs_db[job_id]["error"] = str(e)


@router.post("/process/youtube")
async def process_youtube(
    background_tasks: BackgroundTasks, 
    request: ProcessRequest
):
    if not request.youtube_url:
        raise HTTPException(status_code=400, detail="YouTube URL is required")
        
    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {"status": "pending", "job_id": job_id}
    
    background_tasks.add_task(pipeline_task, job_id, youtube_url=request.youtube_url)
    return {"job_id": job_id, "status": "pending"}


@router.post("/process/upload")
async def process_upload(
    background_tasks: BackgroundTasks, 
    file: UploadFile = File(...)
):
    job_id = str(uuid.uuid4())
    jobs_db[job_id] = {"status": "pending", "job_id": job_id}
    
    # Save uploaded file
    upload_dir = f"uploads/{job_id}"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = f"{upload_dir}/source_{file.filename}"
    with open(file_path, "wb") as f:
        f.write(await file.read())
        
    background_tasks.add_task(pipeline_task, job_id, file_path=file_path)
    return {"job_id": job_id, "status": "pending"}


@router.get("/status/{job_id}")
async def get_status(job_id: str):
    job = jobs_db.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job
