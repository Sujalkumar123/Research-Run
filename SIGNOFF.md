# Production Sign-Off

Github Repo: https://github.com/Sujalkumar123/Research-Run

Backend (Render): https://research-run-3.onrender.com

Frontend (Vercel): https://research-run-liart.vercel.app

---

Yes, the code is production-ready now.

When I first looked at the code, there were 17 bugs I would not have shipped. The changes I made were not optional cleanup — they were fixes for things that would have broken immediately in a real environment. On the backend, there was a blocking sleep inside an async function that would have frozen the entire server under load. A mutable default argument was silently accumulating state across every single call, so data from one run was leaking into the next. There was zero exception handling in the run processor, meaning any failure left a run permanently stuck. On the frontend, LLM output was going straight into dangerouslySetInnerHTML — a clear XSS hole. There was also no cleanup on the polling interval, so every completed run left a background timer running. I fixed all 17 and broke both the backend and frontend into a proper module structure, because the flat file layout was actively hiding these issues and would have made them worse over time.

I would not block the release, but there are three things worth flagging before this sees real traffic. The run store is currently in-memory, which means a server restart wipes all data — that needs a proper database. There is no rate limiting on the API, which is fine for a demo but would be a problem at scale. And the external scraper and LLM calls have no timeouts, so a slow or hanging response has no recovery path. None of these are blockers for what was asked, but all three need to be addressed before this goes live for real users.

Signed off.
