# config.py — Horizon Hopper shared config
import os
from dotenv import load_dotenv
load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
MODEL = "llama-3.3-70b-versatile"
MEMORY_FILE = os.path.join(os.path.dirname(__file__), "memory/user_memory.json")

INTENT_LABELS = ["office_commute", "business_trip", "job_interview", "leisure_trip"]

CHENNAI_AREAS = [
    "Tambaram", "Velachery", "OMR", "Guindy", "Tidel Park",
    "Siruseri", "Mahabalipuram", "T. Nagar", "Egmore", "Anna Nagar",
    "Adyar", "Perungudi", "Sholinganallur", "Chrompet", "Pallavaram"
]
