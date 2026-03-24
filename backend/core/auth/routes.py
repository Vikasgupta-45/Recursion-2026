from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from auth.deps import get_current_user_required
from database.crud import create_registered_user, get_user_by_email
from database.models import User
from database.session import get_db

from .security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])


class RegisterBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    youtube_url: str | None = None


class LoginBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)


class UserOut(BaseModel):
    id: int
    email: str
    default_youtube_url: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


@router.post("/register", response_model=AuthResponse)
def auth_register(body: RegisterBody, db: Session = Depends(get_db)):
    if get_user_by_email(db, str(body.email)):
        raise HTTPException(status_code=409, detail="Email already registered")
    h = hash_password(body.password)
    u = create_registered_user(
        db,
        email=str(body.email),
        password_hash=h,
        default_youtube_url=body.youtube_url,
    )
    token = create_access_token(user_id=u.id, email=u.email or "")
    return AuthResponse(
        access_token=token,
        user=UserOut(id=u.id, email=u.email or "", default_youtube_url=u.default_youtube_url),
    )


@router.post("/login", response_model=AuthResponse)
def auth_login(body: LoginBody, db: Session = Depends(get_db)):
    u = get_user_by_email(db, str(body.email))
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not u.email:
        raise HTTPException(status_code=401, detail="Invalid account")
    token = create_access_token(user_id=u.id, email=u.email)
    return AuthResponse(
        access_token=token,
        user=UserOut(id=u.id, email=u.email, default_youtube_url=u.default_youtube_url),
    )


@router.get("/me", response_model=UserOut)
def auth_me(user: User = Depends(get_current_user_required)):
    return UserOut(id=user.id, email=user.email or "", default_youtube_url=user.default_youtube_url)
