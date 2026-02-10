import os
import sys
import importlib.util

# Ensure the 'app' package resolves to the backend/app directory
BASE_DIR = os.path.dirname(__file__)
APP_DIR = os.path.join(BASE_DIR, "app")
INIT_FILE = os.path.join(APP_DIR, "__init__.py")

# Create a ModuleSpec that marks 'app' as a package with proper submodule search locations
spec = importlib.util.spec_from_file_location(
    "app",
    INIT_FILE,
    submodule_search_locations=[APP_DIR]
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
sys.modules["app"] = module

# Now import the FastAPI instance from app.main
from app.main import app  # noqa: E402

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
