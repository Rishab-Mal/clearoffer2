from functools import lru_cache
from typing import Optional

import httpx
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt

from .config import settings


@lru_cache(maxsize=1)
def _fetch_jwks():
    if not settings.supabase_url:
        raise RuntimeError("Supabase URL not configured")

    response = httpx.get(
        f"{settings.supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json",
        timeout=10,
    )
    response.raise_for_status()
    payload = response.json()
    keys = payload.get("keys")
    if not isinstance(keys, list):
        raise RuntimeError("Invalid JWKS payload")
    return keys


def _decode_supabase_token(token: str):
    header = jwt.get_unverified_header(token)
    algorithm = header.get("alg")
    issuer = f"{settings.supabase_url.rstrip('/')}/auth/v1" if settings.supabase_url else None

    if algorithm == "HS256":
        if not settings.supabase_jwt_secret:
            raise JWTError("Supabase JWT secret not configured")
        return jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            issuer=issuer,
        )

    if algorithm == "ES256":
        kid = header.get("kid")
        if not kid:
            raise JWTError("Missing key id")

        for key in _fetch_jwks():
            if key.get("kid") == kid:
                return jwt.decode(
                    token,
                    key,
                    algorithms=["ES256"],
                    audience="authenticated",
                    issuer=issuer,
                )
        raise JWTError("Unknown signing key")

    raise JWTError("Unsupported Supabase JWT algorithm")


def get_supabase_user(authorization: Optional[str] = Header(None)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid Supabase token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not authorization or not authorization.startswith("Bearer "):
        raise credentials_exception

    token = authorization[len("Bearer "):].strip()
    if not token:
        raise credentials_exception

    try:
        payload = _decode_supabase_token(token)
    except (JWTError, httpx.HTTPError, RuntimeError):
        raise credentials_exception

    subject = payload.get("sub")
    if not subject:
        raise credentials_exception

    return {"id": subject, "email": payload.get("email")}
