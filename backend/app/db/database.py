"""SQLite database layer — replaces the flat users.json file.

Tables:
  users   — id, name, avatar, password_hash, created_at
  memory  — user_id (FK), key, value (JSON text)
  trips   — user_id (FK), date, intent, summary, destination

On first import the module:
  1. Creates the DB + tables if they don't exist.
  2. Migrates existing users.json data into SQLite (one-time).
"""

from __future__ import annotations

import json
import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path
from typing import Generator

from app.core.config import settings
from app.core.security import hash_password

DB_PATH = str(settings.DB_PATH)
_LEGACY_USERS_FILE = str(settings.BASE_DIR / "memory" / "users.json")

# ── Schema ────────────────────────────────────────────────────

_SCHEMA = """
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    avatar        TEXT NOT NULL DEFAULT 'U',
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS memory (
    user_id              TEXT PRIMARY KEY REFERENCES users(id),
    preferred_transport  TEXT,
    food_preference      TEXT,
    budget_range         TEXT,
    accommodation_type   TEXT,
    avoid                TEXT DEFAULT '[]',
    feedback_notes       TEXT DEFAULT '[]',
    updated_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trips (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     TEXT NOT NULL REFERENCES users(id),
    date        TEXT NOT NULL,
    intent      TEXT NOT NULL DEFAULT 'leisure_trip',
    summary     TEXT NOT NULL DEFAULT '',
    destination TEXT NOT NULL DEFAULT '',
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
"""


# ── Connection helper ─────────────────────────────────────────


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Yield a SQLite connection with row_factory set to dict-like rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db():
    """Create tables and migrate legacy data."""
    with get_db() as conn:
        conn.executescript(_SCHEMA)

    # One-time migration from users.json
    if os.path.exists(_LEGACY_USERS_FILE):
        _migrate_legacy_users()


# ── Migration ─────────────────────────────────────────────────


