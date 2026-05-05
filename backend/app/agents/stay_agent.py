from app.utils.hotel_tool import recommend_hotels


FOOD_HINTS = {
    True: "veg-friendly restaurants nearby",
    False: "mixed veg and non-veg dining nearby",
}



def get_stay_options(destination, budget, preferences, intent):
    veg_only = "veg" in (preferences or "").lower()
    picks = recommend_hotels(destination, budget, preferences, intent)
    if not picks:
        return "No stay options found in the bundled dataset."

    lines = []
    for index, hotel in enumerate(picks, start=1):
        hotel_name = hotel.get("hotel_name") or hotel.get("name") or "Recommended Stay"
        area = hotel.get("area", destination)
        price_range = hotel.get("price_range", "NA")
        rating = hotel.get("rating", "NA")
        stay_type = hotel.get("type", "General")
        lines.append(
            f"{index}. {hotel_name} | {area} | INR {price_range} | Rating {rating} | Type {stay_type}"
        )
        lines.append(
            f"   Stay with {FOOD_HINTS[veg_only]} and quick access to {destination}."
        )
    return "\n".join(lines)
