FROM python:3.10-slim

WORKDIR /app

# Install dependencies from root requirements.txt
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app.py ./app.py
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Expose Studio port
EXPOSE 7860

# Ensure Python can import from /app/backend where the 'app' package lives
ENV PYTHONPATH=/app/backend

# Launch FastAPI via Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "app:app"]