def _migrate_legacy_users():
    """Import users.json into SQLite (idempotent)."""
    try:
        with open(_LEGACY_USERS_FILE, encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return

    users_dict = data.get("users", {})
    if not users_dict:
        return

    with get_db() as conn:
        for uid, info in users_dict.items():
            # Skip if already migrated
            existing = conn.execute("SELECT id FROM users WHERE id = ?", (uid,)).fetchone()
            if existing:
                continue

            pw = info.get("password", "")
            pw_hash = hash_password(pw) if pw else hash_password(uid)

            conn.execute(
                "INSERT INTO users (id, name, avatar, password_hash) VALUES (?, ?, ?, ?)",
                (uid, info.get("name", uid), info.get("avatar", "U"), pw_hash),
            )

            mem = info.get("memory", {})
            conn.execute(
                """INSERT INTO memory
                   (user_id, preferred_transport, food_preference, budget_range,
                    accommodation_type, avoid, feedback_notes)
                   VALUES (?, ?, ?, ?, ?, ?, ?)""",
                (
                    uid,
                    mem.get("preferred_transport"),
                    mem.get("food_preference"),
                    mem.get("budget_range"),
                    mem.get("accommodation_type"),
                    json.dumps(mem.get("avoid", [])),
                    json.dumps(mem.get("feedback_notes", [])),
                ),
            )

            for trip in mem.get("past_trips", []):
                conn.execute(
                    "INSERT INTO trips (user_id, date, intent, summary) VALUES (?, ?, ?, ?)",
                    (uid, trip.get("date", ""), trip.get("intent", ""), trip.get("input", "")),
                )

    # Rename old file so migration doesn't repeat
    backup = _LEGACY_USERS_FILE + ".bak"
    if not os.path.exists(backup):
        os.rename(_LEGACY_USERS_FILE, backup)


# ── User CRUD ─────────────────────────────────────────────────


def get_user(user_id: str) -> dict | None:
    """Return user dict or None."""
    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def get_all_users() -> dict[str, dict]:
    """Return {user_id: {name, avatar, memory}} for all users."""
    result = {}
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM users").fetchall()
        for row in rows:
            uid = row["id"]
            result[uid] = {
                "name": row["name"],
                "avatar": row["avatar"],
                "memory": get_user_memory(uid),
            }
    return result


# ── Memory CRUD ───────────────────────────────────────────────

_DEFAULT_MEMORY = {
    "preferred_transport": None,
    "food_preference": None,
    "avoid": [],
    "budget_range": None,
    "accommodation_type": None,
    "past_trips": [],
    "feedback_notes": [],
}


def get_user_memory(user_id: str) -> dict:
    """Return the full memory dict for a user."""
    memory = dict(_DEFAULT_MEMORY)

    with get_db() as conn:
        row = conn.execute("SELECT * FROM memory WHERE user_id = ?", (user_id,)).fetchone()
        if row:
            memory["preferred_transport"] = row["preferred_transport"]
            memory["food_preference"] = row["food_preference"]
            memory["budget_range"] = row["budget_range"]
            memory["accommodation_type"] = row["accommodation_type"]
            memory["avoid"] = json.loads(row["avoid"] or "[]")
            memory["feedback_notes"] = json.loads(row["feedback_notes"] or "[]")

        trips = conn.execute(
            "SELECT date, intent, summary FROM trips WHERE user_id = ? ORDER BY date DESC LIMIT 10",
            (user_id,),
        ).fetchall()
        memory["past_trips"] = [
            {"date": t["date"], "intent": t["intent"], "input": t["summary"]}
            for t in trips
        ]

    return memory


def save_user_memory(user_id: str, memory: dict):
    """Upsert memory for a user."""
    with get_db() as conn:
        # Ensure user exists
        user = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not user:
            conn.execute(
                "INSERT INTO users (id, name, avatar, password_hash) VALUES (?, ?, ?, ?)",
                (user_id, user_id, "U", hash_password(user_id)),
            )

        conn.execute(
            """INSERT INTO memory (user_id, preferred_transport, food_preference,
                   budget_range, accommodation_type, avoid, feedback_notes, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
               ON CONFLICT(user_id) DO UPDATE SET
                   preferred_transport = excluded.preferred_transport,
                   food_preference = excluded.food_preference,
                   budget_range = excluded.budget_range,
                   accommodation_type = excluded.accommodation_type,
                   avoid = excluded.avoid,
                   feedback_notes = excluded.feedback_notes,
                   updated_at = datetime('now')""",
            (
                user_id,
                memory.get("preferred_transport"),
                memory.get("food_preference"),
                memory.get("budget_range"),
                memory.get("accommodation_type"),
                json.dumps(memory.get("avoid", [])),
                json.dumps(memory.get("feedback_notes", [])),
            ),
        )


def add_trip(user_id: str, intent: str, summary: str, destination: str = ""):
    """Record a trip in the trips table."""
    with get_db() as conn:
        conn.execute(
            "INSERT INTO trips (user_id, date, intent, summary, destination) VALUES (?, ?, ?, ?, ?)",
            (user_id, datetime.now().strftime("%Y-%m-%d %H:%M"), intent, summary, destination),
        )


def save_feedback(user_id: str, feedback: str, section: str = "general"):
    """Append a feedback note to the user's memory."""
    with get_db() as conn:
        row = conn.execute("SELECT feedback_notes FROM memory WHERE user_id = ?", (user_id,)).fetchone()
        notes = json.loads(row["feedback_notes"]) if row else []
        notes.append(f"[{section}] {feedback}")
        notes = notes[-20:]  # keep last 20
        conn.execute(
            "UPDATE memory SET feedback_notes = ?, updated_at = datetime('now') WHERE user_id = ?",
            (json.dumps(notes), user_id),
        )


# ── Auth ──────────────────────────────────────────────────────


def authenticate_user(username: str, password: str) -> dict | None:
    """Verify credentials. Returns user dict or None."""
    from app.core.security import verify_password

    with get_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (username.lower(),)).fetchone()
        if not row:
            return None
        if not verify_password(password, row["password_hash"]):
            return None
        return {"id": row["id"], "name": row["name"], "avatar": row["avatar"]}


# ── Initialize on import ─────────────────────────────────────
init_db()
