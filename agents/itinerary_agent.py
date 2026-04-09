from tools.weather_tool import seasonal_advisory



def build_itinerary(user_input, intent, source, destination, commute, stay, attractions, budget, travel_time, preferences):
    lines = [
        f"Trip type: {intent.replace('_', ' ').title()}",
        f"Route: {source} to {destination}",
        f"Arrival target: {travel_time or 'Flexible'}",
        f"Budget: {budget or 'Not specified'}",
        f"Preferences: {preferences or 'None shared'}",
        "",
        "Recommended commute:",
        commute,
        "",
        "Stay and services:",
        stay,
        "",
        "Nearby attractions:",
        attractions,
        "",
        seasonal_advisory(destination),
        "Carry a 20-30 minute buffer if your schedule is strict.",
    ]
    return "\n".join(lines)
