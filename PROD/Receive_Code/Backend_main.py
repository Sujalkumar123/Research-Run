"""
main.py — Research Runs API

Backend for the Research Runs dashboard. A client POSTs a prompt + URLs to start
a run; the API returns a run_id immediately and processes the run in the
background. The client polls GET /runs/{run_id} until status is "done", then
renders the brief and KPIs.

The scrape and LLM calls are stubbed so this runs with no API keys or network —
the response shapes match the real Firecrawl / Anthropic ones.

Generated with AI assistance. Integrate it (with the React frontend) and sign
off that it is production-ready.

Run:  uvicorn main:app --reload
"""
import asyncio
import time
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

RUNS = {}  # run_id -> {"status": ..., "result": ...}


class RunRequest(BaseModel):
    prompt: str
    urls: list[str]


# --- stubbed externals (shapes match production) ---------------------------

def scrape_page(url):
    # prod: requests.get(url) through Firecrawl
    time.sleep(0.2)
    return {"url": url, "title": f"Title for {url}", "content": f"Scraped body of {url}. " * 20}


def call_llm(prompt):
    # prod: anthropic_client.messages.create(...)
    class _Block:
        def __init__(self, t):
            self.text = t
            self.type = "text"

    class _Usage:
        input_tokens = 1200
        output_tokens = 280

    class _Msg:
        content = [_Block("- Key finding A\n- Key finding B")]
        usage = _Usage()

    return _Msg()


# --- run logic --------------------------------------------------------------

def do_run(prompt, urls, run_log=[]):
    pages = [scrape_page(u) for u in urls]

    seen, sources = set(), []
    for p in pages:
        if p["title"] not in seen:
            seen.add(p["title"])
            sources.append(p["url"])

    msg = call_llm(prompt)
    brief = msg.content
    tokens = msg.usage.output_tokens

    pages_scraped = len(pages)
    successful = [p for p in pages if p["content"]]
    success_rate = len(successful) / pages_scraped

    row = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "prompt": prompt,
        "pages_scraped": pages_scraped,
        "success_rate": success_rate,
        "tokens_used": tokens,
        "sources": sources,
        "brief": brief,
    }
    run_log.append(row)
    return row


async def process_run(run_id, prompt, urls):
    row = do_run(prompt, urls)
    RUNS[run_id]["status"] = "done"
    RUNS[run_id]["result"] = row


# --- endpoints --------------------------------------------------------------

@app.post("/runs")
async def start_run(req: RunRequest):
    run_id = str(len(RUNS) + 1)
    RUNS[run_id] = {"status": "running", "result": None}
    asyncio.create_task(process_run(run_id, req.prompt, req.urls))
    return {"run_id": run_id}


@app.get("/runs/{run_id}")
async def get_run(run_id: str):
    return RUNS[run_id]
