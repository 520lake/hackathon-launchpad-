"""Unit tests for JWT token creation and password hashing — no DB needed."""

from datetime import timedelta
from jose import jwt

from app.core.security import (
    create_access_token,
    verify_password,
    get_password_hash,
    ALGORITHM,
)
from app.core.config import settings


def test_create_access_token_contains_sub():
    token = create_access_token(subject=42)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "42"


def test_create_access_token_contains_exp():
    token = create_access_token(subject=1)
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload


def test_create_access_token_custom_expiry():
    token = create_access_token(subject=1, expires_delta=timedelta(minutes=5))
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    assert "exp" in payload


def test_verify_password_correct():
    hashed = get_password_hash("secret123")
    assert verify_password("secret123", hashed) is True


def test_verify_password_incorrect():
    hashed = get_password_hash("secret123")
    assert verify_password("wrong", hashed) is False


def test_password_hash_roundtrip():
    password = "myP@ssw0rd!"
    hashed = get_password_hash(password)
    assert hashed != password  # hash is not plaintext
    assert verify_password(password, hashed) is True
