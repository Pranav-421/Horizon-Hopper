from datetime import datetime


def seasonal_advisory(destination: str) -> str:
    month = datetime.now().month
    if month in {4, 5, 6}:
        return f"Weather note for {destination}: expect heat and carry water for daytime travel."
    if month in {10, 11, 12}:
        return f"Weather note for {destination}: keep a rain-ready backup because northeast monsoon showers can affect plans."
    return f"Weather note for {destination}: conditions are usually manageable, but a light umbrella is still useful."
