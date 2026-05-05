"""Commute agent — generates transport options using Groq LLM + static data.

Transport logic rules (Tamil Nadu):
  • Metro          → only when both ends have metro stations (Chennai metro network)
  • MTC Bus        → only for intra-Chennai travel (distance < 40 km, both in Chennai area)
  • TNSTC/SETC Bus → inter-city routes (> 30 km)
  • Cab / Auto     → up to ~80 km (auto), cab works for any distance
  • Bike Taxi      → intra-city only (< 25 km)
  • Train          → inter-city (> 30 km) where railway corridors exist
  • Private Car    → long distance (> 100 km)
"""

from app.core.config import GROQ_API_KEY, MODEL
from app.utils.metro_tool import build_metro_option
from app.utils.traffic_tool import traffic_advisory

try:
    from groq import Groq
except Exception:
    Groq = None

# ── Chennai-area localities (MTC bus catchment) ──────────────────────────
_CHENNAI_AREA = {
    "chennai", "tambaram", "chromepet", "pallavaram", "guindy", "adyar",
    "t. nagar", "mylapore", "anna nagar", "egmore", "nungambakkam",
    "porur", "avadi", "ambattur", "velachery", "sholinganallur",
    "perungudi", "thiruvanmiyur", "perambur", "tondiarpet", "royapuram",
    "kilpauk", "kodambakkam", "saidapet", "alandur", "st. thomas mount",
    "meenambakkam", "maduravoyal", "poonamallee", "red hills", "manali",
}


def _normalise_city(name: str) -> str:
    return name.split(",")[0].strip().lower()


def _is_chennai_area(place: str) -> bool:
    return _normalise_city(place) in _CHENNAI_AREA


def _build_static_commute(source, destination, budget, preferences, travel_time, location_info):
    """Build logically correct transport options based on distance & geography."""
    distance = float(location_info.get("approximate_distance_km", 0) or 0)
    drive_time = int(location_info.get("estimated_drive_time_mins", 0) or max(20, round(distance * 3.4)))
    traffic = traffic_advisory(travel_time, preferences, distance)

    both_in_chennai = _is_chennai_area(source) and _is_chennai_area(destination)
    is_short = distance < 30  # intra-city range
    is_mid = 30 <= distance < 100
    is_long = distance >= 100

    lines = []
    n = 1

    # ── 1. Metro (only if both ends have stations) ─────────────────────
    metro_option = build_metro_option(source, destination)
    if metro_option:
        metro_time = max(20, round(distance * 2.5))
        metro_cost = max(20, round(distance * 2.2))
        lines.append(
            f"{n}. Metro: {metro_time} min | INR {metro_cost}. {metro_option} "
            f"Air-conditioned, no traffic delays. Best for predictable arrival."
        )
        n += 1

    # ── 2. Bus — MTC (intra-Chennai) or TNSTC/SETC (inter-city) ───────
    if both_in_chennai and is_short:
        bus_time = drive_time + 20
        bus_cost = max(10, round(distance * 1.2))
        lines.append(
            f"{n}. MTC Bus: {bus_time} min | INR {bus_cost}. "
            f"Chennai city bus toward {destination}. Cheapest option; allow extra buffer for stops."
        )
        n += 1
    elif distance > 30:
        bus_time = drive_time + 40
        bus_cost = max(80, round(distance * 1.5))
        bus_type = "SETC A/C" if distance > 150 else "TNSTC Express"
        lines.append(
            f"{n}. {bus_type} Bus: {bus_time} min | INR {bus_cost}. "
            f"Inter-city government bus from the nearest bus stand. "
            f"Comfortable and affordable for longer routes."
        )
        n += 1

    # ── 3. Train (inter-city, > 30 km) ─────────────────────────────────
    from app.utils.train_tool import get_train_option
    train_opt = get_train_option(source, destination)
    
    if train_opt:
        lines.append(
            f"{n}. Train ({train_opt['train_name']}): {train_opt['duration']} hrs | INR {train_opt['cost']}. "
            f"Departs {train_opt['departure']} from {train_opt['station_from']}, "
            f"arrives {train_opt['arrival']} at {train_opt['station_to']}. "
            f"{train_opt['notes']}"
        )
        n += 1
    elif distance > 30:
        train_time = max(60, round(distance * 1.8))
        train_cost = max(30, round(distance * 0.9))
        lines.append(
            f"{n}. Train: {train_time} min | INR {train_cost}. "
            f"Check trains from the nearest junction station. "
            f"Most comfortable for distances over 50 km; book on IRCTC."
        )
        n += 1

    # ── 4. Cab (Ola/Uber) — works for any distance ────────────────────
    cab_time = max(15, drive_time)
    cab_cost = max(100, round(distance * 18))
    if is_short:
        # Short distance: also mention auto-rickshaw
        auto_cost = max(50, round(distance * 14))
        lines.append(
            f"{n}. Cab or Auto: {cab_time} min | INR {auto_cost}-{cab_cost}. "
            f"Auto for short hops, Ola/Uber cab for door-to-door convenience."
        )
    else:
        lines.append(
            f"{n}. Cab (Ola/Uber): {cab_time} min | INR {cab_cost}. "
            f"Door-to-door. Useful when timing or luggage matters."
        )
    n += 1

    # ── 5. Bike Taxi (intra-city only, < 25 km) ───────────────────────
    if distance < 25:
        bike_time = max(12, drive_time - 5)
        bike_cost = max(40, round(distance * 8))
        lines.append(
            f"{n}. Bike Taxi: {bike_time} min | INR {bike_cost}. "
            f"Use Rapido or Ola Bike. Best for solo riders beating city traffic."
        )
        n += 1

    # ── 6. Private Car / Self-Drive (long distance, > 100 km) ─────────
    if is_long:
        car_cost = max(2000, round(distance * 12))
        lines.append(
            f"{n}. Self-Drive / Rental Car: {drive_time} min | INR {car_cost}. "
            f"Rent from Zoomcar or Drivezy. Best for multi-stop trips or groups."
        )
        n += 1

    lines.append(f"Traffic outlook: {traffic['congestion']}. {traffic['notes']}")
    return "\n".join(lines)


