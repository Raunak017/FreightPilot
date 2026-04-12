# CarrierCallsAI — Implementation Plan

HappyRobot FDE take-home: Inbound Carrier Sales automation.

## 1. Problem recap

A freight brokerage wants to automate inbound carrier calls. The HappyRobot voice agent must:

1. Answer inbound web calls from carriers.
2. Collect the carrier's MC number and verify eligibility via FMCSA.
3. Search loads and pitch a matching one.
4. Negotiate price (up to 3 rounds) if the carrier counter-offers.
5. On agreement, mock a transfer-to-sales-rep message.
6. Extract offer details, classify call outcome, classify carrier sentiment.
7. Persist everything so a custom dashboard (Objective 2) can show metrics.
8. Ship the whole thing containerized and deployed with HTTPS + API key auth (Objective 3).

## 2. Architecture

HappyRobot is the voice front-end. Our own FastAPI service is the brain and system of record. One repo, one container, one deployment powers all three objectives.

```
Carrier (web call) ─► HappyRobot inbound agent
                            │
                            ├── tool: verify_carrier(mc_number)        ──► /carriers/verify ──► FMCSA QCMobile
                            ├── tool: search_loads(origin, dest, ...)  ──► /loads/search    ──► loads store
                            ├── tool: get_load_details(load_id)        ──► /loads/{id}
                            ├── tool: evaluate_offer(load_id, offer,   ──► /negotiate       (stateless, LLM tracks round)
                            │                         round_number)
                            └── (end of call) webhook: log_call(...)   ──► /calls           ──► metrics DB
                                                                                                    │
                                                                                                    └──► Dashboard (reads same DB)
```

### Why stateless `/negotiate`

HappyRobot's agent node is LLM-driven with tool-calling semantics — the model fills tool parameters itself. The system prompt instructs the agent to increment and pass `round_number` on each call to `evaluate_offer`. No server-side session store needed. Simpler to test, simpler to reason about, no stale-state bugs.

### Why one service

Objectives 2 and 3 force us to stand up a real backend regardless. Fronting HappyRobot's voice agent with the same backend means every call's data flows into the same DB the dashboard reads. No ETL, no second process.

## 3. Tech choices

| Concern | Choice | Why |
|---|---|---|
| Language/framework | Python 3.11 + FastAPI | Fastest path to typed, documented HTTP endpoints; great for HappyRobot tool integration |
| DB | SQLite (via SQLAlchemy) | Zero-ops, file-based, fine for demo scale; can swap to Postgres later without code changes |
| HTTP client | `httpx` | Async, good timeout control for FMCSA (which is slow) |
| Loads source | Seeded JSON file loaded into SQLite on boot | Meets the PDF's "file or DB" requirement; deterministic demos |
| Dashboard | Vite + React + TypeScript, built to static assets served by FastAPI | Modern TS frontend, one container still ships everything |
| Container | Single Dockerfile, slim Python base | Simple to deploy anywhere |
| Deploy target | Fly.io or Railway | 1-command deploy, automatic HTTPS, no AWS yak-shaving |
| Local tunneling | `cloudflared` or `ngrok` | So HappyRobot can reach the API during development |
| Auth | `X-API-Key` header middleware | Per the challenge's security requirements |
| Secrets | `.env` (not committed) | `FMCSA_WEBKEY`, `API_KEY` |

## 4. Prerequisites (do before writing code)

- [x] Log into HappyRobot docs, skim: Inbound Call example, Web Call trigger, Tools, Webhook integration, Extraction, Classification nodes.
- [x] FMCSA WebKey obtained (provided by HappyRobot).
- [ ] Pick deploy target (Fly.io recommended). Install its CLI.
- [ ] Install Docker Desktop (if not already running).
- [ ] Install `cloudflared` or `ngrok` for local tunneling during agent-to-API testing.

## 5. Repository layout

```
CarrierCallsAI/
├── app/
│   ├── main.py                 # FastAPI app init, middleware, router wiring
│   ├── config.py               # env var loading (FMCSA_WEBKEY, API_KEY, DB_URL)
│   ├── auth.py                 # X-API-Key dependency
│   ├── db.py                   # SQLAlchemy engine/session
│   ├── models.py               # ORM models: Load, Call
│   ├── schemas.py              # Pydantic request/response schemas
│   ├── routes/
│   │   ├── health.py           # /healthz
│   │   ├── carriers.py         # /carriers/verify
│   │   ├── loads.py            # /loads/search, /loads/{id}
│   │   ├── negotiate.py        # /negotiate
│   │   ├── calls.py            # /calls  (POST from HappyRobot end-of-call)
│   │   └── dashboard.py        # /dashboard (HTML) + /metrics (JSON)
│   ├── services/
│   │   ├── fmcsa.py            # FMCSA client + eligibility rule
│   │   ├── loads_search.py     # matching/scoring logic
│   │   └── negotiation.py      # pricing policy
│   └── data/
│       └── loads.seed.json     # ~20 fake loads
├── tests/
│   ├── test_fmcsa.py
│   ├── test_loads_search.py
│   ├── test_negotiation.py
│   └── test_calls.py
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml (or requirements.txt)
├── .env.example
├── .gitignore
├── README.md
└── plan.md                     # this file
```

