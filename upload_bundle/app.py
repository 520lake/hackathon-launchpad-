import os
import sys
import socket

# Ensure 'backend' is importable as a package, then import FastAPI app from backend.app.main
PROJECT_ROOT = os.path.dirname(__file__)
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    # Prefer platform-provided port but avoid conflicts; fallback to 7860/8000
    candidates = []
    for key in ("PORT", "STUDIO_SERVICE_PORT", "SPACE_PORT"):
        val = os.environ.get(key)
        if val and val.isdigit():
            candidates.append(int(val))
    candidates += [7860, 8000]
    port = None
    for p in candidates:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            s.bind(("0.0.0.0", p))
            s.close()
            port = p
            break
        except OSError:
            continue
    if port is None:
        port = 15181
    uvicorn.run(app, host="0.0.0.0", port=port)
