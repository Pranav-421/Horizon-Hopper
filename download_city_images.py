"""
Horizon Hopper - Missing Images Downloader (Pixabay)
Gets free API key at: https://pixabay.com/api/docs/
Run: python download_missing_images.py
"""

import requests
import os
import time

# ← Paste your Pixabay API key here
PIXABAY_API_KEY = ""

OUTPUT_DIR = "frontend/public/assets/cities"
os.makedirs(OUTPUT_DIR, exist_ok=True)

HEADERS = {"User-Agent": "HorizonHopperDataset/1.0"}

# Only the missing ones — already downloaded files are skipped automatically
MISSING = {
    "chennai_5":         "Fort St George Chennai",
    "tambaram_5":        "Tambaram railway station Chennai",
    "chengalpattu_4":    "Crocodile Bank Tamil Nadu",
    "chengalpattu_5":    "Mahabalipuram shore temple",
    "mahabalipuram_4":   "Arjuna penance Mahabalipuram rock carving",
    "mahabalipuram_5":   "Tiger cave Mahabalipuram",
    "kanchipuram_3":     "Ekambareswarar temple Kanchipuram",
    "kanchipuram_4":     "Kailasanathar temple Kanchipuram",
    "kanchipuram_5":     "Varadharaja Perumal temple",
    "coimbatore_4":      "Marudamalai temple Coimbatore",
    "coimbatore_5":      "VOC park Coimbatore",
    "madurai_3":         "Meenakshi temple Madurai",
    "madurai_4":         "Thirumalai Nayakkar palace Madurai",
    "madurai_5":         "Vaigai river Madurai",
    "tiruchirappalli_3": "Rock Fort temple Trichy",
    "tiruchirappalli_4": "Jambukeswarar temple Trichy",
    "tiruchirappalli_5": "Kallanai dam Tamil Nadu",
    "salem_5":           "Yercaud lake Salem",
    "tirunelveli_5":     "Tamirabarani river Tirunelveli",
    "tiruppur_4":        "Amaravathi dam Tiruppur",
    "tiruppur_5":        "Sivanmalai hill Tamil Nadu",
    "vellore_3":         "Sripuram golden temple Vellore",
    "vellore_4":         "Jalakandeswarar temple Vellore fort",
    "vellore_5":         "Christian medical college Vellore",
    "erode_3":           "Bhavani Sangamam river confluence",
    "erode_4":           "Bannari Amman temple Tamil Nadu",
    "erode_5":           "Cauvery river Tamil Nadu",
    "ooty_5":            "Ooty botanical garden flowers",
    "kodaikanal_3":      "Silver Cascade waterfall Kodaikanal",
    "kodaikanal_4":      "Pillar rocks Kodaikanal",
    "kodaikanal_5":      "Coakers walk Kodaikanal",
    "kanyakumari_5":     "Kumari Amman temple Kanyakumari",
    "rameswaram_4":      "Agnitheertham beach Rameswaram",
    "rameswaram_5":      "Dhanushkodi ruins beach",
    "thanjavur_5":       "Thanjavur palace Maratha",
}


def search_pixabay(query):
    """Search Pixabay and return best image URL."""
    r = requests.get(
        "https://pixabay.com/api/",
        params={
            "key": PIXABAY_API_KEY,
            "q": query,
            "image_type": "photo",
            "orientation": "horizontal",
            "min_width": 800,
            "min_height": 600,
            "per_page": 5,
            "safesearch": "true",
        },
        timeout=10,
    )
    r.raise_for_status()
    hits = r.json().get("hits", [])
    if hits:
        # Prefer largeImageURL (full size), fallback to webformatURL
        return hits[0].get("largeImageURL") or hits[0].get("webformatURL")
    return None


ok = 0
fail = 0

print(f"Downloading {len(MISSING)} missing images via Pixabay...\n")

for name, query in MISSING.items():
    filepath_jpg = os.path.join(OUTPUT_DIR, f"{name}.jpg")
    filepath_png = os.path.join(OUTPUT_DIR, f"{name}.png")

    # Skip if already downloaded
    if os.path.exists(filepath_jpg) or os.path.exists(filepath_png):
        print(f"⏭️  {name} already exists")
        ok += 1
        continue

    print(f"  {name} ({query}) ...", end=" ", flush=True)
    try:
        url = search_pixabay(query)
        if not url:
            # Fallback: try simpler query
            short_query = query.split()[0:2]
            url = search_pixabay(" ".join(short_query))

        if not url:
            print("⚠️  Not found")
            fail += 1
            continue

        ext = "jpg" if "jpg" in url.lower() else "png"
        filepath = os.path.join(OUTPUT_DIR, f"{name}.{ext}")

        r = requests.get(url, headers=HEADERS, timeout=20, stream=True)
        r.raise_for_status()
        with open(filepath, "wb") as f:
            for chunk in r.iter_content(8192):
                f.write(chunk)

        size_kb = os.path.getsize(filepath) // 1024
        print(f"✅ {name}.{ext} ({size_kb} KB)")
        ok += 1

    except Exception as e:
        print(f"❌ {e}")
        fail += 1

    time.sleep(0.5)

print(f"\n{'─'*50}")
print(f"✅ Downloaded : {ok}")
print(f"❌ Failed     : {fail}")
print(f"📁 Location   : ./{OUTPUT_DIR}/")
print(f"{'─'*50}")