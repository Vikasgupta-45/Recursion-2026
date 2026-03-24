"""
Save your YouTube Data API v3 key into backend/.env (same folder as this script).

Usage (from the backend folder):
  python configure_youtube_key.py
  python configure_youtube_key.py YOUR_KEY_HERE
"""

from __future__ import annotations

import re
import sys
from pathlib import Path


def main() -> None:
    env_path = Path(__file__).resolve().parent / ".env"
    if len(sys.argv) >= 2:
        key = sys.argv[1].strip().strip('"').strip("'")
    else:
        key = input("Paste your YouTube Data API key: ").strip().strip('"').strip("'")

    if len(key) < 30:
        print("That value looks too short. Keys are usually ~39 characters.")
        sys.exit(1)

    text = env_path.read_text(encoding="utf-8") if env_path.exists() else ""
    lines = text.splitlines()
    out: list[str] = []
    seen = False
    pat = re.compile(r"^\s*YOUTUBE_API_KEY\s*=")
    for line in lines:
        if pat.match(line):
            out.append(f"YOUTUBE_API_KEY={key}")
            seen = True
        else:
            out.append(line)
    if not seen:
        if out and out[-1].strip():
            out.append("")
        out.append(f"YOUTUBE_API_KEY={key}")

    env_path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"Wrote YOUTUBE_API_KEY to {env_path}")
    print("Restart uvicorn, then open http://127.0.0.1:8000/api/env-check")


if __name__ == "__main__":
    main()
