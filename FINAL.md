# Research Runs Dashboard — Submission

**Github Repo:** https://github.com/Sujalkumar123/Research-Run

**Backend (Render):** https://research-run-3.onrender.com

**Frontend (Vercel):** https://research-run-liart.vercel.app

---

## What's in the repo

The project is a full-stack Research Runs Dashboard. A user submits a research prompt and source URLs, the backend scrapes the pages and calls an LLM, and the frontend polls until the run completes and displays the result.

The repository is organized as follows:

```
PROD/Final_Code/
  backend/
    main.py               entry point
    config.py             env settings
    models.py             Pydantic schemas
    api/routes.py         HTTP endpoints
    services/run_service.py   core business logic
  frontend/
    src/
      App.jsx                     root component
      client/runs.js              API fetch layer
      hooks/useRunPoller.js       polling + retry logic
      components/RunForm.jsx      form and validation
      components/RunResult.jsx    result display
```

## Files included in this submission

- **DECISION_LOG.md** — a step-by-step log of every meaningful AI interaction, what was asked, what it returned, and whether I accepted or modified the output.
- **SIGNOFF.md** — a short production sign-off covering the audit findings, test results, and known non-blocking infrastructure gaps.
