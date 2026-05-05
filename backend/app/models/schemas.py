"""Pydantic request / response schemas for the Horizon Hopper API."""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


# ── Auth ──────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


# ── Trip Planning ─────────────────────────────────────────────

class TripPlanRequest(BaseModel):
    user_id: str = "guest"
    source: str
    destination: str
    purpose: str
    budget: str = ""
    travel_time: str = ""
    preferences: str = ""
    service_mode: str = "full_package"


class TripRefineRequest(BaseModel):
    result: dict
    feedback: str
    trip_context: dict
    service_mode: str = "full_package"


# ── Feedback ──────────────────────────────────────────────────

class FeedbackRequest(BaseModel):
    feedback: str
    section: str = "general"
    satisfied: bool = True


# ── Response sub-models ──────────────────────────────────────

class LatLng(BaseModel):
    lat: float
    lng: float


class MapBounds(BaseModel):
    southWest: LatLng
    northEast: LatLng


class MapMarker(BaseModel):
    kind: str
    label: str
    area: str
    lat: float
    lng: float


class MapHighlight(BaseModel):
    kind: str
    label: str
    area: str
    lat: float
    lng: float
    distance_km: float
    type: str


class MapData(BaseModel):
    center: LatLng
    bounds: MapBounds
    route: list[LatLng]
    markers: list[MapMarker]
    highlights: list[MapHighlight]


class CommuteItem(BaseModel):
    mode: str
    duration: str
    price: str
    summary: str


class CommuteSections(BaseModel):
    items: list[CommuteItem]
    traffic_outlook: str


class StayItem(BaseModel):
    name: str
    area: str
    price: str
    rating: str
    details: str
    type: str


class AttractionItem(BaseModel):
    name: str
    distance: str
    best_time: str
    fit: str


class Sections(BaseModel):
    itinerary: str
    commute: CommuteSections
    stay: list[StayItem]
    attractions: list[AttractionItem]


class RawSections(BaseModel):
    commute_options: str
    stay_options: str
    attractions: str
    final_itinerary: str


class TripContext(BaseModel):
    user_id: str
    source: str
    destination: str
    purpose: str
    budget: str
    travel_time: str
    preferences: str


class MemorySummary(BaseModel):
    preferred_transport: Optional[str] = None
    food_preference: Optional[str] = None
    budget_range: Optional[str] = None
    accommodation_type: Optional[str] = None
    avoid: list[str] = Field(default_factory=list)
    feedback_notes: list[str] = Field(default_factory=list)
    past_trips: list[dict] = Field(default_factory=list)
    trip_count: int = 0


class AgentResult(BaseModel):
    intent: str
    location_info: dict
    commute_options: str
    stay_options: str
    attractions: str
    final_itinerary: str
    memory: Optional[dict] = None
    service_mode: str = "full_package"


class PlannerResponse(BaseModel):
    service_mode: str
    intent: str
    trip_context: TripContext
    location_info: dict
    map: MapData
    memory: MemorySummary
    sections: Sections
    raw: RawSections
    agent_result: AgentResult
    updated_section: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    name: str
    avatar: str
    memory: MemorySummary
