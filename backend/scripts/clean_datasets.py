r"""Dataset cleaner for Horizon Hopper demo CSV files.

Usage:
  .\.venv\Scripts\python backend\scripts\clean_datasets.py
"""

from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "backend" / "data"

URL_RE = re.compile(r"^https?://[^\s]+$", re.IGNORECASE)


def _norm(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def _read_rows(path: Path) -> list[dict]:
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _write_rows(path: Path, rows: list[dict], fieldnames: list[str]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def _dedupe(rows: list[dict], name_key: str, area_key: str) -> list[dict]:
    best_by_key: dict[tuple[str, str], dict] = {}

    def row_score(row: dict) -> int:
        # Prefer rows with richer metadata.
        fields = ("photo_url", "image_source", "source_url", "confidence")
        return sum(1 for field in fields if (row.get(field) or "").strip())

    for row in rows:
        key = (_norm(row.get(name_key, "")), _norm(row.get(area_key, "")))
        if not key[0]:
            continue
        current = best_by_key.get(key)
        if current is None or row_score(row) >= row_score(current):
            best_by_key[key] = row

    return list(best_by_key.values())


def _clean_photo_fields(rows: list[dict]) -> int:
    cleaned = 0
    for row in rows:
        photo_url = (row.get("photo_url") or "").strip()
        if not photo_url:
            continue
        if "..." in photo_url or not URL_RE.match(photo_url):
            row["photo_url"] = ""
            if "image_source" in row:
                row["image_source"] = ""
            if (row.get("confidence") or "").strip().lower() == "high":
                row["confidence"] = "medium"
            cleaned += 1
    return cleaned


def main() -> None:
    places_file = DATA_DIR / "chennai_places.csv"
    hotels_file = DATA_DIR / "hotels.csv"
    offices_file = DATA_DIR / "offices.csv"

    places = _read_rows(places_file)
    hotels = _read_rows(hotels_file)
    offices = _read_rows(offices_file)

    places = _dedupe(places, "place_name", "area")
    hotels = _dedupe(hotels, "hotel_name", "area")
    offices = _dedupe(offices, "office_name", "area")

    cleaned_place_photos = _clean_photo_fields(places)
    cleaned_hotel_photos = _clean_photo_fields(hotels)

    place_fields = [
        "place_name",
        "type",
        "latitude",
        "longitude",
        "area",
        "best_time",
        "why_visit",
        "photo_url",
        "image_source",
        "source_url",
        "confidence",
    ]
    hotel_fields = [
        "hotel_name",
        "area",
        "price_range",
        "type",
        "rating",
        "veg_friendly",
        "latitude",
        "longitude",
        "photo_url",
        "image_source",
        "source_url",
        "confidence",
    ]
    office_fields = [
        "office_name",
        "area",
        "latitude",
        "longitude",
        "nearest_metro",
        "source_url",
        "confidence",
    ]

    _write_rows(places_file, places, place_fields)
    _write_rows(hotels_file, hotels, hotel_fields)
    _write_rows(offices_file, offices, office_fields)

    print(f"places: {len(places)} rows | cleaned photos: {cleaned_place_photos}")
    print(f"hotels: {len(hotels)} rows | cleaned photos: {cleaned_hotel_photos}")
    print(f"offices: {len(offices)} rows")


if __name__ == "__main__":
    main()
