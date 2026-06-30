# Final Code — Research Runs Dashboard

Github Repo: https://github.com/Sujalkumar123/Research-Run

Backend (Render): https://research-run-3.onrender.com

Frontend (Vercel): https://research-run-liart.vercel.app

---

The original code was two files. I ended up with ten. That's roughly how much I changed.

The backend started as a single `main.py` with everything crammed in — config, data models, HTTP routes, and business logic all living together. I pulled each of those into its own file. `config.py` handles environment variables, `models.py` has the Pydantic schemas with proper validation, `api/routes.py` is purely the HTTP layer, and `services/run_service.py` is where the actual run processing happens. `main.py` just creates the app and plugs everything in. While doing the split, I fixed the underlying bugs — UUIDs instead of sequential run IDs, the blocking scraper calls moved to a thread pool, proper exception handling so failed runs don't hang forever, and 404s for unknown run IDs.

The frontend went through the same process. `App.jsx` became a thin wrapper. The fetch logic moved to `client/runs.js`, the polling to `hooks/useRunPoller.js` with proper cleanup and a retry mechanism, and the UI into `RunForm.jsx` and `RunResult.jsx`. The XSS vulnerability from injecting LLM output as HTML is gone — it renders as plain text now. The API URL is an environment variable, not localhost hardcoded into the source.

What I didn't change is the actual behaviour of the app — the research flow, the scraping, the LLM call, the response shape. All of that is identical to what I was given. I only changed how it runs.
