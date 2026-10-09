"""End-to-end acceptance tests for Phases 6, 7, 8, 9 against running backend."""
import json
import os
import time
import httpx
import pytest

BASE_URL = "http://localhost:8000"


def get_auth_headers():
    res = httpx.post(
        "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key",
        json={"returnSecureToken": True},
    )
    token = res.json()["idToken"]
    return {"Authorization": f"Bearer {token}"}


def parse_ndjson(resp_text: str):
    events = []
    for line in resp_text.strip().split("\n"):
        line = line.strip()
        if line:
            try:
                events.append(json.loads(line))
            except Exception:
                pass
    return events


def get_result(events):
    for e in events:
        if e.get("type") == "result":
            return e["data"]
        if e.get("type") == "error":
            raise RuntimeError(f"Error {e.get('code')}: {e.get('message')}")
    raise RuntimeError(f"No result found in events: {events}")


# =====================================================================
# PHASE 6: PAYMENT DETECTOR ACCEPTANCE
# job_fee_qr.png -> CRITICAL or HIGH
# merchant_qr_safe.png -> LOW
# refund_qr.png -> RECEIVE_VIA_PAY detected
# =====================================================================
def test_phase6_job_fee_qr():
    time.sleep(1)
    with open("samples/job_fee_qr.png", "rb") as f:
        img_bytes = f.read()

    with httpx.Client(timeout=90.0) as client:
        files = {"image": ("job_fee_qr.png", img_bytes, "image/png")}
        data = {"purpose": "Registration fee for remote typing job"}
        resp = client.post(
            f"{BASE_URL}/api/analyze/payment",
            files=files,
            data=data,
            headers=get_auth_headers(),
        )

    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
    events = parse_ndjson(resp.text)
    result = get_result(events)

    print("\n--- JOB FEE QR RESULT ---")
    print(f"Score: {result['score']}, Level: {result['level']}")
    assert result["level"] in ["HIGH", "CRITICAL"], f"Expected HIGH/CRITICAL, got {result['level']}"
    assert result["details"]["payment_type"] == "UPI"
    assert result["details"]["payee_vpa"] is not None


def test_phase6_merchant_qr_safe():
    time.sleep(1)
    with open("samples/merchant_qr_safe.png", "rb") as f:
        img_bytes = f.read()

    with httpx.Client(timeout=90.0) as client:
        files = {"image": ("merchant_qr_safe.png", img_bytes, "image/png")}
        data = {"purpose": "Coffee at Green Tea Cafe"}
        resp = client.post(
            f"{BASE_URL}/api/analyze/payment",
            files=files,
            data=data,
            headers=get_auth_headers(),
        )

    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
    events = parse_ndjson(resp.text)
    result = get_result(events)

    print("\n--- MERCHANT QR SAFE RESULT ---")
    print(f"Score: {result['score']}, Level: {result['level']}")
    assert result["level"] == "LOW", f"Expected LOW, got {result['level']}"


def test_phase6_refund_qr():
    time.sleep(1)
    with open("samples/refund_qr.png", "rb") as f:
        img_bytes = f.read()

    with httpx.Client(timeout=90.0) as client:
        files = {"image": ("refund_qr.png", img_bytes, "image/png")}
        data = {"purpose": "Receive refund of Rs 2500"}
        resp = client.post(
            f"{BASE_URL}/api/analyze/payment",
            files=files,
            data=data,
            headers=get_auth_headers(),
        )

    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
    events = parse_ndjson(resp.text)
    result = get_result(events)

    print("\n--- REFUND QR RESULT ---")
    print(f"Score: {result['score']}, Level: {result['level']}")
    codes = [f["code"] for f in result["factors"]]
    assert "RECEIVE_VIA_PAY" in codes, f"Expected RECEIVE_VIA_PAY in {codes}"


