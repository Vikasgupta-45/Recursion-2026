# ✦ Lumin AI — Visual Chatbot Builder

A drag-and-drop chatbot creation platform for content creators. Build AI-powered chatbots trained on your own data — YouTube videos, analytics, text — without writing a single line of code.

## Features

- **Visual Flow Canvas** — Drag-and-drop node editor with SVG connections
- **Knowledge Base Node** — Feed YouTube videos, text data, or website URLs
- **YouTube Auto-Fetch** — Automatically downloads metadata & transcribes audio via Whisper
- **AI Responses** — Powered by Groq (LLaMA 3.3 70B)
- **Live Chat Preview** — Test your chatbot in real-time
- **Bot Persistence** — Saved to `data/bots.json`

## Node Types

| Node | Purpose |
|------|---------|
| ▶️ Start | Flow entry point |
| 💬 Message | Send a static message |
| 📚 Knowledge Base | Add data (text, YouTube URL, website) |
| 🤖 AI Response | Groq-powered AI reply using knowledge |
| ⌨️ User Input | Wait for user message |
| 🔀 Condition | Branch based on user choice |
| 🏁 End | End conversation |

## Quick Start

```bash
cd lumin-ai
cp .env.example .env
# Add your GROQ_API_KEY to .env
pip install -r requirements.txt
python main.py
```

Open `http://localhost:8000` and start building!

## Example Flow

```
Start → Knowledge Base (YouTube URL) → User Input → AI Response
```

## Tech Stack

- **Backend:** FastAPI + Groq SDK
- **Frontend:** Vanilla JS/CSS with SVG canvas
- **AI:** LLaMA 3.3 70B (chat) + Whisper Large V3 (transcription)
- **Video:** yt-dlp for YouTube data fetching
