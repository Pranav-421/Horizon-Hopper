"""Centralized application settings — loaded from .env + environment."""

from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ── Paths ──
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = BASE_DIR / "data"
    DB_PATH: Path = BASE_DIR / "horizon_hopper.db"

    # ── LLM ──
    GROQ_API_KEY: str = ""
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    # ── JWT Auth ──
    JWT_SECRET: str = "horizon-hopper-secret-change-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_HOURS: int = 24

    # ── App ──
    APP_NAME: str = "Horizon Hopper"
    DEBUG: bool = False

    INTENT_LABELS: list[str] = [
        "office_commute", "business_trip", "job_interview", "leisure_trip"
    ]

    model_config = {"env_file": ".env", "extra": "ignore"}


settings = Settings()

# ── Backward-compatible module-level exports ──────────────────
# Existing agents import these directly:
#   from app.core.config import GROQ_API_KEY, MODEL, INTENT_LABELS
GROQ_API_KEY = settings.GROQ_API_KEY
MODEL = settings.LLM_MODEL
INTENT_LABELS = settings.INTENT_LABELS
CHENNAI_AREAS = [
    "Tambaram", "Velachery", "OMR", "Guindy", "Tidel Park",
    "Siruseri", "Mahabalipuram", "T. Nagar", "Egmore", "Anna Nagar",
    "Adyar", "Perungudi", "Sholinganallur", "Chrompet", "Pallavaram",
]
