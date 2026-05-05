"""
Converts raw agent output into the structured PlannerResponse the frontend expects.

The frontend needs parsed commute items, stay cards, attraction cards, map data,
and the raw text preserved in `agent_result` for refinement round-trips.
"""

from __future__ import annotations

import math
import re
from typing import Optional

from app.models.schemas import (
    AgentResult,
    AttractionItem,
    CommuteSections,
    CommuteItem,
    LatLng,
    MapBounds,
    MapData,
    MapHighlight,
    MapMarker,
    MemorySummary,
    PlannerResponse,
    RawSections,
    Sections,
    StayItem,
    TripContext,
)
from app.utils.maps_tool import haversine_km, load_place_index, resolve_location


# ── Commute parser ────────────────────────────────────────────

_COMMUTE_RE = re.compile(
    r"^\d+\.\s*(?P<mode>[^:]+?):\s*(?P<dur>\d+)\s*min\s*\|\s*INR\s*(?P<price>\d+)\.?\s*(?P<rest>.*)",
    re.IGNORECASE,
)

_TRAFFIC_RE = re.compile(r"Traffic outlook:\s*(?P<outlook>.+)", re.IGNORECASE)


def _parse_commute(raw: str) -> CommuteSections:
    items: list[CommuteItem] = []
    traffic = ""
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        traffic_m = _TRAFFIC_RE.match(line)
        if traffic_m:
            traffic = traffic_m.group("outlook").strip()
            continue
        m = _COMMUTE_RE.match(line)
        if m:
            items.append(
                CommuteItem(
                    mode=m.group("mode").strip(),
                    duration=f"{m.group('dur')} min",
                    price=f"INR {m.group('price')}",
                    summary=m.group("rest").strip(),
                )
            )
        elif items:
            # continuation line → append to last summary
            items[-1].summary += f" {line}"
    return CommuteSections(items=items, traffic_outlook=traffic)


# ── Stay parser ───────────────────────────────────────────────

_STAY_RE = re.compile(
    r"^\d+\.\s*(?P<name>[^|]+)\|\s*(?P<area>[^|]+)\|\s*INR\s*(?P<price>[^|]+)\|\s*Rating\s*(?P<rating>[^|]+)(?:\|\s*Type\s*(?P<type>.+))?",
    re.IGNORECASE,
)


def _parse_stay(raw: str) -> list[StayItem]:
    items: list[StayItem] = []
    lines = raw.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = _STAY_RE.match(line)
        if m:
            details = ""
            if i + 1 < len(lines) and lines[i + 1].strip().startswith(" ") or (
                i + 1 < len(lines) and not _STAY_RE.match(lines[i + 1].strip())
                and not lines[i + 1].strip().startswith(str(len(items) + 2))
            ):
                details = lines[i + 1].strip() if i + 1 < len(lines) else ""
                i += 1
            items.append(
                StayItem(
                    name=m.group("name").strip(),
                    area=m.group("area").strip(),
                    price=m.group("price").strip(),
                    rating=m.group("rating").strip(),
                    details=details,
                    type=m.group("type").strip() if m.group("type") else "General",
                )
            )
        i += 1
    return items


# ── Attraction parser ─────────────────────────────────────────

_ATTR_RE = re.compile(
    r"^\d+\.\s*(?P<name>[^|]+)\|\s*about\s*(?P<dist>[\d.]+)\s*km\s*away\s*\|\s*(?P<time>[^|]+)\|\s*(?P<fit>.+)",
    re.IGNORECASE,
)

_ATTR_SIMPLE_RE = re.compile(r"^\d+\.\s*(?P<name>.+)")


def _parse_attractions(raw: str) -> list[AttractionItem]:
    items: list[AttractionItem] = []
    for line in raw.splitlines():
        line = line.strip()
        if not line:
            continue
        m = _ATTR_RE.match(line)
        if m:
            items.append(
                AttractionItem(
                    name=m.group("name").strip(),
                    distance=f"{m.group('dist')} km",
                    best_time=m.group("time").strip(),
                    fit=m.group("fit").strip(),
                )
            )
        else:
            m2 = _ATTR_SIMPLE_RE.match(line)
            if m2:
                items.append(
                    AttractionItem(
                        name=m2.group("name").strip(),
                        distance="",
                        best_time="",
                        fit="",
                    )
                )
    return items


# ── Map builder ───────────────────────────────────────────────


