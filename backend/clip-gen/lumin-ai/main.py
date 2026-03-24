"""
Lumin AI - Visual Chatbot Builder
FastAPI backend for drag-and-drop chatbot creation with Groq-powered AI.
"""

import os
import sys
import json
import uuid
import asyncio
import tempfile
import subprocess
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

app = FastAPI(title="Lumin AI - Chatbot Builder", version="2.0.0")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(STATIC_DIR, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOADS_DIR, exist_ok=True)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ── In-memory stores ─────────────────────────────────────────────────
chatbots: dict = {}
sessions: dict = {}
knowledge_cache: dict = {}  # cache fetched youtube/web data


# ── Models ────────────────────────────────────────────────────────────
class BotConfig(BaseModel):
    id: str | None = None
    name: str = "My Chatbot"
    description: str = ""
    nodes: list[dict] = []
    edges: list[dict] = []
    settings: dict = {}

class ChatMessage(BaseModel):
    bot_id: str
    session_id: str | None = None
    message: str = ""


# ── Bot CRUD ──────────────────────────────────────────────────────────
@app.post("/api/bots")
async def create_bot(config: BotConfig):
    bot_id = str(uuid.uuid4())[:8]
    config.id = bot_id
    chatbots[bot_id] = config.model_dump()
    save_bots()
    return chatbots[bot_id]

@app.get("/api/bots")
async def list_bots():
    return list(chatbots.values())

@app.get("/api/bots/{bot_id}")
async def get_bot(bot_id: str):
    if bot_id not in chatbots:
        raise HTTPException(404, "Bot not found")
    return chatbots[bot_id]

@app.put("/api/bots/{bot_id}")
async def update_bot(bot_id: str, config: BotConfig):
    if bot_id not in chatbots:
        raise HTTPException(404, "Bot not found")
    config.id = bot_id
    chatbots[bot_id] = config.model_dump()
    save_bots()
    return chatbots[bot_id]

@app.delete("/api/bots/{bot_id}")
async def delete_bot(bot_id: str):
    if bot_id in chatbots:
        del chatbots[bot_id]
        save_bots()
    return {"status": "deleted"}


# ── YouTube Data Fetcher ──────────────────────────────────────────────
async def fetch_youtube_data(url: str) -> str:
    """Fetch real metadata and transcript from a YouTube video using yt-dlp + Groq Whisper."""
    cache_key = url.strip()
    if cache_key in knowledge_cache:
        return knowledge_cache[cache_key]

    result_parts = []

    # 1. Fetch metadata with yt-dlp
    print(f"DEBUG: Fetching YT metadata for {url}...")
    try:
        import imageio_ffmpeg
        ffmpeg_path = imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        ffmpeg_path = "ffmpeg"

    try:
        meta_cmd = [
            sys.executable, "-m", "yt_dlp", "--dump-json", "--no-download",
            "--ffmpeg-location", ffmpeg_path,
            url,
        ]
        proc = await asyncio.to_thread(
            subprocess.run, meta_cmd, capture_output=True, text=True, timeout=30
        )
        if proc.returncode == 0 and proc.stdout:
            meta = json.loads(proc.stdout)
            print(f"DEBUG: Got metadata for {meta.get('title')}")
            result_parts.append(f"""VIDEO METADATA:
Title: {meta.get('title', 'Unknown')}
Channel: {meta.get('uploader', 'Unknown')}
Views: {meta.get('view_count', 'N/A'):,}
Likes: {meta.get('like_count', 'N/A')}
Duration: {meta.get('duration_string', 'N/A')}
Upload Date: {meta.get('upload_date', 'N/A')}
Description: {(meta.get('description', '') or '')[:500]}
Tags: {', '.join((meta.get('tags', []) or [])[:15])}
Categories: {', '.join(meta.get('categories', []) or [])}""")
    except Exception as e:
        result_parts.append(f"[Could not fetch video metadata: {e}]")

    # 2. Download audio and transcribe with Groq Whisper
    print("DEBUG: Downloading audio for transcription...")
    try:
        audio_dir = os.path.join(UPLOADS_DIR, f"yt_{uuid.uuid4().hex[:8]}")
        os.makedirs(audio_dir, exist_ok=True)
        audio_path = os.path.join(audio_dir, "audio.mp3")

        dl_cmd = [
            sys.executable, "-m", "yt_dlp",
            "--ffmpeg-location", ffmpeg_path,
            "-x", "--audio-format", "mp3",
            "--audio-quality", "9",  # lowest quality = smallest file
            "--max-filesize", "24M",  # Groq Whisper limit is 25MB
            "-o", audio_path,
            url,
        ]
        proc = await asyncio.to_thread(
            subprocess.run, dl_cmd, capture_output=True, text=True, timeout=120
        )

        if os.path.exists(audio_path) and GROQ_API_KEY:
            print("DEBUG: Transcribing audio with Groq...")
            client = Groq(api_key=GROQ_API_KEY)
            with open(audio_path, "rb") as f:
                transcription = await asyncio.to_thread(
                    lambda: client.audio.transcriptions.create(
                        file=("audio.mp3", f.read()),
                        model="whisper-large-v3",
                        response_format="text",
                    )
                )
            transcript_text = transcription if isinstance(transcription, str) else str(transcription)
            print(f"DEBUG: Transcription complete ({len(transcript_text)} chars)")
            result_parts.append(f"\nVIDEO TRANSCRIPT:\n{transcript_text[:3000]}")

        # Cleanup
        import shutil
        shutil.rmtree(audio_dir, ignore_errors=True)

    except Exception as e:
        result_parts.append(f"[Could not transcribe audio: {e}]")

    full_result = "\n".join(result_parts)
    knowledge_cache[cache_key] = full_result
    return full_result