## 6. Build phases

Each phase ends in a runnable, testable artifact. Don't move to the next until the current one is green.

### Phase 0 — Scaffolding

- Init git repo, Python venv, FastAPI skeleton.
- `main.py` with `/healthz` and `X-API-Key` middleware.
- Dockerfile + docker-compose. `docker compose up` must serve `/healthz` before any business logic is written.
- `.env.example` committed; `.env` gitignored.
- Exit criteria: `curl -H "X-API-Key: dev" http://localhost:8000/healthz` returns 200 from a running container.

### Phase 1 — FMCSA verification (`/carriers/verify`)

- `services/fmcsa.py`: client that hits QCMobile with `webKey` query param, handles timeout/retry.
- Eligibility rule, centralized: `allowedToOperate == "Y"` AND active authority. Document this in code.
- `POST /carriers/verify`: `{mc_number}` → `{eligible: bool, carrier_name, dot_number, reason}`.
- Normalize MC input (strip "MC", whitespace, leading zeros).
- In-memory LRU cache on MC to soften FMCSA's latency during the demo.
- Tests against 2–3 real MCs pulled from FMCSA SAFER as fixtures.
- Exit criteria: verify endpoint returns correct eligibility for a known good MC and a known ineligible MC.

### Phase 2 — Loads search (`/loads/search`, `/loads/{id}`)

- Seed `loads.seed.json` with ~20 loads covering varied lanes, equipment types, dates, commodities.
- `app/models.py` Load model with every field from the PDF (load_id, origin, destination, pickup_datetime, delivery_datetime, equipment_type, loadboard_rate, notes, weight, commodity_type, num_of_pieces, miles, dimensions).
- On startup: if DB empty, load seed into SQLite.
- `POST /loads/search`: accepts `{origin?, destination?, equipment_type?, pickup_date?}`, returns top 3 matches sorted by a deterministic score: exact equipment > lane match > pickup-date proximity.
- `GET /loads/{load_id}`: single load lookup for the agent to re-fetch details mid-call.
- Exit criteria: given a query that should match 1–2 seeded loads, the top result is the obvious one.

### Phase 3 — Negotiation (`/negotiate`)

- `POST /negotiate`: `{load_id, carrier_offer, round_number}` → `{action: "accept"|"counter"|"reject", counter_price?, message, round_number}`.
- Pricing policy (stateless, deterministic):
  - Floor price = `loadboard_rate`.
  - Ceiling (walk-away) = `loadboard_rate * 1.15`.
  - If `carrier_offer <= ceiling` AND `round_number == 3`: accept at `carrier_offer`.
  - Round 1 counter: move 40% from `loadboard_rate` toward `carrier_offer`.
  - Round 2 counter: move 70% from previous counter toward `carrier_offer`.
  - Round 3: accept if within ceiling, else reject.
- The agent's system prompt owns round tracking and passes `round_number` on each call.
- Exit criteria: unit tests cover accept-round-1, counter-counter-accept, counter-counter-reject, above-ceiling-reject.

### Phase 4 — Call logging (`/calls`)

- `Call` ORM model: `id, mc_number, carrier_name, dot_number, matched_load_id, final_price, rounds_used, outcome, sentiment, transcript_summary, started_at, ended_at, raw_payload_json`.
- `POST /calls`: accepts the HappyRobot extraction+classification payload, persists it.
- Outcome enum: `booked, declined_by_carrier, no_eligible_mc, no_matching_load, negotiation_failed, abandoned`.
- Sentiment enum: `positive, neutral, negative`.
- `GET /calls` for debugging (protected by API key).
- Exit criteria: an example payload POST creates a row; row reads back correctly.

### Phase 5 — HappyRobot workflow

Only now do we build the voice side. All the tools it calls already work.

