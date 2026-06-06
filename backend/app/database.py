"""
Database configuration and session management.
Uses SQLite for development — swap to PostgreSQL for production.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./data/douglas_re.sqlite",
)

# SQLite needs check_same_thread=False for FastAPI async
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Call once on startup."""
    # Import all models so they register on Base.metadata
    from app.models import user, contact, property, deal, portfolio, task, nurture  # noqa: F401

    os.makedirs("data", exist_ok=True)
    Base.metadata.create_all(bind=engine)