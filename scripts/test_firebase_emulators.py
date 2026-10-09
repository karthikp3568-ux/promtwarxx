"""Verify Firebase Auth and Firestore emulators with Python Admin SDK."""
import os
import firebase_admin
from firebase_admin import credentials, firestore, auth
import google.auth.credentials

print("Testing Firebase Emulators...")

os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"
os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = "localhost:9099"
os.environ["GCLOUD_PROJECT"] = "demo-trustguard"

class EmulatorCredential(credentials.Base):
    def __init__(self):
        super().__init__()
        self._g_credential = google.auth.credentials.AnonymousCredentials()
    def get_credential(self):
        return self._g_credential

app = firebase_admin.initialize_app(EmulatorCredential(), {"projectId": "demo-trustguard"})
db = firestore.client(app=app)

# Test Firestore write & read
doc_ref = db.collection("test").document("ping")
doc_ref.set({"status": "emulator_ok", "version": 3})
data = doc_ref.get().to_dict()
print("[PASS] Firestore emulator verified:", data)

# Test Auth create user
user = auth.create_user(email="judge@demo.example", password="testpassword123")
print("[PASS] Auth emulator user created successfully:", user.uid, user.email)

print("[PASS] All Firebase Emulators verification passed!")