# =====================================================================
# PHASE 7: DOCUMENT ANALYZER ACCEPTANCE
# scholarship_notice.pdf -> HIGH or CRITICAL
# Ask endpoint -> grounded, no invented numbers
# =====================================================================
def test_phase7_scholarship_notice():
    time.sleep(1)
    with open("samples/scholarship_notice.pdf", "rb") as f:
        pdf_bytes = f.read()

    with httpx.Client(timeout=90.0) as client:
        files = {"file": ("scholarship_notice.pdf", pdf_bytes, "application/pdf")}
        data = {"context": "Received via email regarding university grant"}
        resp = client.post(
            f"{BASE_URL}/api/analyze/document",
            files=files,
            data=data,
            headers=get_auth_headers(),
        )

        assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
        events = parse_ndjson(resp.text)
        result = get_result(events)

        print("\n--- SCHOLARSHIP NOTICE RESULT ---")
        print(f"Score: {result['score']}, Level: {result['level']}")
        assert result["level"] in ["HIGH", "CRITICAL"], f"Expected HIGH/CRITICAL, got {result['level']}"

        # Grounded Ask Q&A check
        ask_files = {"file": ("scholarship_notice.pdf", pdf_bytes, "application/pdf")}
        ask_data = {
            "question": "What is the official phone number or website to verify this notice?",
            "analysis": json.dumps(result),
        }
        ask_resp = client.post(
            f"{BASE_URL}/api/document/ask",
            files=ask_files,
            data=ask_data,
            headers=get_auth_headers(),
        )
        assert ask_resp.status_code == 200, f"Ask HTTP {ask_resp.status_code}: {ask_resp.text}"
        ask_json = ask_resp.json()
        print("\n--- GROUNDED ASK RESULT ---")
        print(f"Answer: {ask_json.get('answer')}")
        # Answer must not invent contact details
        answer_text = ask_json.get("answer", "").lower()
        assert (
            "number on your card" in answer_text
            or "official app" in answer_text
            or "official website" in answer_text
            or "not mentioned" in answer_text
            or "does not contain" in answer_text
            or "cannot verify" in answer_text
            or "type yourself" in answer_text
            or "look up yourself" in answer_text
        )


# =====================================================================
# PHASE 8: VOICE ANALYZER ACCEPTANCE
# bank_call.wav -> dual assessment shown (synthetic voice indicators + scam risk reported separately)
# =====================================================================
def test_phase8_voice_analyzer():
    time.sleep(1)
    with open("samples/bank_call.wav", "rb") as f:
        wav_bytes = f.read()

    with httpx.Client(timeout=90.0) as client:
        files = {"audio": ("bank_call.wav", wav_bytes, "audio/wav")}
        data = {"context": "Received unexpected phone call claiming debit card fraud"}
        resp = client.post(
            f"{BASE_URL}/api/analyze/voice",
            files=files,
            data=data,
            headers=get_auth_headers(),
        )

    assert resp.status_code == 200, f"HTTP {resp.status_code}: {resp.text}"
    events = parse_ndjson(resp.text)
    result = get_result(events)

    print("\n--- VOICE ANALYZER RESULT ---")
    print(f"Score: {result['score']}, Level: {result['level']}")
    print(f"Voice Details: {result.get('details')}")
    # Dual assessment check: Scam risk level + voice verdict separate
    assert result["level"] in ["HIGH", "CRITICAL"], f"Expected HIGH/CRITICAL scam risk, got {result['level']}"
    assert "voice_verdict" in result["details"], "Expected voice_verdict in details"


# =====================================================================
# PHASE 9: WHAT-IF ATTACK SIMULATION
# what-if on high-risk result returns 4-7 stages, current stage highlighted, exits at each stage
# =====================================================================
def test_phase9_whatif_simulation():
    time.sleep(1)
    headers = get_auth_headers()
    # Step 1: Run conversation analysis to obtain an analysis_id saved in Firestore
    with open("samples/kyc_block_sms.txt", "r", encoding="utf-8") as f:
        text = f.read()

    with httpx.Client(timeout=90.0) as client:
        resp = client.post(
            f"{BASE_URL}/api/analyze/conversation",
            data={"text": text},
            headers=headers,
        )
        events = parse_ndjson(resp.text)
        result = get_result(events)
        analysis_id = result["id"]

        # Step 2: Request What-If simulation for this analysis
        sim_resp = client.post(
            f"{BASE_URL}/api/whatif",
            json={"analysis_id": analysis_id},
            headers=headers,
        )

    assert sim_resp.status_code == 200, f"What-If HTTP {sim_resp.status_code}: {sim_resp.text}"
    sim_data = sim_resp.json()
    print("\n--- WHAT-IF SIMULATION RESULT ---")
    print(f"Stages count: {len(sim_data['stages'])}")
    print(f"Current stage index: {sim_data['current_stage_index']}")
    print(f"Safest stopping point: {sim_data['safest_stopping_point']}")

    assert 4 <= len(sim_data["stages"]) <= 7, f"Expected 4-7 stages, got {len(sim_data['stages'])}"
    assert 0 <= sim_data["current_stage_index"] < len(sim_data["stages"])
    assert "safe_exit" in sim_data["stages"][0]
