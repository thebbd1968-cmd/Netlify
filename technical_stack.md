# Technical Stack Recommendations

## Architecture Overview
The system will be a web-based SaaS platform designed to sit alongside the Viktor AI platform. It requires a robust backend for deal analysis and a responsive frontend for dashboards.

## 1. Backend
*   **Language:** Python 3.10+
    *   *Why:* Best ecosystem for AI/LLM integration and financial analysis libraries.
*   **Framework:** FastAPI
    *   *Why:* High performance, easy to build async endpoints for Viktor callbacks.
*   **Database:** PostgreSQL (with PostGIS for location-based queries)
    *   *Why:* Relational data is key for property-agent-client relationships. PostGIS allows for "Search in radius" features.
*   **Task Queue:** Celery + Redis
    *   *Why:* For backgrounding property data scraping or mass-email tasks.

## 2. Frontend
*   **Framework:** React with Next.js (App Router)
    *   *Why:* Excellent for SEO (on listing pages) and fast, responsive dashboards.
*   **Styling:** Tailwind CSS + Shadcn UI
    *   *Why:* Fast prototyping and a clean, professional look.
*   **State Management:** TanStack Query (React Query)
    *   *Why:* Efficiently handles server-state for property data.

## 3. AI & Integrations
*   **AI Employee Platform:** Viktor
    *   *Integration:* Webhooks and REST API. Viktor will act as the "agent" executing tasks (follow-ups, data scraping).
*   **Data Providers:** PropStream API, Zillow API, or Attom Data.
*   **Authentication:** Clerk or Auth0
    *   *Why:* Secure, multi-tenant authentication out of the box.

## 4. Infrastructure
*   **Hosting:** Vercel (Frontend), AWS or Fly.io (Backend).
*   **CI/CD:** GitHub Actions.
*   **Monitoring:** Sentry (Error tracking) and PostHog (Product analytics).

## Integration Strategy with Viktor
1.  **Event Driven:** When a "New Lead" arrives in our CRM, it triggers a Viktor workflow.
2.  **Tool Use:** Viktor will have access to custom "tools" provided by our API (e.g., `analyze_property(address)`, `update_contact_status(id)`).
3.  **Context Injection:** Our system will provide Viktor with the "State of the Deal" context before every interaction.
