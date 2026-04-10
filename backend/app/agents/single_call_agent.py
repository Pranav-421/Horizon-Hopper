from app.agents.attraction_agent import get_attractions
from app.agents.commute_agent import get_commute_options
from app.agents.intent_agent import detect_intent
from app.agents.itinerary_agent import build_itinerary
from app.agents.location_agent import get_location_info
from app.agents.stay_agent import get_stay_options



def run_single_call(source, destination, purpose, budget, travel_time, preferences, memory=None, service_mode="full_package"):
    memory = memory or {}
    merged_preferences = " | ".join(
        value
        for value in [
            preferences,
            memory.get("preferred_transport"),
            memory.get("food_preference"),
            ", ".join(memory.get("avoid", [])) if memory.get("avoid") else "",
        ]
        if value
    )

    intent_input = f"{purpose}. {merged_preferences}. {source} to {destination}"
    intent = detect_intent(intent_input)
    location_info = get_location_info(source, destination)
    commute_options = get_commute_options(
        source, destination, budget, merged_preferences, travel_time, location_info
    )
    if service_mode == "travel_only":
        stay_options = ""
    else:
        stay_options = get_stay_options(destination, budget, merged_preferences, intent)
    attractions = get_attractions(destination, intent, location_info)
    final_itinerary = build_itinerary(
        user_input=f"Travel from {source} to {destination}",
        intent=intent,
        source=source,
        destination=destination,
        commute=commute_options,
        stay=stay_options,
        attractions=attractions,
        budget=budget,
        travel_time=travel_time,
        preferences=merged_preferences,
    )

    return {
        "intent": intent,
        "location_info": location_info,
        "commute_options": commute_options,
        "stay_options": stay_options,
        "attractions": attractions,
        "final_itinerary": final_itinerary,
    }
