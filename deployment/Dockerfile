# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# ReMind AI — backend image (multi-stage)
# Build context is the backend/ directory (see deployment/docker-compose.yml
# and deployment/render.yaml).
# ---------------------------------------------------------------------------

# ---- Stage 1: build wheels for all dependencies ----
FROM python:3.11-slim AS builder

WORKDIR /tmp
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /wheels -r requirements.txt

# ---- Stage 2: slim runtime ----
FROM python:3.11-slim AS runtime

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# NOTE: DeepFace/OpenCV need native libs (libgl1, libglib2.0-0). They are
# commented out of requirements.txt for now, so we skip the apt layer to keep
# the image slim — re-enable it in Phase 4 when the CV stack is turned on.

COPY --from=builder /wheels /wheels
COPY requirements.txt .
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY app ./app

# Run as an unprivileged user
RUN useradd --create-home --uid 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD ["python", "-c", "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8000/health').getcode()==200 else 1)"]

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