def _build_map(source: str, destination: str, location_info: dict) -> MapData:
    src = resolve_location(source)
    dst = resolve_location(destination)

    src_lat, src_lng = src["latitude"], src["longitude"]
    dst_lat, dst_lng = dst["latitude"], dst["longitude"]

    center = LatLng(
        lat=round((src_lat + dst_lat) / 2, 6),
        lng=round((src_lng + dst_lng) / 2, 6),
    )

    # Compute bounds with padding
    lat_min = min(src_lat, dst_lat)
    lat_max = max(src_lat, dst_lat)
    lng_min = min(src_lng, dst_lng)
    lng_max = max(src_lng, dst_lng)
    lat_pad = max(0.01, (lat_max - lat_min) * 0.15)
    lng_pad = max(0.01, (lng_max - lng_min) * 0.15)

    bounds = MapBounds(
        southWest=LatLng(lat=round(lat_min - lat_pad, 6), lng=round(lng_min - lng_pad, 6)),
        northEast=LatLng(lat=round(lat_max + lat_pad, 6), lng=round(lng_max + lng_pad, 6)),
    )

    # Simple route polyline (src → midpoint → dst)
    mid_lat = (src_lat + dst_lat) / 2 + (dst_lng - src_lng) * 0.02
    mid_lng = (src_lng + dst_lng) / 2
    route = [
        LatLng(lat=round(src_lat, 6), lng=round(src_lng, 6)),
        LatLng(lat=round(mid_lat, 6), lng=round(mid_lng, 6)),
        LatLng(lat=round(dst_lat, 6), lng=round(dst_lng, 6)),
    ]

    # Markers
    markers = [
        MapMarker(kind="source", label=src.get("name", source), area=src.get("area", ""), lat=round(src_lat, 6), lng=round(src_lng, 6)),
        MapMarker(kind="destination", label=dst.get("name", destination), area=dst.get("area", ""), lat=round(dst_lat, 6), lng=round(dst_lng, 6)),
    ]

    # Highlights — nearby places of interest
    highlights: list[MapHighlight] = []
    try:
        for row in load_place_index():
            if row["type"] == "office":
                continue
            dist = haversine_km(dst_lat, dst_lng, row["latitude"], row["longitude"])
            if dist < 30:
                highlights.append(
                    MapHighlight(
                        kind="attraction",
                        label=row["name"],
                        area=row["area"],
                        lat=round(row["latitude"], 6),
                        lng=round(row["longitude"], 6),
                        distance_km=round(dist, 1),
                        type=row["type"],
                    )
                )
        highlights.sort(key=lambda h: h.distance_km)
        highlights = highlights[:5]
    except Exception:
        pass

    return MapData(center=center, bounds=bounds, route=route, markers=markers, highlights=highlights)


# ── Memory helper ─────────────────────────────────────────────


def _to_memory_summary(mem: dict) -> MemorySummary:
    return MemorySummary(
        preferred_transport=mem.get("preferred_transport"),
        food_preference=mem.get("food_preference"),
        budget_range=mem.get("budget_range"),
        accommodation_type=mem.get("accommodation_type"),
        avoid=mem.get("avoid", []),
        feedback_notes=mem.get("feedback_notes", []),
        past_trips=mem.get("past_trips", []),
        trip_count=len(mem.get("past_trips", [])),
    )


# ── Main formatter ────────────────────────────────────────────


def format_planner_response(
    agent_output: dict,
    source: str,
    destination: str,
    purpose: str,
    budget: str,
    travel_time: str,
    preferences: str,
    user_id: str,
    service_mode: str,
    updated_section: Optional[str] = None,
) -> dict:
    """Convert raw orchestrator/agent output into the structured response expected by the frontend."""

    commute_raw = agent_output.get("commute_options", "")
    stay_raw = agent_output.get("stay_options", "")
    attractions_raw = agent_output.get("attractions", "")
    itinerary_raw = agent_output.get("final_itinerary", "")
    location_info = agent_output.get("location_info", {})
    memory_raw = agent_output.get("memory", {})

    # Parse sections
    commute_sections = _parse_commute(commute_raw)
    stay_items = _parse_stay(stay_raw)
    attraction_items = _parse_attractions(attractions_raw)

    # Build map data
    map_data = _build_map(source, destination, location_info)

    # Build memory summary
    memory_summary = _to_memory_summary(memory_raw)

    response = PlannerResponse(
        service_mode=service_mode,
        intent=agent_output.get("intent", "leisure_trip"),
        trip_context=TripContext(
            user_id=user_id,
            source=source,
            destination=destination,
            purpose=purpose,
            budget=budget,
            travel_time=travel_time,
            preferences=preferences,
        ),
        location_info=location_info,
        map=map_data,
        memory=memory_summary,
        sections=Sections(
            itinerary=itinerary_raw,
            commute=commute_sections,
            stay=stay_items,
            attractions=attraction_items,
        ),
        raw=RawSections(
            commute_options=commute_raw,
            stay_options=stay_raw,
            attractions=attractions_raw,
            final_itinerary=itinerary_raw,
        ),
        agent_result=AgentResult(
            intent=agent_output.get("intent", "leisure_trip"),
            location_info=location_info,
            commute_options=commute_raw,
            stay_options=stay_raw,
            attractions=attractions_raw,
            final_itinerary=itinerary_raw,
            memory=memory_raw,
            service_mode=service_mode,
        ),
        updated_section=updated_section,
    )

    return response.model_dump()
