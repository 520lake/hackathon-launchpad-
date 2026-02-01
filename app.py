import sys
import os
import uvicorn

# Add backend directory to python path
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.main import app

if __name__ == "__main__":
    # ModelScope/HuggingFace Spaces typically use port 7860
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
