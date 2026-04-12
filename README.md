# CarrierCallsAI

Inbound carrier sales automation for a freight brokerage, built on the HappyRobot platform.

The backend is a FastAPI service that fronts:

- FMCSA carrier eligibility lookups
- A loads catalog (search + details)
- Deterministic negotiation logic
- Call logging and metrics for a custom dashboard

HappyRobot's voice agent calls these endpoints as tools during inbound web calls.

## Quick start (local)

```bash
cp .env.example .env
# set API_KEY and FMCSA_WEBKEY in .env
docker compose up --build
```

Health check:

```bash
curl -H "X-API-Key: dev-change-me" http://localhost:8000/healthz
```

Expected response:

```json
{"status": "ok"}
```

Requests without a valid `X-API-Key` header return `401`.

## Project layout

```
app/
  main.py        FastAPI app, global API-key dependency
  config.py      Env-driven settings
  auth.py        X-API-Key dependency
  routes/
    health.py    /healthz
tests/
Dockerfile
docker-compose.yml
requirements.txt
plan.md          Architecture and build phases
```

See `plan.md` for the full implementation plan.
