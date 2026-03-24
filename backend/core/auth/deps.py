from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from database.models import User
from database.session import get_db

from .security import decode_access_token


def get_current_user_optional(
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
) -> User | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    raw = authorization[7:].strip()
    if not raw:
        return None
    try:
        payload = decode_access_token(raw)
        uid = int(payload.get("sub", 0))
    except Exception:
        return None
    if uid <= 0:
        return None
    return db.get(User, uid)


def get_current_user_required(
    user: Annotated[User | None, Depends(get_current_user_optional)],
) -> User:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
