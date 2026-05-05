"""Memory agent — now backed by SQLite instead of flat JSON.

Public interface is unchanged so the rest of the codebase
(orchestrator, routes, formatter) continues to work.
"""

import re
from datetime import datetime

from app.db.database import (
    authenticate_user,
    get_all_users as _db_get_all_users,
    get_user_memory,
    save_user_memory,
    add_trip,
    save_feedback as _db_save_feedback,
)


# ── Keyword extractors (unchanged) ───────────────────────────

_TRANSPORT_KEYWORDS = {
    "metro": "Metro",
    "bus": "MTC Bus",
    "train": "Train",
    "mrts": "MRTS",
    "auto": "Auto",
    "cab": "Cab",
    "ola": "Cab",
    "uber": "Cab",
    "bike": "Bike Taxi",
    "rapido": "Bike Taxi",
    "walk": "Walking",
}
_FOOD_KEYWORDS = {
    "veg": "Vegetarian",
    "vegetarian": "Vegetarian",
    "non-veg": "Non-Vegetarian",
    "nonveg": "Non-Vegetarian",
    "vegan": "Vegan",
    "jain": "Jain",
}
_STAY_KEYWORDS = {
    "hotel": "Hotel",
    "hostel": "Hostel",
    "lodge": "Lodge",
    "guest house": "Guest House",
    "oyo": "Budget Hotel",
    "resort": "Resort",
    "budget": "Budget Hotel",
    "luxury": "Luxury Hotel",
}
_AVOID_KEYWORDS = ["highway", "traffic", "toll", "peak", "crowd", "noise"]


def _extract_preferences(text: str) -> dict:
    lower = text.lower()
    result = {
        "preferred_transport": None,
        "food_preference": None,
        "avoid": [],
        "budget_range": None,
        "accommodation_type": None,
    }
    for keyword, value in _TRANSPORT_KEYWORDS.items():
        if keyword in lower:
            result["preferred_transport"] = value
            break
    for keyword, value in _FOOD_KEYWORDS.items():
        if keyword in lower:
            result["food_preference"] = value
            break
    for keyword, value in _STAY_KEYWORDS.items():
        if keyword in lower:
            result["accommodation_type"] = value
            break
    result["avoid"] = [keyword for keyword in _AVOID_KEYWORDS if keyword in lower]
    budget_match = re.search(r"(?:rs\.?|inr)?\s*\d+(?:\s*[-–]\s*\d+)?", text, re.IGNORECASE)
    if budget_match:
        result["budget_range"] = budget_match.group(0).strip()
    return result


# ── Public API (same signatures as before) ────────────────────


def authenticate(username: str, password: str):
    """Verify credentials — returns {id, name, avatar} or None."""
    return authenticate_user(username, password)


def get_all_users():
    """Return {user_id: {name, avatar, memory}} for all users."""
    return _db_get_all_users()


def load_user_memory(user_id: str) -> dict:
    user_id = (user_id or "guest").lower()
    return get_user_memory(user_id)


def save_user_memory_wrapper(user_id: str, memory: dict):
    user_id = (user_id or "guest").lower()
    save_user_memory(user_id, memory)


# Aliases for backward compat
load_memory = load_user_memory


def update_memory(user_input: str, preferences: str, intent: str, user_id: str = "guest") -> dict:
    try:
        user_id = (user_id or "guest").lower()
        new = _extract_preferences(f"{user_input} {preferences}")
        existing = get_user_memory(user_id)

        for key in ["preferred_transport", "food_preference", "budget_range", "accommodation_type"]:
            if new.get(key):
                existing[key] = new[key]
        if new.get("avoid"):
            existing["avoid"] = sorted(set(existing.get("avoid", []) + new["avoid"]))

        # Save memory preferences
        save_user_memory(user_id, existing)

        # Record the trip separately
        add_trip(user_id, intent, user_input[:80])

        # Re-read to include the new trip
        return get_user_memory(user_id)
    except Exception as exc:
        print(f"Memory error: {exc}")
        return get_user_memory(user_id)
