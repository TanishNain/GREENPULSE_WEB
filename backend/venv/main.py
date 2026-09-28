import os
import sqlite3
import hashlib
import secrets
import json
import urllib.parse
import urllib.request

from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

import psycopg
from psycopg.rows import dict_row

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


# ============================================================
# GREEN PULSE — BACKEND
# ============================================================

app = FastAPI(title="GreenPulse API")


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://greenpulse-75vr7v1hf-green-pulse3.vercel.app",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL PRESENT:", bool(DATABASE_URL))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB = os.path.join(BASE_DIR, "greenpulse.db")


class PostgresConnection:
    # Small compatibility wrapper so existing SQLite-style
    # SQL can continue using ? placeholders with PostgreSQL.

    def __init__(self, connection):
        self.connection = connection

    def execute(self, query, params=()):
        query = query.replace("?", "%s")
        return self.connection.execute(query, params)

    def executemany(self, query, params_list):
        query = query.replace("?", "%s")
        return self.connection.executemany(query, params_list)

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


def get_db():
    # Supabase PostgreSQL is PRIMARY whenever DATABASE_URL exists.
    # SQLite remains the local fallback/reserve database.

    if DATABASE_URL:
        connection = psycopg.connect(
            DATABASE_URL,
            row_factory=dict_row,
        )
        return PostgresConnection(connection)

    connection = sqlite3.connect(
        SQLITE_DB,
        check_same_thread=False,
    )

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# INDIA TIME
# ============================================================

INDIA_TZ = ZoneInfo("Asia/Kolkata")


def india_now():
    return datetime.now(INDIA_TZ)


def india_now_iso():
    return india_now().isoformat()


def india_today():
    return india_now().date().isoformat()


# ============================================================
# SEASONS
# ============================================================

SEASONS = [
    {
        "id": "spring",
        "name": "Spring",
        "icon": "🌸",
        "description": (
            "Fresh growth, gentle sunlight and new life "
            "begin to appear across the forest."
        ),
        "months": [2, 3],
    },
    {
        "id": "summer",
        "name": "Summer",
        "icon": "☀️",
        "description": (
            "Longer days bring brighter light, warmer air "
            "and a fuller green canopy."
        ),
        "months": [4, 5, 6],
    },
    {
        "id": "monsoon",
        "name": "Monsoon",
        "icon": "🌧️",
        "description": (
            "Rain feeds the forest, deepens the greens and "
            "brings a richer living atmosphere."
        ),
        "months": [7, 8, 9],
    },
    {
        "id": "autumn",
        "name": "Autumn",
        "icon": "🍂",
        "description": (
            "The rains ease and the forest settles into "
            "warmer, earthy tones."
        ),
        "months": [10, 11],
    },
    {
        "id": "winter",
        "name": "Winter",
        "icon": "❄️",
        "description": (
            "Cooler air, softer light and morning mist give "
            "the forest a calm winter character."
        ),
        "months": [12, 1],
    },
]


def get_current_season(current_date=None):
    # Returns the current Indian seasonal environment.
    #
    # Seasons are broad environmental phases rather than
    # strict meteorological classifications. Real weather
    # controls the actual daily atmosphere.

    if current_date is None:
        current_date = india_now().date()

    month = current_date.month

    for season in SEASONS:
        if month in season["months"]:
            return season

    return SEASONS[0]


def get_season_progress(current_date=None):
    # Returns approximate progress through the current season.
    #
    # This is visual metadata for the Forest.
    # It does not affect points, badges or user progression.

    if current_date is None:
        current_date = india_now().date()

    year = current_date.year
    month = current_date.month

    if month == 1:
        start = datetime(year, 1, 1).date()
        end = datetime(year, 1, 31).date()

    elif month in (2, 3):
        start = datetime(year, 2, 1).date()
        end = datetime(year, 3, 31).date()

    elif month in (4, 5, 6):
        start = datetime(year, 4, 1).date()
        end = datetime(year, 6, 30).date()

    elif month in (7, 8, 9):
        start = datetime(year, 7, 1).date()
        end = datetime(year, 9, 30).date()

    elif month in (10, 11):
        start = datetime(year, 10, 1).date()
        end = datetime(year, 11, 30).date()

    else:
        start = datetime(year, 12, 1).date()
        end = datetime(year + 1, 1, 31).date()

    total_days = max(
        1,
        (end - start).days + 1,
    )

    elapsed_days = (
        current_date - start
    ).days + 1

    progress = (
        elapsed_days / total_days
    ) * 100

    return max(
        0,
        min(100, round(progress)),
    )


