# API Specification: Douglas Real Estate Systems (MVP)

## Base URL
`https://api.douglas-re.com/v1`

## Authentication
Bearer Token (JWT) provided via Clerk/Auth0. All requests must include `Authorization: Bearer <token>`.

---

## 1. Contacts (CRM)
Manage leads, clients, and past customers.

### `GET /contacts`
List all contacts with optional filtering.
- **Query Params:** `type` (lead, client, past), `source`, `status`
- **Response:** `200 OK` with list of contact objects.

### `POST /contacts`
Create a new contact.
- **Body:** `first_name`, `last_name`, `email`, `phone`, `type`, `source`, `notes`
- **Response:** `201 Created` with the new contact object.

### `GET /contacts/{id}`
Get details for a specific contact.

### `PATCH /contacts/{id}`
Update contact details (e.g., status, notes).

---

## 2. Deals (Transaction Management)
Track the progress of real estate transactions.

### `GET /deals`
List all deals.
- **Query Params:** `stage` (lead, showing, offer, under_contract, closed), `assigned_to`
- **Response:** `200 OK` with list of deal objects.

### `POST /deals`
Create a new deal.
- **Body:** `title`, `contact_id`, `property_address`, `estimated_value`, `stage`
- **Response:** `201 Created`.

### `PATCH /deals/{id}`
Update deal stage or details. Used to move deals through the Kanban board.

---

## 3. Property Analysis
Calculate financial metrics for potential investments.

### `POST /analysis/calculate`
Calculate ROI, Cap Rate, and Cash-on-Cash.
- **Body:** `purchase_price`, `down_payment`, `interest_rate`, `monthly_rent`, `expenses` (taxes, insurance, maintenance, etc.)
- **Response:** `200 OK` with calculated metrics: `roi`, `cap_rate`, `cash_on_cash_return`, `monthly_cash_flow`.

### `GET /analysis/lookup`
Fetch market data for a specific address (integrates with 3rd party providers).
- **Query Params:** `address`
- **Response:** `200 OK` with `estimated_value`, `estimated_rent`, `tax_history`.

---

## 4. Reporting
Aggregated data for performance tracking.

### `GET /reports/gci`
Get Gross Commission Income stats.
- **Query Params:** `timeframe` (month, quarter, year)
- **Response:** `200 OK` with `total_gci`, `pending_gci`, `closed_deals_count`.

---

## 5. Viktor Integration (Webhooks & Tools)
Endpoints specifically designed for the AI Employee platform.

### `POST /webhooks/viktor/event`
Viktor sends events here to trigger actions in our system.
- **Body:** `event_type` (lead_responded, task_completed), `payload`

### `POST /tools/analyze-and-draft`
A specific endpoint for Viktor to call.
- **Body:** `address`
- **Response:** `200 OK` with full property analysis and a drafted email/SMS for the lead.
