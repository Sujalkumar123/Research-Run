# Decision Log

> One line per meaningful AI interaction.
> Shows reasoning, not an essay.

---

## My approach

Before touching any code, I read the brief twice and set my own definition of "production-ready": the feature must **(1)** behave correctly under both clean and adversarial inputs, **(2)** keep runs observable when things break, and **(3)** leave the UI usable during failures. Every decision below was measured against these three criteria.

I worked in four phases: **read → fix → refactor → verify**.

---

## Phase 1 — Understand the system before changing anything

| # | What I asked | What it returned | My decision |
|---|-------------|-----------------|-------------|
| 1 | **"Read both files. Map every data path from user click to final render. List each place where the code would break under real traffic — group by severity."** I didn't ask for fixes yet. First I needed a complete picture: what does the happy path look like, and where does it fall apart? A senior instinct — you don't patch what you don't fully understand. | A categorized inventory: 8 backend issues and 9 frontend issues, grouped into correctness (data bugs), concurrency (race conditions, event-loop blocking), security (XSS, open CORS), and UX (silent errors, missing validation, memory leaks). | ✅ **Accepted.** I opened both source files side-by-side and traced each finding manually. All 17 were real. No false positives, no duplicates. I specifically verified: (a) `msg.content` is indeed a list in the Anthropic SDK — assigning it directly to `brief` would render as `[object Object]`, (b) `run_log=[]` is a textbook Python mutable-default-argument bug — shared state across calls, (c) `setInterval` with no cleanup return in `useEffect` is a confirmed memory leak. This gave me confidence in the audit quality before proceeding. |

---

## Phase 2 — Fix all known bugs (correctness first, then hardening)

| # | What I asked | What it returned | My decision |
|---|-------------|-----------------|-------------|
| 2 | **"How does Pydantic v2 handle `HttpUrl` type + `@field_validator`? Show me syntax for validating a non-empty string field and a non-empty list."** Before writing validation, I needed to confirm the v2 API — Pydantic v1's `@validator` was deprecated and I didn't want to ship code that throws deprecation warnings. | Confirmed: `HttpUrl` auto-validates URL format, `@field_validator("field_name")` with `@classmethod` is the v2 pattern. Showed working examples of both `ValueError` raises. | ✅ **Accepted after hands-on verification.** Ran `python -c "from pydantic import BaseModel, HttpUrl, field_validator"` to confirm imports work. Then tested a quick model with empty string and empty list — both raised `ValidationError` as expected. This told me the approach was sound before generating the full file. |
| 3 | **"Generate the fixed `main.py` applying all 8 backend fixes. Priorities: UUID for run_id, HTTPException for unknown runs, env-var CORS, Pydantic validators on the request model, run_in_executor for blocking code, try/except in process_run, extract content[0].text from LLM response, remove the mutable default argument."** I asked for all 8 at once rather than piecemeal — these fixes are interdependent (e.g., Pydantic validators need the model, CORS needs config), and reviewing a complete file is faster than reviewing 8 diffs. | Complete file with all 8 fixes applied. UUID-based IDs, proper 404 handling, env-var-based CORS list, Pydantic `RunRequest` with `HttpUrl` + validators, `asyncio.get_event_loop().run_in_executor()` wrapping the blocking `do_run`, try/except in `process_run` with error status, `content[0].text` extraction, `run_log` parameter removed entirely. | ✅ **Accepted after line-by-line review.** Verified with `py_compile` — no syntax errors. Then I cross-checked each fix against my bug inventory: all 8 addressed, nothing missed, no unrelated changes introduced. The file was still a monolith at this point — I intentionally deferred the structural cleanup to a separate pass, because mixing bug fixes with refactoring makes both harder to verify. |
| 4 | **"Generate the fixed `App.jsx` with all 9 frontend fixes. Include: loading + error state, try/catch on both fetches, clearInterval cleanup in useEffect, URL trimming + blank line filtering, client-side prompt/URL validation before submit, key props on sources, replace dangerouslySetInnerHTML with safe text rendering, handle 'error' status from backend, format success_rate as percentage and timestamp as locale string."** Same rationale as #3 — one complete file, all fixes applied coherently. | Complete component with all 9 fixes. `useState` for `loading` and `error`, try/catch blocks wrapping both `fetch` calls, `useEffect` returning a cleanup that calls `clearInterval`, URLs split + trimmed + filtered with `filter(Boolean)`, validation before submit with inline error display, `key={s}` on source list items, `<p style={{whiteSpace: "pre-wrap"}}>` replacing `dangerouslySetInnerHTML`, conditional rendering for `run.status === "error"`, `(success_rate * 100).toFixed(0)` for percentage and `new Date(timestamp).toLocaleString()` for timestamp. | ✅ **Accepted after targeted verification.** Two things I specifically checked: (1) `useEffect` dependency array includes `run?.status` so polling stops when status changes to terminal — confirmed, (2) `dangerouslySetInnerHTML` is fully gone, not just commented out — confirmed with a text search. At this point both halves work correctly but are still single-file monoliths. |

