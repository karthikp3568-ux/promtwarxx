"""Firebase Authentication dependency for FastAPI.

Verifies the Firebase ID token in the Authorization header.
Extracts the verified UID. Never accepts a UID from headers, body, or query.
"""
import logging
from typing import Optional
from fastapi import Header, Request
from firebase_admin import auth as fb_auth

from errors import TrustGuardError, ErrorCode
from services.firebase_app import get_firebase_app

logger = logging.getLogger(__name__)


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> str:
    """FastAPI dependency to verify Firebase ID token and return verified uid.

    Raises:
        TrustGuardError(AUTH_REQUIRED, 401) if header is missing or not Bearer.
        TrustGuardError(AUTH_INVALID, 401) if token is invalid or expired.
    """
    if not authorization:
        raise TrustGuardError(ErrorCode.AUTH_REQUIRED, status_code=401)

    parts = authorization.strip().split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise TrustGuardError(ErrorCode.AUTH_REQUIRED, status_code=401)

    token = parts[1]

    # Ensure Firebase Admin SDK is initialized
    app = get_firebase_app()
    if app is None:
        logger.error("Firebase Admin SDK not initialized when verifying token")
        raise TrustGuardError(ErrorCode.FIREBASE_UNAVAILABLE, status_code=503)

    try:
        decoded = fb_auth.verify_id_token(token, app=app)
        uid = decoded.get("uid")
        if not uid:
            raise TrustGuardError(ErrorCode.AUTH_INVALID, status_code=401)
        return uid
    except fb_auth.ExpiredIdTokenError:
        logger.info("Firebase ID token expired")
        raise TrustGuardError(ErrorCode.AUTH_INVALID, status_code=401)
    except fb_auth.RevokedIdTokenError:
        logger.info("Firebase ID token revoked")
        raise TrustGuardError(ErrorCode.AUTH_INVALID, status_code=401)
    except fb_auth.InvalidIdTokenError:
        logger.info("Firebase ID token invalid")
        raise TrustGuardError(ErrorCode.AUTH_INVALID, status_code=401)
    except Exception as e:
        logger.warning(f"Unexpected token verification error: {e}")
        raise TrustGuardError(ErrorCode.AUTH_INVALID, status_code=401)
