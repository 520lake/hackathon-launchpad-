# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
# Use npm ci if package-lock exists, otherwise npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY frontend ./
RUN npm run build

# Stage 2: Backend Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (Minimal for SQLite and builds)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy scripts
COPY scripts /app/scripts

# Copy backend code
COPY backend /app/backend

# Copy frontend artifacts from Stage 1
# This assumes the build output is in 'dist'. Adjust if it's 'build'.
COPY --from=frontend-build /app/frontend/dist /app/backend/static_dist

# Expose port 7860 (Standard for Hugging Face Spaces / ModelScope)
EXPOSE 7860

# Environment variables
ENV PYTHONPATH=/app/backend
ENV PORT=7860

# Run
WORKDIR /app/backend
RUN chmod +x start_modelscope.sh
CMD ["bash", "start_modelscope.sh"]
