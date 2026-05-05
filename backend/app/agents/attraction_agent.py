"""Attraction agent — CSV-grounded first to minimise LLM hallucination."""

import csv
import os
from functools import lru_cache

from app.utils.maps_tool import (
    fetch_wikipedia_nearby,
    get_nearby_landmarks,
    haversine_km,
    load_place_index,
    resolve_location,
)

_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "attractions.csv")


@lru_cache(maxsize=1)
def _load_attractions_csv() -> dict[str, list[dict]]:
    """Load attractions.csv once and index by normalised city name."""
    index: dict[str, list[dict]] = {}
    try:
        with open(_CSV_PATH, newline="", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                city = row["city"].strip().lower()
                index.setdefault(city, []).append(row)
    except FileNotFoundError:
        pass
    return index


def _city_key(destination: str) -> str:
    """Normalise destination string to match CSV city keys."""
    # Strip state suffixes like ", Tamil Nadu" and lowercase
    name = destination.split(",")[0].strip().lower()
    return name


def _format_csv_attractions(rows: list[dict], intent: str, limit: int = 5) -> str:
    """Format CSV rows into a rich string for the LLM prompt."""
    intent_text = intent.replace("_", " ")
    lines = []
    for i, row in enumerate(rows[:limit], start=1):
        fee_text = "Free entry" if row["entry_fee_inr"] == "0" else f"Entry ₹{row['entry_fee_inr']}"
        lines.append(
            f"{i}. {row['attraction_name']} [{row['category']}] | "
            f"{fee_text} | Food est. ₹{row['food_estimate_inr']} | "
            f"Transport est. ₹{row['transport_estimate_inr']} | "
            f"Duration ~{row['duration_hours']}h | Best time: {row['best_time']} | "
            f"{row['notes']} | Good fit for {intent_text}"
        )
    return "\n".join(lines)


def get_attractions(destination: str, intent: str, location_info: dict) -> str:
    if intent == "office_commute":
        return (
            "1. Quick meal stop near destination\n"
            "2. Nearby cafe for a short break\n"
            "3. Mall or park visit after work if time permits"
        )

    # ── 1. Try CSV (zero hallucination) ───────────────────────────────────
    attractions_db = _load_attractions_csv()
    city_key = _city_key(destination)
    csv_rows = attractions_db.get(city_key, [])

    if csv_rows:
        return _format_csv_attractions(csv_rows, intent)

    # ── 2. Live Wikipedia nearby lookup ────────────────────────────────────
    destination_info = resolve_location(destination)
    intent_text = intent.replace("_", " ")
    lines = []

    live_places = fetch_wikipedia_nearby(
        destination_info["latitude"], destination_info["longitude"], limit=8, radius_m=35000
    )
    destination_norm = destination_info["name"].strip().lower()
    for row in live_places:
        name = row["name"].strip()
        if not name or name.lower() == destination_norm:
            continue
        lines.append(
            f"{len(lines) + 1}. {name} | about {row['distance_km']} km away | "
            f"Best during morning or sunset | Good fit for {intent_text}"
        )
        if len(lines) >= 5:
            break

    # ── 3. Bundled local place index ───────────────────────────────────────
    if not lines:
        candidates = []
        for row in load_place_index():
            if row["type"] == "office":
                continue
            distance = haversine_km(
                destination_info["latitude"],
                destination_info["longitude"],
                row["latitude"],
                row["longitude"],
            )
            if distance <= 120:
                candidates.append((distance, row))

        candidates.sort(key=lambda item: item[0])
        for index, (distance, row) in enumerate(candidates[:5], start=1):
            lines.append(
                f"{index}. {row['name']} | about {round(distance, 1)} km away | "
                f"Best during morning or sunset | Good fit for {intent_text}"
            )

    # ── 4. Landmark fallback ───────────────────────────────────────────────
    if not lines:
        landmarks = get_nearby_landmarks(location_info.get("destination_area", destination))
        lines = [f"{idx}. {name}" for idx, name in enumerate(landmarks[:5], start=1)]

    # ── 5. Generic last resort ─────────────────────────────────────────────
    if not lines:
        place = destination_info.get("name") or destination
        lines = [
            f"1. {place} city center walk | about 1-3 km away | Best during morning or evening | Good fit for {intent_text}",
            f"2. Local heritage or temple cluster in {place} | about 3-8 km away | Best during morning | Good fit for {intent_text}",
            f"3. Popular food street or market in {place} | about 2-6 km away | Best during evening | Good fit for {intent_text}",
        ]

    return "\n".join(lines)
