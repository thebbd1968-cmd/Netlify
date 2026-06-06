"""
Douglas Real Estate Systems — FastAPI Application
Main entry point for the backend API server.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db

app = FastAPI(
    title="Douglas Real Estate Systems",
    description="Specialized real estate operations platform — deal analysis, CRM, portfolio tracking, and automated workflows.",
    version="0.1.0",
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[x for x in [
        "http://localhost:5173",
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", ""),
    ] if x],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
from app.routers import auth, contacts, properties, deals, tasks, portfolios, tools, webhooks, analysis, reports, nurture

app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(properties.router)
app.include_router(deals.router)
app.include_router(tasks.router)
app.include_router(portfolios.router)
app.include_router(tools.router)
app.include_router(webhooks.router)
app.include_router(analysis.router)
app.include_router(reports.router)
app.include_router(nurture.router)


@app.on_event("startup")
def on_startup():
    """Initialize database tables on first run."""
    init_db()


@app.get("/health")
def health_check():
    return {"status": "ok", "version": "0.1.0"}