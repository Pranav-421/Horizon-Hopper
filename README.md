<div align="center">

# 🌏 Horizon Hopper

### AI-Powered Agentic Travel Planner for Tamil Nadu

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3-F55036?logo=meta&logoColor=white)](https://groq.com)
[![SQLite](https://img.shields.io/badge/SQLite-WAL-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)
[![JWT](https://img.shields.io/badge/Auth-JWT_+_bcrypt-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io)

*A multi-agent AI system that generates personalized travel itineraries, real-time commute options, and data-driven stay recommendations across 18+ Tamil Nadu cities.*

</div>

---

## 📖 Overview

Horizon Hopper is an **agentic AI travel planner** built with a multi-agent architecture. Instead of static templates, it uses a pipeline of specialized AI agents — each responsible for intent detection, commute planning, hotel recommendations, attraction curation, and itinerary generation — orchestrated to produce a complete, personalized travel plan in a single request.

The system covers **18 cities across Tamil Nadu** with CSV-driven datasets for railway schedules, metro routes, hotel listings, office locations, and tourist attractions.

---

## ✨ Features

### 🤖 AI & Agent System
- **6 Specialized Agents** — Intent, Location, Commute, Stay, Attraction, and Itinerary agents work in concert
- **Groq-Powered LLM** — Uses Llama 3.3 70B via Groq API for sub-second inference
- **Smart Fallback** — Agents degrade gracefully to rule-based logic when the AI service is unavailable
- **Feedback Refinement** — Users can refine any section of their plan, and the system re-generates only the affected part
- **Persistent Memory** — Learns user preferences (transport, food, avoidances) across sessions

### 🗺️ Travel Intelligence
- **Railway Schedule Engine** — Parses `railway_schedule.csv` for real train names, timings, station stops, and ticket pricing
- **Metro Route Planner** — Chennai metro connectivity via `metro_routes.csv`
- **Dynamic Route Mapping** — OSRM API for road geometry; custom BFS graph for railway corridors
- **Data-Driven Hotels** — 5 categories (Luxury → Hostel) across 18 cities from `stays.csv`
- **Attraction Database** — 88+ attractions with entry fees, food estimates, and best-visit times

### 🔐 Infrastructure
- **SQLite Database** — WAL-mode with `users`, `memory`, and `trips` tables (auto-migrated from legacy JSON)
- **JWT Authentication** — Signed tokens with 24-hour expiry, forwarded through the Next.js proxy layer
- **bcrypt Password Hashing** — Secure credential storage with legacy plain-text fallback for migration
- **Global Error Handling** — Structured logging and clean JSON error responses (no stack trace leaks)
- **Centralized Config** — `pydantic-settings` with `.env` auto-loading

### 🎨 Frontend
- **Premium UI** — Glassmorphism, micro-animations, dark mode support
- **Interactive Transport Cards** — Click-to-expand modal with route visualization
- **Stay Images** — 270 category-matched hotel images across all cities
- **Star Ratings** — Visual rating display on stay recommendations
- **Profile Dashboard** — Travel DNA, past journeys, memory notes, and live stats

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js Frontend                      │
│   Login Screen → Planner Dashboard → Profile View        │
│                    ↕ API Proxy                           │
├─────────────────────────────────────────────────────────┤
│                   FastAPI Backend                         │
│  ┌──────────┐  ┌───────────┐  ┌──────────────────────┐  │
│  │  Routes   │→│Orchestrator│→│   Agent Pipeline      │  │
│  │ (JWT Auth)│  └───────────┘  │                      │  │
│  └──────────┘                  │  Intent Agent        │  │
│                                │  Location Agent      │  │
│  ┌──────────┐                  │  Commute Agent       │  │
│  │ SQLite DB │                 │  Stay Agent          │  │
│  │ (WAL)    │                  │  Attraction Agent    │  │
│  └──────────┘                  │  Itinerary Agent     │  │
│                                │  Memory Agent        │  │
│  ┌──────────┐                  │  Feedback Agent      │  │
│  │ CSV Data  │                 └──────────────────────┘  │
│  │ Layer     │                                           │
│  └──────────┘                  ┌──────────────────────┐  │
│                                │  Groq API (LLM)      │  │
│                                └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
horizon-hopper/
├── frontend/                        # Next.js 15 application
│   ├── src/
│   │   ├── app/                     # App router, pages, API proxy routes
│   │   │   ├── api/                 # Proxy endpoints (auth, trips, users)
│   │   │   ├── planner/             # Main planner page
│   │   │   └── profile/             # User profile page
│   │   ├── components/              # React components
│   │   │   ├── login-screen.tsx     # Animated login with user selection
│   │   │   ├── planner-dashboard.tsx# Core planning interface
│   │   │   ├── profile-view.tsx     # Travel DNA & stats dashboard
│   │   │   └── travel-map.tsx       # Leaflet map with route rendering
│   │   └── lib/                     # Shared utilities
│   │       ├── session.ts           # JWT token & session management
│   │       ├── proxy.ts             # Backend proxy with auth forwarding
│   │       └── types.ts             # TypeScript interfaces
│   └── public/assets/               # City & stay images (270+ photos)
│
├── backend/                         # FastAPI application
│   ├── main.py                      # App entry, CORS, global error handler
│   ├── requirements.txt             # Python dependencies
│   ├── horizon_hopper.db            # SQLite database (auto-created)
│   ├── app/
│   │   ├── api/routes.py            # REST endpoints with JWT extraction
│   │   ├── core/
│   │   │   ├── config.py            # Pydantic settings (env-driven)
│   │   │   └── security.py          # JWT + bcrypt utilities
│   │   ├── db/database.py           # SQLite layer (schema, CRUD, migration)
│   │   ├── agents/                  # AI agent modules
│   │   │   ├── intent_agent.py      # Trip purpose classification
│   │   │   ├── location_agent.py    # Geo-resolution & distance calc
│   │   │   ├── commute_agent.py     # Transport options generator
│   │   │   ├── stay_agent.py        # Hotel recommendation engine
│   │   │   ├── attraction_agent.py  # POI curation from CSV + LLM
│   │   │   ├── itinerary_agent.py   # Full plan synthesis
│   │   │   ├── memory_agent.py      # User preference persistence
│   │   │   └── feedback_agent.py    # Targeted section refinement
│   │   ├── models/schemas.py        # Pydantic request/response models
│   │   ├── services/
│   │   │   ├── orchestrator.py      # Agent pipeline coordinator
│   │   │   └── formatter.py         # Raw text → structured JSON parser
│   │   └── utils/                   # Data tools
│   │       ├── maps_tool.py         # Geocoding, routing, landmarks
│   │       ├── hotel_tool.py        # CSV-based hotel lookup
│   │       ├── train_tool.py        # Railway schedule parser
│   │       ├── metro_tool.py        # Chennai metro route engine
│   │       ├── traffic_tool.py      # Time-based traffic estimation
│   │       └── weather_tool.py      # Seasonal weather hints
│   └── data/                        # Source datasets
│       ├── attractions.csv          # 88 attractions across 18 cities
│       ├── stays.csv                # Hotel listings (5 categories)
│       ├── railway_schedule.csv     # Inter-city train schedules
│       ├── metro_routes.csv         # Chennai metro stations & lines
│       └── offices.csv              # IT park & office locations
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- [Groq API Key](https://console.groq.com) (free tier available)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/horizon-hopper.git
cd horizon-hopper
```

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create a `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your-secret-key-change-this
```

Start the backend:
```bash
uvicorn main:app --reload
```
> Backend runs on `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
> Frontend runs on `http://localhost:3000`

### 4. Login
Use any of the pre-seeded accounts:

| Username | Password | Profile |
|----------|----------|---------|
| `arjun` | `arjun123` | Business traveler, vegetarian |
| `priya` | `priya456` | Leisure explorer, budget-conscious |
| `vikram` | `vikram789` | Student backpacker |

---

## 💡 Use Cases

| Persona | Example Query |
|---------|---------------|
| **Office Commuter** | *"Tambaram to Tidel Park by 9 AM, prefer metro, avoid traffic"* |
| **Business Traveler** | *"2-day trip to Madurai, hotel near conference center, vegetarian food"* |
| **Tourist** | *"Weekend trip from Chennai to Ooty, budget ₹15,000, prefer train"* |
| **Backpacker** | *"Cheapest way from Kanyakumari to Rameswaram, hostel stays only"* |

---

## 🔧 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/login` | Authenticate & receive JWT token |
| `GET` | `/api/users` | List all user profiles |
| `GET` | `/api/users/{id}/memory` | Get user memory & preferences |
| `POST` | `/api/users/{id}/feedback` | Save trip feedback |
| `POST` | `/api/trips/plan` | Generate a full travel plan |
| `POST` | `/api/trips/refine` | Refine a specific section with feedback |

All endpoints accept `Authorization: Bearer <token>` headers.

---

## 🗄️ Database Schema

```sql
-- Users table (bcrypt-hashed passwords)
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT 'U',
    password_hash TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User preferences & memory
CREATE TABLE memory (
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    preferred_transport TEXT,
    food_preference TEXT,
    budget_range TEXT,
    accommodation_type TEXT,
    avoid TEXT DEFAULT '[]',
    feedback_notes TEXT DEFAULT '[]'
);

-- Trip history
CREATE TABLE trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT REFERENCES users(id),
    date TEXT NOT NULL,
    intent TEXT DEFAULT 'leisure_trip',
    summary TEXT DEFAULT '',
    destination TEXT DEFAULT ''
);
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 15, React 19, Leaflet | UI, routing, map rendering |
| Backend | FastAPI, Pydantic v2 | REST API, validation |
| AI/LLM | Groq API, Llama 3.3 70B | Intent detection, itinerary generation |
| Database | SQLite (WAL mode) | User data, memory, trip history |
| Auth | JWT (PyJWT) + bcrypt | Token-based authentication |
| Config | pydantic-settings, python-dotenv | Environment management |
| Routing | OSRM API + Custom BFS Graph | Road & railway route computation |
| Data | Pandas, CSV datasets | Structured travel data |

---

## 📊 Dataset Coverage

| Dataset | Records | Coverage |
|---------|---------|----------|
| `attractions.csv` | 88 attractions | 18 cities, 6 categories |
| `stays.csv` | 90+ hotels | 5 tiers (Luxury → Hostel) |
| `railway_schedule.csv` | 30+ routes | Inter-city train connections |
| `metro_routes.csv` | 40+ stations | Chennai metro network |
| `offices.csv` | 25+ locations | IT parks & business centers |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for Tamil Nadu travelers**

</div>
