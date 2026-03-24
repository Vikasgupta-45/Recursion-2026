"""
DATABASE_URL: Supabase Postgres connection string (Settings → Database).
Example: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

If unset, uses SQLite at ./growth_engine.db (dev / hackathon offline).
"""

import os

import app_config  # noqa: F401 — loads backend/.env and repo-root .env


def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        if url.startswith("postgres://"):
            url = "postgresql://" + url[len("postgres://") :]
        return url
    return "sqlite:///./growth_engine.db"
