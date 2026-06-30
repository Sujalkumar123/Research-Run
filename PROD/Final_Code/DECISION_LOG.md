# Decision Log

> One line per meaningful AI interaction.
> Shows reasoning, not an essay.

---

| # | What I asked | What it returned | My decision |
|---|-------------|-----------------|-------------|
| 1 | **"Read both files and list every production bug."** | A categorized list: 8 backend bugs, 9 frontend bugs — grouped by correctness, concurrency, security, UX. | ✅ **Accepted.** Cross-checked each finding against the code. All 17 were real bugs, no false positives. |
| 2 | **"How does Pydantic v2 HttpUrl + field_validator work?"** | Confirmed Pydantic v2 syntax: `HttpUrl` for URL validation, `@field_validator` replaces old `@validator`. Working examples. | ✅ **Accepted.** Ran a quick `python -c` test to confirm `ValidationError` fires on empty strings and empty lists. |
| 3 | **"Generate the fixed main.py with all 8 backend fixes."** | Complete file: UUID IDs, HTTPException 404, env-var CORS, Pydantic validators, thread pool executor, try/except in process_run, `content[0].text` extraction, removed mutable default. | ✅ **Accepted after verification.** Compiled with `py_compile` — no errors. Checked each fix against the original bug list. |
| 4 | **"Generate the fixed App.jsx with all 9 frontend fixes + display formatting."** | Complete file: loading/error state, try/catch on fetches, clearInterval cleanup, URL trimming, client-side validation, key props, XSS fix, error status handling, percentage + timestamp formatting. | ✅ **Accepted after verification.** Confirmed useEffect deps include `run?.status`, confirmed `dangerouslySetInnerHTML` fully removed. |
| 5 | **"Write the sign-off note."** | Structured note: 4 bug categories, each fix with rationale, 5 items for real-traffic deployment. | ✏️ **Modified.** Trimmed the "would block" section to only items outside scope — not bugs already fixed. |
| 6 | **"Audit the first-pass solution for remaining production gaps."** | Found 6 backend gaps (no logging, deprecated `asyncio.get_event_loop()`, no `/health`, single-file monolith, unnecessary `allow_credentials`, CORS env-var parsing without strip) and 6 frontend gaps (no `console.error`, hardcoded API URL, single poll failure kills polling, 200-line monolith, index key on sources, inline Fix-N comments). Confirmed `asyncio.get_event_loop()` raises `RuntimeError` on Python 3.12 in practice. | ✅ **Accepted.** Verified each finding against the running server before including. |
| 7 | **"Refactor into a modular structure and fix all 12 remaining gaps."** | Backend split into `config.py`, `models.py`, `services/run_service.py`, `api/routes.py`, thin `main.py`. Frontend split into `client/runs.js`, `hooks/useRunPoller.js`, `components/RunForm.jsx`, `components/RunResult.jsx`, thin `App.jsx`. All 12 gaps fixed in-place. | ✅ **Accepted after live verification.** Re-ran all 11 edge-case curl tests against the reloaded server — all pass. `/health` now returns 200. Structured log lines appear on `POST /runs` and completion. |
