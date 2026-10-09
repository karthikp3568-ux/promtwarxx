# ==============================================================================
# TrustGuard AI — Cloud Run Production Dockerfile
# Optimized for Python 3.11, CPU-only PyTorch & WavLM Forensics
# ==============================================================================
FROM python:3.11-slim AS runner

# Prevent Python from writing .pyc and buffering stdout/stderr
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    TRANSFORMERS_CACHE=/app/.cache/huggingface \
    HF_HOME=/app/.cache/huggingface

WORKDIR /app

# Install minimal OS runtime packages for audio analysis (libsndfile/ffmpeg) & image parsing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libsndfile1 \
    ffmpeg \
    libgl1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only first to prevent downloading 3GB+ CUDA libraries
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install remaining dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application codebase
COPY . .

# Pre-cache WavLM audio forensics weights into the container image
# This ensures sub-second Cloud Run cold starts and avoids runtime HuggingFace downloads
RUN python scripts/download_models.py

# Create unprivileged application user for security best practice
RUN useradd -m -u 1000 trustguard && \
    chown -R trustguard:trustguard /app
USER trustguard

# Cloud Run injects $PORT (default 8080)
EXPOSE 8080

# Health check to ensure service readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:${PORT}/health || exit 1

# Launch FastAPI via Uvicorn (Cloud Run manages port via PORT env var)
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1
