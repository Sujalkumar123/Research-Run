"""
api/routes.py — FastAPI router for the Research Runs API.

Keeps HTTP concerns (request parsing, status codes, error responses) separate
from business logic, which lives in services/run_service.py.
"""
import asyncio
import logging

from fastapi import APIRouter, HTTPException

from models import RunRequest, RunResponse
from services import run_service

logger = logging.getLogger("research_runs.api")

router = APIRouter()


@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/runs", response_model=dict, status_code=202)
async def start_run(req: RunRequest):
    urls_str = [str(u) for u in req.urls]
    run_id = run_service.create_run()
    asyncio.create_task(run_service.process_run(run_id, req.prompt, urls_str))
    logger.info("run %s queued prompt_len=%d url_count=%d", run_id, len(req.prompt), len(urls_str))
    return {"run_id": run_id}


@router.get("/runs/{run_id}", response_model=RunResponse)
async def get_run(run_id: str):
    run = run_service.get_run(run_id)
    if run is None:
        logger.warning("run %s not found", run_id)
        raise HTTPException(status_code=404, detail="Run not found")
    return run
