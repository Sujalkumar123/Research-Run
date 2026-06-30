"""
models.py — Pydantic request and response models for the Research Runs API.

Keeping models in a separate module lets routes, services, and tests all import
from one place without circular dependencies.
"""
from typing import Optional
from pydantic import BaseModel, HttpUrl, field_validator


class RunRequest(BaseModel):
    prompt: str
    urls: list[HttpUrl]

    @field_validator("prompt")
    @classmethod
    def prompt_must_not_be_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Prompt must be a non-empty string")
        return v

    @field_validator("urls")
    @classmethod
    def urls_must_not_be_empty(cls, v: list[HttpUrl]) -> list[HttpUrl]:
        if not v:
            raise ValueError("At least one URL is required")
        return v


class RunResult(BaseModel):
    timestamp: str
    prompt: str
    pages_scraped: int
    success_rate: float
    tokens_used: int
    sources: list[str]
    brief: str


class RunResponse(BaseModel):
    status: str                       # "running" | "done" | "error"
    result: Optional[RunResult] = None
    error: Optional[str] = None
