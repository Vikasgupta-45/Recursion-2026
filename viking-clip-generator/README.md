# AI Video Clipping Tool - Setup & Run Guide

This tool uses FastAPI, MoviePy, and Groq's AI to automatically extract viral-style clips from YouTube videos.

## Prerequisites

1.  **Python 3.10+**: Make sure you have Python installed.
2.  **FFmpeg**: This tool requires FFmpeg for video processing.
    -   **Windows**: Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add the `bin` folder to your system PATH.
    -   **macOS**: `brew install ffmpeg`
    -   **Linux**: `sudo apt install ffmpeg`

## Installation

1.  **Navigate to the project directory**:
    ```bash
    cd viking-clip-generator
    ```

2.  **Create a Virtual Environment**:
    ```bash
    python -m venv venv
    ```

3.  **Activate the Virtual Environment**:
    -   **Windows**: `venv\Scripts\activate`
    -   **macOS/Linux**: `source venv/bin/activate`

4.  **Install Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Configuration

1.  **API Key**:
    -   The project includes a `.env` file. You should update the `GROQ_API_KEY` if it's no longer valid.
2.  **Get a free Groq API key from [console.groq.com](https://console.groq.com/).**

## Running the App

1.  Start the FastAPI server:
    ```bash
    python main.py
    ```

2.  Open your browser and navigate to:
    [http://localhost:8000](http://localhost:8000)

## Features
- **YouTube Link Processing**: Just paste a link and let the AI find the best parts.
- **AI Analysis**: Powered by Groq for high-speed content understanding.
- **Auto-Clipping**: Automatically crops and edits clips into vertical (9:16) or horizontal formats.
