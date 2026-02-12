#!/bin/sh
set -e

# Run migrations
alembic upgrade head

# Create initial data (optional)
# python app/initial_data.py

# Start application
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
