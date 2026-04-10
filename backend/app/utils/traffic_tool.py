def traffic_advisory(travel_time: str, preferences: str, distance_km: float) -> dict:
    text = f"{travel_time} {preferences}".lower()
    peak = any(token in text for token in ["8", "9", "10", "5 pm", "6 pm", "7 pm", "peak", "office"])
    avoid_highways = "avoid highway" in text or "avoid highways" in text

    congestion = "moderate"
    if peak and distance_km >= 12:
        congestion = "high"
    elif distance_km <= 6:
        congestion = "low"

    note_parts = []
    if peak:
        note_parts.append("Peak-hour road congestion is likely.")
    if avoid_highways:
        note_parts.append("A surface-road route is better aligned with the preference to avoid highways.")
    if not note_parts:
        note_parts.append("Traffic looks manageable for a standard city transfer.")

    return {"congestion": congestion, "notes": " ".join(note_parts)}
