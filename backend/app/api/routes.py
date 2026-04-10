"""FastAPI route handlers for the Horizon Hopper backend API."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.agents.feedback_agent import run_feedback_refinement, save_feedback_to_memory
from app.agents.memory_agent import authenticate, get_all_users, load_user_memory
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

router = APIRouter(prefix="/api")


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
    return {"user": profile.model_dump()}


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
    return {"status": "ok"}


# ── Trip Planning ─────────────────────────────────────────────


@router.post("/trips/plan")
def plan_trip(body: TripPlanRequest):
    result = run_planner(
        source=body.source,
        destination=body.destination,
        purpose=body.purpose,
        budget=body.budget,
        travel_time=body.travel_time,
        preferences=body.preferences,
        user_id=body.user_id,
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
        user_id=body.user_id,
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
