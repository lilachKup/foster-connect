from datetime import datetime, timedelta, timezone

import bcrypt
from jose import jwt

from ..config import settings


def _password_bytes(password: str) -> bytes:
    # bcrypt operates on bytes and has a 72-byte input limit.
    pwd = password.encode("utf-8")
    if len(pwd) > 72:
        raise ValueError("Password is too long (max 72 bytes)")
    return pwd


def hash_password(password: str) -> str:
    return bcrypt.hashpw(_password_bytes(password), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_password_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: int, role: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
