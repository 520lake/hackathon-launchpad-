import sys
import os
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("vibebuild")

# Add backend directory to python path
# backend/app -> import app
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.main import app
from app.db.session import init_db

if __name__ == "__main__":
    try:
        # Initialize database tables
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error initializing database: {e}")
        # Continue anyway, as some errors might be recoverable or migration-related

    # ModelScope/HuggingFace Spaces typically use port 7860
    port = int(os.environ.get("PORT", 7860))
    logger.info(f"Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)
