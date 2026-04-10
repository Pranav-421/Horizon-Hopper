from typing import Optional, TypedDict

from app.agents.memory_agent import load_user_memory, update_memory
from app.agents.single_call_agent import run_single_call


class TravelState(TypedDict):
    user_input: str
    source: str
    destination: str
    purpose: str
    budget: str
    travel_time: str
    preferences: str
    intent: Optional[str]
    location_info: Optional[dict]
    commute_options: Optional[str]
    stay_options: Optional[str]
    attractions: Optional[str]
    final_itinerary: Optional[str]
    memory: Optional[dict]



def run_planner(source, destination, purpose, budget, travel_time, preferences, user_id="guest", service_mode="full_package"):
    user_input = (
        f"Travel from {source} to {destination}. Purpose: {purpose}. Budget: {budget}. "
        f"Time: {travel_time}. Preferences: {preferences}."
    )
    memory = load_user_memory(user_id)
    result = run_single_call(
        source=source,
        destination=destination,
        purpose=purpose,
        budget=budget,
        travel_time=travel_time,
        preferences=preferences,
        memory=memory,
        service_mode=service_mode,
    )

    if result.get("final_itinerary"):
        memory = update_memory(user_input, preferences, result.get("intent", "leisure_trip"), user_id)

    result["memory"] = memory
    result["user_input"] = user_input
    return result
