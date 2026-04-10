"""
Comprehensive API test suite for Horizon Hopper backend.

Tests all 6 endpoints using FastAPI TestClient (no server needed).
"""

import os
import sys

# Ensure backend dir is on path
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


# ═══════════════════════════════════════════════════════════════
#  1. Auth — POST /api/auth/login
# ═══════════════════════════════════════════════════════════════


class TestAuthLogin:
    def test_valid_login_arjun(self):
        res = client.post("/api/auth/login", json={"username": "arjun", "password": "arjun123"})
        assert res.status_code == 200
        data = res.json()
        assert "user" in data
        assert data["user"]["id"] == "arjun"
        assert data["user"]["name"] == "Arjun Sharma"
        assert data["user"]["avatar"] == "🧑‍💼"
        assert "memory" in data["user"]

    def test_valid_login_priya(self):
        res = client.post("/api/auth/login", json={"username": "priya", "password": "priya456"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["id"] == "priya"
        assert data["user"]["name"] == "Priya Nair"

    def test_valid_login_vikram(self):
        res = client.post("/api/auth/login", json={"username": "vikram", "password": "vikram789"})
        assert res.status_code == 200
        data = res.json()
        assert data["user"]["id"] == "vikram"

    def test_invalid_password(self):
        res = client.post("/api/auth/login", json={"username": "arjun", "password": "wrong"})
        assert res.status_code == 401

    def test_invalid_username(self):
        res = client.post("/api/auth/login", json={"username": "nobody", "password": "test"})
        assert res.status_code == 401

    def test_missing_fields(self):
        res = client.post("/api/auth/login", json={})
        assert res.status_code == 422  # Pydantic validation error

    def test_memory_in_profile(self):
        res = client.post("/api/auth/login", json={"username": "arjun", "password": "arjun123"})
        mem = res.json()["user"]["memory"]
        assert "preferred_transport" in mem
        assert "past_trips" in mem
        assert "trip_count" in mem
        assert isinstance(mem["avoid"], list)


# ═══════════════════════════════════════════════════════════════
#  2. Users — GET /api/users
# ═══════════════════════════════════════════════════════════════


class TestListUsers:
    def test_returns_users(self):
        res = client.get("/api/users")
        assert res.status_code == 200
        data = res.json()
        assert "users" in data
        assert isinstance(data["users"], list)
        assert len(data["users"]) >= 3  # arjun, priya, vikram

    def test_user_shape(self):
        res = client.get("/api/users")
        user = res.json()["users"][0]
        assert "id" in user
        assert "name" in user
        assert "avatar" in user
        assert "memory" in user

    def test_known_users_present(self):
        res = client.get("/api/users")
        ids = [u["id"] for u in res.json()["users"]]
        assert "arjun" in ids
        assert "priya" in ids
        assert "vikram" in ids


# ═══════════════════════════════════════════════════════════════
#  3. User Memory — GET /api/users/{userId}/memory
# ═══════════════════════════════════════════════════════════════


class TestUserMemory:
    def test_arjun_memory(self):
        res = client.get("/api/users/arjun/memory")
        assert res.status_code == 200
        data = res.json()
        assert data["preferred_transport"] == "Metro"
        assert data["food_preference"] == "Vegetarian"
        assert isinstance(data["past_trips"], list)
        assert data["trip_count"] >= 1

    def test_priya_memory(self):
        res = client.get("/api/users/priya/memory")
        assert res.status_code == 200
        data = res.json()
        assert data["preferred_transport"] == "Cab"

    def test_guest_memory(self):
        res = client.get("/api/users/guest/memory")
        assert res.status_code == 200
        data = res.json()
        # Guest should have default/empty memory
        assert isinstance(data["avoid"], list)
        assert isinstance(data["past_trips"], list)

    def test_memory_structure(self):
        res = client.get("/api/users/vikram/memory")
        data = res.json()
        expected_keys = {
            "preferred_transport",
            "food_preference",
            "budget_range",
            "accommodation_type",
            "avoid",
            "feedback_notes",
            "past_trips",
            "trip_count",
        }
        assert expected_keys.issubset(set(data.keys()))


# ═══════════════════════════════════════════════════════════════
#  4. Feedback — POST /api/users/{userId}/feedback
# ═══════════════════════════════════════════════════════════════


class TestFeedback:
    def test_save_positive_feedback(self):
        res = client.post(
            "/api/users/arjun/feedback",
            json={"feedback": "Great trip plan!", "section": "general", "satisfied": True},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_save_negative_feedback(self):
        res = client.post(
            "/api/users/priya/feedback",
            json={"feedback": "Hotel was too expensive", "section": "stay_options", "satisfied": False},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

    def test_missing_feedback_field(self):
        res = client.post("/api/users/arjun/feedback", json={})
        assert res.status_code == 422


# ═══════════════════════════════════════════════════════════════
#  5. Trip Plan — POST /api/trips/plan
# ═══════════════════════════════════════════════════════════════


class TestTripPlan:
    def test_office_commute(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "arjun",
                "source": "Tambaram",
                "destination": "Tidel Park",
                "purpose": "Office Commute",
                "budget": "200-500",
                "travel_time": "By 9:00 AM",
                "preferences": "Prefer metro, avoid traffic",
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()

        # Top-level keys
        assert data["service_mode"] == "full_package"
        assert data["intent"] == "office_commute"
        assert "trip_context" in data
        assert "location_info" in data
        assert "map" in data
        assert "memory" in data
        assert "sections" in data
        assert "raw" in data
        assert "agent_result" in data

    def test_trip_context_echo(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "arjun",
                "source": "Tambaram",
                "destination": "Tidel Park",
                "purpose": "Office Commute",
                "budget": "200-500",
                "travel_time": "9 AM",
                "preferences": "metro",
                "service_mode": "travel_only",
            },
        )
        ctx = res.json()["trip_context"]
        assert ctx["source"] == "Tambaram"
        assert ctx["destination"] == "Tidel Park"
        assert ctx["user_id"] == "arjun"

    def test_commute_sections_parsed(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Tambaram",
                "destination": "Guindy",
                "purpose": "Office Commute",
                "budget": "500",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        commute = res.json()["sections"]["commute"]
        assert isinstance(commute["items"], list)
        assert len(commute["items"]) >= 1
        # Each item should have correct shape
        for item in commute["items"]:
            assert "mode" in item
            assert "duration" in item
            assert "price" in item
            assert "summary" in item

    def test_stay_sections_parsed(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Chennai",
                "destination": "Mahabalipuram",
                "purpose": "Leisure / Tourism",
                "budget": "3000",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        stay = res.json()["sections"]["stay"]
        assert isinstance(stay, list)
        assert len(stay) >= 1
        for item in stay:
            assert "name" in item
            assert "area" in item
            assert "price" in item
            assert "rating" in item

    def test_attractions_parsed(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Chennai",
                "destination": "Mahabalipuram",
                "purpose": "Leisure / Tourism",
                "budget": "3000",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        attrs = res.json()["sections"]["attractions"]
        assert isinstance(attrs, list)
        assert len(attrs) >= 1
        for item in attrs:
            assert "name" in item

    def test_map_data(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Tambaram",
                "destination": "OMR",
                "purpose": "Office Commute",
                "budget": "500",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        m = res.json()["map"]
        assert "center" in m
        assert "lat" in m["center"]
        assert "lng" in m["center"]
        assert "bounds" in m
        assert "route" in m
        assert isinstance(m["route"], list)
        assert len(m["route"]) >= 2
        assert "markers" in m
        assert len(m["markers"]) >= 2

    def test_location_info(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Tambaram",
                "destination": "Tidel Park",
                "purpose": "Office Commute",
                "budget": "500",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        loc = res.json()["location_info"]
        assert loc["destination_area"] == "OMR"
        assert loc["approximate_distance_km"] > 0
        assert loc["estimated_drive_time_mins"] > 0

    def test_itinerary_present(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Tambaram",
                "destination": "Guindy",
                "purpose": "Business Meeting",
                "budget": "2000",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        itin = res.json()["sections"]["itinerary"]
        assert isinstance(itin, str)
        assert len(itin) > 0

    def test_agent_result_preserved(self):
        """The agent_result must be preserved for round-trip refinement."""
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "guest",
                "source": "Tambaram",
                "destination": "Guindy",
                "purpose": "Office Commute",
                "budget": "500",
                "travel_time": "",
                "preferences": "",
                "service_mode": "full_package",
            },
        )
        ar = res.json()["agent_result"]
        assert "intent" in ar
        assert "commute_options" in ar
        assert "stay_options" in ar
        assert "attractions" in ar
        assert "final_itinerary" in ar
        assert "location_info" in ar

    def test_leisure_trip(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "priya",
                "source": "Chennai",
                "destination": "Mahabalipuram",
                "purpose": "Leisure / Tourism",
                "budget": "1500-3000",
                "travel_time": "Flexible",
                "preferences": "Need beach attractions",
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "leisure_trip"

    def test_job_interview_trip(self):
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "vikram",
                "source": "Velachery",
                "destination": "Siruseri SIPCOT",
                "purpose": "Job Interview",
                "budget": "500",
                "travel_time": "8 AM",
                "preferences": "cheap, bus preferred",
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["intent"] == "job_interview"


# ═══════════════════════════════════════════════════════════════
#  6. Trip Refine — POST /api/trips/refine
# ═══════════════════════════════════════════════════════════════


class TestTripRefine:
    def _make_plan(self) -> dict:
        """Helper: create a plan to refine."""
        res = client.post(
            "/api/trips/plan",
            json={
                "user_id": "priya",
                "source": "Chennai",
                "destination": "Mahabalipuram",
                "purpose": "Leisure / Tourism",
                "budget": "1500-3000",
                "travel_time": "Flexible",
                "preferences": "Need beach attractions",
                "service_mode": "full_package",
            },
        )
        return res.json()

    def test_refine_attractions(self):
        plan = self._make_plan()
        res = client.post(
            "/api/trips/refine",
            json={
                "result": plan["agent_result"],
                "feedback": "Show temple attractions only",
                "trip_context": plan["trip_context"],
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["updated_section"] == "attractions"
        assert "sections" in data
        assert isinstance(data["sections"]["attractions"], list)

    def test_refine_commute(self):
        plan = self._make_plan()
        res = client.post(
            "/api/trips/refine",
            json={
                "result": plan["agent_result"],
                "feedback": "I prefer bus transport only",
                "trip_context": plan["trip_context"],
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["updated_section"] == "commute_options"

    def test_refine_stay(self):
        plan = self._make_plan()
        res = client.post(
            "/api/trips/refine",
            json={
                "result": plan["agent_result"],
                "feedback": "Show only luxury hotels",
                "trip_context": plan["trip_context"],
                "service_mode": "full_package",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["updated_section"] == "stay_options"

    def test_refine_preserves_structure(self):
        plan = self._make_plan()
        res = client.post(
            "/api/trips/refine",
            json={
                "result": plan["agent_result"],
                "feedback": "Refresh the whole itinerary",
                "trip_context": plan["trip_context"],
                "service_mode": "full_package",
            },
        )
        data = res.json()
        assert "map" in data
        assert "sections" in data
        assert "raw" in data
        assert "agent_result" in data
        assert "trip_context" in data


# ═══════════════════════════════════════════════════════════════
#  7. Health Check
# ═══════════════════════════════════════════════════════════════


class TestHealth:
    def test_root(self):
        res = client.get("/")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"
