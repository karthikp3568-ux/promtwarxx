"""Tests for document parsing, PDF active content, and page limits."""
import pytest
import io
import pypdf
from services.document_parser import parse_pdf
from errors import TrustGuardError


def test_parse_sample_scholarship_pdf():
    with open("samples/scholarship_notice.pdf", "rb") as f:
        pdf_bytes = f.read()

    res = parse_pdf(pdf_bytes)
    assert res.pages_count == 1
    assert "State Merit Scholarship" in res.text
    assert "scholarship.cell2024@ybl" in res.text
    assert len(res.hidden_links) >= 1
    assert "https://scholarship-verify.example.com/upload" in res.hidden_links


def test_too_many_pages_rejects():
    writer = pypdf.PdfWriter()
    for _ in range(11):
        writer.add_blank_page(width=100, height=100)

    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    with pytest.raises(TrustGuardError) as exc:
        parse_pdf(pdf_bytes)
    assert exc.value.code.value == "TOO_MANY_PAGES"


def test_detect_active_content_javascript():
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=100, height=100)
    # Add JS action
    writer.add_js("app.alert('malicious script executed');")

    buf = io.BytesIO()
    writer.write(buf)
    pdf_bytes = buf.getvalue()

    res = parse_pdf(pdf_bytes)
    assert res.active_content is True
    codes = [f.code for f in res.deterministic_factors]
    assert "PDF_ACTIVE_CONTENT" in codes
