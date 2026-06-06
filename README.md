# Douglas Real Estate Systems

**A specialized real estate operations platform** that sits alongside the Viktor AI employee platform — purpose-built for agents, investors, and institutions.

## Quick Start

```bash
# 1. Start the backend API
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. In another terminal, seed demo data
cd backend
python seeds.py

# 3. Start the frontend dev server
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and log in with:
- **Agent**: `agent@douglasre.com` / `password123`
- **Investor**: `investor@douglasre.com` / `password123`

## Product Vision

Built for three customer types:

| Persona | Need |
|---------|------|
| **Active Amy** (Agent) | Scale from 15→40 deals/yr with automation |
| **Scaling Steve** (Investor) | Quick deal analysis & portfolio tracking |
| **Broker Bob** (Firm Owner) | Team-wide KPIs & standardized workflows |

## Phase 1 (MVP) Features

- ✅ **Unified CRM Dashboard** — Contact management with real estate fields
- ✅ **Property Analysis Engine** — Cap rate, cash-on-cash, ROI calculations
- 🔜 **Viktor Auto-Nurture** — AI-driven email/SMS follow-up sequences
- ✅ **Task Management** — Kanban board for deal stages
- ✅ **Basic Reporting** — Pipeline summary, deal counts, commissions

## Project Structure

```
├── backend/          # Python FastAPI backend
│   ├── app/          # API application
│   │   ├── models/   # Database models (User, Contact, Property, Deal, Task, Portfolio)
│   │   ├── routers/  # REST API endpoints
│   │   └── schemas/  # Pydantic request/response models
│   └── seeds.py      # Demo data seeder
├── frontend/         # React + TypeScript + Vite frontend
│   └── src/
│       ├── api/      # API client
│       ├── pages/    # Route pages
│       └── layouts/  # App shell
└── docs/
    └── architecture.md  # Full architecture documentation
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy, SQLite (PostgreSQL-ready)
- **Auth**: JWT (python-jose + passlib/bcrypt)

## Team

- **Lead**: Team management, task planning
- **Product Researcher**: Market analysis, feature requirements
- **Software Engineer**: Architecture, implementation, deployment

## License

Internal — Douglas Real Estate Systems