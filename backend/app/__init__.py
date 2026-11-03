"""
Douglas Real Estate Systems — backend package.

Loading the project's .env happens here, before any submodule is imported, so every
module that reads configuration with ``os.getenv`` at import time (database URL,
Gumroad credentials, webhook secret, ...) sees the values from ``backend/.env``.

``load_dotenv`` never overrides variables that are already set in the process
environment, so a real deployment env (or a test's monkeypatched env) always wins.
"""
from pathlib import Path

from dotenv import load_dotenv

# backend/app/__init__.py → backend/.env
load_dotenv(Path(__file__).resolve().parent.parent / ".env")
