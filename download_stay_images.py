"""
Horizon Hopper - Stay Images Downloader
Downloads 2-3 images per category per city using Pixabay API
Naming: chennai_luxury_1.jpg, chennai_budget_2.jpg etc.
Run: python download_stay_images.py
"""

import requests
import os
import time

PIXABAY_API_KEY = ""  # ← paste your key

OUTPUT_DIR = "frontend/public/assets/stays"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {"User-Agent": "HorizonHopperDataset/1.0"}

CITIES = [
    "chennai", "tambaram", "chengalpattu", "mahabalipuram",
    "kanchipuram", "coimbatore", "madurai", "tiruchirappalli",
    "salem", "tirunelveli", "tiruppur", "vellore",
    "erode", "ooty", "kodaikanal", "kanyakumari",
    "rameswaram", "thanjavur"
]

# Category → search queries (generic hotel room queries work best on Pixabay)
CATEGORIES = {
    "luxury":   ["luxury hotel room interior", "5 star hotel lobby India", "luxury resort pool India"],
    "premium":  ["premium hotel room India", "4 star hotel interior", "business hotel room modern"],
    "midrange": ["mid range hotel room India", "comfortable hotel room", "hotel room clean India"],
    "budget":   ["budget hotel room India", "simple hotel room clean", "Indian guesthouse room"],
    "hostel":   ["hostel dormitory India", "backpacker hostel lounge", "hostel common room India"],
}

IMAGES_PER_CATEGORY = 3  # downloads 3 images per category per city


def search_pixabay(query, page=1):
    """Search Pixabay and return image URLs."""
    r = requests.get(
        "https://pixabay.com/api/",
        params={
            "key":          PIXABAY_API_KEY,
            "q":            query,
            "image_type":   "photo",
            "orientation":  "horizontal",
            "min_width":    800,
            "min_height":   500,
            "per_page":     10,
            "page":         page,
            "safesearch":   "true",
        },
        timeout=10,
    )
    r.raise_for_status()
    hits = r.json().get("hits", [])
    return [h.get("largeImageURL") or h.get("webformatURL") for h in hits if h.get("largeImageURL") or h.get("webformatURL")]


def download_image(url, filepath):
    r = requests.get(url, headers=HEADERS, timeout=20, stream=True)
    r.raise_for_status()
    with open(filepath, "wb") as f:
        for chunk in r.iter_content(8192):
            f.write(chunk)
    return os.path.getsize(filepath) // 1024


# ─── MAIN ────────────────────────────────────────────────────────────────────
total_ok = 0
total_fail = 0
total_skip = 0

# Pre-fetch URLs for each category (shared across all cities — hotel interiors
# are generic enough; no need for city-specific hotel room photos)
print("🔍 Pre-fetching image URLs for each category...\n")
category_urls = {}
for cat, queries in CATEGORIES.items():
    urls = []
    for q in queries:
        results = search_pixabay(q, page=1)
        urls.extend(results[:5])
        time.sleep(0.3)
    # Deduplicate and keep enough for all cities
    category_urls[cat] = list(dict.fromkeys(urls))
    print(f"  {cat}: {len(category_urls[cat])} URLs fetched")

print(f"\n📦 Downloading {len(CITIES)} cities × {len(CATEGORIES)} categories × {IMAGES_PER_CATEGORY} images...\n")

for city in CITIES:
    print(f"📍 {city.upper()}")
    for cat, urls in category_urls.items():
        # Rotate URLs across cities so each city gets different images
        city_idx = CITIES.index(city)
        offset = (city_idx * IMAGES_PER_CATEGORY) % max(len(urls), 1)
        selected = (urls + urls)[offset: offset + IMAGES_PER_CATEGORY]  # wrap around

        for i, url in enumerate(selected, start=1):
            filename = f"{city}_{cat}_{i}.jpg"
            filepath = os.path.join(OUTPUT_DIR, filename)

            if os.path.exists(filepath):
                print(f"  ⏭️  {filename} exists")
                total_skip += 1
                continue

            print(f"  [{i}/{IMAGES_PER_CATEGORY}] {filename} ...", end=" ", flush=True)
            try:
                size_kb = download_image(url, filepath)
                print(f"✅ ({size_kb} KB)")
                total_ok += 1
            except Exception as e:
                print(f"❌ {e}")
                total_fail += 1

            time.sleep(0.3)

print(f"\n{'─'*50}")
print(f"✅ Downloaded : {total_ok}")
print(f"⏭️  Skipped    : {total_skip}")
print(f"❌ Failed     : {total_fail}")
print(f"📁 Saved to   : ./{OUTPUT_DIR}/")
print(f"{'─'*50}")
print(f"\nTotal files: {len(CITIES)} cities × {len(CATEGORIES)} categories × {IMAGES_PER_CATEGORY} = {len(CITIES)*len(CATEGORIES)*IMAGES_PER_CATEGORY} images")
