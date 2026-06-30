# Take-home: Research Runs (full-stack)

**Time:** ~90–120 minutes
**Tools:** Use AI freely — Claude, Cursor, Codex, whatever you normally reach for. We expect it.

## Context

You're picking up a small full-stack feature: a **Research Runs** dashboard. A user submits a prompt and a list of source URLs; the backend scrapes the pages, synthesizes a brief with an LLM, and records the run's KPIs. Because a run takes a while, the API returns a `run_id` immediately and processes the run in the background; the frontend polls until it's done, then shows the brief and KPIs.

It was put together with AI assistance and needs to go into production.

- `backend_main.py` — FastAPI service (`POST /runs` starts a run, `GET /runs/{run_id}` returns its status/result). Scrape and LLM calls are stubbed so it runs with no keys or network; the response shapes match the real ones.
- `frontend_App.jsx` — the React UI (single component) that submits a run and polls for the result.

## Your task

Integrate the two halves and **sign off that the feature is production-ready.** Treat it the way you would if it were going live on real traffic tomorrow and your name was on it.

"Production-ready" means it behaves correctly across the inputs and conditions a real deployment will throw at it — not only the clean case — and that runs stay observable and the UI stays usable when things go wrong. Beyond that, the definition of done is yours to set; that judgment is part of what we're looking at.

## Running it

**Backend:** `pip install fastapi uvicorn` then `uvicorn main:app --reload` (rename `backend_main.py` to `main.py`, or adjust the command). Serves on `http://localhost:8000`.

**Frontend:** drop `frontend_App.jsx` in as the `App` component of any React setup (a fresh Vite React app is simplest: `npm create vite@latest`, replace `App.jsx`, `npm install`, `npm run dev`).

## What to submit

1. **The code** — your final backend and frontend, however much or little you change.
2. **A short sign-off note** (a few paragraphs): is it production-ready? What did you change and why? If you'd block the release on anything, say what.
3. **Your decision log** (template below) — one line per meaningful AI interaction.

## Reference: shapes

`POST /runs` request → `{ "prompt": "…", "urls": ["https://…", "…"] }`, response → `{ "run_id": "1" }`

`GET /runs/{run_id}` →

```json
{
  "status": "running | done",
  "result": {
    "timestamp": "…", "prompt": "…", "pages_scraped": 2,
    "success_rate": 1.0, "tokens_used": 280,
    "sources": ["https://…"], "brief": "…"
  }
}
```

---

## Decision log

One line per meaningful AI call. Keep it lightweight — the point is to show your reasoning, not to write an essay.

| # | What I asked the AI | What it gave back | Accepted / rejected / modified — and why |
|---|---------------------|-------------------|------------------------------------------|
| 1 |                     |                   |                                          |
| 2 |                     |                   |                                          |
| 3 |                     |                   |                                          |
