"""
services/run_service.py — Core business logic for research runs.

Owns the in-memory run store, the scraping/LLM stubs, and the async
background task that drives each run from start to completion.
"""
import asyncio
import logging
import time
import uuid
from datetime import datetime, timezone

logger = logging.getLogger("research_runs.service")

# In-memory store: run_id -> RunResponse-shaped dict.
# For production with real traffic, replace with Redis or a database.
RUNS: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Stubbed externals — response shapes match real Firecrawl / LLM responses.
# Replace with real implementations when deploying with live integrations.
# ---------------------------------------------------------------------------

def _scrape_page(url: str) -> dict:
    # prod: Firecrawl SDK or requests + BeautifulSoup
    time.sleep(0.2)
    return {
        "url": url,
        "title": f"Title for {url}",
        "content": f"Scraped body of {url}. " * 20,
    }


def _call_llm(_prompt: str, _pages: list[dict]) -> tuple[str, int]:
    # prod: Azure OpenAI / Anthropic — wire up credentials in config.py
    brief = "- Key finding A\n- Key finding B"
    tokens = 280
    return brief, tokens


# ---------------------------------------------------------------------------
# Run logic
# ---------------------------------------------------------------------------

def do_run(prompt: str, urls: list[str]) -> dict:
    """Scrape pages and call LLM synchronously. Run in a thread pool (blocking)."""
    pages = [_scrape_page(u) for u in urls]

    seen: set[str] = set()
    sources: list[str] = []
    for p in pages:
        if p["title"] not in seen:
            seen.add(p["title"])
            sources.append(p["url"])

    brief, tokens = _call_llm(prompt, pages)

    pages_scraped = len(pages)
    successful = [p for p in pages if p["content"]]
    # Guard against an empty pages list (shouldn't happen — validation enforces ≥1 URL,
    # but defensive against future code paths that bypass the validator).
    success_rate = len(successful) / pages_scraped if pages_scraped else 0.0

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "prompt": prompt,
        "pages_scraped": pages_scraped,
        "success_rate": success_rate,
        "tokens_used": tokens,
        "sources": sources,
        "brief": brief,
    }


async def process_run(run_id: str, prompt: str, urls: list[str]) -> None:
    """Background task: execute a run and update the store with result or error."""
    logger.info("run %s started prompt_len=%d url_count=%d", run_id, len(prompt), len(urls))
    try:
        # do_run is blocking (time.sleep / real I/O in prod); run off the event loop.
        row = await asyncio.get_running_loop().run_in_executor(None, do_run, prompt, urls)
        RUNS[run_id]["status"] = "done"
        RUNS[run_id]["result"] = row
        logger.info(
            "run %s completed pages=%d tokens=%d",
            run_id,
            row["pages_scraped"],
            row["tokens_used"],
        )
    except Exception:
        RUNS[run_id]["status"] = "error"
        RUNS[run_id]["error"] = "An internal error occurred. Please try again."
        # exc_info=True preserves the full stack trace in the log record.
        logger.error("run %s failed", run_id, exc_info=True)


def create_run() -> str:
    """Register a new run in the store and return its id."""
    run_id = str(uuid.uuid4())
    RUNS[run_id] = {"status": "running", "result": None, "error": None}
    return run_id


def get_run(run_id: str) -> dict | None:
    """Return the run record or None if the id is unknown."""
    return RUNS.get(run_id)
