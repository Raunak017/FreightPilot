# Freight Pilot

Inbound carrier sales automation for freight brokerages, built on the HappyRobot voice AI platform.

An AI voice agent handles inbound calls from carriers: verifies their MC number via FMCSA, searches available loads, negotiates pricing (up to 3 rounds), and logs every call with outcome and sentiment classification. A custom dashboard tracks key metrics in real-time.

## Architecture

```
Carrier (web call) --> HappyRobot inbound agent
                            |
                            |-- tool: verify_carrier   --> /carriers/verify --> FMCSA API
                            |-- tool: search_loads     --> /loads/search    --> SQLite
                            |-- tool: get_load_details --> /loads/{id}
                            |-- tool: evaluate_offer   --> /negotiate
                            |-- (end of call) webhook  --> /calls/          --> SQLite
                                                                                |
                                                                           /dashboard
```

One FastAPI service powers all API endpoints and serves the dashboard. One container, one deploy.

## Live deployment

- **API:** `https://<your-railway-url>/healthz`
- **Dashboard:** `https://<your-railway-url>/dashboard`

## API endpoints

All API endpoints require `X-API-Key` header. The dashboard is publicly accessible.

| Method | Path | Description |
|---|---|---|
| GET | `/healthz` | Health check |
| POST | `/carriers/verify` | Verify carrier eligibility via FMCSA |
| POST | `/loads/search` | Search loads by origin, destination, equipment, date |
| GET | `/loads/{load_id}` | Get load details |
| POST | `/negotiate` | Evaluate carrier's counter-offer |
| POST | `/calls/` | Log a completed call (from HappyRobot webhook) |
| GET | `/calls/` | List calls with optional outcome/sentiment filters |
| GET | `/metrics/` | Aggregated dashboard metrics |
| GET | `/dashboard` | Dashboard UI (no API key required) |

## Local development

### Prerequisites

- Docker Desktop
- Node.js 20+ (for frontend dev only)
- Python 3.11+ (for running tests locally)

### Run locally

```bash
cp .env.example .env
# Edit .env: set API_KEY and FMCSA_WEBKEY
docker compose up --build
```

- API: `http://localhost:8000`
- Dashboard: `http://localhost:8000/dashboard`

### Run frontend dev server (hot reload)

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on `http://localhost:5173` and proxies API requests to FastAPI on port 8000.

### Run tests

```bash
pip install -r requirements.txt
python -m pytest tests/ -v
```

## Deployment (Railway)

### Prerequisites

- Railway account and CLI installed (`npm i -g @railway/cli`)
- GitHub repository connected to Railway

### Deploy

1. Connect your GitHub repo to a new Railway project
2. Railway auto-detects the Dockerfile and builds
3. Set environment variables in Railway dashboard:
   - `API_KEY` — your chosen API key
   - `FMCSA_WEBKEY` — FMCSA API key
4. Railway provisions HTTPS automatically via Let's Encrypt

### Reproduce deployment

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to existing project (or create new)
railway link

# Set secrets
railway variables set API_KEY=<your-api-key>
railway variables set FMCSA_WEBKEY=<your-fmcsa-key>

# Deploy
railway up
```

### Verify deployment

```bash
curl -H "X-API-Key: <your-api-key>" https://<your-railway-url>/healthz
# {"status": "ok"}
```

## Environment variables

| Variable | Description | Default |
|---|---|---|
| `API_KEY` | API key for endpoint authentication | `dev-change-me` |
| `FMCSA_WEBKEY` | FMCSA QCMobile API key | (none) |
| `DATABASE_URL` | SQLite connection string | `sqlite:///./carrier_calls.db` |

## Security

- HTTPS via Let's Encrypt (Railway auto-provisions)
- API key authentication on all API endpoints (`X-API-Key` header)
- Dashboard served without API key; data fetched by the dashboard JS includes the key

## Project layout

```
app/
  main.py                 FastAPI app, router wiring, static file serving
  config.py               Env-driven settings
  auth.py                 X-API-Key dependency
  db.py                   SQLAlchemy engine, session, DB init + seeding
  models.py               ORM models (Load, Call)
  schemas.py              Pydantic request/response schemas
  routes/
    health.py             /healthz
    carriers.py           /carriers/verify
    loads.py              /loads/search, /loads/{id}
    negotiate.py          /negotiate
    calls.py              /calls/ (POST + GET)
    metrics.py            /metrics/
  services/
    fmcsa.py              FMCSA API client + eligibility logic
    loads_search.py       Scored load matching
    negotiation.py        Pricing policy (stateless, deterministic)
  data/
    loads.seed.json       20 seed loads (auto-loaded on first startup)
frontend/
  src/
    App.tsx               Main dashboard layout
    api.ts                API fetch helpers
    types.ts              TypeScript interfaces
    components/
      KpiCard.tsx         Metric cards
      OutcomeChart.tsx    Outcome breakdown (bar chart)
      SentimentChart.tsx  Sentiment distribution (donut chart)
      RoundsChart.tsx     Negotiation rounds (bar chart)
      CallsTable.tsx      Recent calls table
tests/
  test_fmcsa.py           FMCSA verification tests
  test_negotiation.py     Negotiation pricing policy tests
Dockerfile                Multi-stage: Node (frontend build) + Python (runtime)
docker-compose.yml        Local development
```

## Tech stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite, httpx
- **Frontend:** React, TypeScript, Tailwind CSS, Recharts
- **Build:** Vite, multi-stage Docker
- **Deploy:** Railway (HTTPS via Let's Encrypt)
- **Voice AI:** HappyRobot platform
