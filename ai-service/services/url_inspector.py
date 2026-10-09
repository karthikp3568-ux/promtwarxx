"""SSRF-safe URL inspector."""
import ipaddress
import logging
import re
import socket
from urllib.parse import urlparse

import httpx
import tldextract

from config import settings
from schemas import UrlFinding, UrlHop

logger = logging.getLogger(__name__)

# Known URL shorteners
SHORTENERS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "adf.ly", "bl.ink", "lnkd.in", "surl.li", "rb.gy",
    "cutt.ly", "shorturl.at", "t.ly",
}

ALLOWED_SCHEMES = {"http", "https"}
ALLOWED_PORTS = {80, 443, None}  # None = default port
MAX_HOPS = 5
HOP_TIMEOUT = 5.0
TOTAL_TIMEOUT = 15.0
MAX_TITLE_BYTES = 65536

# Hostnames that always resolve to non-routable IPs
BLOCKED_HOSTS = {"localhost", "localhost.localdomain", "ip6-localhost", "ip6-loopback"}


def _is_ip_host(host: str) -> bool:
    """Check if host is an IP address literal."""
    try:
        ipaddress.ip_address(host.strip("[]"))
        return True
    except ValueError:
        return False


def _is_globally_routable(ip_str: str) -> bool:
    """Check if IP is globally routable."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return ip.is_global
    except ValueError:
        return False


def _has_punycode(host: str) -> bool:
    return any(part.startswith("xn--") for part in host.lower().split("."))


def _has_userinfo(url: str) -> bool:
    parsed = urlparse(url)
    return bool(parsed.username or parsed.password)


def _get_registrable_domain(url: str) -> str:
    """Get registrable domain using tldextract with bundled suffix list (no network)."""
    ext = tldextract.extract(url, include_psl_private_domains=True)
    rd = getattr(ext, 'top_domain_under_public_suffix', None) or getattr(ext, 'registered_domain', None)
    if rd:
        return rd
    return ext.domain or ""


def _is_shortener(domain: str) -> bool:
    return domain.lower() in SHORTENERS


def _extract_title(html: bytes) -> str | None:
    """Extract <title> from HTML bytes."""
    try:
        text = html.decode("utf-8", errors="ignore")
    except Exception:
        return None
    match = re.search(r"<title[^>]*>(.*?)</title>", text, re.IGNORECASE | re.DOTALL)
    return match.group(1).strip()[:200] if match else None


def static_checks(url: str) -> tuple[list[str], UrlFinding | None]:
    """Run static (no-network) checks on a URL.
    Returns (signal_codes, blocking_finding_or_None).
    """
    signals: list[str] = []
    parsed = urlparse(url)
    host = parsed.hostname or ""
    port = parsed.port
    scheme = parsed.scheme.lower()

    # Scheme check
    if scheme not in ALLOWED_SCHEMES:
        return signals, UrlFinding(
            original=url,
            blocked_reason=f"Blocked: scheme '{scheme}' not allowed",
        )

    # Port check
    if port is not None and port not in {80, 443}:
        return signals, UrlFinding(
            original=url,
            blocked_reason=f"Blocked: port {port} not allowed",
        )

    # Blocked hostnames
    if host.lower() in BLOCKED_HOSTS:
        return signals, UrlFinding(
            original=url,
            blocked_reason=f"Blocked: hostname '{host}' not allowed",
        )

    # IP literal host
    if _is_ip_host(host):
        signals.append("URL_IP_HOST")
        # Check if routable
        if not _is_globally_routable(host.strip("[]")):
            return signals, UrlFinding(
                original=url,
                blocked_reason=f"Blocked: non-routable IP {host}",
            )

    # Punycode
    if _has_punycode(host):
        signals.append("URL_PUNYCODE")

    # Userinfo
    if _has_userinfo(url):
        signals.append("URL_USERINFO")

    # Shortener
    domain = _get_registrable_domain(url)
    if _is_shortener(domain):
        signals.append("URL_SHORTENED")

    return signals, None


async def inspect_url(url: str) -> tuple[list[str], UrlFinding]:
    """Inspect a URL. Returns (signal_codes, finding)."""
    signals, blocked = static_checks(url)
    if blocked:
        return signals, blocked

    finding = UrlFinding(
        original=url,
        final_url=url,
        shortened=bool("URL_SHORTENED" in signals),
    )

    if not settings.url_fetch_enabled:
        return signals, finding

    # Network fetch with redirect following
    original_domain = _get_registrable_domain(url)
    current_url = url
    hops: list[UrlHop] = []

    try:
        async with httpx.AsyncClient(
            follow_redirects=False,
            timeout=HOP_TIMEOUT,
            headers={"User-Agent": "TrustGuard-URLInspector/1.0"},
            verify=True,
        ) as client:
            for hop_num in range(MAX_HOPS + 1):
                if hop_num >= MAX_HOPS:
                    finding.error = f"Too many redirects (>{MAX_HOPS})"
                    break

                # Pre-flight: resolve and check IP
                parsed = urlparse(current_url)
                host = parsed.hostname or ""

                if not _is_ip_host(host):
                    try:
                        infos = socket.getaddrinfo(host, None)
                        for info in infos:
                            ip_str = info[4][0]
                            if not _is_globally_routable(ip_str):
                                finding.blocked_reason = f"Blocked: {host} resolves to non-routable IP {ip_str}"
                                return signals, finding
                    except socket.gaierror:
                        finding.error = f"DNS resolution failed for {host}"
                        return signals, finding

                # HEAD request
                try:
                    resp = await client.head(current_url)
                except httpx.RequestError as e:
                    finding.error = str(e)[:200]
                    break

                hop_domain = _get_registrable_domain(current_url)
                hops.append(UrlHop(
                    url=current_url,
                    status=resp.status_code,
                    registrable_domain=hop_domain,
                ))

                if resp.is_redirect:
                    location = resp.headers.get("location")
                    if not location:
                        break
                    current_url = str(resp.url.join(location)) if not location.startswith("http") else location

                    # Check the redirect target
                    redir_signals, redir_blocked = static_checks(current_url)
                    signals.extend(s for s in redir_signals if s not in signals)
                    if redir_blocked:
                        finding.blocked_reason = redir_blocked.blocked_reason
                        return signals, finding
                    continue
                else:
                    # Try to get title via GET
                    if resp.status_code < 400:
                        try:
                            get_resp = await client.get(current_url)
                            content = get_resp.content[:MAX_TITLE_BYTES]
                            finding.page_title = _extract_title(content)
                        except Exception:
                            pass
                    break

    except Exception as e:
        finding.error = str(e)[:200]

    finding.hops = hops
    final_domain = _get_registrable_domain(current_url)
    finding.final_url = current_url
    finding.domain_changed = final_domain.lower() != original_domain.lower() if original_domain else False

    if finding.domain_changed:
        if "URL_REDIRECT_DOMAIN_CHANGE" not in signals:
            signals.append("URL_REDIRECT_DOMAIN_CHANGE")

    return signals, finding
