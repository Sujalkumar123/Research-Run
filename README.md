# 🔬 Research Runs Dashboard

A full-stack web application for automated research. Submit a prompt and source URLs — the backend scrapes the pages, synthesizes a brief using an LLM, and tracks KPIs. The frontend polls for results in real-time.

> **Built as a take-home assignment:** Received two AI-generated files with 29 bugs. Audited, fixed, refactored into a modular production-ready codebase, and signed off.

---

## ✨ Features

- **Async Background Processing** — Runs execute in the background; the API returns immediately with a `run_id`
- **Real-Time Polling** — Frontend polls every second with automatic retry (3 consecutive failures before surfacing errors)
- **Input Validation** — Both client-side (React) and server-side (Pydantic) validation
- **Error Handling** — Try/catch at every level, graceful error states in UI
- **Structured Logging** — INFO on run start/complete, ERROR with full stack traces on failure
- **XSS Protection** — LLM output rendered as plain text, not `dangerouslySetInnerHTML`
- **CORS Configuration** — Environment-variable-based origins (not hardcoded `*`)
- **Health Check** — `GET /health` endpoint for load balancers and monitoring
- **Light/Dark Theme** — Auto-detected via `prefers-color-scheme`

---

## 📁 Project Structure

```
PROD/
├── Receive_Code/                        ← Original buggy code (input)
│   ├── Intern_Brief.md                  ← Assignment instructions
│   ├── Backend_main.py                  ← Original backend (1 file, 118 lines)
│   └── Frontend_app.jsx                 ← Original frontend (1 file, 74 lines)
│
└── Final_Code/                          ← Fixed production-ready code (output)
    ├── SIGNOFF.md                       ← Production readiness sign-off
    ├── DECISION_LOG.md                  ← AI interaction log
    │
    ├── backend/                         ← Python / FastAPI
    │   ├── main.py                      ← App factory (entry point)
    │   ├── config.py                    ← Environment settings
    │   ├── models.py                    ← Pydantic request/response schemas
    │   ├── requirements.txt             ← Python dependencies
    │   ├── api/
    │   │   └── routes.py                ← HTTP endpoints
    │   └── services/
    │       └── run_service.py           ← Business logic + in-memory store
    │
    └── frontend/                        ← React / Vite
        ├── package.json                 ← Node dependencies
        ├── vite.config.js               ← Build config
        └── src/
            ├── App.jsx                  ← Root component (state orchestrator)
            ├── index.css                ← Global styles (light/dark theme)
            ├── main.jsx                 ← React entry point
            ├── client/
            │   └── runs.js             ← HTTP client (fetch wrapper)
            ├── hooks/
            │   └── useRunPoller.js      ← Polling hook with retry logic
            └── components/
                ├── RunForm.jsx          ← Form with client-side validation
                └── RunResult.jsx        ← Result display (4 states)
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**

### Backend

```bash
cd PROD/Final_Code/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Serves on `http://localhost:8000`

### Frontend

```bash
cd PROD/Final_Code/frontend
npm install
npm run dev
```

Serves on `http://localhost:5173`

> The frontend connects to `http://localhost:8000` by default. Override with the `VITE_API_URL` environment variable.

---

## 🔌 API Reference

### `GET /health`

Health check for load balancers.

**Response:** `200 OK`
```json
{ "status": "ok" }
```

### `POST /runs`

Start a new research run. Returns immediately; processing happens in the background.

**Request:**
```json
{
  "prompt": "What are the key trends in AI research?",
  "urls": ["https://example.com/article1", "https://example.com/article2"]
}
```

**Response:** `202 Accepted`
```json
{ "run_id": "a1b2c3d4-..." }
```

**Validation Errors:** `422 Unprocessable Entity` for empty prompts, empty URL lists, or invalid URLs.

### `GET /runs/{run_id}`

Poll for the status and result of a run.

**Response (running):**
```json
{ "status": "running", "result": null, "error": null }
```

**Response (done):**
```json
{
  "status": "done",
  "result": {
    "timestamp": "2026-06-30T12:00:00+00:00",
    "prompt": "What are the key trends?",
    "pages_scraped": 2,
    "success_rate": 1.0,
    "tokens_used": 280,
    "sources": ["https://example.com/article1", "https://example.com/article2"],
    "brief": "- Key finding A\n- Key finding B"
  },
  "error": null
}
```

**Response (error):**
```json
{ "status": "error", "result": null, "error": "An internal error occurred." }
```

**Not Found:** `404` for unknown `run_id`.

---

## 🛡️ Data Flow

