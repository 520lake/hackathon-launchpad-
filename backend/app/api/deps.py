from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlmodel import Session
import logging

from app.core import security
from app.core.config import settings
from app.db.session import get_session
from app.models.user import User

logger = logging.getLogger(__name__)

reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/login/access-token"
)

def get_current_user(
    session: Session = Depends(get_session),
    token: str = Depends(reusable_oauth2)
) -> User:
    try:
        print(f"DEBUG: Validating token: {token[:20]}...")
        print(f"DEBUG: Using Secret Key: {settings.SECRET_KEY[:5]}...")
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = payload.get("sub")
        print(f"DEBUG: Token payload sub: {token_data}")
    except (JWTError, ValidationError) as e:
        print(f"ERROR: Token validation failed: {str(e)}")
        logger.error(f"Token validation failed: {str(e)}")
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
