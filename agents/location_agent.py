from tools.maps_tool import get_location_snapshot


def get_location_info(source: str, destination: str) -> dict:
    return get_location_snapshot(source, destination)
