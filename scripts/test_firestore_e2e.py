"""Verify automated Firestore creation for Registration, Analysis History, and What-If."""
import json
import os
import sys
import time
import httpx

os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"
os.environ["GCLOUD_PROJECT"] = "demo-trustguard"
os.environ["PYTHONIOENCODING"] = "utf-8"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "ai-service"))

import firebase_admin
from firebase_admin import auth, firestore
import google.auth.credentials

class EmulatorCred(firebase_admin.credentials.Base):
    def get_credential(self):
        return google.auth.credentials.AnonymousCredentials()

try:
    fb_app = firebase_admin.get_app()
except ValueError:
    fb_app = firebase_admin.initialize_app(EmulatorCred(), {"projectId": "demo-trustguard"})

db = firestore.client(app=fb_app)
BASE_URL = "http://localhost:8000"

print("=" * 70)
print("TrustGuard AI -- Automated Firestore Creation Verification")
print("=" * 70)

# 1. Create user via Auth Emulator REST API (simulating React client registration)
test_email = f"user_{int(time.time())}@trustguard.demo"
test_password = "ValidPassword123!"

res = httpx.post(
    "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-key",
    json={"email": test_email, "password": test_password, "returnSecureToken": True},
)
assert res.status_code == 200, f"Registration failed: {res.text}"
auth_data = res.json()
uid = auth_data["localId"]
id_token = auth_data["idToken"]
print(f"[OK] 1. Registered user in Auth: uid={uid}, email={test_email}")

# Simulate client Firestore write at users/{uid} upon registration
user_doc_ref = db.collection("users").document(uid)
user_doc_ref.set({
    "uid": uid,
    "email": test_email,
    "displayName": "Test Security Officer",
    "createdAt": firestore.SERVER_TIMESTAMP,
    "preferences": {"saveAnalysisHistory": True},
})

user_doc = user_doc_ref.get()
assert user_doc.exists, "User doc does not exist"
user_dict = user_doc.to_dict()
assert user_dict["uid"] == uid
assert user_dict["email"] == test_email
assert user_dict["preferences"]["saveAnalysisHistory"] is True
print(f"[OK] 2. User profile verified in Firestore at: users/{uid}")

# 2. Perform an analysis with ID Token through FastAPI backend
sample_text = (
    "URGENT: Your Bharat National Bank account has been temporarily blocked due to KYC. "
    "Verify immediately: https://bharat-national-bank-kyc.example.com/verify "
    "Share the OTP with our team to keep your account open. Act within 24 hours."
)

headers = {"Authorization": f"Bearer {id_token}"}
with httpx.Client(timeout=90.0) as client:
    resp = client.post(
        f"{BASE_URL}/api/analyze/conversation",
        data={"text": sample_text},
        headers=headers,
    )
    assert resp.status_code == 200, f"Analysis failed: {resp.text}"

    events = [json.loads(line) for line in resp.text.strip().split("\n") if line.strip()]
    result_data = next(e["data"] for e in events if e.get("type") == "result")
    save_event = next((e for e in events if e.get("type") == "save"), None)

analysis_id = result_data["id"]
print(f"[OK] 3. Analysis executed successfully: id={analysis_id}, score={result_data['score']}, level={result_data['level']}")
if save_event:
    print(f"      Save event received: status={save_event.get('status')}")

# 3. Verify analysis document exists in Firestore under users/{uid}/analyses/{analysis_id}
analysis_doc_ref = db.collection("users").document(uid).collection("analyses").document(analysis_id)
analysis_snap = analysis_doc_ref.get()
assert analysis_snap.exists, f"Analysis document users/{uid}/analyses/{analysis_id} was NOT created!"

saved = analysis_snap.to_dict()
print(f"[OK] 4. Analysis document verified at: users/{uid}/analyses/{analysis_id}")
print(f"      - schemaVersion: {saved.get('schemaVersion')}")
print(f"      - featureType: {saved.get('featureType')}")
print(f"      - riskScore: {saved.get('riskScore')}")
print(f"      - riskLevel: {saved.get('riskLevel')}")
print(f"      - summary: {saved.get('summary')}")
print(f"      - evidence factors count: {len(saved.get('evidence', []))}")
print(f"      - recommendations count: {len(saved.get('recommendations', []))}")
print(f"      - createdAt (server timestamp): {saved.get('createdAt')}")

assert saved["schemaVersion"] == 1
assert saved["riskScore"] is not None
assert saved["riskLevel"] in ["HIGH", "CRITICAL"]
assert len(saved.get("evidence", [])) > 0
assert len(saved.get("recommendations", [])) > 0
assert saved.get("createdAt") is not None

# 4. Trigger What-If Simulation and verify persistence in subcollection
with httpx.Client(timeout=90.0) as client:
    sim_resp = client.post(
        f"{BASE_URL}/api/whatif",
        json={"analysis_id": analysis_id},
        headers=headers,
    )
    assert sim_resp.status_code == 200, f"What-If failed: {sim_resp.text}"
    sim_data = sim_resp.json()

print(f"[OK] 5. What-If simulation generated: {len(sim_data['stages'])} stages")

# Verify simulation doc in subcollection: users/{uid}/analyses/{analysis_id}/simulation
sim_docs = list(analysis_doc_ref.collection("simulation").stream())
assert len(sim_docs) > 0, "Simulation was NOT saved in subcollection!"
print(f"[OK] 6. Simulation persisted in subcollection: users/{uid}/analyses/{analysis_id}/simulation/{sim_docs[0].id}")

# 5. Delete analysis via backend DELETE endpoint and verify recursive cleanup
with httpx.Client(timeout=90.0) as client:
    del_resp = client.delete(
        f"{BASE_URL}/api/history/{analysis_id}",
        headers=headers,
    )
    assert del_resp.status_code in (200, 204), f"Delete failed: {del_resp.text}"

assert not analysis_doc_ref.get().exists, "Analysis document still exists after deletion!"
sim_docs_after = list(analysis_doc_ref.collection("simulation").stream())
assert len(sim_docs_after) == 0, "Simulation subcollection still exists after recursive deletion!"
print(f"[OK] 7. Analysis and its simulations recursively deleted from Firestore")

print("=" * 70)
print("ALL AUTOMATED FIRESTORE TESTS PASSED SUCCESSFULLY [OK]")
print("=" * 70)
