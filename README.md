# Douglas Real Estate Systems

**A specialized real estate operations platform** that sits alongside the Viktor AI employee platform — purpose-built for agents, investors, and institutions.

## Quick Start (Local Development)

```bash
# 1. Start the backend API
cd backend
pip install -r requirements.txt
python seeds.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 2. In another terminal, start the frontend dev server
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and log in with:
- **Agent**: `agent@douglasre.com` / `password123`
- **Investor**: `investor@douglasre.com` / `password123`

## 🌐 Deployment to Production

### Frontend → Netlify (One-Click Deploy)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/thebbd1968-cmd/Netlify)

**Or deploy manually:**

1. Connect your GitHub repo to Netlify
2. Build settings are auto-configured in `netlify.toml`:
   - **Base directory:** `frontend`
   - **Publish directory:** `frontend/dist`
   - **Build command:** `npm run build`
3. Set environment variable `VITE_API_URL` to your backend URL (e.g., `https://douglas-re-backend.onrender.com`)
4. Deploy!

The `_redirects` file handles SPA routing — all paths fall back to `index.html`.

### Backend → Render (or Fly.io)

**Option A: Render (recommended)**

1. Push this repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Connect your GitHub repo
4. Use settings from `render.yaml`:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables:
   - `JWT_SECRET` — auto-generated secret
   - `FRONTEND_URL` — your Netlify URL
   - `VIKTOR_WEBHOOK_URL` — (optional) Viktor integration
   - `VIKTOR_WEBHOOK_SECRET` — (optional) Viktor integration

**Option B: Docker (Fly.io / Railway / any container host)**

```bash
# Build the Docker image
docker build -t douglas-re-backend .

# Run it
docker run -p 8000:8000 \
  -e JWT_SECRET=your-secret \
  -e FRONTEND_URL=https://your-frontend.netlify.app \
  douglas-re-backend
```

### Database Notes

The MVP runs on **SQLite** (stored in `backend/data/`). For production:

1. Set `DATABASE_URL` env var to your PostgreSQL connection string
2. Run migrations: `cd backend && alembic upgrade head`

---

## Product Vision

Built for three customer types:

| Persona | Need |
|---------|------|
| **Active Amy** (Agent) | Scale from 15→40 deals/yr with automation |
| **Scaling Steve** (Investor) | Quick deal analysis & portfolio tracking |
| **Broker Bob** (Firm Owner) | Team-wide KPIs & standardized workflows |

## MVP Features

| Feature | Status | Description |
|---------|--------|-------------|
| Unified CRM Dashboard | ✅ | Contact management with real estate-specific fields |
| Property Analysis Engine | ✅ | Cap rate, cash-on-cash, ROI, gross yield calculations |
| Deal Kanban Board | ✅ | Lead → Showing → Offer → Under Contract → Closed |
| Basic Reporting | ✅ | GCI, pipeline value, deal counts |
| Viktor Webhooks & Tools | ✅ | Event system, webhooks, analyze-and-draft tool |
| Viktor Auto-Nurture | ✅ | AI-driven email/SMS follow-up sequences |
| Portfolio Management | ✅ | Investor portfolio tracking with financial summaries |

## API Overview

| Route Group | Description |
|---|---|
| `/auth` | Register, login, JWT tokens |
| `/contacts` | CRM — leads, clients, past customers |
| `/properties` | Property listings with analysis engine |
| `/deals` | Deal pipeline with kanban stages |
| `/tasks` | Kanban task board |
| `/portfolios` | Investor portfolio management |
| `/reports` | GCI and summary reporting |
| `/nurture` | Auto follow-up sequences & templates |
| `/webhooks/viktor` | Viktor AI event receivers |
| `/tools` | Viktor AI tool endpoints |
| `/analysis` | Financial calculator & market lookup |

Full API spec: [`api_specification.md`](./api_specification.md)

## Project Structure

```
├── backend/            # Python FastAPI backend
│   ├── app/
│   │   ├── models/     # DB models (User, Contact, Property, Deal, Task, Portfolio, FollowUp)
│   │   ├── routers/    # 10 API route files
│   │   ├── schemas/    # Request/response validation
│   │   └── events.py   # Event system for Viktor integration
│   └── seeds.py        # Demo data seeder
├── frontend/           # React + TypeScript + Vite
│   └── src/
│       ├── api/        # Typed API client
│       ├── pages/      # 7 route pages
│       └── layouts/    # App shell
├── dockerfile          # Backend container
├── netlify.toml        # Netlify frontend config
├── render.yaml         # Render backend config
└── docs/
    ├── architecture.md # Full architecture docs
```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router
- **Backend**: Python 3.12, FastAPI, SQLAlchemy, SQLite (PostgreSQL-ready)
- **Auth**: JWT with bcrypt
- **AI Integration**: Viktor (webhooks + REST API tools)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | ✅ | Secret key for JWT tokens |
| `DATABASE_URL` | ❌ | PostgreSQL URL (defaults to SQLite) |
| `FRONTEND_URL` | ⚠️ | Frontend URL for CORS |
| `VIKTOR_WEBHOOK_URL` | ❌ | Viktor webhook endpoint |
| `VIKTOR_WEBHOOK_SECRET` | ❌ | Viktor webhook secret |
| `VITE_API_URL` | ⚠️ | Backend API URL (frontend build-time) |

## License

Internal — Douglas Real Estate Systems