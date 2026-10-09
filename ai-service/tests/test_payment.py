"""Tests for QR decoding and UPI parsing."""
import pytest
from services.upi_parser import parse_upi_uri
from services.qr_decoder import decode_qr


def test_parse_merchant_upi():
    uri = "upi://pay?pa=greentea.cafe@upi&pn=Green%20Tea%20Cafe&mc=5812&cu=INR"
    res = parse_upi_uri(uri)
    assert res.is_upi is True
    assert res.payee_vpa == "greentea.cafe@upi"
    assert res.payee_name == "Green Tea Cafe"
    assert res.merchant_code == "5812"
    # Has merchant code -> no PERSONAL_RECIPIENT signal
    codes = [f.code for f in res.deterministic_factors]
    assert "PERSONAL_RECIPIENT" not in codes


def test_parse_personal_recipient_upi():
    uri = "upi://pay?pa=rameshk1985@ybl&pn=RAMESH%20K&am=1499.00&cu=INR&tn=Registration%20fee"
    res = parse_upi_uri(uri)
    assert res.is_upi is True
    assert res.payee_vpa == "rameshk1985@ybl"
    assert res.amount == "1499.00"
    codes = [f.code for f in res.deterministic_factors]
    assert "PERSONAL_RECIPIENT" in codes


def test_parse_receive_via_pay_trap():
    uri = "upi://pay?pa=megamart.refunds@ybl&pn=MegaMart%20Refunds&am=5000.00&cu=INR&tn=Cashback%20refund%20-%20scan%20to%20receive"
    res = parse_upi_uri(uri)
    assert res.is_upi is True
    codes = [f.code for f in res.deterministic_factors]
    assert "RECEIVE_VIA_PAY" in codes


def test_decode_sample_qrs():
    with open("samples/job_fee_qr.png", "rb") as f:
        job_qr = f.read()
    payloads = decode_qr(job_qr)
    assert len(payloads) >= 1
    assert "rameshk1985@ybl" in payloads[0]

    with open("samples/merchant_qr_safe.png", "rb") as f:
        merchant_qr = f.read()
    payloads = decode_qr(merchant_qr)
    assert len(payloads) >= 1
    assert "greentea.cafe@upi" in payloads[0]
