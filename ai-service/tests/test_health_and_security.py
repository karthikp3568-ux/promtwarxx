"""Unit tests for health endpoints and security headers middleware."""
import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def client():
    return TestClient(app)


def test_root_health_endpoint(client):
    """Test that GET /health responds with 200 and valid JSON status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "gemini_configured" in data
    assert "firebase" in data


def test_api_health_endpoint(client):
    """Test that GET /api/health responds with 200 and health info."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_security_headers_present(client):
    """Test that all enterprise security headers and request-id are present."""
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "Permissions-Policy" in response.headers


def test_404_preserves_security_headers(client):
    """Test that 404 responses still return enterprise security headers."""
    response = client.get("/non-existent-endpoint-random-xyz")
    assert response.status_code == 404
    assert "X-Request-ID" in response.headers
    assert response.headers["X-Content-Type-Options"] == "nosniff"
