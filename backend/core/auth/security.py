from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import jwt
from passlib.context import CryptContext

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

JWT_ALG = "HS256"
JWT_EXPIRE_DAYS = 30


def _secret() -> str:
    s = os.getenv("JWT_SECRET", "").strip() or os.getenv("APP_SECRET_KEY", "").strip()
    if not s:
        # Dev fallback — set JWT_SECRET in production
        s = "dev-insecure-change-me-lumin-jwt"
    return s


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str | None) -> bool:
    if not plain or not hashed:
        return False
    return _pwd.verify(plain, hashed)


def create_access_token(*, user_id: int, email: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "iat": int(now.timestamp()),
        "exp": now + timedelta(days=JWT_EXPIRE_DAYS),
    }
    return jwt.encode(payload, _secret(), algorithm=JWT_ALG)


def decode_access_token(token: str) -> dict:
    return jwt.decode(token, _secret(), algorithms=[JWT_ALG])
