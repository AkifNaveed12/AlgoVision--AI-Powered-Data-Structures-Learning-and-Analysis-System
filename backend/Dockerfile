# ─────────────────────────────────────────────────────────────────────────────
# AlgoVision Backend — Dockerfile
# Build context MUST be the project root (one level above /backend)
# so that `from backend.xxx import ...` works correctly.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Install all compiler/runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ \
    gcc \
    nodejs \
    npm \
    default-jdk \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set /app as working directory — the project ROOT is copied here
WORKDIR /app

# Install Python dependencies (copy from backend/ subfolder)
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the entire backend package so imports like `from backend.xxx` work
COPY backend/ ./backend/

EXPOSE 8000

# Run from /app so Python can resolve the `backend` package
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
