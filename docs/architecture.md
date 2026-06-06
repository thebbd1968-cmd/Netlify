# Douglas Real Estate Systems — Architecture

## Overview

Douglas Real Estate Systems is a specialized real estate operations platform built to sit alongside the Viktor AI employee platform. It serves agents, investors, and small-to-mid-size firms with deal analysis, CRM, portfolio tracking, and automated workflows.

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | React 19 + TypeScript + Vite | Lightweight, fast builds, memory-efficient |
| **Styling** | Tailwind CSS v4 | Utility-first, rapid prototyping |
| **State/Data** | TanStack Query (React Query) | Server-state caching for property/deal data |
| **Routing** | React Router v7 | Client-side SPA routing |
| **Backend** | Python 3.10+ / FastAPI | Async support, auto-docs, AI-friendly |
| **Database** | SQLite (dev) → PostgreSQL (prod) | Simple dev setup, scalable prod |
| **Auth** | JWT (python-jose + passlib) | Stateless auth for API + frontend |

## Project Structure

```
/home/team/shared/
├── README.md               # Root project overview & setup
├── backend/
│   ├── README.md           # Backend setup guide
│   ├── requirements.txt    # Python dependencies
│   ├── seeds.py            # Demo data seeder
│   ├── app/
│   │   ├── main.py         # FastAPI entry point, routers, CORS
│   │   ├── database.py     # SQLAlchemy engine, session, init_db()
│   │   ├── models/         # SQLAlchemy ORM models
│   │   │   ├── user.py     # User/agent/investor accounts
│   │   │   ├── contact.py  # CRM leads & contacts
│   │   │   ├── property.py # Property listings & analysis
│   │   │   ├── deal.py     # Deal pipeline (lead→closed)
│   │   │   ├── task.py     # Kanban tasks & follow-ups
│   │   │   └── portfolio.py# Investor portfolios
│   │   ├── routers/        # FastAPI route handlers
│   │   │   ├── auth.py     # Register, login, JWT, me
│   │   │   ├── contacts.py # CRUD + lead management
│   │   │   ├── properties.py# CRUD + analysis engine
│   │   │   ├── deals.py    # CRUD + pipeline summary
│   │   │   ├── tasks.py    # CRUD + complete action
│   │   │   └── portfolios.py# CRUD + property linking
│   │   └── schemas/        # Pydantic request/response schemas
│   └── tests/              # Test directory
├── frontend/
│   ├── README.md           # Frontend setup guide
│   ├── vite.config.ts      # Vite config + Tailwind + API proxy
│   └── src/
│       ├── main.tsx        # React entry point
│       ├── App.tsx         # Router + providers
│       ├── index.css       # Tailwind import
│       ├── api/
│       │   └── client.ts   # API client (typed fetch wrapper)
│       ├── types/
│       │   └── index.ts    # TypeScript interfaces
│       ├── layouts/
│       │   └── DashboardLayout.tsx  # Sidebar + main area
│       └── pages/
│           ├── LoginPage.tsx        # Auth page
│           ├── DashboardPage.tsx    # Stats + pipeline overview
│           ├── DealsPage.tsx        # Kanban pipeline
│           ├── ContactsPage.tsx     # CRM table
│           ├── PropertiesPage.tsx   # Property cards + analysis
│           ├── TasksPage.tsx        # Kanban board
│           └── PortfoliosPage.tsx   # Portfolio health cards
└── docs/
    └── architecture.md     # This file
```

## Database Schema (Entity-Relationship)

```
User (1) ──── (*) Contact      # User owns contacts (CRM)
User (1) ──── (*) Property     # User owns properties
User (1) ──── (*) Deal         # User manages deals
User (1) ──── (*) Task         # User has tasks
User (1) ──── (*) Portfolio    # User has portfolios

Contact (1) ─ (*) Deal         # Contact linked to deals
Property (1) ─ (*) Deal        # Property linked to deals
Deal    (1) ─ (*) Task         # Tasks can be scoped to deals
Contact (1) ─ (*) Task         # Tasks can be scoped to contacts

Portfolio (*) ─ (*) Property   # Many-to-many via portfolio_properties
```

## REST API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Get JWT token |
| GET | `/auth/me` | Current user info |

### Contacts (CRM)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/contacts` | List contacts (paginated, filterable) |
| POST | `/contacts` | Create contact |
| GET | `/contacts/{id}` | Get contact |
| PUT | `/contacts/{id}` | Update contact |
| DELETE | `/contacts/{id}` | Delete contact |

### Properties
| Method | Path | Description |
|--------|------|-------------|
| GET | `/properties` | List properties |
| POST | `/properties` | Create property |
| GET | `/properties/{id}` | Get property |
| PUT | `/properties/{id}` | Update property |
| DELETE | `/properties/{id}` | Delete property |
| POST | `/properties/{id}/analyze` | Run deal analysis (cap rate, cash-on-cash, ROI) |

### Deals
| Method | Path | Description |
|--------|------|-------------|
| GET | `/deals` | List deals |
| POST | `/deals` | Create deal |
| GET | `/deals/{id}` | Get deal |
| PUT | `/deals/{id}` | Update deal |
| DELETE | `/deals/{id}` | Delete deal |
| GET | `/deals/pipeline/summary` | Deal counts by stage |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tasks` | List tasks |
| POST | `/tasks` | Create task |
| GET | `/tasks/{id}` | Get task |
| PUT | `/tasks/{id}` | Update task |
| POST | `/tasks/{id}/complete` | Mark task done |
| DELETE | `/tasks/{id}` | Delete task |

### Portfolios
| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolios` | List portfolios |
| POST | `/portfolios` | Create portfolio |
| GET | `/portfolios/{id}` | Get portfolio |
| PUT | `/portfolios/{id}` | Update portfolio |
| DELETE | `/portfolios/{id}` | Delete portfolio |
| GET | `/portfolios/{id}/properties` | List properties in portfolio |
| POST | `/portfolios/{id}/properties/{propId}` | Add property to portfolio |
| DELETE | `/portfolios/{id}/properties/{propId}` | Remove property from portfolio |

## Analysis Engine

The property analysis endpoint (`POST /properties/{id}/analyze`) computes:

1. **Cap Rate** = (Annual NOI) / Property Value × 100
   - NOI = (Monthly Rent × 12) - Annual HOA
2. **Cash-on-Cash Return** = Annual Cash Flow / Down Payment × 100
   - Assumes 20% down payment
3. **Gross Yield** = (Annual Rent / Purchase Price) × 100

## Viktor Integration Points (Future)

| Trigger | Viktor Action |
|---------|---------------|
| New lead in CRM | Auto-nurture sequence (email/SMS) |
| Deal reaches "offer" stage | Generate offer summary docs |
| Property analyzed | Flag potential issues (high HOA, etc.) |
| Weekly cadence | Market report for portfolio properties |
| Task overdue | Follow-up reminder to agent |

## Development Workflow

1. Start backend: `cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
2. Seed database: `cd backend && python seeds.py`
3. Start frontend: `cd frontend && npm run dev`
4. Open: http://localhost:5173

The Vite dev server proxies `/api/*` requests to the backend at `localhost:8000`, so no CORS issues during development.