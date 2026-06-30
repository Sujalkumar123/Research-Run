"""
config.py — Application settings loaded from environment variables.

All configurable values live here. Import from this module instead of
calling os.getenv() scattered across the codebase.
"""
import os

# Comma-separated list of allowed CORS origins.
# Example: ALLOWED_ORIGINS="https://app.example.com,https://staging.example.com"
ALLOWED_ORIGINS: list[str] = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
    if o.strip()
]

# Python logging level for the application logger.
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()
