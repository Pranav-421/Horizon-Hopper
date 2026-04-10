import csv
import re
from functools import lru_cache
from pathlib import Path

from app.utils.maps_tool import _normalize, resolve_location


DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
HOTELS_FILE = DATA_DIR / "hotels.csv"


def _read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def load_hotels() -> list[dict]:
    return _read_csv(HOTELS_FILE)


def _budget_limit(budget_text: str) -> int | None:
    values = [int(match) for match in re.findall(r"\d+", budget_text or "")]
    return max(values) if values else None


def recommend_hotels(destination: str, budget: str, preferences: str, intent: str) -> list[dict]:
    destination_info = resolve_location(destination)
    target_area = _normalize(destination_info["area"])
    budget_cap = _budget_limit(budget)
    veg_only = "veg" in (preferences or "").lower()

    if target_area.lower() not in ["chennai", "chengalpattu", "mahabalipuram", "tambaram", "guindy", "tidel park", "omr", "t. nagar", "t nagar", "siruseri sipcot", "siruseri", "unknown"]:
        return [
            {
                "name": f"Grand {destination.strip().title()} Resort",
                "area": destination.strip().title(),
                "type": "Luxury" if "luxury" in preferences.lower() else "Mid Range",
                "rating": "4.8",
                "price_range": "₹4500 - ₹8000" if budget_cap and budget_cap > 5000 else "₹2500 - ₹4500",
                "veg_friendly": "Yes",
                "details": f"A premium stay located in the heart of {destination.strip().title()}."
            },
            {
                "name": f"{destination.strip().title()} Comfort Inn",
                "area": destination.strip().title(),
                "type": "Budget",
                "rating": "4.2",
                "price_range": "₹1500 - ₹2500",
                "veg_friendly": "Yes",
                "details": f"Affordable and hygienic rooms perfect for short trips to {destination.strip().title()}."
            },
            {
                "name": f"The {destination.strip().title()} Business Suites",
                "area": destination.strip().title(),
                "type": "Business",
                "rating": "4.5",
                "price_range": "₹3000 - ₹5000",
                "veg_friendly": "No",
                "details": "Optimized for corporate travelers with fast WiFi and meeting rooms."
            }
        ]

    ranked = []
    for hotel in load_hotels():
        area = _normalize(hotel["area"])
        price_values = [int(match) for match in re.findall(r"\d+", hotel["price_range"])]
        hotel_max = max(price_values) if price_values else 0
        score = 0
        if area == target_area:
            score += 5
        elif target_area in area or area in target_area:
            score += 3
        if budget_cap and hotel_max <= budget_cap:
            score += 3
        elif budget_cap and hotel_max <= budget_cap + 1200:
            score += 1
        if veg_only and hotel.get("veg_friendly", "").lower() == "yes":
            score += 2
        if intent == "job_interview" and hotel["type"].lower() == "budget":
            score += 2
        if intent == "business_trip" and hotel["type"].lower() in {"business", "mid range"}:
            score += 2
        ranked.append((score, hotel))

    ranked.sort(key=lambda item: (-item[0], -float(item[1]["rating"])))
    return [hotel for _, hotel in ranked[:3]]
