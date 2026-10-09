"""Test that submitted content never appears in logs."""
import logging
import io
from fastapi.testclient import TestClient


def test_content_not_logged():
    """Verify secret content does not appear in log output."""
    # Capture log output
    log_stream = io.StringIO()
    handler = logging.StreamHandler(log_stream)
    handler.setLevel(logging.DEBUG)
    root_logger = logging.getLogger()
    root_logger.addHandler(handler)

    try:
        from main import app
        client = TestClient(app)

        secret_content = "SUPER_SECRET_CONTENT_XYZ_12345"
        # This should fail with MISSING_API_KEY or similar, but must not log the content
        response = client.post(
            "/api/analyze/conversation",
            data={"text": secret_content},
        )
        # The endpoint may not exist yet or may return an error - that's fine
        # The important thing is the content is not in the logs
        log_output = log_stream.getvalue()
        assert secret_content not in log_output, "Secret content found in logs!"
    finally:
        root_logger.removeHandler(handler)
