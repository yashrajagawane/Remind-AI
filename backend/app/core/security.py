import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from jose import jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _read_key(path_str: str) -> str:
    """Read key content from file path."""
    # Resolve relative to the project root (backend is one level down)
    base_dir = Path(__file__).resolve().parent.parent.parent
    key_path = base_dir / path_str
    if not key_path.exists():
        raise RuntimeError(f"Key file missing: {key_path}")
    with open(key_path, "r") as f:
        return f.read()


PRIVATE_KEY = _read_key(settings.PRIVATE_KEY_PATH)
PUBLIC_KEY = _read_key(settings.PUBLIC_KEY_PATH)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def create_access_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(to_encode, PRIVATE_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(subject: str | Any, expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encoded_jwt = jwt.encode(to_encode, PRIVATE_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> dict:
    """Decode and verify the token. Raises JWTError if invalid."""
    payload = jwt.decode(token, PUBLIC_KEY, algorithms=[settings.ALGORITHM])
    if payload.get("type") != token_type:
        raise ValueError(f"Invalid token type: expected {token_type}")
    return payload
