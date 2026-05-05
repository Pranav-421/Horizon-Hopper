import csv
import re
from functools import lru_cache
from pathlib import Path

from app.utils.maps_tool import _normalize, resolve_location

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
STAYS_FILE = DATA_DIR / "stays.csv"


def _read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def load_hotels() -> list[dict]:
    try:
        return _read_csv(STAYS_FILE)
    except FileNotFoundError:
        return []


def _budget_limit(budget_text: str) -> int | None:
    values = [int(match) for match in re.findall(r"\d+", budget_text or "")]
    return max(values) if values else None


def recommend_hotels(destination: str, budget: str, preferences: str, intent: str) -> list[dict]:
    destination_info = resolve_location(destination)
    target_city = _normalize(destination_info.get("name", destination).split(",")[0])
    budget_cap = _budget_limit(budget)
    
    ranked = []
    for hotel in load_hotels():
        hotel_city = _normalize(hotel["city"])
        
        # Must match city or be close
        if hotel_city != target_city and target_city not in hotel_city and hotel_city not in target_city:
            continue
            
        hotel_max = int(hotel.get("total_per_night_inr", 0))
        
        score = 0
        if budget_cap and hotel_max <= budget_cap:
            score += 3
        elif budget_cap and hotel_max <= budget_cap + 1000:
            score += 1
            
        category = hotel.get("category", "").lower()
        if intent == "job_interview" and category in ["budget", "mid-range"]:
            score += 2
        if intent == "business_trip" and category in ["premium", "luxury"]:
            score += 2
        if "luxury" in (preferences or "").lower() and category == "luxury":
            score += 3
            
        rating_str = hotel.get("rating", "0")
        try:
            rating = float(rating_str)
        except ValueError:
            rating = 0.0
            
        ranked.append((score, rating, hotel))

    # Sort by score (desc), then rating (desc)
    ranked.sort(key=lambda item: (-item[0], -item[1]))
    
    # Map back to the expected format
    results = []
    for _, _, h in ranked[:3]:
        results.append({
            "name": h["hotel_name"],
            "area": h["location_area"],
            "type": h["category"],
            "rating": h["rating"],
            "price_range": f"₹{h['per_night_inr']}",
            "details": f"{h['notes']}. Amenities: {h['amenities']}."
        })
        
    return results
