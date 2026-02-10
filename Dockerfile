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

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
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
CMD ["bash", "start_modelscope.sh"]
