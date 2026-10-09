"""TrustGuard AI — FastAPI application."""
import logging
import uuid

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from config import settings
from errors import TrustGuardError, trustguard_error_handler, ErrorCode, ERROR_MESSAGES
from routers import health, conversation

# Configure logging - never log content, filenames, keys, prompts or model responses
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="TrustGuard AI",
    description="AI-powered digital safety layer",
    version="0.1.0",
)

app.state.limiter = limiter

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error handlers
app.add_exception_handler(TrustGuardError, trustguard_error_handler)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    return JSONResponse(
        status_code=429,
        content={"code": ErrorCode.RATE_LIMITED.value, "message": ERROR_MESSAGES[ErrorCode.RATE_LIMITED]},
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(f"Unhandled error request_id={request_id} endpoint={request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"code": "INTERNAL_ERROR", "message": "An unexpected error occurred. Please try again."},
    )


@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# Routers
from routers import history, payment, document, voice, whatif
app.include_router(health.router)
app.include_router(conversation.router)
app.include_router(payment.router)
app.include_router(document.router)
app.include_router(voice.router)
app.include_router(whatif.router)
app.include_router(history.router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