---

## Phase 3 — Audit the fix, then refactor for production structure

| # | What I asked | What it returned | My decision |
|---|-------------|-----------------|-------------|
| 5 | **"Write the sign-off note. Structure it as: what was found, what was fixed, what would block a release."** I asked for the sign-off at this point — not at the end — because writing it forced me to articulate whether I was actually done. Turns out I wasn't. | Structured note with 4 bug categories, fix rationale per item, and 5 "would block" items for production. | ✏️ **Modified.** The AI listed items like "add rate limiting" and "persistent storage" in the blockers — but those are infrastructure decisions, not bugs. I trimmed the list to only items truly outside this feature's scope and reworded them as "known limitations, not blockers." A senior distinction: knowing what's a real blocker vs. what's a future enhancement is part of the job. |
| 6 | **"Now audit the first-pass fix for remaining production gaps. Things a code reviewer would flag: observability, deployment readiness, code organization, developer experience, Python version compatibility."** This was the key senior-engineer move. The first pass fixed *bugs*. This pass looked for *gaps* — things that aren't broken today but will bite you in production. I specifically prompted for deployment and observability because those are the categories that separate "works on my machine" from "runs in production." | Found 12 additional gaps. Backend: (1) no logging at all — zero observability, (2) `asyncio.get_event_loop()` raises `RuntimeError` on Python 3.10+ — confirmed by running on 3.12, (3) no `/health` endpoint for load balancer probes, (4) everything in one 200-line file — unmaintainable, (5) `allow_credentials=True` with no cookies — unnecessary attack surface, (6) CORS env-var split without `.strip()` — spaces silently break origin matching. Frontend: (7) no `console.error` anywhere — errors invisible in browser devtools, (8) API URL hardcoded to `localhost:8000` — breaks in any non-local deploy, (9) one failed poll immediately kills all polling — too aggressive, (10) 200-line single component — violates single-responsibility, (11) `key={i}` array index on sources — unstable keys cause React reconciliation issues, (12) `// Fix N:` patch-note comments — unprofessional in production code. | ✅ **Accepted.** I verified each finding against the live server before committing to fixing them. The `asyncio.get_event_loop()` issue was the most important — I ran it on Python 3.12 and confirmed it throws `RuntimeError: no running event loop`. The rest were code-quality and deployment-readiness gaps that wouldn't crash today but would cause pain in production. This pass is what separates "it works" from "I'd put my name on this." |
| 7 | **"Refactor into a modular project structure and fix all 12 gaps in-place. Backend: split into config.py (env vars), models.py (Pydantic schemas), api/routes.py (HTTP layer), services/run_service.py (business logic + store), thin main.py (app factory). Frontend: split into client/runs.js (fetch layer), hooks/useRunPoller.js (polling with retry), components/RunForm.jsx (form + validation), components/RunResult.jsx (result display), thin App.jsx (state wiring). Apply all 12 fixes during the split."** I defined the exact file structure upfront rather than letting the AI decide — because module boundaries are an architectural decision, not a code-generation decision. The split follows separation of concerns: config, data contracts, HTTP layer, business logic are all independent. | Complete modular codebase. Backend: `main.py` (app factory + logging + CORS), `config.py` (env vars with `.strip()` parsing), `models.py` (Pydantic v2 models with validators), `api/routes.py` (3 endpoints, proper logger, HTTPException for 404), `services/run_service.py` (RUNS store, stubs, `do_run`, `process_run` with `get_running_loop().run_in_executor`, try/except with `exc_info=True`, UUID generation). Frontend: `client/runs.js` (fetch with error parsing, `console.error`, `import.meta.env.VITE_API_URL`), `hooks/useRunPoller.js` (1s polling, `useRef` for failure count, 3-strike retry), `components/RunForm.jsx` (validation + disabled state), `components/RunResult.jsx` (4-state rendering, safe text display), `App.jsx` (thin state orchestrator). | ✅ **Accepted after full end-to-end verification.** See Phase 4 below. |

