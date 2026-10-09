"""URL inspector tests."""
import pytest
from services.url_inspector import static_checks, inspect_url


@pytest.mark.parametrize("url", [
    "http://127.0.0.1/",
    "http://localhost/",
    "http://10.0.0.1/",
    "http://192.168.1.1/",
    "http://169.254.169.254/",
    "http://[::1]/",
    "http://0.0.0.0/",
])
def test_blocks_private_ips(url):
    signals, finding = static_checks(url)
    assert finding is not None
    assert finding.blocked_reason is not None
    assert "Blocked" in finding.blocked_reason


def test_blocks_port_8080():
    signals, finding = static_checks("http://example.com:8080/")
    assert finding is not None
    assert "port" in finding.blocked_reason.lower()


def test_blocks_file_scheme():
    signals, finding = static_checks("file:///etc/passwd")
    assert finding is not None
    assert "scheme" in finding.blocked_reason.lower()


def test_blocks_javascript_scheme():
    signals, finding = static_checks("javascript:alert(1)")
    assert finding is not None
    assert "scheme" in finding.blocked_reason.lower()


def test_flags_punycode():
    signals, finding = static_checks("https://xn--pple-43d.com/")
    assert "URL_PUNYCODE" in signals
    assert finding is None  # Not blocked, just flagged


def test_flags_userinfo():
    signals, finding = static_checks("https://admin@evil.com/")
    assert "URL_USERINFO" in signals


def test_flags_ip_host():
    signals, finding = static_checks("https://93.184.216.34/")
    assert "URL_IP_HOST" in signals
    assert finding is None  # Globally routable, not blocked


def test_flags_shortener():
    signals, finding = static_checks("https://bit.ly/abc123")
    assert "URL_SHORTENED" in signals


@pytest.mark.asyncio
async def test_blocks_redirect_to_private_ip():
    """A redirect to a private IP should be blocked.
    We test the static check that would run on each redirect hop."""
    signals, finding = static_checks("http://192.168.1.1/admin")
    assert finding is not None
    assert "Blocked" in finding.blocked_reason


def test_sixth_hop_limit():
    """Verify the hop limit constant."""
    from services.url_inspector import MAX_HOPS
    assert MAX_HOPS == 5  # 6th hop would be blocked
