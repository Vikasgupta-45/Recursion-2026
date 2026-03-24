# Recursion-2026 🚀

A full-stack YouTube Analytics & Creator Growth Platform.

## Project Structure

```
├── frontend3/          # Main React Dashboard (Vite + React + TypeScript)
├── backend/            # Core Analytics Backend (FastAPI + Python)
├── backend1/           # Competitor Analysis Backend (FastAPI + YouTube API)
├── clip-gen/           # AI Video Clipper Service (FastAPI + yt-dlp)
│   └── lumin-ai/       # AI Bot Builder Service (FastAPI + Groq)
└── frontend/           # Standalone Competitor Analysis Frontend (legacy)
```

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend (React) | 8080 | Main dashboard UI |
| Backend (Core) | 8000 | Analytics, ML forecasting, content strategy |
| Backend1 (Competitor) | 5050 | Competitor analysis + growth suggestions |
| Clip Gen | 8001 | AI-powered video clip generator |
| Lumin AI | 8002 | AI chatbot builder for creators |

## Quick Start

### Frontend
```bash
cd frontend3
npm install
npm run dev
```

### Backend (Core)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --port 8000 --reload
```

### Backend1 (Competitor Analysis)
```bash
cd backend1
pip install -r requirements.txt
python -m uvicorn main:app --port 5050 --reload
```

### Clip Gen
```bash
cd clip-gen
pip install -r requirements.txt
python -m uvicorn main:app --port 8001 --reload
```

### Lumin AI
```bash
cd clip-gen/lumin-ai
pip install -r requirements.txt
python -m uvicorn main:app --port 8002 --reload
```

## Environment Variables

Create `.env` files in each backend directory:

**backend/.env:**
```
GROQ_API_KEY=your_groq_api_key
YOUTUBE_API_KEY=your_youtube_api_key
```

**backend1/.env:**
```
YOUTUBE_API_KEY=your_youtube_api_key
GROK_API_KEY=your_groq_api_key
```

**clip-gen/.env & clip-gen/lumin-ai/.env:**
```
GROQ_API_KEY=your_groq_api_key
PORT=8001  # (or 8002 for lumin-ai)
```

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Framer Motion, GSAP, Recharts
- **Backend**: Python, FastAPI, Groq AI, YouTube Data API v3
- **AI Tools**: yt-dlp, Groq Whisper, LLaMA 3.3 70B