def _enhance_commute_groq(source, destination, budget, preferences, travel_time, static_data, location_info):
    """Call Groq LLM to improve commute recommendations with reasoning."""
    if not GROQ_API_KEY or Groq is None:
        return None

    distance = location_info.get("approximate_distance_km", "unknown")

    system_prompt = (
        "You are Horizon Hopper, an expert on Tamil Nadu transportation. "
        "You MUST keep the same numbered output format so parsers can extract mode, time, and price. "
        "Each transport line MUST follow this exact pattern:\n"
        "N. ModeName: TIME min | INR PRICE. Description.\n"
        "End with a line: Traffic outlook: LEVEL. Notes.\n\n"
        "IMPORTANT RULES:\n"
        "- MTC Bus is ONLY for travel within Chennai city (< 30 km, both points in Chennai).\n"
        "- For inter-city bus travel, use TNSTC or SETC buses.\n"
        "- Bike Taxi (Rapido) is ONLY for short intra-city trips (< 25 km).\n"
        "- Auto-rickshaw is only practical within cities (< 20 km).\n"
        "- Do NOT show both 'Cab or Auto' AND a separate 'Private Car' for short distances.\n"
        "- Train option should include specific junction names if known.\n"
        "- You may refine descriptions and add practical tips, but NEVER violate the rules above.\n"
        "- NEVER add transport modes not present in the raw data below."
    )

    user_prompt = f"""Improve these transport suggestions for a trip from {source} to {destination} ({distance} km).

Budget: ₹{budget or 'flexible'}
Preferences: {preferences or 'none'}
Travel time: {travel_time or 'flexible'}

Raw transport data:
{static_data}

Refine the suggestions:
- Keep the exact format (N. ModeName: TIME min | INR PRICE. description)
- Add practical tips (e.g. which bus number, which platform, Ola vs Uber pricing)
- Adjust descriptions to be more helpful and specific to this route
- Keep the Traffic outlook line at the end
- Keep it concise — one line per option plus the traffic line"""

    try:
        client = Groq(api_key=GROQ_API_KEY)
        response = client.chat.completions.create(
            model=MODEL,
            temperature=0.5,
            max_tokens=400,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
        )
        result = (response.choices[0].message.content or "").strip()
        # Validate the LLM kept the expected format — must have at least one numbered line
        if result and any(line.strip().startswith(("1.", "2.")) for line in result.splitlines()):
            return result
        return None
    except Exception as exc:
        print(f"[commute_agent] Groq call failed: {exc}")
        return None


def get_commute_options(source, destination, budget, preferences, travel_time, location_info):
    """Generate commute options — LLM-enhanced with static fallback."""
    static = _build_static_commute(source, destination, budget, preferences, travel_time, location_info)
    enhanced = _enhance_commute_groq(source, destination, budget, preferences, travel_time, static, location_info)
    return enhanced or static
