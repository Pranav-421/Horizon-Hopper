import os
import json
import re
from datetime import datetime

MEMORY_DIR = os.path.join(os.path.dirname(__file__), "../memory")
USERS_FILE = os.path.join(MEMORY_DIR, "users.json")

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
_DEFAULT_MEMORY = {
    "preferred_transport": None,
    "food_preference": None,
    "avoid": [],
    "budget_range": None,
    "accommodation_type": None,
    "past_trips": [],
    "feedback_notes": [],
}



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



def _load_users() -> dict:
    try:
        with open(USERS_FILE, encoding="utf-8") as handle:
            return json.load(handle)
    except Exception:
        return {"users": {}}



def _save_users(data: dict):
    os.makedirs(MEMORY_DIR, exist_ok=True)
    with open(USERS_FILE, "w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)



def authenticate(username: str, password: str):
    users = _load_users()
    user = users["users"].get(username.lower())
    if user and user.get("password") == password:
        return {"id": username.lower(), **user}
    return None



def get_all_users():
    return _load_users()["users"]



def load_user_memory(user_id: str) -> dict:
    users = _load_users()
    user = users["users"].get(user_id, {})
    memory = dict(_DEFAULT_MEMORY)
    memory.update(user.get("memory", {}))
    memory.setdefault("past_trips", [])
    memory.setdefault("feedback_notes", [])
    memory.setdefault("avoid", [])
    return memory



def save_user_memory(user_id: str, memory: dict):
    users = _load_users()
    if user_id not in users["users"]:
        users["users"][user_id] = {"password": "", "name": user_id, "avatar": "U", "memory": {}}
    users["users"][user_id]["memory"] = memory
    _save_users(users)



def load_memory(user_id: str = "guest") -> dict:
    return load_user_memory(user_id)



def update_memory(user_input: str, preferences: str, intent: str, user_id: str = "guest") -> dict:
    try:
        new = _extract_preferences(f"{user_input} {preferences}")
        existing = load_user_memory(user_id)
        for key in ["preferred_transport", "food_preference", "budget_range", "accommodation_type"]:
            if new.get(key):
                existing[key] = new[key]
        if new.get("avoid"):
            existing["avoid"] = sorted(set(existing.get("avoid", []) + new["avoid"]))
        existing.setdefault("past_trips", []).append(
            {
                "date": datetime.now().strftime("%Y-%m-%d %H:%M"),
                "intent": intent,
                "input": user_input[:80],
            }
        )
        existing["past_trips"] = existing["past_trips"][-10:]
        save_user_memory(user_id, existing)
        return existing
    except Exception as exc:
        print(f"Memory error: {exc}")
        return load_user_memory(user_id)
