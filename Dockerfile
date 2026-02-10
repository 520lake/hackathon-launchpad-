# Stage 1: Build Frontend
FROM node:18-alpine as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# Stage 2: Backend Runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (Minimal for SQLite)
# Removed heavy build-essential/libpq-dev to prevent OOM
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy scripts
COPY scripts /app/scripts

# Copy backend code
COPY backend /app/backend

# Copy frontend artifacts from Stage 1
COPY --from=frontend-build /app/frontend/dist /app/backend/static_dist

# Expose port
EXPOSE 7860

# Environment variables
ENV PYTHONPATH=/app/backend

# Run
WORKDIR /app/backend
RUN chmod +x start_modelscope.sh
CMD ["bash", "start_modelscope.sh"]
