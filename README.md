# 🌏 Horizon Hopper
### Personalized Agentic Travel Planner for Chennai & Chengalpattu Region

## Overview
Horizon Hopper is a multi-agent AI travel planner powered by LangGraph and Claude.
It helps office commuters, business travelers, job seekers, and tourists plan
smarter trips in and around Chennai. Recently, the platform has been updated to a modern full-stack architecture with a Next.js frontend and a FastAPI backend.

## Features
- 🧠 Intent detection (office, business, interview, leisure)
- 📍 Location-aware routing (metro, bus, cab, train)
- 🏨 Smart hotel and service suggestions
- 🗺️ Attraction recommendations for free time
- 💾 Learns and remembers your preferences
- 🖥️ Modern Next.js UI with a robust API backend

## Tech Stack
- **Frontend** – Next.js (React), Tailwind CSS
- **Backend API** – FastAPI (Python)
- **Agent Framework** – LangGraph
- **LLM** – Claude API (Anthropic)
- **Data Handling** – Pandas
- **Storage** – JSON memory storage

## Folder Structure
```
horizon-hopper/
├── frontend/               ← Next.js frontend application
│   ├── src/app/            ← App router, API routes, and pages
│   └── src/components/     ← React UI components
├── backend/                ← FastAPI backend application
│   ├── main.py             ← API entry point
│   ├── requirements.txt    ← Python dependencies
│   ├── app/                
│   │   ├── api/            ← FastAPI routes
│   │   ├── agents/         ← LangGraph agents (intent, location, stay, etc.)
│   │   ├── tools/          ← Agent tools (maps, hotel, weather, etc.)
│   │   ├── services/       ← Orchestrator and other services
│   │   └── models/         ← Pydantic schemas
│   ├── data/               ← CSV data files
│   └── memory/             ← Local JSON user data
├── legacy_streamlit/       ← Old Streamlit application
├── README.md
```

## Use Cases
| User | Example Request |
|------|----------------|
| Office Commuter | "Travel from Tambaram to Tidel Park by 9 AM, avoid traffic" |
| Business Traveler | "2-day trip to Guindy with hotel near DLF IT Park, veg food" |
| Job Seeker | "Going to Siruseri SIPCOT for interview, need cheap stay" |
| Tourist | "Weekend trip from Chennai to Mahabalipuram" |

## Setup

### Backend (FastAPI & LangGraph)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Add your Anthropic API key to .env
cp .env.example .env
# Edit .env and supply ANTHROPIC_API_KEY=your_key_here

uvicorn main:app --reload
```

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Visit the frontend at `http://localhost:3000`.
