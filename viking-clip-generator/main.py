import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

from routers import video

app = FastAPI(title="AI Video Clipping Tool")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize uploads directory
os.makedirs("uploads", exist_ok=True)

# Mount routers
app.include_router(video.router, prefix="/api", tags=["Video"])

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Mount uploads to serve the generated clips
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    # Serve the main HTML page
    return FileResponse("static/index.html")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
