"""Pytest fixtures for the backend.

The database URL and the Gumroad webhook secret are set *before* any ``app.*``
module is imported, because those modules read configuration at import time.
"""
import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

# Isolated SQLite file for the test run (never touches backend/data/).
_TMP_DIR = tempfile.mkdtemp(prefix="douglas-re-tests-")
os.environ["DATABASE_URL"] = f"sqlite:///{_TMP_DIR}/test.sqlite"
os.environ.setdefault("GUMROAD_WEBHOOK_SECRET", "test-secret-do-not-use-in-prod")

import pytest  # noqa: E402

TEST_SECRET = os.environ["GUMROAD_WEBHOOK_SECRET"]


@pytest.fixture(scope="session")
def app_client():
    """A TestClient bound to the real FastAPI app, with tables created."""
    from fastapi.testclient import TestClient

    from app.database import init_db
    from app.main import app

    init_db()
    with TestClient(app) as client:
        yield client


@pytest.fixture()
def client(app_client):
    """A TestClient with empty users/subscriptions tables for each test."""
    from app.database import SessionLocal
    from app.models.subscription import Subscription
    from app.models.user import User

    db = SessionLocal()
    try:
        db.query(Subscription).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()

    yield app_client

    db = SessionLocal()
    try:
        db.query(Subscription).delete()
        db.query(User).delete()
        db.commit()
    finally:
        db.close()


@pytest.fixture()
def db_session():
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
