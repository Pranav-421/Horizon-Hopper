from tools.hotel_tool import recommend_hotels


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
        lines.append(
            f"{index}. {hotel['hotel_name']} | {hotel['area']} | INR {hotel['price_range']} | Rating {hotel['rating']}"
        )
        lines.append(
            f"   {hotel['type']} stay with {FOOD_HINTS[veg_only]} and quick access to {destination}."
        )
    return "\n".join(lines)