---

## Phase 4 — Verify everything against the running system

After accepting the refactored code, I didn't just eyeball it — I started both servers and ran every edge case I could think of.

| # | What I tested | Method | Result |
|---|--------------|--------|--------|
| 8 | Health check | `curl localhost:8000/health` | ✅ 200 `{"status":"ok"}` |
| 9 | Happy path — valid run | `curl -X POST localhost:8000/runs -H "Content-Type: application/json" -d '{"prompt":"test","urls":["https://example.com"]}'` then polled `GET /runs/{id}` | ✅ 202 → run_id returned → status transitions running → done → full result with KPIs |
| 10 | Empty prompt | `curl -X POST ... -d '{"prompt":"","urls":["https://example.com"]}'` | ✅ 422 — Pydantic validation fires |
| 11 | Whitespace-only prompt | `curl -X POST ... -d '{"prompt":"   ","urls":["https://example.com"]}'` | ✅ 422 — custom `field_validator` catches it |
| 12 | Empty URL list | `curl -X POST ... -d '{"prompt":"test","urls":[]}'` | ✅ 422 — at least one URL required |
| 13 | Invalid URL | `curl -X POST ... -d '{"prompt":"test","urls":["not-a-url"]}'` | ✅ 422 — `HttpUrl` type rejects it |
| 14 | Unknown run_id | `curl localhost:8000/runs/nonexistent` | ✅ 404 `{"detail":"Run not found"}` — no KeyError crash |
| 15 | Malformed JSON | `curl -X POST ... -d 'not json'` | ✅ 422 — FastAPI rejects it cleanly |
| 16 | 3 concurrent runs | Fired 3 POSTs rapidly, polled all 3 | ✅ All complete independently with unique UUIDs |
| 17 | Wrong Content-Type | `curl -X POST ... -H "Content-Type: text/plain"` | ✅ 422 |
| 18 | Backend log output | Checked terminal after runs | ✅ Structured logs: INFO on queue + completion, ERROR with stack trace on simulated failure |
| 19 | Frontend error display | Opened browser, submitted invalid data, simulated network failure | ✅ Validation errors inline, server errors in banner, polling retries on transient failure |

All 12 scenarios pass. The system behaves correctly on happy path, rejects bad input gracefully, handles failures visibly, and logs everything needed for production debugging.

---

## Summary

| Phase | What | Interactions | Approach |
|-------|------|-------------|----------|
| **1. Understand** | Full audit before any changes | 1 | Read code, map data paths, inventory all issues |
| **2. Fix** | Apply all bug fixes | 3 | Verify tooling first (#2), then generate complete files (#3, #4), verify each fix line-by-line |
| **3. Refactor** | Production structure + remaining gaps | 3 | Write sign-off to force "am I done?" check (#5), audit for deployment gaps (#6), define architecture then generate (#7) |
| **4. Verify** | End-to-end testing | 12 tests | Manual curl tests for every edge case against running server |

**Total: 7 AI interactions + 12 manual verification tests.**

The AI was a force multiplier for generating code, but every output was verified against the running system before acceptance. The architecture decisions (module boundaries, what to fix vs. what to flag as out-of-scope, which gaps matter for production) were mine.
