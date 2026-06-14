# Douglas Real Estate Systems — Deployment Guide

> Deploy your live demo in 10 minutes for client presentations.

---

## Prerequisites

- GitHub account (your code is already at `github.com/thebbd1968-cmd/Netlify`)
- Netlify account (free at [app.netlify.com](https://app.netlify.com))
- Render account (free at [render.com](https://render.com))

---

## Step 1: Deploy the Backend (Render)

**Time: ~5 minutes**

1. Go to [render.com](https://render.com) and sign up / log in
2. Click **Dashboard → New → Blueprint**
3. Connect your GitHub account
4. Select the repository: `thebbd1968-cmd/Netlify`
5. Render will auto-detect the `render.yaml` configuration
6. Click **Apply**
7. Wait ~2 minutes for the build to complete

**Backend URL:** `https://douglas-re-backend.onrender.com`

> **Note:** The first deploy may take a few minutes while Render installs Python dependencies.

---

## Step 2: Deploy the Frontend (Netlify)

**Time: ~5 minutes**

1. Go to [app.netlify.com](https://app.netlify.com) and sign up / log in
2. Click **Add new site → Import existing project**
3. Connect your GitHub account
4. Select the repository: `thebbd1968-cmd/Netlify`
5. Netlify will auto-detect the `netlify.toml` configuration:
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
6. Click **Deploy site**
7. Wait ~1 minute for the build to complete

**Frontend URL:** `https://[your-site-name].netlify.app`

> **Tip:** You can customize the URL in Netlify: **Site settings → Change site name**

---

## Step 3: Connect Frontend to Backend

After both services are deployed:

1. Go to your **Render dashboard** and copy your backend URL
2. Go to your **Netlify dashboard → Site settings → Environment variables**
3. Add a variable:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://douglas-re-backend.onrender.com`
4. **Rebuild** your Netlify site (Deploy → Trigger deploy)

Or skip this step — the default config already proxies `/api/*` calls to Render.

---

## Step 4: Log In & Demo

Open your Netlify URL in any browser and log in:

| Role | Email | Password |
|------|-------|----------|
| Agent | `agent@douglasre.com` | `password123` |
| Investor | `investor@douglasre.com` | `password123` |

---

## Features Available in the Demo

| Feature | Description |
|---------|-------------|
| **Dashboard** | Live stats cards, pipeline summary, recent deals & tasks |
| **Contacts CRM** | Real estate-specific fields, lead source/status tracking, budget ranges |
| **Properties** | Card grid with address, details, and one-click analysis button |
| **Deal Pipeline** | 5-stage kanban: Lead → Showing → Offer → Under Contract → Closed |
| **Tasks** | Kanban board with priority indicators and completion tracking |
| **Portfolios** | Investor dashboard with income, expenses, equity, cash flow |
| **Auto-Nurture** | Follow-up sequences with templates, triggers, and default presets |
| **Reports** | GCI tracking and full dashboard summary |

---

## API Endpoints (for Viktor Integration)

Once deployed, these endpoints are available for your Viktor AI employee:

| Endpoint | Purpose |
|----------|---------|
| `POST /tools/analyze-and-draft` | Property analysis + drafted email/SMS |
| `POST /tools/quick-analyze` | Lightweight financial analysis |
| `POST /webhooks/viktor/event` | Viktor sends events to trigger workflows |
| `POST /webhooks/viktor/update-contact-status` | Viktor updates lead status |
| `POST /nurture/check-triggers` | Check which follow-ups should fire |
| `POST /nurture/send` | Log a sent follow-up message |
| `POST /nurture/log-response` | Log a lead's response to a follow-up |

**Set these environment variables on Render:**
- `VIKTOR_WEBHOOK_URL` — your Viktor webhook URL
- `VIKTOR_WEBHOOK_SECRET` — your Viktor webhook secret
- `JWT_SECRET` — auto-generated (leave blank for auto)

---

## Troubleshooting

**Frontend shows blank page:**
- Check that the build succeeded in Netlify deploy log
- Ensure `_redirects` file is in `frontend/public/` (already included)

**API calls fail (502 errors):**
- Verify your backend is running at the Render URL
- Check CORS settings in `backend/app/main.py` (already configured)

**Login doesn't work:**
- Make sure the backend has been seeded with demo data
- The backend auto-seeds on first startup via `seeds.py`

---

## Alternative: Docker Deployment

If you prefer containers:

```bash
docker build -t douglas-re-backend .
docker run -p 8000:8000 douglas-re-backend
```

---

*Douglas Real Estate Systems — Built on the cto.new platform with Viktor AI integration*
