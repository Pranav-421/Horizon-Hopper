"""Horizon Hopper — FastAPI application entry point."""

import os
import sys

# Ensure the backend directory is on sys.path so `app.*` imports work
# regardless of the working directory used to launch the server.
_BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

from dotenv import load_dotenv

load_dotenv(os.path.join(_BACKEND_DIR, ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router

app = FastAPI(
    title="Horizon Hopper API",
    description="Personalized Agentic Travel Planner for Chennai & Chengalpattu",
    version="2.0.0",
)

# Allow the Next.js frontend (and any dev origin) to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
def health():
    return {"status": "ok", "service": "horizon-hopper-backend"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
