import unittest

from agents.feedback_agent import detect_section, run_feedback_refinement
from agents.intent_agent import detect_intent
from agents.location_agent import get_location_info
from agents.memory_agent import load_memory
from orchestrator import run_planner


class HorizonHopperTests(unittest.TestCase):
    def test_intent_detection(self):
        intent = detect_intent("I need to go to Tidel Park by 9 AM from Tambaram for office")
        self.assertEqual(intent, "office_commute")

    def test_location_info(self):
        loc = get_location_info("Tambaram", "Tidel Park")
        self.assertEqual(loc["destination_area"], "OMR")
        self.assertGreater(loc["approximate_distance_km"], 0)

    def test_memory_load(self):
        mem = load_memory("arjun")
        self.assertIn("preferred_transport", mem)
        self.assertIn("past_trips", mem)

    def test_run_planner(self):
        result = run_planner(
            source="Tambaram",
            destination="Tidel Park",
            purpose="Office Commute",
            budget="200-500",
            travel_time="By 9:00 AM",
            preferences="Prefer metro, avoid traffic",
            user_id="arjun",
        )
        self.assertEqual(result["intent"], "office_commute")
        self.assertIn("commute", result["final_itinerary"].lower())
        self.assertTrue(result["stay_options"])

    def test_feedback_refinement(self):
        result = run_planner(
            source="Chennai",
            destination="Mahabalipuram",
            purpose="Leisure / Tourism",
            budget="1500-3000",
            travel_time="Flexible",
            preferences="Need beach attractions",
            user_id="priya",
        )
        updated = run_feedback_refinement(
            result,
            "Show temple attractions only",
            {
                "source": "Chennai",
                "destination": "Mahabalipuram",
                "purpose": "Leisure / Tourism",
                "budget": "1500-3000",
                "travel_time": "Flexible",
                "preferences": "Need beach attractions",
            },
        )
        self.assertEqual(detect_section("Show temple attractions only"), "attractions")
        self.assertEqual(updated["_updated_section"], "attractions")
        self.assertTrue(updated["attractions"])


if __name__ == "__main__":
    unittest.main()
