# Auto-reloads on code changes — use this for local dev instead of plain uvicorn.
Set-Location $PSScriptRoot
uv run uvicorn main:app --host 127.0.0.1 --port 8000 --reload
