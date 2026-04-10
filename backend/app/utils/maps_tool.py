import csv
import math
from functools import lru_cache
from pathlib import Path


DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
PLACES_FILE = DATA_DIR / "chennai_places.csv"
OFFICES_FILE = DATA_DIR / "offices.csv"

ALIASES = {
    "chengalpattu": "Mahabalipuram",
    "mahabs": "Mahabalipuram",
    "tnagar": "T. Nagar",
    "t nagar": "T. Nagar",
    "central": "Chennai Central",
    "siruseri sipcot": "SIPCOT IT Park",
}


def _normalize(text: str) -> str:
    lowered = " ".join((text or "").strip().lower().replace("-", " ").split())
    return ALIASES.get(lowered, lowered)


def _read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def load_place_index() -> list[dict]:
    rows = _read_csv(PLACES_FILE)
    offices = _read_csv(OFFICES_FILE)
    merged = []

    for row in rows:
        merged.append(
            {
                "name": row["place_name"],
                "area": row["area"],
                "type": row["type"],
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "nearest_metro": row.get("nearest_metro", "") or "NA",
            }
        )

    for row in offices:
        merged.append(
            {
                "name": row["office_name"],
                "area": row["area"],
                "type": "office",
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "nearest_metro": row.get("nearest_metro", "") or "NA",
            }
        )

    return merged


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def resolve_location(query: str) -> dict:
    normalized = _normalize(query)
    candidates = load_place_index()

    for row in candidates:
        if _normalize(row["name"]) == normalized:
            return row

    for row in candidates:
        if normalized in _normalize(row["name"]):
            return row

    for row in candidates:
        if normalized in _normalize(row["area"]):
            return row

    title_query = query.strip().title() or "Unknown"
    return {
        "name": title_query,
        "area": title_query,
        "type": "area",
        "latitude": 13.0827,
        "longitude": 80.2707,
        "nearest_metro": "NA",
    }


def get_nearby_landmarks(destination_area: str, limit: int = 3) -> list[str]:
    normalized_area = _normalize(destination_area)
    landmarks = []
    for row in load_place_index():
        area_name = _normalize(row["area"])
        if normalized_area in area_name or area_name in normalized_area:
            if row["name"] not in landmarks:
                landmarks.append(row["name"])
        if len(landmarks) >= limit:
            break
    return landmarks


def get_location_snapshot(source: str, destination: str) -> dict:
    source_info = resolve_location(source)
    destination_info = resolve_location(destination)
    distance_km = haversine_km(
        source_info["latitude"],
        source_info["longitude"],
        destination_info["latitude"],
        destination_info["longitude"],
    )
    distance_km = max(1, round(distance_km, 1))
    drive_time_mins = max(12, round(distance_km * 3.4))

    notes = []
    if distance_km > 25:
        notes.append("Start early because this is a long Chennai corridor trip.")
    if "OMR" in destination_info["area"] or "Siruseri" in destination_info["area"]:
        notes.append("Expect slower traffic on the OMR stretch during peak hours.")
    if source_info["nearest_metro"] != "NA" and destination_info["nearest_metro"] != "NA":
        notes.append("Metro can reduce road traffic uncertainty for most of the route.")

    return {
        "source_area": source_info["area"],
        "destination_area": destination_info["area"],
        "approximate_distance_km": distance_km,
        "estimated_drive_time_mins": drive_time_mins,
        "nearest_metro_source": source_info["nearest_metro"],
        "nearest_metro_destination": destination_info["nearest_metro"],
        "nearby_landmarks": get_nearby_landmarks(destination_info["area"]),
        "travel_notes": " ".join(notes) or "Local planning data generated from bundled Chennai datasets.",
    }
