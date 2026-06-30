# Production Sign-Off

> **Feature:** Research Runs Dashboard (full-stack)
> **Date:** June 30, 2026
> **Verdict:** Ready to ship

---

## What is this?

A user submits a research prompt and source URLs. The backend scrapes the pages, calls an LLM, and returns a brief with KPIs. The frontend polls until the run completes, then displays everything.

Received two AI-generated files (`backend_main.py`, `frontend_App.jsx`). My job was to audit, fix, and sign off.

---

## What I found and fixed

Two passes of review. First pass caught the obvious correctness and security bugs. Second pass caught gaps that only surface in a real deployment.

### Pass 1 — 17 bugs fixed

| # | Backend | Severity |
|---|---------|----------|
| B1 | `msg.content` is a list — must read `content[0].text` | Critical |
| B2 | `def do_run(run_log=[])` — mutable default shared across calls | Critical |
| B3 | `time.sleep()` inside async function blocks the event loop | Critical |
| B4 | `run_id = len(RUNS) + 1` — race condition under concurrent requests | Critical |
| B5 | Unknown `run_id` causes `KeyError` → unhandled 500 | High |
| B6 | No input validation — accepts blank prompts, non-URLs | High |
| B7 | `allow_origins=["*"]` — CORS fully open | High |
| B8 | Exception in `do_run` leaves run stuck at "running" forever | High |

| # | Frontend | Severity |
|---|----------|----------|
| F1 | `setInterval` never cleared — memory leak on every run | Critical |
| F2 | No try/catch on fetch — network errors are silent | Critical |
| F3 | `dangerouslySetInnerHTML` on LLM output — XSS vulnerability | High |
| F4 | Blank lines in URL box sent as empty strings | High |
| F5 | No double-click guard — multiple concurrent submissions possible | High |
| F6 | No client-side validation — empty prompts reach the server | Medium |
| F7 | Missing `key` prop on sources list | Medium |
| F8 | Backend "error" status silently ignored in UI | Medium |
| F9 | Polling continues after terminal status | Medium |

### Pass 2 — 12 more gaps fixed

| # | What was wrong | What was done |
|---|----------------|---------------|
| B9 | No logging — zero observability in production | Added `logging` module; INFO on start/complete, ERROR with stack trace on failure |
| B10 | `asyncio.get_event_loop()` — raises `RuntimeError` on Python 3.10+ (confirmed 3.12) | Replaced with `asyncio.get_running_loop()` |
| B11 | No `GET /health` — load balancers have nothing to ping | Added `/health` → `{"status":"ok"}` |
| B12 | Single-file monolith — config, models, business logic, routes all mixed | Split into `config.py`, `models.py`, `services/run_service.py`, `api/routes.py` |
| B13 | `allow_credentials=True` — this API uses no cookies or session tokens | Removed |
| B14 | `ALLOWED_ORIGINS.split(",")` without `.strip()` — spaces in env var break CORS | Added `.strip()` per element; empty entries filtered |
| F10 | No `console.error` anywhere — frontend errors invisible in production | Added structured console logging in `client/runs.js` and `hooks/useRunPoller.js` |
| F11 | `const API = "http://localhost:8000"` hardcoded | Changed to `import.meta.env.VITE_API_URL ?? "http://localhost:8000"` |
| F12 | First poll failure immediately stops polling | 3 consecutive failures required before surfacing error; single blip is silently retried |
| F13 | 200-line single component — fetch, polling, validation, display all mixed | Split into `client/runs.js`, `hooks/useRunPoller.js`, `components/RunForm.jsx`, `components/RunResult.jsx` |
| F14 | `key={i}` (array index) on sources list | Changed to `key={s}` (URL string — stable and unique) |
| F15 | `// Fix N:` comments throughout — patch notes in production code | Replaced with concise WHY-based comments or removed |

---

## Final structure

```
backend                         frontend
──────────────────────────────  ──────────────────────────────────
main.py          app factory    App.jsx            root wiring
config.py        env settings   client/runs.js     fetch layer
models.py        Pydantic types hooks/useRunPoller.js  polling + retry
api/routes.py    HTTP layer     components/RunForm.jsx   form + validation
services/        business logic components/RunResult.jsx  result display
  run_service.py + RUNS store
```

---

## Live test results (Python 3.12, fastapi 0.138)

| Scenario | Result |
|----------|--------|
| `GET /health` | ✅ 200 `{"status":"ok"}` |
| `POST /runs` valid payload | ✅ 202, run completes, structured logs appear |
| `GET /runs/{id}` — completed run | ✅ full result with KPIs |
| Empty prompt | ✅ 422 |
| Whitespace-only prompt | ✅ 422 |
| Empty URL list | ✅ 422 |
| Invalid URL | ✅ 422 |
| Unknown run_id | ✅ 404 |
| Malformed JSON body | ✅ 422 |
| 3 concurrent runs | ✅ all complete independently |
| Wrong Content-Type | ✅ 422 |

---

## Is it production-ready?

**Yes — for the stubbed/demo deployment this brief describes.**

The three criteria in the brief are met:

1. **Behaves correctly across inputs and conditions** — 29 bugs fixed total; all 11 edge-case tests pass against the live server.
2. **Runs stay observable** — structured logging on backend (INFO on start/complete, ERROR with stack trace on failure); `console.error` on frontend for every caught exception.
3. **UI stays usable when things go wrong** — validation errors shown inline, server errors shown in banner, transient poll failures silently retried (3 strikes before surfacing), form disabled during active run to prevent duplicate submissions.

Three items remain out of scope — they require infrastructure decisions outside this feature and were identified in the original brief's spirit of "would you block the release?":

| Item | Why not done |
|------|-------------|
| Persistent storage | `RUNS = {}` is in-memory; restart loses data. Requires Redis or a DB — outside this feature's scope. |
| Rate limiting | No throttle on `POST /runs`. Requires middleware or an API gateway — deployment concern, not feature code. |
| Timeouts on external calls | Real scrapers and LLM calls can hang. Requires timeout config tied to the specific clients used in production. |

None of these are bugs — they are infrastructure gaps that exist whether or not this feature is deployed. They do not affect correctness, observability, or UI resilience within the scope of this take-home.

**Signed off.**
