"""Firebase Admin SDK initialization.

Initialized once at application startup.
Supports local Firebase emulators under project 'demo-trustguard' or production project.
"""
import logging
import os
from typing import Optional

import firebase_admin
from firebase_admin import credentials, firestore, auth
import google.auth.credentials
from google.cloud.firestore import Client as FirestoreClient

from config import settings

logger = logging.getLogger(__name__)

_app: Optional[firebase_admin.App] = None
_db: Optional[FirestoreClient] = None


class EmulatorCredential(credentials.Base):
    """Anonymous credential for running against local Firebase emulators."""
    def __init__(self):
        super().__init__()
        self._g_credential = google.auth.credentials.AnonymousCredentials()

    def get_credential(self):
        return self._g_credential


def get_firebase_app() -> Optional[firebase_admin.App]:
    """Get or initialize Firebase Admin app."""
    global _app
    if _app is not None:
        return _app

    try:
        _app = firebase_admin.get_app()
        return _app
    except ValueError:
        pass

    project_id = "demo-trustguard" if settings.use_firebase_emulators else settings.firebase_project_id

    if settings.use_firebase_emulators:
        os.environ["FIRESTORE_EMULATOR_HOST"] = os.environ.get("FIRESTORE_EMULATOR_HOST", "localhost:8080")
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = os.environ.get("FIREBASE_AUTH_EMULATOR_HOST", "localhost:9099")
        os.environ["GCLOUD_PROJECT"] = project_id
        cred = EmulatorCredential()
        _app = firebase_admin.initialize_app(cred, {"projectId": project_id})
        logger.info(f"Initialized Firebase Admin SDK with Emulators (project={project_id})")
    elif settings.google_application_credentials and os.path.exists(settings.google_application_credentials):
        cred = credentials.Certificate(settings.google_application_credentials)
        _app = firebase_admin.initialize_app(cred, {"projectId": project_id})
        logger.info(f"Initialized Firebase Admin SDK with service account (project={project_id})")
    else:
        try:
            # Application default credentials
            _app = firebase_admin.initialize_app(options={"projectId": project_id})
            logger.info(f"Initialized Firebase Admin SDK with Application Default Credentials (project={project_id})")
        except Exception as e:
            logger.warning(f"Firebase Admin SDK initialization deferred: {e}")
            _app = None

    return _app


def get_firestore_db() -> Optional[FirestoreClient]:
    """Get Firestore client instance."""
    global _db
    if _db is not None:
        return _db

    app = get_firebase_app()
    if app is not None:
        try:
            _db = firestore.client(app=app)
        except Exception as e:
            logger.warning(f"Firestore client initialization failed: {e}")
            _db = None
    return _db


def is_admin_ready() -> bool:
    """Check if Firebase Admin SDK is initialized and ready."""
    return get_firebase_app() is not None
