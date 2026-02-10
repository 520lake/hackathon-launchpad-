import os
import sys
import importlib.util

APP_DIR = os.path.join(os.path.dirname(__file__), "backend", "app")
INIT_FILE = os.path.join(APP_DIR, "__init__.py")

if os.path.exists(INIT_FILE):
    spec = importlib.util.spec_from_file_location(
        "app",
        INIT_FILE,
        submodule_search_locations=[APP_DIR]
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    sys.modules["app"] = module

from app.main import app
