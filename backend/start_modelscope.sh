#!/bin/bash
set -e

# ModelScope Persistence Volume
PERSISTENT_DIR="/mnt/workspace"

# Ensure persistence directory exists
if [ ! -d "$PERSISTENT_DIR" ]; then
    echo "Creating persistent directory at $PERSISTENT_DIR"
    mkdir -p "$PERSISTENT_DIR"
fi

# Set Database URL
if [ -z "$DATABASE_URL" ]; then
    export DATABASE_URL="sqlite:///$PERSISTENT_DIR/vibebuild.db"
    echo "Using persistent database: $DATABASE_URL"
else
    echo "Using custom DATABASE_URL: $DATABASE_URL"
fi

# Run Database Migrations
echo "Running Alembic migrations..."
alembic upgrade head || echo "Warning: Alembic upgrade failed. Attempting schema fix..."

# Force fix schema if needed
if [ -f "../scripts/fix_db_schema.py" ]; then
    echo "Running schema fix script..."
    python ../scripts/fix_db_schema.py
else
    echo "Warning: Schema fix script not found at ../scripts/fix_db_schema.py"
fi

# Initial Data Seeding
echo "Seeding initial data..."
python -m aura_server.initial_data || echo "Initial data seeding failed or already exists."

# Seed Mock Hackathons
if [ -f "../scripts/seed_hackathons.py" ]; then
    echo "Seeding hackathons..."
    python ../scripts/seed_hackathons.py || echo "Hackathon seeding failed."
fi

# Populate Mock Data
if [ -f "../scripts/populate_mock_data.py" ]; then
    echo "Populating mock data..."
    python ../scripts/populate_mock_data.py || echo "Mock data population failed."
fi

# Start Uvicorn Server
# ModelScope/Hugging Face Spaces default port is 7860
PORT=${PORT:-7860}
echo "Starting application on port $PORT..."
exec python -m uvicorn aura_server.main:app --host 0.0.0.0 --port $PORT --workers 1
