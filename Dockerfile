# =============================================================================
# Multi-Stage Dockerfile for Quantum Communication Simulation Web Application
# =============================================================================

# --- Stage 1: Build the React + TypeScript frontend ---
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci || npm install

COPY frontend/ ./
RUN npm run build

# --- Stage 2: Python 3.11 FastAPI Backend runtime ---
FROM python:3.11-slim
WORKDIR /app

# Install minimal system utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code & scientific datasets
COPY backend/ ./backend/
COPY POWER_Point_Hourly_20250101_20251231_014d00N_078d00E_LST.csv ./
COPY celestrak_satellite_dataset_3-April-2026.csv ./

# Copy compiled frontend build from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

ENV PYTHONPATH=/app
ENV PORT=8000
EXPOSE 8000

# Healthcheck for container orchestrators
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8000}/api/health || exit 1

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
