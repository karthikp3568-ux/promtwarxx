"""Tests for redaction.py."""
import pytest
from services.redaction import redact_text, redact_data_structure


def test_redact_emails():
    text = "Contact support at alice@example.com or bob.smith@corp.org for help."
    redacted = redact_text(text)
    assert "alice@example.com" not in redacted
    assert "bob.smith@corp.org" not in redacted
    assert "[email]" in redacted


def test_redact_upi_ids():
    text = "Send payments to user@okhdfcbank or merchant.bills@ybl immediately."
    redacted = redact_text(text)
    assert "user@okhdfcbank" not in redacted
    assert "merchant.bills@ybl" not in redacted
    assert "[upi-id]" in redacted


def test_redact_urls():
    text = "Visit https://phish.subdomain.example.com/login?token=abc for verification."
    redacted = redact_text(text)
    assert "https://phish.subdomain.example.com/login?token=abc" not in redacted
    assert "example.com" in redacted


def test_redact_phone_numbers():
    text = "Call +91 9876543210 or 1-800-555-1234 to unlock."
    redacted = redact_text(text)
    assert "9876543210" not in redacted
    assert "[phone]" in redacted


def test_redact_account_and_otp_numbers():
    text = "Your OTP is 482910 and account number is 98765432101234."
    redacted = redact_text(text)
    assert "482910" not in redacted
    assert "98765432101234" not in redacted
    assert "[number]" in redacted


def test_preserve_currency_numbers():
    text = "Amount due is ₹5000 or $1200 or Rs. 1500."
    redacted = redact_text(text)
    assert "₹5000" in redacted or "5000" in redacted
    assert "$1200" in redacted or "1200" in redacted
    assert "1500" in redacted


def test_redact_nested_structure():
    data = {
        "title": "Payment to alice@ybl",
        "nested": ["Call 9876543210", {"link": "https://secure.banking.example.com/test"}],
    }
    redacted = redact_data_structure(data)
    assert redacted["title"] == "Payment to [upi-id]"
    assert "[phone]" in redacted["nested"][0]
    assert "example.com" in redacted["nested"][1]["link"]