# ============================================================
# PASSWORD HASHING
# ============================================================

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    derived = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
    )

    return (
        "scrypt$"
        + salt.hex()
        + "$"
        + derived.hex()
    )


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_hex, hash_hex = stored_hash.split("$")

        if algorithm != "scrypt":
            return False

        salt = bytes.fromhex(salt_hex)

        derived = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=16384,
            r=8,
            p=1,
        )

        return secrets.compare_digest(
            derived.hex(),
            hash_hex,
        )

    except Exception:
        return False


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():
    db = get_db()

    try:
        if DATABASE_URL:
            db.execute(
                "CREATE TABLE IF NOT EXISTS users ("
                "id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "
                "username TEXT NOT NULL UNIQUE, "
                "password_hash TEXT NOT NULL, "
                "role TEXT NOT NULL DEFAULT 'user' "
                "CHECK (role IN ('user', 'admin')), "
                "created_at TEXT NOT NULL, "
                "points INTEGER NOT NULL DEFAULT 0, "
                "streak INTEGER NOT NULL DEFAULT 0, "
                "level INTEGER NOT NULL DEFAULT 1, "
                "forest_actions INTEGER NOT NULL DEFAULT 0"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS sessions ("
                "token TEXT PRIMARY KEY, "
                "user_id BIGINT NOT NULL REFERENCES users(id), "
                "created_at TEXT NOT NULL"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS reviews ("
                "id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "
                "name TEXT NOT NULL, "
                "rating INTEGER NOT NULL "
                "CHECK (rating >= 1 AND rating <= 5), "
                "review TEXT NOT NULL, "
                "created_at TEXT NOT NULL, "
                "owner_token TEXT"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS challenge_completions ("
                "id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, "
                "user_id BIGINT NOT NULL REFERENCES users(id), "
                "challenge_id TEXT NOT NULL, "
                "challenge_date TEXT NOT NULL, "
                "completed_at TEXT NOT NULL, "
                "points INTEGER NOT NULL, "
                "UNIQUE(user_id, challenge_date)"
                ")"
            )

        else:
            db.execute(
                "CREATE TABLE IF NOT EXISTS users ("
                "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                "username TEXT NOT NULL UNIQUE, "
                "password_hash TEXT NOT NULL, "
                "role TEXT NOT NULL DEFAULT 'user' "
                "CHECK (role IN ('user', 'admin')), "
                "created_at TEXT NOT NULL, "
                "points INTEGER NOT NULL DEFAULT 0, "
                "streak INTEGER NOT NULL DEFAULT 0, "
                "level INTEGER NOT NULL DEFAULT 1, "
                "forest_actions INTEGER NOT NULL DEFAULT 0"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS sessions ("
                "token TEXT PRIMARY KEY, "
                "user_id INTEGER NOT NULL, "
                "created_at TEXT NOT NULL"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS reviews ("
                "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                "name TEXT NOT NULL, "
                "rating INTEGER NOT NULL "
                "CHECK (rating >= 1 AND rating <= 5), "
                "review TEXT NOT NULL, "
                "created_at TEXT NOT NULL, "
                "owner_token TEXT"
                ")"
            )

            db.execute(
                "CREATE TABLE IF NOT EXISTS challenge_completions ("
                "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                "user_id INTEGER NOT NULL, "
                "challenge_id TEXT NOT NULL, "
                "challenge_date TEXT NOT NULL, "
                "completed_at TEXT NOT NULL, "
                "points INTEGER NOT NULL, "
                "UNIQUE(user_id, challenge_date)"
                ")"
            )

        db.commit()

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


init_db()


# ============================================================
# REQUEST MODELS
# ============================================================

class Review(BaseModel):
    name: str
    rating: int
    review: str
    owner_token: str | None = None


class ReviewUpdate(BaseModel):
    token: str
    review_id: int
    name: str
    rating: int
    review: str


class ReviewDelete(BaseModel):
    token: str
    review_id: int


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class ChallengeCompleteRequest(BaseModel):
    token: str
    challenge_id: str


# ============================================================
# DAILY CHALLENGES
# ============================================================

CHALLENGES = [
    {
        "id": "electricity_switch_off",
        "category": "Electricity",
        "icon": "💡",
        "points": 10,
        "forest_points": 1,
        "title": "Switch off what you don't need",
        "description": (
            "Reduce unnecessary electricity use in your room, "
            "classroom, hostel or home."
        ),
        "action": (
            "Before leaving a room, switch off lights, fans and "
            "other appliances that are not needed."
        ),
    },
    {
        "id": "water_wise",
        "category": "Water",
        "icon": "💧",
        "points": 10,
        "forest_points": 1,
        "title": "Use water consciously",
        "description": (
            "Make one deliberate water-saving choice today."
        ),
        "action": (
            "Turn off the tap while brushing or washing and "
            "avoid letting clean water run unnecessarily."
        ),
    },
    {
        "id": "food_no_waste",
        "category": "Food",
        "icon": "🍽️",
        "points": 10,
        "forest_points": 1,
        "title": "Finish what you take",
        "description": (
            "Food waste carries the footprint of everything "
            "used to produce and deliver that food."
        ),
        "action": (
            "Take only as much food as you realistically plan "
            "to eat."
        ),
    },
    {
        "id": "transport_walk",
        "category": "Transport",
        "icon": "🚶",
        "points": 15,
        "forest_points": 1,
        "title": "Choose a low-carbon trip",
        "description": (
            "Replace one short motorised journey with a lower-"
            "carbon option."
        ),
        "action": (
            "Walk, cycle or use shared/public transport for one "
            "short journey where practical."
        ),
    },
    {
        "id": "lpg_efficient",
        "category": "LPG / Cooking",
        "icon": "🔥",
        "points": 10,
        "forest_points": 1,
        "title": "Cook efficiently",
        "description": (
            "Use cooking energy carefully without requiring "
            "you to measure LPG consumption."
        ),
        "action": (
            "Use an appropriate flame and keep the vessel covered "
            "when practical."
        ),
    },
    {
        "id": "waste_reduce",
        "category": "Waste",
        "icon": "♻️",
        "points": 10,
        "forest_points": 1,
        "title": "Avoid one unnecessary disposable",
        "description": (
            "Prevent one avoidable piece of disposable waste today."
        ),
        "action": (
            "Choose a reusable bottle, cup, bag or container "
            "instead of a disposable alternative."
        ),
    },
    {
        "id": "nature_action",
        "category": "Forest / Nature",
        "icon": "🌿",
        "points": 15,
        "forest_points": 2,
        "title": "Give nature some attention",
        "description": (
            "Take one practical action that supports the natural "
            "environment around you."
        ),
        "action": (
            "Care for a plant, protect a green space or spend "
            "a few minutes observing and appreciating nature."
        ),
    },
    {
        "id": "carbon_choice",
        "category": "Carbon Reduction",
        "icon": "🌍",
        "points": 15,
        "forest_points": 2,
        "title": "Make one lower-carbon choice",
        "description": (
            "Make a conscious choice that reduces unnecessary "
            "resource use or emissions."
        ),
        "action": (
            "Choose the lower-impact option when you have a "
            "realistic choice today."
        ),
    },
]


def get_today_challenge():
    # Everyone receives the same challenge for the same
    # Indian calendar date.

    today = india_now().date()

    seed = int(
        today.strftime("%Y%m%d")
    )

    index = seed % len(CHALLENGES)

    return CHALLENGES[index]


def get_level_from_points(points: int) -> int:
    return max(
        1,
        (points // 100) + 1,
    )


def challenge_already_completed(
    db,
    user_id: int,
    challenge_date: str,
):
    row = db.execute(
        "SELECT * "
        "FROM challenge_completions "
        "WHERE user_id = ? "
        "AND challenge_date = ? "
        "LIMIT 1",
        (
            user_id,
            challenge_date,
        ),
    ).fetchone()

    return row


# ============================================================
# FOREST BADGES
# ============================================================

FOREST_BADGES = [
    {
        "id": "first_step",
        "name": "First Step",
        "icon": "🌱",
        "description": "Complete your first GreenPulse challenge.",
        "type": "challenge_count",
        "requirement": 1,
    },
    {
        "id": "growing",
        "name": "Growing",
        "icon": "🌿",
        "description": "Complete 3 GreenPulse challenges.",
        "type": "challenge_count",
        "requirement": 3,
    },
    {
        "id": "consistent",
        "name": "Consistent",
        "icon": "🔥",
        "description": "Reach a 7-day challenge streak.",
        "type": "streak",
        "requirement": 7,
    },
    {
        "id": "forest_friend",
        "name": "Forest Friend",
        "icon": "🐦",
        "description": "Complete 15 GreenPulse challenges.",
        "type": "challenge_count",
        "requirement": 15,
    },
    {
        "id": "deep_explorer",
        "name": "Deep Explorer",
        "icon": "🌲",
        "description": "Complete 30 GreenPulse challenges.",
        "type": "challenge_count",
        "requirement": 30,
    },
    {
        "id": "ecosystem_builder",
        "name": "Ecosystem Builder",
        "icon": "💧",
        "description": "Complete 50 GreenPulse challenges.",
        "type": "challenge_count",
        "requirement": 50,
    },
    {
        "id": "forest_guardian",
        "name": "Forest Guardian",
        "icon": "🌳",
        "description": "Complete 100 GreenPulse challenges.",
        "type": "challenge_count",
        "requirement": 100,
    },
    {
        "id": "electricity_guardian",
        "name": "Energy Guardian",
        "icon": "⚡",
        "description": "Complete 5 electricity challenges.",
        "type": "category_count",
        "category": "Electricity",
        "requirement": 5,
    },
    {
        "id": "water_guardian",
        "name": "Water Guardian",
        "icon": "💧",
        "description": "Complete 5 water challenges.",
        "type": "category_count",
        "category": "Water",
        "requirement": 5,
    },
    {
        "id": "food_guardian",
        "name": "Food Guardian",
        "icon": "🍎",
        "description": "Complete 5 food challenges.",
        "type": "category_count",
        "category": "Food",
        "requirement": 5,
    },
    {
        "id": "transport_guardian",
        "name": "Low-Carbon Traveller",
        "icon": "🚲",
        "description": "Complete 5 transport challenges.",
        "type": "category_count",
        "category": "Transport",
        "requirement": 5,
    },
    {
        "id": "waste_guardian",
        "name": "Waste Reducer",
        "icon": "♻️",
        "description": "Complete 5 waste challenges.",
        "type": "category_count",
        "category": "Waste",
        "requirement": 5,
    },
]


# ============================================================
# FOREST STAGES
# ============================================================

FOREST_STAGES = [
    {
        "id": "seedling",
        "name": "Seedling",
        "icon": "🌱",
        "minimum_actions": 0,
        "description": (
            "Your forest begins with a single living seed."
        ),
        "unlocks": [
            "basic_forest",
            "soft_wind",
        ],
    },
    {
        "id": "young_forest",
        "name": "Young Forest",
        "icon": "🌿",
        "minimum_actions": 3,
        "description": (
            "New plants begin appearing around your first growth."
        ),
        "unlocks": [
            "young_forest",
            "birds",
        ],
    },
    {
        "id": "growing_forest",
        "name": "Growing Forest",
        "icon": "🌳",
        "minimum_actions": 7,
        "description": (
            "The forest becomes denser as your actions accumulate."
        ),
        "unlocks": [
            "growing_forest",
            "insects",
            "flowers",
        ],
    },
    {
        "id": "deep_forest",
        "name": "Deep Forest",
        "icon": "🌲",
        "minimum_actions": 30,
        "description": (
            "The path now reaches deeper into the forest."
        ),
        "unlocks": [
            "deep_forest",
            "wildlife",
            "deep_ambience",
        ],
    },
    {
        "id": "ecosystem",
        "name": "Thriving Ecosystem",
        "icon": "💧",
        "minimum_actions": 50,
        "description": (
            "A living ecosystem begins to form around the forest."
        ),
        "unlocks": [
            "stream",
            "full_ecosystem",
        ],
    },
    {
        "id": "guardian_forest",
        "name": "Forest Guardian",
        "icon": "🌌",
        "minimum_actions": 100,
        "description": (
            "Your long-term actions have transformed the forest."
        ),
        "unlocks": [
            "advanced_ecosystem",
            "rare_wildlife",
            "night_ecosystem",
        ],
    },
]


# ============================================================
# FOREST PROGRESSION HELPERS
# ============================================================

def get_completed_challenge_count(db, user_id: int):
    row = db.execute(
        "SELECT COUNT(*) AS count "
        "FROM challenge_completions "
        "WHERE user_id = ?",
        (user_id,),
    ).fetchone()

    return int(
        row["count"]
        if row
        else 0
    )


def get_category_counts(db, user_id: int):
    rows = db.execute(
        "SELECT challenge_id, COUNT(*) AS count "
        "FROM challenge_completions "
        "WHERE user_id = ? "
        "GROUP BY challenge_id",
        (user_id,),
    ).fetchall()

    category_counts = {
        challenge["category"]: 0
        for challenge in CHALLENGES
    }

    challenge_map = {
        challenge["id"]: challenge["category"]
        for challenge in CHALLENGES
    }

    for row in rows:
        challenge_id = row["challenge_id"]
        count = int(row["count"])

        category = challenge_map.get(
            challenge_id
        )

        if category:
            category_counts[category] = count

    return category_counts


def get_forest_stage(forest_actions: int):
    current = FOREST_STAGES[0]
    next_stage = None

    for stage in FOREST_STAGES:
        if forest_actions >= stage["minimum_actions"]:
            current = stage
        elif next_stage is None:
            next_stage = stage

    if next_stage:
        previous_requirement = current["minimum_actions"]
        next_requirement = next_stage["minimum_actions"]

        span = (
            next_requirement
            - previous_requirement
        )

        if span <= 0:
            progress = 100
        else:
            progress = (
                (
                    forest_actions
                    - previous_requirement
                )
                / span
            ) * 100

        progress = max(
            0,
            min(100, round(progress)),
        )

    else:
        progress = 100

    return (
        current,
        next_stage,
        progress,
    )


def get_unlocked_features(
    forest_actions: int,
    streak: int,
):
    unlocked = set()

    for stage in FOREST_STAGES:
        if forest_actions >= stage["minimum_actions"]:
            unlocked.update(
                stage["unlocks"]
            )

    if forest_actions >= 3:
        unlocked.add("birds")

    if streak >= 7:
        unlocked.add("insects")

    if forest_actions >= 15:
        unlocked.add("wildlife")

    if forest_actions >= 30:
        unlocked.add("deep_ambience")

    if forest_actions >= 50:
        unlocked.add("stream")

    if forest_actions >= 100:
        unlocked.add("full_ecosystem")

    return sorted(unlocked)


def get_badges(
    db,
    user_id: int,
    challenge_count: int,
    streak: int,
):
    category_counts = get_category_counts(
        db,
        user_id,
    )

    badges = []

    for badge in FOREST_BADGES:
        earned = False
        current_value = 0

        if badge["type"] == "challenge_count":
            current_value = challenge_count
            earned = (
                challenge_count
                >= badge["requirement"]
            )

        elif badge["type"] == "streak":
            current_value = streak
            earned = (
                streak
                >= badge["requirement"]
            )

        elif badge["type"] == "category_count":
            current_value = category_counts.get(
                badge["category"],
                0,
            )

            earned = (
                current_value
                >= badge["requirement"]
            )

        badges.append(
            {
                **badge,
                "earned": earned,
                "current_value": current_value,
            }
        )

    return badges


def get_forest_payload(db, user):
    user_id = int(user["id"])

    challenge_count = get_completed_challenge_count(
        db,
        user_id,
    )

    forest_actions = int(
        user["forest_actions"] or 0
    )

    streak = int(
        user["streak"] or 0
    )

    stage, next_stage, stage_progress = get_forest_stage(
        forest_actions
    )

    unlocked = get_unlocked_features(
        forest_actions,
        streak,
    )

    badges = get_badges(
        db,
        user_id,
        challenge_count,
        streak,
    )

    earned_badges = [
        badge
        for badge in badges
        if badge["earned"]
    ]

    if next_stage:
        next_unlock = {
            "name": next_stage["name"],
            "icon": next_stage["icon"],
            "required_actions": next_stage["minimum_actions"],
            "remaining_actions": max(
                0,
                next_stage["minimum_actions"]
                - forest_actions,
            ),
        }
    else:
        next_unlock = None

    return {
        "forest_actions": forest_actions,
        "challenge_count": challenge_count,
        "streak": streak,
        "stage": {
            "id": stage["id"],
            "name": stage["name"],
            "icon": stage["icon"],
            "description": stage["description"],
            "minimum_actions": stage["minimum_actions"],
        },
        "stage_progress": stage_progress,
        "unlocked": unlocked,
        "next_unlock": next_unlock,
        "badges": badges,
        "earned_badges": earned_badges,
        "earned_badge_count": len(earned_badges),
        "total_badge_count": len(badges),
    }


# ============================================================
# WEATHER
# ============================================================

def weather_code_to_condition(weather_code: int):
    # Open-Meteo WMO weather interpretation.

    if weather_code == 0:
        return "clear"

    if weather_code in (1, 2):
        return "partly_cloudy"

    if weather_code == 3:
        return "cloudy"

    if weather_code in (45, 48):
        return "fog"

    if weather_code in (51, 53, 55, 56, 57):
        return "drizzle"

    if weather_code in (61, 63, 65, 66, 67):
        return "rain"

    if weather_code in (71, 73, 75, 77):
        return "snow"

    if weather_code in (80, 81, 82):
        return "showers"

    if weather_code in (85, 86):
        return "snow_showers"

    if weather_code in (95, 96, 99):
        return "thunderstorm"

    return "cloudy"


def get_time_of_day(latitude: float, longitude: float):
    # Helper reserved for future Forest improvements.

    return {
        "latitude": latitude,
        "longitude": longitude,
    }


# ============================================================
# AUTH HELPERS
# ============================================================

def get_current_user(db, token: str):
    if not token:
        return None

    row = db.execute(
        "SELECT "
        "users.id, "
        "users.username, "
        "users.role, "
        "users.created_at, "
        "users.points, "
        "users.streak, "
        "users.level, "
        "users.forest_actions "
        "FROM sessions "
        "JOIN users "
        "ON users.id = sessions.user_id "
        "WHERE sessions.token = ? "
        "LIMIT 1",
        (token,),
    ).fetchone()

    return row


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "name": "GreenPulse API",
        "status": "online",
    }


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "database": (
            "supabase-postgresql"
            if DATABASE_URL
            else "sqlite-fallback"
        ),
    }


@app.get("/api/impact")
def impact():
    return {
        "message": "GreenPulse impact API is online."
    }


# ============================================================
# AUTH — REGISTER
# ============================================================

@app.post("/api/register")
def register(request: RegisterRequest):
    username = request.username.strip()

    if len(username) < 2:
        raise HTTPException(
            status_code=400,
            detail="Username must contain at least 2 characters.",
        )

    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters.",
        )

    db = get_db()

    try:
        existing = db.execute(
            "SELECT id "
            "FROM users "
            "WHERE LOWER(username) = LOWER(?) "
            "LIMIT 1",
            (username,),
        ).fetchone()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Username already exists.",
            )

        password_hash = hash_password(
            request.password
        )

        created_at = india_now_iso()

        if DATABASE_URL:
            row = db.execute(
                "INSERT INTO users ("
                "username, "
                "password_hash, "
                "role, "
                "created_at, "
                "points, "
                "streak, "
                "level, "
                "forest_actions"
                ") "
                "VALUES (?, ?, 'user', ?, 0, 0, 1, 0) "
                "RETURNING id, username, role",
                (
                    username,
                    password_hash,
                    created_at,
                ),
            ).fetchone()

        else:
            cursor = db.execute(
                "INSERT INTO users ("
                "username, "
                "password_hash, "
                "role, "
                "created_at, "
                "points, "
                "streak, "
                "level, "
                "forest_actions"
                ") "
                "VALUES (?, ?, 'user', ?, 0, 0, 1, 0)",
                (
                    username,
                    password_hash,
                    created_at,
                ),
            )

            row = {
                "id": cursor.lastrowid,
                "username": username,
                "role": "user",
            }

        db.commit()

        return {
            "message": "Registration successful.",
            "user": dict(row),
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "REGISTER ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to register user.",
        )

    finally:
        db.close()


# ============================================================
# AUTH — LOGIN
# ============================================================

@app.post("/api/login")
def login(request: LoginRequest):
    username = request.username.strip()

    db = get_db()

    try:
        row = db.execute(
            "SELECT * "
            "FROM users "
            "WHERE LOWER(username) = LOWER(?) "
            "LIMIT 1",
            (username,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password.",
            )

        if not verify_password(
            request.password,
            row["password_hash"],
        ):
            raise HTTPException(
                status_code=401,
                detail="Invalid username or password.",
            )

        token = secrets.token_urlsafe(32)

        db.execute(
            "INSERT INTO sessions ("
            "token, "
            "user_id, "
            "created_at"
            ") "
            "VALUES (?, ?, ?)",
            (
                token,
                row["id"],
                india_now_iso(),
            ),
        )

        db.commit()

        return {
            "token": token,
            "user": {
                "id": row["id"],
                "username": row["username"],
                "role": row["role"],
            },
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "LOGIN ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to login.",
        )

    finally:
        db.close()


# ============================================================
# AUTH — ME
# ============================================================

@app.get("/api/me")
def me(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid or expired session.",
            )

        return {
            "user": dict(user),
        }

    finally:
        db.close()


# ============================================================
# AUTH — LOGOUT
# ============================================================

@app.post("/api/logout")
def logout(token: str):
    db = get_db()

    try:
        db.execute(
            "DELETE FROM sessions "
            "WHERE token = ?",
            (token,),
        )

        db.commit()

        return {
            "message": "Logged out successfully."
        }

    finally:
        db.close()


# ============================================================
# REVIEWS — GET
# ============================================================

@app.get("/api/reviews")
def get_reviews():
    db = get_db()

    try:
        rows = db.execute(
            "SELECT "
            "id, "
            "name, "
            "rating, "
            "review, "
            "created_at "
            "FROM reviews "
            "ORDER BY id DESC"
        ).fetchall()

        return [
            dict(row)
            for row in rows
        ]

    finally:
        db.close()


# ============================================================
# REVIEWS — CREATE
# ============================================================

@app.post("/api/reviews")
def create_review(review: Review):
    if review.rating < 1 or review.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5.",
        )

    if not review.name.strip():
        raise HTTPException(
            status_code=400,
            detail="Name is required.",
        )

    if not review.review.strip():
        raise HTTPException(
            status_code=400,
            detail="Review cannot be empty.",
        )

    db = get_db()

    try:
        db.execute(
            "INSERT INTO reviews ("
            "name, "
            "rating, "
            "review, "
            "created_at, "
            "owner_token"
            ") "
            "VALUES (?, ?, ?, ?, ?)",
            (
                review.name.strip(),
                review.rating,
                review.review.strip(),
                india_now_iso(),
                review.owner_token,
            ),
        )

        db.commit()

        return {
            "message": "Review submitted successfully."
        }

    except Exception as error:
        db.rollback()

        print(
            "CREATE REVIEW ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save review.",
        )

    finally:
        db.close()


# ============================================================
# REVIEWS — UPDATE
# ============================================================

@app.put("/api/reviews")
def update_review(request: ReviewUpdate):
    if request.rating < 1 or request.rating > 5:
        raise HTTPException(
            status_code=400,
            detail="Rating must be between 1 and 5.",
        )

    db = get_db()

    try:
        current_user = get_current_user(
            db,
            request.token,
        )

        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        row = db.execute(
            "SELECT * "
            "FROM reviews "
            "WHERE id = ? "
            "LIMIT 1",
            (request.review_id,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Review not found.",
            )

        owner_token = row["owner_token"]

        is_owner = (
            owner_token
            and owner_token == request.token
        )

        is_admin = (
            current_user["role"] == "admin"
        )

        if not is_owner and not is_admin:
            raise HTTPException(
                status_code=403,
                detail="You cannot edit this review.",
            )

        db.execute(
            "UPDATE reviews "
            "SET "
            "name = ?, "
            "rating = ?, "
            "review = ? "
            "WHERE id = ?",
            (
                request.name.strip(),
                request.rating,
                request.review.strip(),
                request.review_id,
            ),
        )

        db.commit()

        return {
            "message": "Review updated successfully."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "UPDATE REVIEW ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to update review.",
        )

    finally:
        db.close()


# ============================================================
# REVIEWS — DELETE
# ============================================================

@app.delete("/api/reviews")
def delete_review(request: ReviewDelete):
    db = get_db()

    try:
        current_user = get_current_user(
            db,
            request.token,
        )

        if not current_user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        row = db.execute(
            "SELECT * "
            "FROM reviews "
            "WHERE id = ? "
            "LIMIT 1",
            (request.review_id,),
        ).fetchone()

        if not row:
            raise HTTPException(
                status_code=404,
                detail="Review not found.",
            )

        owner_token = row["owner_token"]

        is_owner = (
            owner_token
            and owner_token == request.token
        )

        is_admin = (
            current_user["role"] == "admin"
        )

        if not is_owner and not is_admin:
            raise HTTPException(
                status_code=403,
                detail="You cannot delete this review.",
            )

        db.execute(
            "DELETE FROM reviews "
            "WHERE id = ?",
            (request.review_id,),
        )

        db.commit()

        return {
            "message": "Review deleted successfully."
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "DELETE REVIEW ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to delete review.",
        )

    finally:
        db.close()


# ============================================================
# DAILY CHALLENGE — TODAY
# ============================================================

@app.get("/api/challenges/today")
def challenge_today(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        today = india_today()

        challenge = get_today_challenge()

        completion = challenge_already_completed(
            db,
            user["id"],
            today,
        )

        return {
            "date": today,
            "challenge": challenge,
            "completed": bool(completion),
            "completion": (
                dict(completion)
                if completion
                else None
            ),
        }

    finally:
        db.close()


# ============================================================
# DAILY CHALLENGE — COMPLETE
# ============================================================

@app.post("/api/challenges/complete")
def complete_challenge(
    request: ChallengeCompleteRequest,
):
    db = get_db()

    try:
        user = get_current_user(
            db,
            request.token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        challenge = next(
            (
                item
                for item in CHALLENGES
                if item["id"] == request.challenge_id
            ),
            None,
        )

        if not challenge:
            raise HTTPException(
                status_code=404,
                detail="Challenge not found.",
            )

        today = india_today()

        existing = challenge_already_completed(
            db,
            user["id"],
            today,
        )

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Today's challenge is already completed.",
            )

        # ----------------------------------------------------
        # STREAK
        # ----------------------------------------------------

        current_streak = int(
            user["streak"] or 0
        )

        previous_completion = db.execute(
            "SELECT challenge_date "
            "FROM challenge_completions "
            "WHERE user_id = ? "
            "ORDER BY challenge_date DESC "
            "LIMIT 1",
            (user["id"],),
        ).fetchone()

        if previous_completion:
            previous_date = datetime.strptime(
                previous_completion["challenge_date"],
                "%Y-%m-%d",
            ).date()

            today_date = india_now().date()

            if previous_date == (
                today_date
                - timedelta(days=1)
            ):
                new_streak = (
                    current_streak + 1
                )
            else:
                new_streak = 1

        else:
            new_streak = 1

        # ----------------------------------------------------
        # PROGRESS
        # ----------------------------------------------------

        current_points = int(
            user["points"] or 0
        )

        current_forest_actions = int(
            user["forest_actions"] or 0
        )

        new_points = (
            current_points
            + challenge["points"]
        )

        new_forest_actions = (
            current_forest_actions
            + challenge["forest_points"]
        )

        new_level = get_level_from_points(
            new_points
        )

        completed_at = india_now_iso()

        # ----------------------------------------------------
        # SAVE CHALLENGE COMPLETION
        # ----------------------------------------------------

        db.execute(
            "INSERT INTO challenge_completions ("
            "user_id, "
            "challenge_id, "
            "challenge_date, "
            "completed_at, "
            "points"
            ") "
            "VALUES (?, ?, ?, ?, ?)",
            (
                user["id"],
                challenge["id"],
                today,
                completed_at,
                challenge["points"],
            ),
        )

        # ----------------------------------------------------
        # UPDATE USER PROGRESS
        # ----------------------------------------------------

        db.execute(
            "UPDATE users "
            "SET "
            "points = ?, "
            "streak = ?, "
            "level = ?, "
            "forest_actions = ? "
            "WHERE id = ?",
            (
                new_points,
                new_streak,
                new_level,
                new_forest_actions,
                user["id"],
            ),
        )

        db.commit()

        return {
            "message": "Challenge completed.",
            "challenge": challenge,
            "progress": {
                "points": new_points,
                "streak": new_streak,
                "level": new_level,
                "forest_actions": new_forest_actions,
            },
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as error:
        db.rollback()

        print(
            "CHALLENGE COMPLETION ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to complete challenge.",
        )

    finally:
        db.close()


# ============================================================
# CHALLENGE HISTORY
# ============================================================

@app.get("/api/challenges/history")
def challenge_history(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        rows = db.execute(
            "SELECT "
            "challenge_id, "
            "challenge_date, "
            "completed_at, "
            "points "
            "FROM challenge_completions "
            "WHERE user_id = ? "
            "ORDER BY challenge_date DESC",
            (user["id"],),
        ).fetchall()

        challenge_map = {
            challenge["id"]: challenge
            for challenge in CHALLENGES
        }

        history = []

        for row in rows:
            challenge = challenge_map.get(
                row["challenge_id"]
            )

            history.append(
                {
                    "challenge_id": row["challenge_id"],
                    "challenge_date": row["challenge_date"],
                    "completed_at": row["completed_at"],
                    "points": row["points"],
                    "challenge": challenge,
                }
            )

        return {
            "history": history,
            "count": len(history),
        }

    finally:
        db.close()


# ============================================================
# FOREST — REAL PROGRESS
# ============================================================

@app.get("/api/forest")
def forest(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        return get_forest_payload(
            db,
            user,
        )

    finally:
        db.close()


# ============================================================
# FOREST — BADGES ONLY
# ============================================================

@app.get("/api/forest/badges")
def forest_badges(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        payload = get_forest_payload(
            db,
            user,
        )

        return {
            "badges": payload["badges"],
            "earned_badges": payload["earned_badges"],
            "earned_badge_count": payload[
                "earned_badge_count"
            ],
            "total_badge_count": payload[
                "total_badge_count"
            ],
        }

    finally:
        db.close()


# ============================================================
# FOREST — WEATHER
# ============================================================

@app.get("/api/forest/weather")
def forest_weather(
    latitude: float = 28.6139,
    longitude: float = 77.2090,
):
    # Live weather source for the Forest.
    #
    # Defaults to Delhi coordinates.
    # The frontend can provide another location later.
    #
    # Open-Meteo does not require an API key.
    #
    # Weather + day/night + season are combined into
    # a semantic Forest environment.

    query = urllib.parse.urlencode(
        {
            "latitude": latitude,
            "longitude": longitude,
            "current": (
                "temperature_2m,"
                "relative_humidity_2m,"
                "apparent_temperature,"
                "is_day,"
                "precipitation,"
                "rain,"
                "showers,"
                "snowfall,"
                "weather_code,"
                "cloud_cover,"
                "wind_speed_10m,"
                "wind_gusts_10m"
            ),
            "daily": (
                "sunrise,"
                "sunset"
            ),
            "timezone": "auto",
            "forecast_days": 1,
        }
    )

    url = (
        "https://api.open-meteo.com/v1/forecast?"
        + query
    )

    try:
        request = urllib.request.Request(
            url,
            headers={
                "User-Agent": "GreenPulse/1.0"
            },
        )

        with urllib.request.urlopen(
            request,
            timeout=8,
        ) as response:
            data = json.loads(
                response.read().decode("utf-8")
            )

        current = data.get(
            "current",
            {},
        )

        daily = data.get(
            "daily",
            {},
        )

        weather_code = int(
            current.get(
                "weather_code",
                0,
            )
        )

        condition = weather_code_to_condition(
            weather_code
        )

        is_day = bool(
            current.get(
                "is_day",
                1,
            )
        )

        sunrise = daily.get(
            "sunrise",
            [None],
        )[0]

        sunset = daily.get(
            "sunset",
            [None],
        )[0]

        current_date = india_now().date()

        season = get_current_season(
            current_date
        )

        season_progress = get_season_progress(
            current_date
        )

        time_of_day = (
            "day"
            if is_day
            else "night"
        )

        # ----------------------------------------------------
        # COMBINED FOREST ENVIRONMENT
        # ----------------------------------------------------

        theme = (
            f"{season['id']}_"
            f"{condition}_"
            f"{time_of_day}"
        )

        environment_tags = []

        # ----------------------------------------------------
        # SEASON TAGS
        # ----------------------------------------------------

        if season["id"] == "spring":
            environment_tags.extend(
                [
                    "fresh_growth",
                    "soft_sunlight",
                    "spring_bloom",
                ]
            )

        elif season["id"] == "summer":
            environment_tags.extend(
                [
                    "warm_light",
                    "full_canopy",
                    "long_day",
                ]
            )

        elif season["id"] == "monsoon":
            environment_tags.extend(
                [
                    "lush_greenery",
                    "moist_air",
                    "monsoon_atmosphere",
                ]
            )

        elif season["id"] == "autumn":
            environment_tags.extend(
                [
                    "earthy_tones",
                    "settling_canopy",
                    "warm_light",
                ]
            )

        elif season["id"] == "winter":
            environment_tags.extend(
                [
                    "cool_air",
                    "soft_light",
                    "morning_mist",
                ]
            )

        # ----------------------------------------------------
        # RAIN TAGS
        # ----------------------------------------------------

        if condition in (
            "rain",
            "drizzle",
            "showers",
            "thunderstorm",
        ):
            environment_tags.extend(
                [
                    "wet_foliage",
                    "rain_particles",
                    "rain_ambience",
                ]
            )

        # ----------------------------------------------------
        # STORM TAGS
        # ----------------------------------------------------

        if condition == "thunderstorm":
            environment_tags.extend(
                [
                    "storm_wind",
                    "distant_thunder",
                    "occasional_lightning",
                ]
            )

        # ----------------------------------------------------
        # FOG TAGS
        # ----------------------------------------------------

        if condition == "fog":
            environment_tags.extend(
                [
                    "mist",
                    "reduced_visibility",
                ]
            )

        # ----------------------------------------------------
        # NIGHT TAGS
        # ----------------------------------------------------

        if not is_day:
            environment_tags.extend(
                [
                    "night_lighting",
                    "nocturnal_ambience",
                ]
            )

        # ----------------------------------------------------
        # DAYLIGHT TAGS
        # ----------------------------------------------------

        if is_day and condition in (
            "clear",
            "partly_cloudy",
        ):
            environment_tags.extend(
                [
                    "sun_rays",
                    "canopy_shadows",
                ]
            )

        return {
            "location": {
                "latitude": latitude,
                "longitude": longitude,
                "timezone": data.get(
                    "timezone"
                ),
            },
            "current": {
                "temperature_c": current.get(
                    "temperature_2m"
                ),
                "relative_humidity": current.get(
                    "relative_humidity_2m"
                ),
                "apparent_temperature_c": current.get(
                    "apparent_temperature"
                ),
                "precipitation_mm": current.get(
                    "precipitation"
                ),
                "rain_mm": current.get(
                    "rain"
                ),
                "showers_mm": current.get(
                    "showers"
                ),
                "snowfall_cm": current.get(
                    "snowfall"
                ),
                "weather_code": weather_code,
                "condition": condition,
                "cloud_cover": current.get(
                    "cloud_cover"
                ),
                "wind_speed_kmh": current.get(
                    "wind_speed_10m"
                ),
                "wind_gusts_kmh": current.get(
                    "wind_gusts_10m"
                ),
                "is_day": is_day,
                "time_of_day": time_of_day,
            },
            "sun": {
                "sunrise": sunrise,
                "sunset": sunset,
            },
            "season": {
                "id": season["id"],
                "name": season["name"],
                "icon": season["icon"],
                "description": season["description"],
                "progress": season_progress,
            },
            "forest_environment": {
                "theme": theme,
                "season": season["id"],
                "weather": condition,
                "time_of_day": time_of_day,
                "rain": condition in (
                    "rain",
                    "drizzle",
                    "showers",
                    "thunderstorm",
                ),
                "storm": condition == "thunderstorm",
                "night": not is_day,
                "environment_tags": sorted(
                    set(environment_tags)
                ),
            },
            "source": "Open-Meteo",
        }

    except Exception as error:
        print(
            "FOREST WEATHER ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail=(
                "Live weather is temporarily "
                "unavailable."
            ),
        )


# ============================================================
# FOREST — SEASON
# ============================================================

@app.get("/api/forest/season")
def forest_season():
    # Season is environmental world data,
    # so authentication is not required.

    today = india_now().date()

    season = get_current_season(
        today
    )

    return {
        "date": today.isoformat(),
        "season": {
            "id": season["id"],
            "name": season["name"],
            "icon": season["icon"],
            "description": season["description"],
            "progress": get_season_progress(
                today
            ),
        },
        "source": "GreenPulse seasonal calendar",
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(token: str):
    db = get_db()

    try:
        user = get_current_user(
            db,
            token,
        )

        if not user:
            raise HTTPException(
                status_code=401,
                detail="Invalid session.",
            )

        return {
            "points": int(
                user["points"] or 0
            ),
            "streak": int(
                user["streak"] or 0
            ),
            "level": int(
                user["level"] or 1
            ),
            "forest_actions": int(
                user["forest_actions"] or 0
            ),
        }

    finally:
        db.close()


# ============================================================
# STARTUP INFO
# ============================================================

@app.on_event("startup")
def startup_message():
    current_season = get_current_season()

    print("----------------------------------------")
    print("GREEN PULSE API STARTED")

    print(
        "DATABASE:",
        (
            "SUPABASE POSTGRESQL"
            if DATABASE_URL
            else "SQLITE FALLBACK"
        ),
    )

    print(
        "TODAY'S CHALLENGE:",
        get_today_challenge()["id"],
    )

    print(
        "CURRENT SEASON:",
        current_season["name"],
    )

    print("----------------------------------------")