# Freight Pilot

Inbound carrier sales automation for freight brokerages, built on the HappyRobot voice AI platform.

An AI voice agent handles inbound calls from carriers: verifies their MC number via FMCSA, recognizes repeat carriers with personalized greetings, searches available loads, negotiates pricing with smart rounding and auto-accept thresholds, and logs every call with AI-generated summaries, outcome classification, and sentiment analysis. A custom-built analytics dashboard provides real-time metrics with interactive cross-filtering.

## Live Deployment

- **Dashboard:** [`https://freightpilot-production.up.railway.app/dashboard`](https://freightpilot-production.up.railway.app/dashboard)
- **API Health:** [`https://freightpilot-production.up.railway.app/healthz`](https://freightpilot-production.up.railway.app/healthz)

## Architecture

```
Carrier (web call) ──► HappyRobot Voice Agent
                            │
                            ├── verify_carrier      ──► POST /carriers/verify  ──► FMCSA API
                            ├── get_carrier_history  ──► GET  /carriers/history ──► SQLite
                            ├── find_available_loads  ──► POST /loads/search     ──► SQLite
                            ├── get_load_details     ──► GET  /loads/{id}
                            ├── evaluate_offer       ──► POST /negotiate
                            │
                            ▼ (call ends)
                       AI Classify ──► outcome (booked, declined, etc.)
                       AI Extract  ──► structured data + AI summary
                       Webhook     ──► POST /calls/  ──► SQLite
                                                          │
                                              GET /calls/, /loads/all
                                                          │
                                                     Dashboard
                                              (React + cross-filtering)
```

Single FastAPI service powers all API endpoints and serves the dashboard. One container, one deploy.

## API Endpoints

All endpoints require `X-API-Key` header. Dashboard page is publicly accessible.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/healthz` | Health check |
| POST | `/carriers/verify` | Verify carrier via FMCSA |
| GET | `/carriers/history?mc_number=` | Carrier's past interaction history |
| POST | `/loads/search` | Search loads by origin, destination, equipment, date |
| GET | `/loads/all` | All loads (used by dashboard) |
| GET | `/loads/{load_id}` | Load details by ID |
| GET | `/loads/by-id?load_id=` | Load details by query param |
| POST | `/negotiate` | Evaluate carrier counter-offer |
| POST | `/calls/` | Log a completed call |
| GET | `/calls/` | List calls with optional filters |
| GET | `/metrics/` | Aggregated metrics with optional `?days=` filter |
| GET | `/dashboard` | Dashboard UI |

## Features

### Voice Agent (HappyRobot)
- FMCSA carrier verification with MC number normalization
- **Carrier memory** — recognizes repeat carriers, greets them by company name, references past lanes
- Scored load matching (equipment type weighted highest, then origin/destination)
- Smart negotiation: counter prices rounded to nearest $50, auto-accept within 5% (round 1) / 8% (round 2+), rejects >15% asks before calling the tool
- Post-call AI extraction with structured summaries, outcome classification, and sentiment analysis

### Dashboard
- 4 KPI cards: Total Calls, Booking Rate, Avg Agreed Price (with rate/mile), Avg Rounds to Close (with avg duration)
- Conversion funnel with drop-off percentages
- Call outcomes, top lanes, commodity breakdown (horizontal bar charts)
- Equipment demand (donut chart), carrier sentiment (donut with percentages)
- **Interactive cross-filtering** — click any chart element to filter all other charts
- Date range filtering (7d / 30d / all time)
- Expandable call rows with AI-generated summaries
- Searchable calls table (by load ID, carrier name, or MC number)

### Security
- HTTPS via Let's Encrypt (Railway auto-provisions)
- API key authentication on all API endpoints (`X-API-Key` header)
- Dashboard served without API key; data fetched client-side includes the key

## Local Development

### Prerequisites
- Docker Desktop
- Node.js 20+ (for frontend dev)
- Python 3.11+

### Run with Docker
```bash
cp .env.example .env
# Edit .env: set API_KEY and FMCSA_WEBKEY
docker compose up --build
```
- API: `http://localhost:8000`
- Dashboard: `http://localhost:8000/dashboard`

### Frontend dev server (hot reload)
```bash
cd frontend
npm install
npm run dev
```
Vite dev server proxies API requests to FastAPI on port 8000.

### Run tests
```bash
pip install -r requirements.txt
python -m pytest tests/ -v
```

## Deployment (Railway)

### Prerequisites
- Railway account and CLI (`npm i -g @railway/cli`)
- GitHub repository connected to Railway

### Deploy
1. Connect your GitHub repo to a new Railway project
2. Railway auto-detects the Dockerfile and builds
3. Set environment variables in Railway dashboard:
   - `API_KEY` — your chosen API key
   - `FMCSA_WEBKEY` — FMCSA API key (get from https://mobile.fmcsa.dot.gov/QCDevsite/)
4. Railway provisions HTTPS automatically

### Reproduce deployment
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# Set environment variables
railway variables set API_KEY=<your-api-key>
railway variables set FMCSA_WEBKEY=<your-fmcsa-key>

# Deploy
railway up
```

### Verify
```bash
curl -H "X-API-Key: <your-api-key>" https://<your-railway-url>/healthz
# {"status": "ok"}
```

### Note on SQLite
SQLite DB resets on each Railway redeploy (fresh container). Loads are auto-seeded from `app/data/loads.seed.json` on startup. Call data from HappyRobot accumulates from live calls. For demos, you can seed historical call data via `POST /calls/` with `created_at` overrides.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_KEY` | API key for endpoint authentication | `dev-change-me` |
| `FMCSA_WEBKEY` | FMCSA QCMobile API key | (none) |
| `DATABASE_URL` | SQLite connection string | `sqlite:///./carrier_calls.db` |

## Project Layout

```
app/
  main.py                 FastAPI app, router wiring, static file serving
  config.py               Env-driven settings
  auth.py                 X-API-Key dependency
  db.py                   SQLAlchemy engine, session, DB init + load seeding
  models.py               ORM models (Load, Call)
  schemas.py              Pydantic request/response schemas
  routes/
    health.py             GET /healthz
    carriers.py           POST /carriers/verify, GET /carriers/history
    loads.py              POST /loads/search, GET /loads/all, GET /loads/{id}
    negotiate.py          POST /negotiate
    calls.py              POST /calls/, GET /calls/
    metrics.py            GET /metrics/ (with ?days= date filtering)
  services/
    fmcsa.py              FMCSA API client + eligibility logic (with LRU cache)
    loads_search.py       Scored load matching (equipment 10pts, origin/dest 5pts each)
    negotiation.py        Pricing policy (stateless, $50-rounded counters)
  data/
    loads.seed.json       20 seed loads (auto-loaded on first startup)
frontend/
  src/
    App.tsx               Main layout, global filter state, cross-filtering logic
    api.ts                API fetch helpers with X-API-Key
    types.ts              TypeScript interfaces (Metrics, Call, Load, Filters)
    computeMetrics.ts     Client-side metrics computation from raw calls + loads
    components/
      KpiCard.tsx         Metric cards with indigo icons
      FunnelChart.tsx     Conversion funnel with clickable steps
      OutcomeChart.tsx    Call outcomes (horizontal bars, cross-filterable)
      SentimentChart.tsx  Sentiment donut with percentages
      TopLanesChart.tsx   Top 5 lanes (horizontal bars, city names only)
      EquipmentChart.tsx  Equipment demand donut (blue palette)
      CommodityChart.tsx  Top 5 commodities (horizontal bars)
      CallsTable.tsx      Expandable rows with AI summaries, search
Dockerfile                Multi-stage: Node (frontend build) + Python (runtime)
docker-compose.yml        Local development
deploy.sh                 Railway deployment script
```

## Tech Stack

- **Backend:** Python 3.11, FastAPI, SQLAlchemy, SQLite, httpx
- **Frontend:** React 18, TypeScript, Tailwind CSS, Recharts
- **Build:** Vite, multi-stage Docker
- **Deploy:** Railway (HTTPS via Let's Encrypt)
- **Voice AI:** HappyRobot platform (GPT-5.2-instant for voice, GPT-4.1 for classification/extraction)