```
User types prompt + URLs
        │
        ▼
   ┌─────────────┐     POST /runs        ┌──────────────┐
   │  RunForm.jsx │ ──────────────────►   │  routes.py   │
   │  (validates) │     {prompt, urls}    │  (validates)  │
   └─────────────┘                        └──────┬───────┘
                                                 │
                              create_run() ──► RUNS[id] = {status: "running"}
                              asyncio.create_task(process_run)
                                                 │
                              Returns {run_id} immediately (HTTP 202)
                                                 │
   Background:                                   ▼
   ┌──────────────┐                        ┌──────────────┐
   │ process_run() │ ─ run_in_executor ──► │   do_run()   │
   └──────┬───────┘                        │ • scrape pages│
          │                                │ • call LLM   │
          ▼                                └──────────────┘
   RUNS[id].status = "done"
   RUNS[id].result = {...}

   ┌─────────────────┐   GET /runs/{id}    ┌──────────────┐
   │ useRunPoller.js  │ ◄─── every 1s ───  │  routes.py   │
   │ (polls + retry)  │                    └──────────────┘
   └────────┬────────┘
            ▼
   ┌─────────────────┐
   │ RunResult.jsx    │ ── displays KPIs, sources, brief
   └─────────────────┘
```

---

## 🐛 Bugs Fixed (29 Total)

### Pass 1 — 17 Bugs

| # | Issue | Severity |
|---|-------|----------|
| B1 | `msg.content` is a list — must read `content[0].text` | Critical |
| B2 | `def do_run(run_log=[])` — mutable default shared across calls | Critical |
| B3 | `time.sleep()` inside async blocks the event loop | Critical |
| B4 | `run_id = len(RUNS) + 1` — race condition under concurrency | Critical |
| B5 | Unknown `run_id` → `KeyError` → unhandled 500 | High |
| B6 | No input validation on prompts or URLs | High |
| B7 | `allow_origins=["*"]` — CORS wide open | High |
| B8 | Exception in `do_run` leaves run stuck at "running" forever | High |
| F1 | `setInterval` never cleared — memory leak | Critical |
| F2 | No try/catch on fetch — silent network errors | Critical |
| F3 | `dangerouslySetInnerHTML` on LLM output — XSS vulnerability | High |
| F4 | Blank lines in URL box sent as empty strings | High |
| F5 | No double-click guard on submit button | High |
| F6 | No client-side validation | Medium |
| F7 | Missing `key` prop on sources list | Medium |
| F8 | Backend "error" status silently ignored in UI | Medium |
| F9 | Polling continues after terminal status | Medium |

### Pass 2 — 12 More Gaps

| # | Issue | Fix |
|---|-------|-----|
| B9 | No logging / observability | Added structured `logging` module |
| B10 | `asyncio.get_event_loop()` — errors on Python 3.10+ | `asyncio.get_running_loop()` |
| B11 | No `/health` endpoint | Added `GET /health` |
| B12 | Single-file monolith | Split into 5 modules |
| B13 | Unnecessary `allow_credentials=True` | Removed |
| B14 | CORS env-var parsing without `.strip()` | Added per-element stripping |
| F10 | No `console.error` in frontend | Added structured console logging |
| F11 | Hardcoded `localhost:8000` API URL | `import.meta.env.VITE_API_URL` |
| F12 | Single poll failure kills polling | 3 consecutive failures required |
| F13 | 200-line single component | Split into 5 modules |
| F14 | `key={i}` (array index) on sources | `key={s}` (URL string) |
| F15 | `// Fix N:` comments in code | Replaced with WHY-based comments |

---

## ⚙️ Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Comma-separated CORS origins |
| `LOG_LEVEL` | `INFO` | Python logging level |
| `VITE_API_URL` | `http://localhost:8000` | Backend URL for the frontend |

---

## 🧪 Tested Scenarios

| Scenario | Result |
|----------|--------|
| `GET /health` | ✅ 200 `{"status":"ok"}` |
| `POST /runs` valid payload | ✅ 202, run completes |
| `GET /runs/{id}` completed run | ✅ Full result with KPIs |
| Empty prompt | ✅ 422 |
| Whitespace-only prompt | ✅ 422 |
| Empty URL list | ✅ 422 |
| Invalid URL | ✅ 422 |
| Unknown run_id | ✅ 404 |
| Malformed JSON body | ✅ 422 |
| 3 concurrent runs | ✅ All complete independently |
| Wrong Content-Type | ✅ 422 |

---

## 📝 Known Limitations

These are infrastructure concerns, not bugs — documented in [SIGNOFF.md](PROD/Final_Code/SIGNOFF.md):

| Item | Reason |
|------|--------|
| **In-memory storage** | `RUNS = {}` — restart loses data. Requires Redis/DB. |
| **No rate limiting** | Needs middleware or API gateway. |
| **No timeouts on external calls** | Requires config tied to real scraper/LLM clients. |
| **Stubbed externals** | Scraper and LLM are fake — response shapes match real APIs. |

---

## 📄 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI 0.138, Pydantic 2.13, Uvicorn |
| Frontend | React 19, Vite 8, Vanilla CSS |
| Tooling | oxlint, GitHub CLI |

---

## 📋 Deliverables

1. **[Final Code](PROD/Final_Code/)** — Production-ready backend + frontend
2. **[Sign-Off Note](PROD/Final_Code/SIGNOFF.md)** — Production readiness assessment
3. **[Decision Log](PROD/Final_Code/DECISION_LOG.md)** — AI interaction log with reasoning
4. **[Original Code](PROD/Receive_Code/)** — The buggy input files + assignment brief
