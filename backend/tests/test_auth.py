"""Integration tests for auth endpoints and the auth dependency chain."""

from tests.conftest import auth_headers


def test_login_success(client, normal_user):
    resp = client.post(
        "/api/v1/login/access-token",
        data={"username": "normal@test.com", "password": "testpass123"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_password(client, normal_user):
    resp = client.post(
        "/api/v1/login/access-token",
        data={"username": "normal@test.com", "password": "wrong"},
    )
    assert resp.status_code == 400


def test_login_nonexistent_user(client):
    resp = client.post(
        "/api/v1/login/access-token",
        data={"username": "nobody@test.com", "password": "whatever"},
    )
    assert resp.status_code == 400


def test_protected_endpoint_with_valid_token(client, normal_user):
    """GET /users/me should return the user when a valid token is provided."""
    resp = client.get("/api/v1/users/me", headers=auth_headers(normal_user))
    assert resp.status_code == 200
    assert resp.json()["email"] == "normal@test.com"


def test_protected_endpoint_with_invalid_token(client):
    resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": "Bearer invalid.token.here"},
    )
    assert resp.status_code == 401


def test_protected_endpoint_missing_token(client):
    resp = client.get("/api/v1/users/me")
    assert resp.status_code == 401


def test_login_returns_usable_token(client, normal_user):
    """Token from login should work for authenticated requests."""
    login_resp = client.post(
        "/api/v1/login/access-token",
        data={"username": "normal@test.com", "password": "testpass123"},
    )
    token = login_resp.json()["access_token"]
    me_resp = client.get(
        "/api/v1/users/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "normal@test.com"
