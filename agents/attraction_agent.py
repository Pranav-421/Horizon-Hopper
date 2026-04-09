from tools.maps_tool import get_nearby_landmarks, load_place_index, resolve_location, haversine_km



def get_attractions(destination, intent, location_info):
    if intent == "office_commute":
        return "1. Quick meal stop near destination\n2. Nearby cafe for a short break\n3. Mall or park visit after work if time permits"

    destination_info = resolve_location(destination)
    candidates = []
    for row in load_place_index():
        if row["type"] == "office":
            continue
        distance = haversine_km(
            destination_info["latitude"],
            destination_info["longitude"],
            row["latitude"],
            row["longitude"],
        )
        candidates.append((distance, row))

    candidates.sort(key=lambda item: item[0])
    lines = []
    for index, (distance, row) in enumerate(candidates[:5], start=1):
        lines.append(
            f"{index}. {row['name']} | about {round(distance, 1)} km away | Best during morning or sunset | Good fit for {intent.replace('_', ' ')}"
        )

    if not lines:
        landmarks = get_nearby_landmarks(location_info.get("destination_area", destination))
        lines = [f"1. {name}" for name in landmarks] or ["1. Explore the local area around the destination."]
    return "\n".join(lines)