# ── Chat Preview / Execution ─────────────────────────────────────────
@app.post("/api/chat")
async def chat_with_bot(req: ChatMessage):
    """Execute a chatbot flow step by step."""
    if req.bot_id not in chatbots:
        raise HTTPException(404, "Bot not found")

    bot = chatbots[req.bot_id]
    nodes_map = {n["id"]: n for n in bot["nodes"]}
    edges = bot["edges"]

    # Get or create session
    session_id = req.session_id or str(uuid.uuid4())[:8]
    if session_id not in sessions:
        start_node = next((n for n in bot["nodes"] if n["type"] == "start"), None)
        if not start_node:
            raise HTTPException(400, "Bot has no start node")
        sessions[session_id] = {
            "id": session_id,
            "bot_id": req.bot_id,
            "current_node": start_node["id"],
            "history": [],
            "waiting_for_input": False,
            "ended": False,
        }

    # Gather knowledge from all knowledge nodes (including fetched YT data)
    knowledge_context = ""
    for n in bot["nodes"]:
        if n["type"] == "knowledge":
            label = n["data"].get("label", "Knowledge")
            content = n["data"].get("content", "")
            yt_url = n["data"].get("youtube_url", "")
            web_url = n["data"].get("website_url", "")

            if content:
                knowledge_context += f"\n\n--- {label} ---\n{content}"
            if yt_url:
                # Fetch real YouTube data
                try:
                    yt_data = await fetch_youtube_data(yt_url)
                    knowledge_context += f"\n\n--- {label} (YouTube Video) ---\n{yt_data}"
                except Exception as e:
                    knowledge_context += f"\n\n--- {label} (YouTube) ---\nURL: {yt_url}\n[Error fetching: {e}]"
            if web_url:
                knowledge_context += f"\n\n--- {label} (Website) ---\nURL: {web_url}"

    session = sessions[session_id]

    # If the conversation already ended, find the last user_input node and restart from there
    if session.get("ended") and req.message:
        session["ended"] = False
        # Find any user_input node to loop back to
        user_input_nodes = [n for n in bot["nodes"] if n["type"] == "user_input"]
        if user_input_nodes:
            session["current_node"] = user_input_nodes[0]["id"]
            session["waiting_for_input"] = True

    # If waiting for user input, record it and advance
    if session["waiting_for_input"] and req.message:
        session["history"].append({"role": "user", "content": req.message})
        session["waiting_for_input"] = False
        # Move to next node
        next_edges = [e for e in edges if e["source"] == session["current_node"]]
        if next_edges:
            current = nodes_map.get(session["current_node"])
            if current and current["type"] == "condition":
                matched = False
                for edge in next_edges:
                    if edge.get("label", "").lower() in req.message.lower():
                        session["current_node"] = edge["target"]
                        matched = True
                        break
                if not matched:
                    session["current_node"] = next_edges[-1]["target"]
            else:
                session["current_node"] = next_edges[0]["target"]

    # Process nodes until we need user input or reach end
    responses = []
    max_steps = 20

    for _ in range(max_steps):
        current_id = session["current_node"]
        node = nodes_map.get(current_id)
        if not node:
            break

        if node["type"] == "start":
            next_edges = [e for e in edges if e["source"] == current_id]
            if next_edges:
                session["current_node"] = next_edges[0]["target"]
            else:
                break
            continue

        elif node["type"] == "message":
            text = node["data"].get("text", "Hello!")
            responses.append({"type": "bot", "content": text})
            session["history"].append({"role": "assistant", "content": text})
            next_edges = [e for e in edges if e["source"] == current_id]
            if next_edges:
                session["current_node"] = next_edges[0]["target"]
            else:
                break
            continue

        elif node["type"] == "knowledge":
            # Passthrough — data is already gathered above
            next_edges = [e for e in edges if e["source"] == current_id]
            if next_edges:
                session["current_node"] = next_edges[0]["target"]
            else:
                break
            continue

        elif node["type"] == "ai_response":
            prompt = node["data"].get("prompt", "You are a helpful assistant.")
            if knowledge_context:
                prompt += f"\n\nUse the following knowledge base to answer. Only use this data when relevant:\n{knowledge_context}"
            ai_text = await get_ai_response(prompt, session["history"])
            responses.append({"type": "bot", "content": ai_text, "ai": True})
            session["history"].append({"role": "assistant", "content": ai_text})
            next_edges = [e for e in edges if e["source"] == current_id]
            if next_edges:
                session["current_node"] = next_edges[0]["target"]
            else:
                # No outgoing edge — become conversational (loop back to waiting)
                session["waiting_for_input"] = True
                responses.append({"type": "input", "placeholder": "Ask a follow-up question..."})
                break
            continue

        elif node["type"] == "user_input":
            placeholder = node["data"].get("placeholder", "Type your message...")
            responses.append({"type": "input", "placeholder": placeholder})
            session["waiting_for_input"] = True
            break

        elif node["type"] == "condition":
            options = node["data"].get("options", [])
            text = node["data"].get("text", "Choose an option:")
            responses.append({"type": "options", "content": text, "options": options})
            session["waiting_for_input"] = True
            break

        elif node["type"] == "end":
            text = node["data"].get("text", "Thanks for chatting! 👋")
            responses.append({"type": "bot", "content": text})
            responses.append({"type": "end"})
            session["ended"] = True
            break

        else:
            break

    return {
        "session_id": session_id,
        "responses": responses,
    }


