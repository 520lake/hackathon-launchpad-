from typing import Generator, Optional
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlmodel import Session
import logging
import sys

from aura_server.core import security
from aura_server.core.config import settings
from aura_server.db.session import get_session
from aura_server.models.user import User

# Use uvicorn logger to ensure visibility in ModelScope logs
logger = logging.getLogger("uvicorn")

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token",
    auto_error=False
)

def get_current_user(
    request: Request,
    session: Session = Depends(get_session),
    token: Optional[str] = Depends(reusable_oauth2)
) -> User:
    # DEBUG: Check why token might be missing
    # OAuth2PasswordBearer returns None if header missing, but might return "null" string if header is "Bearer null"
    if not token or token == "null" or token == "undefined":
        auth_header = request.headers.get("Authorization")
        logger.error(f"DEBUG: Token invalid or missing (token={token}). Auth Header: {auth_header}")
        
        # Try to get from cookie as fallback
        token = request.cookies.get("access_token")
        if token:
             logger.info(f"DEBUG: Found token in cookie: {token[:10]}...")
        else:
             logger.error(f"DEBUG: Missing Token in both Header and Cookie.")
             raise HTTPException(
                 status_code=status.HTTP_401_UNAUTHORIZED,
                 detail="Not authenticated (Missing Token - Header & Cookie)",
                 headers={"WWW-Authenticate": "Bearer"},
             )

    try:
        logger.info(f"DEBUG: Validating token: {token[:20]}...")
        logger.info(f"DEBUG: Using Secret Key: {settings.SECRET_KEY[:5]}...")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload.get("sub")
        logger.info(f"DEBUG: Token payload sub: {token_data}")
    except (JWTError, ValidationError) as e:
        logger.error(f"ERROR: Token validation failed: {str(e)}")
        logger.error(f"Received Token (first 20 chars): {token[:20]}...")
        logger.error(f"Expected Secret Key: {settings.SECRET_KEY}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        user_id = int(token_data)
    except (ValueError, TypeError):
        print(f"ERROR: Token sub is not an int: {token_data}")
        raise HTTPException(status_code=401, detail="Invalid token subject")
        
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def get_current_active_superuser(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_superuser:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user
