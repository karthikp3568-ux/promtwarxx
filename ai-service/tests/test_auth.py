"""Tests for Firebase auth token verification."""
import pytest
from unittest.mock import patch, MagicMock
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

from errors import TrustGuardError, trustguard_error_handler
from services.auth import get_current_user

app = FastAPI()
app.add_exception_handler(TrustGuardError, trustguard_error_handler)


@app.get("/test-protected")
async def protected_route(uid: str = Depends(get_current_user)):
    return {"uid": uid}


client = TestClient(app)


def test_missing_token_returns_auth_required():
    response = client.get("/test-protected")
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH_REQUIRED"


def test_invalid_bearer_format_returns_auth_required():
    response = client.get("/test-protected", headers={"Authorization": "Basic xyz123"})
    assert response.status_code == 401
    assert response.json()["code"] == "AUTH_REQUIRED"


def test_invalid_token_returns_auth_invalid():
    with patch("services.auth.fb_auth.verify_id_token", side_effect=Exception("Invalid token")):
        with patch("services.auth.get_firebase_app", return_value=MagicMock()):
            response = client.get(
                "/test-protected",
                headers={"Authorization": "Bearer bad-token-xyz"},
            )
            assert response.status_code == 401
            assert response.json()["code"] == "AUTH_INVALID"


def test_valid_token_extracts_uid():
    with patch("services.auth.fb_auth.verify_id_token", return_value={"uid": "user-456"}):
        with patch("services.auth.get_firebase_app", return_value=MagicMock()):
            response = client.get(
                "/test-protected",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == 200
            assert response.json()["uid"] == "user-456"


def test_uid_in_query_or_body_ignored():
    """A uid passed in query params or body cannot override the token uid."""
    with patch("services.auth.fb_auth.verify_id_token", return_value={"uid": "real-user-123"}):
        with patch("services.auth.get_firebase_app", return_value=MagicMock()):
            response = client.get(
                "/test-protected?uid=fake-hacker-uid",
                headers={"Authorization": "Bearer valid-token"},
            )
            assert response.status_code == 200
            assert response.json()["uid"] == "real-user-123"
