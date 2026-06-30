"""
main.py — Research Runs API: application factory.

Wires together configuration, logging, CORS middleware, and the API router.
Business logic lives in services/run_service.py; routes in api/routes.py.

Run:  uvicorn main:app --reload
"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from api.routes import router

logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%SZ",
)

app = FastAPI(title="Research Runs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
