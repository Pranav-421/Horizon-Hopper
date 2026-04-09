# 🌏 Horizon Hopper
### Personalized Agentic Travel Planner for Chennai & Chengalpattu Region

## Overview
Horizon Hopper is a multi-agent AI travel planner powered by LangGraph and Claude.
It helps office commuters, business travelers, job seekers, and tourists plan
smarter trips in and around Chennai.

## Features
- 🧠 Intent detection (office, business, interview, leisure)
- 📍 Location-aware routing (metro, bus, cab, train)
- 🏨 Smart hotel and service suggestions
- 🗺️ Attraction recommendations for free time
- 💾 Learns and remembers your preferences
- 🖥️ Clean Streamlit UI

## Tech Stack
- **LangGraph** – multi-agent orchestration
- **Claude API (Anthropic)** – all agent intelligence
- **Streamlit** – frontend UI
- **Pandas** – dataset handling
- **JSON** – memory storage

## Folder Structure
```
horizon-hopper/
├── app.py                  ← Streamlit UI
├── orchestrator.py         ← LangGraph workflow
├── requirements.txt
├── README.md
├── agents/
│   ├── intent_agent.py
│   ├── location_agent.py
│   ├── commute_agent.py
│   ├── stay_agent.py
│   ├── attraction_agent.py
│   ├── itinerary_agent.py
│   └── memory_agent.py
├── tools/
│   ├── maps_tool.py
│   ├── traffic_tool.py
│   ├── hotel_tool.py
│   ├── weather_tool.py
│   └── metro_tool.py
├── data/
│   ├── chennai_places.csv
│   ├── offices.csv
│   ├── metro_routes.csv
│   └── hotels.csv
├── memory/
│   └── user_memory.json
└── diagrams/
    └── architecture.png
```

## Use Cases
| User | Example Request |
|------|----------------|
| Office Commuter | "Travel from Tambaram to Tidel Park by 9 AM, avoid traffic" |
| Business Traveler | "2-day trip to Guindy with hotel near DLF IT Park, veg food" |
| Job Seeker | "Going to Siruseri SIPCOT for interview, need cheap stay" |
| Tourist | "Weekend trip from Chennai to Mahabalipuram" |

## Setup
```bash
pip install -r requirements.txt
# Add your Anthropic API key to .env
echo "ANTHROPIC_API_KEY=your_key_here" > .env
streamlit run app.py
```
