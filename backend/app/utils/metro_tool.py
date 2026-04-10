import csv
from functools import lru_cache
from pathlib import Path

from app.utils.maps_tool import _normalize, resolve_location


DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
METRO_FILE = DATA_DIR / "metro_routes.csv"


def _read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


@lru_cache(maxsize=1)
def load_stations() -> list[dict]:
    return _read_csv(METRO_FILE)


def _find_station(name: str) -> dict | None:
    normalized = _normalize(name)
    for station in load_stations():
        if _normalize(station["station_name"]) == normalized:
            return station
    for station in load_stations():
        if normalized in _normalize(station["station_name"]):
            return station
    return None


def nearest_station(place: str) -> dict | None:
    location = resolve_location(place)
    station_name = location.get("nearest_metro", "NA")
    if station_name and station_name != "NA":
        found = _find_station(station_name)
        if found:
            return found
    if location["area"] != location["name"]:
        return _find_station(location["area"])
    return None


def build_metro_option(source: str, destination: str) -> str | None:
    source_station = nearest_station(source)
    dest_station = nearest_station(destination)

    if not source_station or not dest_station:
        return None

    source_name = source_station["station_name"]
    dest_name = dest_station["station_name"]
    if source_name == dest_name:
        return f"Metro: board at {source_name}; destination is in the same station catchment."

    interchanges = []
    if "Blue/Green" in source_station["line"] or "Blue/Green" in dest_station["line"]:
        interchanges.append("Alandur interchange may help if you switch lines.")
    if source_station.get("interchange") == "Yes":
        interchanges.append(f"{source_name} is an interchange station.")
    if dest_station.get("interchange") == "Yes":
        interchanges.append(f"{dest_name} is an interchange station.")

    route_hint = f"Metro: {source_name} -> {dest_name}"
    if interchanges:
        route_hint += " " + " ".join(interchanges)
    return route_hint