@app.post("/api/chat/reset")
async def reset_chat(req: ChatMessage):
    if req.session_id and req.session_id in sessions:
        del sessions[req.session_id]
    return {"status": "reset"}


# ── AI Helper ─────────────────────────────────────────────────────────
async def get_ai_response(system_prompt: str, history: list) -> str:
    if not GROQ_API_KEY:
        return "⚠️ AI not configured. Please set GROQ_API_KEY."

    client = Groq(api_key=GROQ_API_KEY)
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(history[-10:])

    def call():
        return client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=800,
        )

    try:
        response = await asyncio.to_thread(call)
        return response.choices[0].message.content
    except Exception as e:
        return f"⚠️ AI Error: {str(e)}"


# ── Persistence ───────────────────────────────────────────────────────
def save_bots():
    with open(os.path.join(DATA_DIR, "bots.json"), "w") as f:
        json.dump(chatbots, f, indent=2)

def load_bots():
    path = os.path.join(DATA_DIR, "bots.json")
    if os.path.exists(path):
        with open(path) as f:
            chatbots.update(json.load(f))

load_bots()


# ── Serve Frontend ────────────────────────────────────────────────────
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/preview/{bot_id}")
async def serve_preview(bot_id: str):
    return FileResponse(os.path.join(STATIC_DIR, "preview.html"))

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"\n✦ Lumin AI Builder running at http://localhost:{port}\n")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
