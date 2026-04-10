from app.agents.attraction_agent import get_attractions
from app.agents.commute_agent import get_commute_options
from app.agents.itinerary_agent import build_itinerary
from app.agents.location_agent import get_location_info
from app.agents.stay_agent import get_stay_options
from app.agents.memory_agent import load_user_memory, save_user_memory


_SECTION_KEYWORDS = {
    "stay_options": ["hotel", "stay", "accommodation", "lodge", "room", "hostel", "oyo", "resort"],
    "commute_options": ["transport", "commute", "travel", "route", "metro", "bus", "cab", "auto", "train", "bike"],
    "attractions": ["attraction", "visit", "place", "sightseeing", "temple", "beach", "mall", "park", "zoo", "tourist"],
    "final_itinerary": ["itinerary", "plan", "schedule", "timeline", "full", "everything", "whole", "all"],
}



def detect_section(feedback_text: str) -> str:
    lower = feedback_text.lower()
    for section, keywords in _SECTION_KEYWORDS.items():
        if any(keyword in lower for keyword in keywords):
            return section
    return "final_itinerary"



def _merged_preferences(original_result: dict, trip_context: dict, feedback: str) -> str:
    pieces = [trip_context.get("preferences", ""), feedback]
    location = original_result.get("location_info", {})
    if location.get("travel_notes"):
        pieces.append(location["travel_notes"])
    return " | ".join(piece for piece in pieces if piece)



def run_feedback_refinement(original_result: dict, feedback: str, trip_context: dict) -> dict:
    section = detect_section(feedback)
    preferences = _merged_preferences(original_result, trip_context, feedback)
    source = trip_context.get("source", "")
    destination = trip_context.get("destination", "")
    budget = trip_context.get("budget", "")
    travel_time = trip_context.get("travel_time", "")
    intent = original_result.get("intent", "leisure_trip")
    location_info = original_result.get("location_info") or get_location_info(source, destination)

    updated = dict(original_result)
    if section == "commute_options":
        updated[section] = get_commute_options(source, destination, budget, preferences, travel_time, location_info)
    elif section == "stay_options":
        updated[section] = get_stay_options(destination, budget, preferences, intent)
    elif section == "attractions":
        updated[section] = get_attractions(destination, intent, location_info)
    else:
        updated[section] = build_itinerary(
            user_input=f"Travel from {source} to {destination}",
            intent=intent,
            source=source,
            destination=destination,
            commute=updated.get("commute_options", ""),
            stay=updated.get("stay_options", ""),
            attractions=updated.get("attractions", ""),
            budget=budget,
            travel_time=travel_time,
            preferences=preferences,
        )
    updated["_updated_section"] = section
    return updated



def save_feedback_to_memory(user_id: str, feedback: str, section: str, satisfied: bool):
    mem = load_user_memory(user_id)
    notes = mem.get("feedback_notes", [])
    marker = "[saved]" if satisfied else "[refined]"
    entry = f"{marker} {section}: {feedback[:100]}"
    if entry not in notes:
        notes.append(entry)
    mem["feedback_notes"] = notes[-20:]
    save_user_memory(user_id, mem)
