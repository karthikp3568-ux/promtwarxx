"""History management router."""
import logging
from fastapi import APIRouter, Depends, Response, status

from errors import TrustGuardError, ErrorCode
from services.auth import get_current_user
from services.history_store import (
    retry_save_analysis,
    delete_analysis_doc,
    delete_all_user_analyses,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/history", tags=["history"])


@router.post("/{analysis_id}/retry")
async def retry_save(
    analysis_id: str,
    uid: str = Depends(get_current_user),
):
    """Retry saving an analysis that previously failed."""
    success = await retry_save_analysis(uid, analysis_id)
    if not success:
        raise TrustGuardError(ErrorCode.HISTORY_SAVE_FAILED)
    return {"saved": True}


@router.delete("/{analysis_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_analysis(
    analysis_id: str,
    uid: str = Depends(get_current_user),
):
    """Recursively delete a single analysis and its simulations."""
    success = await delete_analysis_doc(uid, analysis_id)
    if not success:
        raise TrustGuardError(ErrorCode.HISTORY_UNAVAILABLE)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_all_history(
    uid: str = Depends(get_current_user),
):
    """Recursively delete all analyses and simulations for the authenticated user."""
    success = await delete_all_user_analyses(uid)
    if not success:
        raise TrustGuardError(ErrorCode.HISTORY_UNAVAILABLE)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