- Trigger: **Web Call** (the PDF explicitly forbids buying a phone number).
- System prompt / persona: "Sam, a dispatcher at Acme Logistics." Includes:
  - Ask for MC number first, verify it, refuse politely if ineligible.
  - Search for loads using carrier's origin/destination/equipment preferences.
  - Pitch: load ID, origin → destination, equipment, pickup date, rate, commodity.
  - Negotiation rules (max 3 rounds, increment `round_number` each call).
  - End-of-call behavior: if outcome = booked, say the mock transfer line and wrap up.
- Tools wired to API (all with `X-API-Key` header):
  1. `verify_carrier` → `/carriers/verify`
  2. `search_loads` → `/loads/search`
  3. `get_load_details` → `/loads/{id}`
  4. `evaluate_offer` → `/negotiate`
- End-of-call AI Extract node: pull `mc_number`, `carrier_name`, `load_id`, `agreed_price`, `rounds_used`, `notes`.
- Classification nodes:
  - Outcome: `{booked, declined_by_carrier, no_eligible_mc, no_matching_load, negotiation_failed, abandoned}`.
  - Sentiment: `{positive, neutral, negative}`.
- Final action: webhook POST the extracted + classified payload to `/calls`.
- Transfer-to-rep mock: a text node that the agent plays when outcome = booked.

### Phase 6 — Rehearsal and prompt tuning

Script and run these 5 scenarios via Web Call trigger, fix prompt wording where the agent stumbles:

1. Eligible carrier accepts first offer.
2. Eligible carrier counters once, agent counters, carrier accepts.
3. Eligible carrier counters twice, negotiation fails on round 3.
4. Ineligible MC → polite refusal.
5. No matching load → polite apology and end call.

Every scenario should produce a row in `/calls` with the right outcome.

### Phase 7 — Dashboard (Objective 2)

- `/dashboard` returns HTML with:
  - Total calls, booked count, booking rate (%), avg agreed price, avg rounds-to-agreement.
  - Outcome breakdown (bar chart).
  - Sentiment breakdown (pie or bar).
  - Recent calls table (last 20 rows, most recent first).
- `/metrics` returns JSON for the same numbers (useful for curl and for future frontends).
- Chart.js via CDN keeps the frontend stack nil.
- Protected by the same API key — dashboard reads key from a query param or session cookie set by a tiny login form. For the demo, simplest: API key in a query param.
- Exit criteria: after running the 5 rehearsal scenarios, dashboard reflects the correct counts.

### Phase 8 — Containerize and deploy (Objective 3)

- Finalize Dockerfile (multi-stage, slim runtime).
- Deploy to Fly.io (or Railway):
  - `fly launch` / equivalent, set secrets (`FMCSA_WEBKEY`, `API_KEY`) via the platform's secret store.
  - Confirm HTTPS works (Fly gives this free via Let's Encrypt).
- Update HappyRobot tool URLs from the local `cloudflared` URL to the cloud URL.
- README with: architecture diagram, env vars, `docker compose up` for local, `fly deploy` for prod, example curl per endpoint, how to re-seed loads.
- Exit criteria: the HappyRobot workflow now calls the deployed API, a test call end-to-end produces a row in the cloud DB, dashboard URL is shareable.

## 7. Deliverables checklist

- [ ] Email to Carlos Becker (recruiter in cc) before the meeting.
- [ ] "Acme Logistics" build doc (1–2 pages, client-facing tone: problem → solution → architecture → results → next steps).
- [ ] Deployed dashboard URL.
- [ ] Code repository link.
- [ ] HappyRobot workflow link.
- [ ] 5-minute demo video: use case setup, live call demo, dashboard walkthrough.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| FMCSA WebKey approval delay | Request on day 1, before writing any code. |
| FMCSA API slow / flaky during demo | In-memory cache + short timeout + a fallback "verified" mock path behind a debug flag. |
| Agent fumbles the negotiation round count | Be explicit in the system prompt; server-side cap at 3 rounds rejects anything beyond. |
| Prompt tuning black hole | Time-box Phase 6 to one sitting. Five scripted scenarios, not open-ended. |
| HappyRobot workflow link expires / can't be shared | Capture a demo video as backup; include it in the build doc. |
| Cloud deploy surprises | Deploy the Phase 0 skeleton to Fly on day 1 so we're never debugging ops and logic at the same time. |

## 9. Starting order (next 24 hours)

1. Request FMCSA WebKey.
2. Create the repo, Phase 0 scaffolding, confirm Docker + `/healthz`.
3. Deploy the skeleton to Fly.io so deployment is a solved problem before any real logic ships.
4. Phase 1: `/carriers/verify` against real FMCSA. This is the riskiest external dependency, so ship it first.
