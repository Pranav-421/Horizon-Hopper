"""FastAPI route handlers for the Horizon Hopper backend API."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request

from app.agents.feedback_agent import run_feedback_refinement, save_feedback_to_memory
from app.agents.memory_agent import authenticate, get_all_users, load_user_memory
from app.core.security import create_token, decode_token
from app.db.database import save_feedback as db_save_feedback
from app.models.schemas import (
    FeedbackRequest,
    LoginRequest,
    MemorySummary,
    TripPlanRequest,
    TripRefineRequest,
    UserProfile,
)
from app.services.formatter import format_planner_response, _to_memory_summary
from app.services.orchestrator import run_planner

logger = logging.getLogger("horizon_hopper")

router = APIRouter(prefix="/api")


# ── Helper: extract user from JWT ─────────────────────────────


def _get_current_user(request: Request) -> str | None:
    """Extract user_id from Authorization header if present."""
    auth = request.headers.get("authorization", "")
    if auth.startswith("Bearer "):
        payload = decode_token(auth[7:])
        if payload:
            return payload.get("sub")
    return None


# ── Auth ──────────────────────────────────────────────────────


@router.post("/auth/login")
def login(body: LoginRequest):
    user = authenticate(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    memory = load_user_memory(user["id"])
    profile = UserProfile(
        id=user["id"],
        name=user.get("name", user["id"]),
        avatar=user.get("avatar", "U"),
        memory=_to_memory_summary(memory),
    )

    # Generate JWT token
    token = create_token(user["id"], {"name": user.get("name", user["id"])})

    return {
        "user": profile.model_dump(),
        "token": token,
    }


# ── Users ─────────────────────────────────────────────────────


@router.get("/users")
def list_users():
    raw = get_all_users()
    profiles = []
    for uid, data in raw.items():
        memory = data.get("memory", {})
        profiles.append(
            UserProfile(
                id=uid,
                name=data.get("name", uid),
                avatar=data.get("avatar", "U"),
                memory=_to_memory_summary(memory),
            ).model_dump()
        )
    return {"users": profiles}


@router.get("/users/{user_id}/memory")
def get_memory(user_id: str):
    memory = load_user_memory(user_id)
    return _to_memory_summary(memory).model_dump()


# ── Feedback ──────────────────────────────────────────────────


@router.post("/users/{user_id}/feedback")
def save_feedback(user_id: str, body: FeedbackRequest):
    save_feedback_to_memory(user_id, body.feedback, body.section, body.satisfied)
    db_save_feedback(user_id, body.feedback, body.section)
    return {"status": "ok"}


# ── Trip Planning ─────────────────────────────────────────────


@router.post("/trips/plan")
def plan_trip(body: TripPlanRequest, request: Request):
    # Use JWT user if available, else fall back to body.user_id
    jwt_user = _get_current_user(request)
    user_id = jwt_user or body.user_id

    result = run_planner(
        source=body.source,
        destination=body.destination,
        purpose=body.purpose,
        budget=body.budget,
        travel_time=body.travel_time,
        preferences=body.preferences,
        user_id=user_id,
        service_mode=body.service_mode,
    )
    return format_planner_response(
        agent_output=result,
        source=body.source,
        destination=body.destination,
        purpose=body.purpose,
        budget=body.budget,
        travel_time=body.travel_time,
        preferences=body.preferences,
        user_id=user_id,
        service_mode=body.service_mode,
    )


# ── Trip Refinement ───────────────────────────────────────────


@router.post("/trips/refine")
def refine_trip(body: TripRefineRequest):
    updated = run_feedback_refinement(
        original_result=body.result,
        feedback=body.feedback,
        trip_context=body.trip_context,
    )

    ctx = body.trip_context
    return format_planner_response(
        agent_output=updated,
        source=ctx.get("source", ""),
        destination=ctx.get("destination", ""),
        purpose=ctx.get("purpose", ""),
        budget=ctx.get("budget", ""),
        travel_time=ctx.get("travel_time", ""),
        preferences=ctx.get("preferences", ""),
        user_id=ctx.get("user_id", "guest"),
        service_mode=body.service_mode,
        updated_section=updated.get("_updated_section"),
    )


# ── Knowledge Graph (Graphify) ────────────────────────────────

GRAPH_DIR = Path(__file__).resolve().parents[3] / "graphify-out"


@router.get("/graph/data")
def get_graph_data():
    """Serve the graphify knowledge graph JSON."""
    graph_json = GRAPH_DIR / "graph.json"
    if not graph_json.exists():
        raise HTTPException(
            status_code=404,
            detail="Knowledge graph not built yet. Run: graphify .",
        )
    with open(graph_json, encoding="utf-8") as f:
        return json.load(f)


@router.get("/graph/report")
def get_graph_report():
    """Serve the graphify architecture report."""
    report_md = GRAPH_DIR / "GRAPH_REPORT.md"
    if not report_md.exists():
        raise HTTPException(status_code=404, detail="Graph report not found.")
    return {"report": report_md.read_text(encoding="utf-8")}
