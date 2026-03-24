from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from database.json_safe import json_safe
from database.models import AnalysisRun, User


def get_user_by_email(db: Session, email: str) -> User | None:
    e = str(email).strip().lower()
    return db.execute(select(User).where(User.email == e)).scalar_one_or_none()


def create_registered_user(
    db: Session,
    *,
    email: str,
    password_hash: str,
    default_youtube_url: str | None,
) -> User:
    e = str(email).strip().lower()
    u = User(email=e, password_hash=password_hash, default_youtube_url=(default_youtube_url or "").strip() or None)
    db.add(u)
    db.commit()
    db.refresh(u)
    return u


def get_or_create_user_by_email(db: Session, email: str | None) -> int | None:
    if not email or not str(email).strip():
        return None
    email = str(email).strip().lower()
    row = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
    if row:
        return row.id
    u = User(email=email)
    db.add(u)
    db.flush()
    return u.id


def get_or_create_user_by_supabase_id(db: Session, supabase_user_id: str | None) -> int | None:
    if not supabase_user_id or not str(supabase_user_id).strip():
        return None
    sid = str(supabase_user_id).strip()
    row = db.execute(select(User).where(User.supabase_user_id == sid)).scalar_one_or_none()
    if row:
        return row.id
    u = User(supabase_user_id=sid)
    db.add(u)
    db.flush()
    return u.id


def create_analysis_run(
    db: Session,
    *,
    result: dict[str, Any],
    youtube_url: str | None,
    channel_id_uc: str | None,
    timeseries_source: str | None,
    user_id: int | None = None,
) -> AnalysisRun:
    safe = json_safe(result)
    run = AnalysisRun(
        user_id=user_id,
        youtube_url=youtube_url,
        channel_id_uc=channel_id_uc,
        timeseries_source=timeseries_source,
        status="completed",
        result_json=safe,
    )
    db.add(run)
    db.commit()
    db.refresh(run)
    return run


def get_analysis_run(db: Session, run_id: uuid.UUID) -> AnalysisRun | None:
    return db.get(AnalysisRun, run_id)


def get_latest_analysis_run_for_user(db: Session, user_id: int) -> AnalysisRun | None:
    q = (
        select(AnalysisRun)
        .where(AnalysisRun.user_id == user_id)
        .order_by(AnalysisRun.created_at.desc())
        .limit(1)
    )
    return db.execute(q).scalar_one_or_none()


def list_analysis_runs(db: Session, *, limit: int = 20, user_id: int | None = None) -> list[AnalysisRun]:
    if user_id is not None:
        q = (
            select(AnalysisRun)
            .where(AnalysisRun.user_id == user_id)
            .order_by(AnalysisRun.created_at.desc())
            .limit(limit)
        )
    else:
        q = select(AnalysisRun).order_by(AnalysisRun.created_at.desc()).limit(limit)
    return list(db.execute(q).scalars().all())
