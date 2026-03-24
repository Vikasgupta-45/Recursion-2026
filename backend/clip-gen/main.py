"""
Viking Clip Generator - FastAPI Server
Main entry point for the application.
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from services.clipper import generate_clips

load_dotenv()

app = FastAPI(title="Viking Clip Generator", version="1.0.0")

# ── In-memory job status store ────────────────────────────────────────
jobs: dict = {}


class GenerateRequest(BaseModel):
    url: str


class JobStatus(BaseModel):
    job_id: str
    stage: str
    message: str
    result: dict | None = None


# ── Ensure directories exist ─────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
STATIC_DIR = os.path.join(BASE_DIR, "static")
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(STATIC_DIR, exist_ok=True)


# ── API Routes ────────────────────────────────────────────────────────
@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    """Start clip generation for a YouTube URL."""
    if not req.url or not req.url.strip():
        raise HTTPException(status_code=400, detail="URL is required")

    # Create a job ID placeholder
    import uuid
    job_id = str(uuid.uuid4())
    jobs[job_id] = {"stage": "queued", "message": "Job queued...", "result": None}

    # Run pipeline in background
    async def run_pipeline():
        async def status_cb(stage: str, message: str):
            jobs[job_id]["stage"] = stage
            jobs[job_id]["message"] = message

        try:
            result = await generate_clips(req.url, status_callback=status_cb)
            jobs[job_id]["stage"] = "done"
            jobs[job_id]["message"] = "All clips generated!"
            jobs[job_id]["result"] = result
        except Exception as e:
            jobs[job_id]["stage"] = "error"
            jobs[job_id]["message"] = str(e)

    asyncio.create_task(run_pipeline())

    return {"job_id": job_id, "status": "started"}


@app.get("/api/status/{job_id}")
async def api_status(job_id: str):
    """Get current status of a generation job."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]


# ── Serve index.html at root ─────────────────────────────────────────
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


# ── Mount static files & uploads ─────────────────────────────────────
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ── Run Server ────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n⚡ Viking Clip Generator running at http://localhost:{port}\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
