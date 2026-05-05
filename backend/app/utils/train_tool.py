import csv
from functools import lru_cache
from pathlib import Path

from app.utils.maps_tool import _normalize, resolve_location

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
TRAIN_FILE = DATA_DIR / "railway_schedule.csv"

def _read_csv(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))

@lru_cache(maxsize=1)
def load_trains() -> list[dict]:
    try:
        return _read_csv(TRAIN_FILE)
    except FileNotFoundError:
        return []

def get_train_option(source: str, destination: str) -> dict | None:
    source_info = resolve_location(source)
    dest_info = resolve_location(destination)
    
    src_city = _normalize(source_info.get("name", source).split(",")[0])
    dst_city = _normalize(dest_info.get("name", destination).split(",")[0])
    
    # Simple direct matching
    for row in load_trains():
        r_from = _normalize(row.get("from_city", ""))
        r_to = _normalize(row.get("to_city", ""))
        
        # Checking match
        if (src_city in r_from or r_from in src_city) and (dst_city in r_to or r_to in dst_city):
            if row.get("direct_train", "").lower() == "yes":
                train_name = row.get("train_name", "Train")
                dep = row.get("departure_time", "NA")
                arr = row.get("arrival_time", "NA")
                dur = row.get("duration_hrs", "NA")
                cost = row.get("sleeper_inr") or row.get("3ac_inr") or row.get("2ac_inr") or "NA"
                st_from = row.get("nearest_station_from", src_city.title())
                st_to = row.get("nearest_station_to", dst_city.title())
                
                return {
                    "train_name": train_name,
                    "departure": dep,
                    "arrival": arr,
                    "duration": dur,
                    "cost": cost,
                    "station_from": st_from,
                    "station_to": st_to,
                    "notes": row.get("notes", "")
                }
    
    return None
