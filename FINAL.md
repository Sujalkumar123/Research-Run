# Research Runs Dashboard — Submission

Github Repo: https://github.com/Sujalkumar123/Research-Run
Backend (Render): https://research-run-3.onrender.com
Frontend (Vercel): https://research-run-liart.vercel.app

---

## What this project is

The Research Runs Dashboard is a full-stack web application where a user submits a research prompt along with source URLs. The backend takes those URLs, scrapes the content, and calls an LLM to generate a structured research brief with KPIs. The frontend polls the backend until the run finishes and then displays the result.

I was given the initial AI-generated code and tasked with auditing it, fixing everything that would break in production, and deploying it end to end.

## How the code is organised

```
PROD/Final_Code/
  backend/
    main.py                     app entry point
    config.py                   environment settings
    models.py                   Pydantic request/response schemas
    api/routes.py               HTTP endpoints
    services/run_service.py     core execution logic and run store

  frontend/
    src/
      App.jsx                   root component
      client/runs.js            API fetch layer
      hooks/useRunPoller.js     polling logic with retry
      components/RunForm.jsx    form and input validation
      components/RunResult.jsx  result display
```

## Files in this submission

**FINAL.md** — this file. Quick overview and links.

**DECISION_LOG.md** — a log of every meaningful AI interaction during the build. Shows what I asked, what the AI returned, and the reasoning behind whether I accepted, rejected, or modified the output.

**SIGNOFF.md** — the production sign-off. Covers what was found, what was fixed, how the system was tested, and what known limitations remain out of scope.
