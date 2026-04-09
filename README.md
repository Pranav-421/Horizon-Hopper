# Horizon Hopper

Horizon Hopper is an AI-powered travel planning system focused on Chennai and nearby districts. It uses multiple intelligent agents to understand a user's preferences and generate personalized travel plans based on budget, time, interests, and transport options.

---

## Features

* Personalized travel recommendations
* Chennai-focused itinerary planning
* Multi-agent architecture for smarter suggestions
* Budget-aware trip generation
* Nearby attraction and restaurant recommendations
* Route optimization between locations
* Travel plans based on:

  * Available time
  * Budget
  * Preferred transport
  * Interests (food, beaches, temples, shopping, history, etc.)

---

## Problem Statement

Planning a local trip around Chennai can be confusing because users need to:

* Search multiple websites
* Compare routes and costs
* Decide what to visit in limited time
* Match places with their interests

Horizon Hopper solves this by generating a complete personalized trip plan in one place.

---

## How It Works

The system uses multiple AI agents:

1. Intent Agent

   * Understands what the user wants
   * Detects interests, budget, trip duration, and travel style

2. Place Recommendation Agent

   * Suggests attractions based on user preferences
   * Focused on Chennai and nearby areas

3. Route Planning Agent

   * Finds the best order to visit places
   * Reduces travel time and cost

4. Budget Agent

   * Estimates food, transport, and entry costs
   * Keeps the trip within budget

5. Final Planner Agent

   * Combines all results into a complete itinerary

---

## Example User Input

```text
I want a one-day trip in Chennai with a budget of ₹1000. I like beaches, food, and photography.
```

## Example Output

```text
08:00 AM - Marina Beach
10:00 AM - Breakfast nearby
12:00 PM - Santhome Church
02:00 PM - Lunch
04:00 PM - Elliot's Beach
06:00 PM - Sunset Photography
Estimated Cost: ₹950
```

---

## Tech Stack

* Python
* Streamlit
* LangGraph
* Groq API
* Google Maps API
* Pandas
* JSON

---

## Project Structure

```text
Horizon-Hopper/
│
├── app.py
├── agents/
│   ├── intent_agent.py
│   ├── recommendation_agent.py
│   ├── route_agent.py
│   ├── budget_agent.py
│   └── planner_agent.py
│
├── data/
│   ├── chennai_places.json
│   └── restaurants.json
│
├── utils/
│   ├── map_utils.py
│   └── budget_utils.py
│
├── requirements.txt
└── README.md
```

---

## Installation

```bash
git clone https://github.com/your-username/Horizon-Hopper.git
cd Horizon-Hopper
pip install -r requirements.txt
```

Create a `.env` file:

```text
GROQ_API_KEY=your_api_key
GOOGLE_MAPS_API_KEY=your_api_key
```

Run the project:

```bash
python -m streamlit run app.py
```

---

## Future Improvements

* Support for more cities in Tamil Nadu
* Real-time traffic integration
* Hotel and stay recommendations
* Voice-based travel planning
* Weather-aware itinerary generation
* Group trip planning

---

## Contributors

* Pranav Gupta

## License

This project is for educational and hackathon purposes.
