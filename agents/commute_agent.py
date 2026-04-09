from tools.metro_tool import build_metro_option
from tools.traffic_tool import traffic_advisory



def get_commute_options(source, destination, budget, preferences, travel_time, location_info):
    distance = float(location_info.get("approximate_distance_km", 0) or 0)
    drive_time = int(location_info.get("estimated_drive_time_mins", max(20, round(distance * 3.4))))
    traffic = traffic_advisory(travel_time, preferences, distance)
    lines = []

    metro_option = build_metro_option(source, destination)
    if metro_option:
        metro_time = max(25, round(distance * 2.6))
        metro_cost = max(20, round(distance * 2.2))
        lines.append(
            f"1. Metro: {metro_time} min | INR {metro_cost}. {metro_option} Best for predictable arrival."
        )

    bus_time = drive_time + 20
    bus_cost = max(15, round(distance * 1.4))
    lines.append(
        f"2. MTC Bus: {bus_time} min | INR {bus_cost}. Use the nearest trunk route toward {destination}. Cheapest option, but allow extra buffer."
    )

    cab_time = max(18, drive_time)
    cab_cost = max(120, round(distance * 18))
    lines.append(
        f"3. Cab or Auto: {cab_time} min | INR {cab_cost}. Door-to-door and useful when luggage or timing matters."
    )

    bike_cost = max(70, round(distance * 10))
    lines.append(
        f"4. Bike Taxi: {max(15, drive_time - 5)} min | INR {bike_cost}. Best for solo travelers when roads are busy."
    )

    lines.append(f"Traffic outlook: {traffic['congestion']}. {traffic['notes']}")
    return "\n".join(lines)
