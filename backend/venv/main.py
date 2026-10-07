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
# Supabase-connected version
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
    ],
    allow_origin_regex=r"^https://greenpulse-[a-z0-9]+-nain07\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL PRESENT:", bool(DATABASE_URL))

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SQLITE_DB = os.path.join(
    BASE_DIR,
    "greenpulse.db",
)


class PostgresConnection:
    """
    Compatibility wrapper.

    Existing GreenPulse backend code uses ? placeholders.
    PostgreSQL uses %s.

    This wrapper converts ? -> %s.
    """

    def __init__(self, connection):
        self.connection = connection

    def execute(self, query, params=()):
        query = query.replace("?", "%s")
        return self.connection.execute(
            query,
            params,
        )

    def executemany(self, query, params_list):
        query = query.replace("?", "%s")
        return self.connection.executemany(
            query,
            params_list,
        )

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


def get_db():
    """
    Supabase PostgreSQL is PRIMARY whenever DATABASE_URL exists.

    SQLite remains the local fallback.
    """

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

    if current_date is None:
        current_date = india_now().date()

    month = current_date.month

    for season in SEASONS:
        if month in season["months"]:
            return season

    return SEASONS[0]


def get_season_progress(current_date=None):

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
        min(
            100,
            round(progress),
        ),
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


def verify_password(
    password: str,
    stored_hash: str,
) -> bool:

    try:

        algorithm, salt_hex, hash_hex = (
            stored_hash.split("$")
        )

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

        # ====================================================
        # EXISTING TABLES
        # ====================================================

        if DATABASE_URL:

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin')),
                    created_at TEXT NOT NULL,
                    points INTEGER NOT NULL DEFAULT 0,
                    streak INTEGER NOT NULL DEFAULT 0,
                    level INTEGER NOT NULL DEFAULT 1,
                    forest_actions INTEGER NOT NULL DEFAULT 0
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id),
                    created_at TEXT NOT NULL
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS reviews (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    name TEXT NOT NULL,
                    rating INTEGER NOT NULL
                        CHECK (rating >= 1 AND rating <= 5),
                    review TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    owner_token TEXT
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS challenge_completions (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id),
                    challenge_id TEXT NOT NULL,
                    challenge_date TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'General',
                    completed_at TEXT NOT NULL,
                    points INTEGER NOT NULL,
                    UNIQUE(user_id, challenge_date)
                )
                """
            )

        else:

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user'
                        CHECK (role IN ('user', 'admin')),
                    created_at TEXT NOT NULL,
                    points INTEGER NOT NULL DEFAULT 0,
                    streak INTEGER NOT NULL DEFAULT 0,
                    level INTEGER NOT NULL DEFAULT 1,
                    forest_actions INTEGER NOT NULL DEFAULT 0
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    created_at TEXT NOT NULL
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS reviews (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    rating INTEGER NOT NULL
                        CHECK (rating >= 1 AND rating <= 5),
                    review TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    owner_token TEXT
                )
                """
            )

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS challenge_completions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    challenge_id TEXT NOT NULL,
                    challenge_date TEXT NOT NULL,
                    category TEXT NOT NULL DEFAULT 'General',
                    completed_at TEXT NOT NULL,
                    points INTEGER NOT NULL,
                    UNIQUE(user_id, challenge_date)
                )
                """
            )

        # ====================================================
        # SAFE MIGRATION — USERS
        # ====================================================

        if DATABASE_URL:

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS account_status
                TEXT NOT NULL DEFAULT 'active'
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS completed_days
                INTEGER NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS total_calculations
                INTEGER NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS total_co2e
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS total_saved_co2e
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS electricity_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS lpg_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS water_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS transport_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS food_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

            db.execute(
                """
                ALTER TABLE users
                ADD COLUMN IF NOT EXISTS waste_total
                DOUBLE PRECISION NOT NULL DEFAULT 0
                """
            )

        else:

            # SQLite compatibility migration.
            existing_columns = db.execute(
                "PRAGMA table_info(users)"
            ).fetchall()

            column_names = {
                row["name"]
                for row in existing_columns
            }

            sqlite_user_columns = {
                "account_status": (
                    "TEXT NOT NULL DEFAULT 'active'"
                ),
                "completed_days": (
                    "INTEGER NOT NULL DEFAULT 0"
                ),
                "total_calculations": (
                    "INTEGER NOT NULL DEFAULT 0"
                ),
                "total_co2e": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "total_saved_co2e": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "electricity_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "lpg_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "water_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "transport_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "food_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
                "waste_total": (
                    "REAL NOT NULL DEFAULT 0"
                ),
            }

            for column, definition in sqlite_user_columns.items():

                if column not in column_names:

                    db.execute(
                        f"""
                        ALTER TABLE users
                        ADD COLUMN {column}
                        {definition}
                        """
                    )

        # ====================================================
        # DAILY CALCULATIONS
        # ====================================================

        if DATABASE_URL:

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_calculations (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,

                    user_id BIGINT NOT NULL
                        REFERENCES users(id)
                        ON DELETE CASCADE,

                    calculation_date TEXT NOT NULL,

                    electricity DOUBLE PRECISION NOT NULL DEFAULT 0,
                    lpg DOUBLE PRECISION NOT NULL DEFAULT 0,
                    water DOUBLE PRECISION NOT NULL DEFAULT 0,
                    travel DOUBLE PRECISION NOT NULL DEFAULT 0,

                    transport_mode TEXT NOT NULL DEFAULT 'Car',

                    meals DOUBLE PRECISION NOT NULL DEFAULT 0,

                    diet TEXT NOT NULL DEFAULT 'Mixed',

                    waste DOUBLE PRECISION NOT NULL DEFAULT 0,

                    electricity_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,
                    lpg_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,
                    transport_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,
                    food_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,
                    waste_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,

                    total_co2e DOUBLE PRECISION NOT NULL DEFAULT 0,

                    points INTEGER NOT NULL DEFAULT 25,

                    created_at TEXT NOT NULL,

                    UNIQUE(user_id, calculation_date)
                )
                """
            )

        else:

            db.execute(
                """
                CREATE TABLE IF NOT EXISTS daily_calculations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,

                    user_id INTEGER NOT NULL,

                    calculation_date TEXT NOT NULL,

                    electricity REAL NOT NULL DEFAULT 0,
                    lpg REAL NOT NULL DEFAULT 0,
                    water REAL NOT NULL DEFAULT 0,
                    travel REAL NOT NULL DEFAULT 0,

                    transport_mode TEXT NOT NULL DEFAULT 'Car',

                    meals REAL NOT NULL DEFAULT 0,

                    diet TEXT NOT NULL DEFAULT 'Mixed',

                    waste REAL NOT NULL DEFAULT 0,

                    electricity_co2e REAL NOT NULL DEFAULT 0,
                    lpg_co2e REAL NOT NULL DEFAULT 0,
                    transport_co2e REAL NOT NULL DEFAULT 0,
                    food_co2e REAL NOT NULL DEFAULT 0,
                    waste_co2e REAL NOT NULL DEFAULT 0,

                    total_co2e REAL NOT NULL DEFAULT 0,

                    points INTEGER NOT NULL DEFAULT 25,

                    created_at TEXT NOT NULL,

                    UNIQUE(user_id, calculation_date)
                )
                """
            )

        # ====================================================
        # INDEXES
        # ====================================================

        db.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_sessions_user_id
            ON sessions(user_id)
            """
        )

        db.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_challenges_user_id
            ON challenge_completions(user_id)
            """
        )

        db.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_daily_calculations_user_id
            ON daily_calculations(user_id)
            """
        )

        db.execute(
            """
            CREATE INDEX IF NOT EXISTS
            idx_daily_calculations_date
            ON daily_calculations(calculation_date)
            """
        )

        # ====================================================
        # EXISTING USERS
        # Give migrated accounts an explicit active status.
        # This does NOT change passwords or roles.
        # ====================================================

        db.execute(
            """
            UPDATE users
            SET account_status = 'active'
            WHERE account_status IS NULL
               OR account_status = ''
            """
        )

        db.commit()

        print("DATABASE MIGRATION: OK")

    except Exception as error:

        db.rollback()

        print(
            "DATABASE INITIALIZATION ERROR:",
            error,
        )

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


class CalculationRequest(BaseModel):
    token: str

    calculation_date: str | None = None

    electricity: float = 0
    lpg: float = 0
    water: float = 0
    travel: float = 0

    transport_mode: str = "Car"

    meals: float = 0

    diet: str = "Mixed"

    waste: float = 0


class AdminUserStatusRequest(BaseModel):
    token: str
    user_id: int
    status: str


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
            "Replace one short motorised journey with a "
            "lower-carbon option."
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

    today = india_now().date()

    seed = int(
        today.strftime("%Y%m%d")
    )

    index = seed % len(CHALLENGES)

    return CHALLENGES[index]


def get_level_from_points(points: int):

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
        """
        SELECT *
        FROM challenge_completions
        WHERE user_id = ?
        AND challenge_date = ?
        LIMIT 1
        """,
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
# FOREST HELPERS
# ============================================================

def get_completed_challenge_count(
    db,
    user_id: int,
):

    row = db.execute(
        """
        SELECT COUNT(*) AS count
        FROM challenge_completions
        WHERE user_id = ?
        """,
        (user_id,),
    ).fetchone()

    return int(
        row["count"]
        if row
        else 0
    )


def get_category_counts(
    db,
    user_id: int,
):

    rows = db.execute(
        """
        SELECT category, COUNT(*) AS count
        FROM challenge_completions
        WHERE user_id = ?
        GROUP BY category
        """,
        (user_id,),
    ).fetchall()

    category_counts = {
        challenge["category"]: 0
        for challenge in CHALLENGES
    }

    for row in rows:

        category = row["category"]

        if category in category_counts:

            category_counts[category] = int(
                row["count"]
            )

    return category_counts


def get_forest_stage(
    forest_actions: int,
):

    current = FOREST_STAGES[0]
    next_stage = None

    for stage in FOREST_STAGES:

        if forest_actions >= stage["minimum_actions"]:

            current = stage

        elif next_stage is None:

            next_stage = stage

    if next_stage:

        previous_requirement = (
            current["minimum_actions"]
        )

        next_requirement = (
            next_stage["minimum_actions"]
        )

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
            min(
                100,
                round(progress),
            ),
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


def get_forest_payload(
    db,
    user,
):

    user_id = int(
        user["id"]
    )

    challenge_count = (
        get_completed_challenge_count(
            db,
            user_id,
        )
    )

    forest_actions = int(
        user["forest_actions"] or 0
    )

    streak = int(
        user["streak"] or 0
    )

    (
        stage,
        next_stage,
        stage_progress,
    ) = get_forest_stage(
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
            "required_actions": next_stage[
                "minimum_actions"
            ],
            "remaining_actions": max(
                0,
                next_stage[
                    "minimum_actions"
                ] - forest_actions,
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
            "minimum_actions": stage[
                "minimum_actions"
            ],
        },
        "stage_progress": stage_progress,
        "unlocked": unlocked,
        "next_unlock": next_unlock,
        "badges": badges,
        "earned_badges": earned_badges,
        "earned_badge_count": len(
            earned_badges
        ),
        "total_badge_count": len(
            badges
        ),
    }


# ============================================================
# AUTH HELPERS
# ============================================================

def get_current_user(
    db,
    token: str,
):

    if not token:
        return None

    row = db.execute(
        """
        SELECT
            users.id,
            users.username,
            users.role,
            users.created_at,
            users.points,
            users.streak,
            users.level,
            users.forest_actions,
            users.account_status,
            users.completed_days,
            users.total_calculations,
            users.total_co2e,
            users.total_saved_co2e,
            users.electricity_total,
            users.lpg_total,
            users.water_total,
            users.transport_total,
            users.food_total,
            users.waste_total
        FROM sessions
        JOIN users
            ON users.id = sessions.user_id
        WHERE sessions.token = ?
        LIMIT 1
        """,
        (token,),
    ).fetchone()

    if not row:
        return None

    if row["account_status"] != "active":
        return None

    return row


def get_admin_user(
    db,
    token: str,
):

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication required.",
        )

    row = db.execute(
        """
        SELECT *
        FROM sessions
        JOIN users
            ON users.id = sessions.user_id
        WHERE sessions.token = ?
        LIMIT 1
        """,
        (token,),
    ).fetchone()

    if not row:

        raise HTTPException(
            status_code=401,
            detail="Invalid session.",
        )

    if row["account_status"] != "active":

        raise HTTPException(
            status_code=403,
            detail="This account is frozen.",
        )

    if row["role"] != "admin":

        raise HTTPException(
            status_code=403,
            detail="Administrator access required.",
        )

    return row


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():

    return {
        "name": "GreenPulse API",
        "status": "online",
        "database": (
            "supabase-postgresql"
            if DATABASE_URL
            else "sqlite-fallback"
        ),
    }


@app.get("/api/health")
def health():

    db = get_db()

    try:

        db.execute(
            "SELECT 1"
        ).fetchone()

        return {
            "status": "healthy",
            "database": (
                "supabase-postgresql"
                if DATABASE_URL
                else "sqlite-fallback"
            ),
        }

    except Exception as error:

        print(
            "HEALTH DATABASE ERROR:",
            error,
        )

        raise HTTPException(
            status_code=503,
            detail="Database connection unavailable.",
        )

    finally:

        db.close()


@app.get("/api/impact")
def impact():

    return {
        "message": "GreenPulse impact API is online."
    }


# ============================================================
# AUTH — REGISTER
# ============================================================

@app.post("/api/register")
@app.post("/api/auth/register")
def register(
    request: RegisterRequest,
):

    username = request.username.strip()

    if len(username) < 2:

        raise HTTPException(
            status_code=400,
            detail=(
                "Username must contain "
                "at least 2 characters."
            ),
        )

    if len(request.password) < 6:

        raise HTTPException(
            status_code=400,
            detail=(
                "Password must contain "
                "at least 6 characters."
            ),
        )

    db = get_db()

    try:

        existing = db.execute(
            """
            SELECT id
            FROM users
            WHERE LOWER(username) = LOWER(?)
            LIMIT 1
            """,
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
                """
                INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    created_at,
                    points,
                    streak,
                    level,
                    forest_actions,
                    account_status
                )
                VALUES (
                    ?,
                    ?,
                    'user',
                    ?,
                    0,
                    0,
                    1,
                    0,
                    'active'
                )
                RETURNING id, username, role, account_status
                """,
                (
                    username,
                    password_hash,
                    created_at,
                ),
            ).fetchone()

        else:

            cursor = db.execute(
                """
                INSERT INTO users (
                    username,
                    password_hash,
                    role,
                    created_at,
                    points,
                    streak,
                    level,
                    forest_actions,
                    account_status
                )
                VALUES (
                    ?,
                    ?,
                    'user',
                    ?,
                    0,
                    0,
                    1,
                    0,
                    'active'
                )
                """,
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
                "account_status": "active",
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
@app.post("/api/auth/login")
def login(
    request: LoginRequest,
):

    username = request.username.strip()

    db = get_db()

    try:

        row = db.execute(
            """
            SELECT *
            FROM users
            WHERE LOWER(username) = LOWER(?)
            LIMIT 1
            """,
            (username,),
        ).fetchone()

        if not row:

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid username "
                    "or password."
                ),
            )

        # ----------------------------------------------------
        # EXISTING PASSWORD HASH IS USED DIRECTLY.
        # NO PASSWORD RESET.
        # ----------------------------------------------------

        if not verify_password(
            request.password,
            row["password_hash"],
        ):

            raise HTTPException(
                status_code=401,
                detail=(
                    "Invalid username "
                    "or password."
                ),
            )

        # ----------------------------------------------------
        # FROZEN ACCOUNT
        # ----------------------------------------------------

        if row["account_status"] != "active":

            raise HTTPException(
                status_code=403,
                detail=(
                    "This GreenPulse account is currently "
                    "frozen by an administrator."
                ),
            )

        token = secrets.token_urlsafe(32)

        db.execute(
            """
            INSERT INTO sessions (
                token,
                user_id,
                created_at
            )
            VALUES (?, ?, ?)
            """,
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
                "account_status": row[
                    "account_status"
                ],
                "points": int(
                    row["points"] or 0
                ),
                "streak": int(
                    row["streak"] or 0
                ),
                "level": int(
                    row["level"] or 1
                ),
                "forest_actions": int(
                    row["forest_actions"] or 0
                ),
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
def me(
    token: str,
):

    db = get_db()

    try:

        user = get_current_user(
            db,
            token,
        )

        if not user:

            raise HTTPException(
                status_code=401,
                detail="Invalid, expired or frozen session.",
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
def logout(
    token: str,
):

    db = get_db()

    try:

        db.execute(
            """
            DELETE FROM sessions
            WHERE token = ?
            """,
            (token,),
        )

        db.commit()

        return {
            "message": "Logged out successfully."
        }

    finally:

        db.close()


# ============================================================
# CALCULATOR — FACTORS
# ============================================================

FACTORS = {
    "electricity": 0.82,
    "lpg": 2.98,
    "waste": 0.50,

    "transport": {
        "Car": 0.192,
        "Bike": 0.103,
        "Bus": 0.089,
        "Train": 0.041,
        "Walking / Cycling": 0,
    },

    "meals": {
        "Vegetarian": 0.80,
        "Mixed": 1.70,
        "Non-Vegetarian": 2.50,
    },
}


def calculate_carbon(
    request: CalculationRequest,
):

    electricity = max(
        0,
        float(request.electricity),
    )

    lpg = max(
        0,
        float(request.lpg),
    )

    water = max(
        0,
        float(request.water),
    )

    travel = max(
        0,
        float(request.travel),
    )

    meals = max(
        0,
        float(request.meals),
    )

    waste = max(
        0,
        float(request.waste),
    )

    transport_mode = request.transport_mode

    if transport_mode not in FACTORS["transport"]:
        transport_mode = "Car"

    diet = request.diet

    if diet not in FACTORS["meals"]:
        diet = "Mixed"

    electricity_co2e = (
        electricity
        * FACTORS["electricity"]
    )

    lpg_co2e = (
        lpg
        * FACTORS["lpg"]
    )

    transport_co2e = (
        travel
        * FACTORS["transport"][
            transport_mode
        ]
    )

    food_co2e = (
        meals
        * FACTORS["meals"][diet]
    )

    waste_co2e = (
        waste
        * FACTORS["waste"]
    )

    total = (
        electricity_co2e
        + lpg_co2e
        + transport_co2e
        + food_co2e
        + waste_co2e
    )

    return {
        "electricity_co2e": round(
            electricity_co2e,
            3,
        ),
        "lpg_co2e": round(
            lpg_co2e,
            3,
        ),
        "transport_co2e": round(
            transport_co2e,
            3,
        ),
        "food_co2e": round(
            food_co2e,
            3,
        ),
        "waste_co2e": round(
            waste_co2e,
            3,
        ),
        "total_co2e": round(
            total,
            3,
        ),
    }


# ============================================================
# CALCULATOR — SAVE
# ============================================================

@app.post("/api/calculations")
@app.post("/api/calculator/save")
def save_calculation(
    request: CalculationRequest,
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

        calculation_date = (
            request.calculation_date
            or india_today()
        )

        result = calculate_carbon(
            request
        )

        existing = db.execute(
            """
            SELECT *
            FROM daily_calculations
            WHERE user_id = ?
            AND calculation_date = ?
            LIMIT 1
            """,
            (
                user["id"],
                calculation_date,
            ),
        ).fetchone()

        if existing:

            raise HTTPException(
                status_code=409,
                detail=(
                    "A carbon calculation for this "
                    "date has already been saved."
                ),
            )

        points = 25

        db.execute(
            """
            INSERT INTO daily_calculations (
                user_id,
                calculation_date,
                electricity,
                lpg,
                water,
                travel,
                transport_mode,
                meals,
                diet,
                waste,
                electricity_co2e,
                lpg_co2e,
                transport_co2e,
                food_co2e,
                waste_co2e,
                total_co2e,
                points,
                created_at
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            """,
            (
                user["id"],
                calculation_date,
                max(0, float(request.electricity)),
                max(0, float(request.lpg)),
                max(0, float(request.water)),
                max(0, float(request.travel)),
                request.transport_mode,
                max(0, float(request.meals)),
                request.diet,
                max(0, float(request.waste)),
                result["electricity_co2e"],
                result["lpg_co2e"],
                result["transport_co2e"],
                result["food_co2e"],
                result["waste_co2e"],
                result["total_co2e"],
                points,
                india_now_iso(),
            ),
        )

        # ----------------------------------------------------
        # CALCULATE NEW AGGREGATES
        # ----------------------------------------------------

        current_points = int(
            user["points"] or 0
        )

        new_points = (
            current_points
            + points
        )

        new_level = get_level_from_points(
            new_points
        )

        current_calculations = int(
            user["total_calculations"] or 0
        )

        current_completed_days = int(
            user["completed_days"] or 0
        )

        new_total_calculations = (
            current_calculations + 1
        )

        new_completed_days = (
            current_completed_days + 1
        )

        current_total_co2e = float(
            user["total_co2e"] or 0
        )

        current_electricity = float(
            user["electricity_total"] or 0
        )

        current_lpg = float(
            user["lpg_total"] or 0
        )

        current_water = float(
            user["water_total"] or 0
        )

        current_transport = float(
            user["transport_total"] or 0
        )

        current_food = float(
            user["food_total"] or 0
        )

        current_waste = float(
            user["waste_total"] or 0
        )

        new_total_co2e = (
            current_total_co2e
            + result["total_co2e"]
        )

        new_electricity = (
            current_electricity
            + result["electricity_co2e"]
        )

        new_lpg = (
            current_lpg
            + result["lpg_co2e"]
        )

        new_water = (
            current_water
            + float(request.water)
        )

        new_transport = (
            current_transport
            + result["transport_co2e"]
        )

        new_food = (
            current_food
            + result["food_co2e"]
        )

        new_waste = (
            current_waste
            + result["waste_co2e"]
        )

        db.execute(
            """
            UPDATE users
            SET
                points = ?,
                level = ?,
                completed_days = ?,
                total_calculations = ?,
                total_co2e = ?,
                electricity_total = ?,
                lpg_total = ?,
                water_total = ?,
                transport_total = ?,
                food_total = ?,
                waste_total = ?
            WHERE id = ?
            """,
            (
                new_points,
                new_level,
                new_completed_days,
                new_total_calculations,
                new_total_co2e,
                new_electricity,
                new_lpg,
                new_water,
                new_transport,
                new_food,
                new_waste,
                user["id"],
            ),
        )

        db.commit()

        return {
            "message": (
                "Today's footprint was saved."
            ),
            "points_earned": points,
            "result": result,
            "progress": {
                "points": new_points,
                "level": new_level,
                "completed_days": new_completed_days,
                "total_calculations": (
                    new_total_calculations
                ),
                "total_co2e": round(
                    new_total_co2e,
                    3,
                ),
            },
        }

    except HTTPException:

        db.rollback()
        raise

    except Exception as error:

        db.rollback()

        print(
            "SAVE CALCULATION ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to save carbon calculation.",
        )

    finally:

        db.close()


# ============================================================
# CALCULATOR — HISTORY
# ============================================================

@app.get("/api/calculations/history")
def calculation_history(
    token: str,
):

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
            """
            SELECT *
            FROM daily_calculations
            WHERE user_id = ?
            ORDER BY calculation_date DESC
            """,
            (user["id"],),
        ).fetchall()

        return {
            "history": [
                dict(row)
                for row in rows
            ],
            "count": len(rows),
        }

    finally:

        db.close()


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(
    token: str,
):

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
            "completed_days": int(
                user["completed_days"] or 0
            ),
            "total_calculations": int(
                user["total_calculations"] or 0
            ),
            "total_co2e": float(
                user["total_co2e"] or 0
            ),
            "total_saved_co2e": float(
                user["total_saved_co2e"] or 0
            ),
            "account_status": user[
                "account_status"
            ],
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
            """
            SELECT
                id,
                name,
                rating,
                review,
                created_at
            FROM reviews
            ORDER BY id DESC
            """
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
def create_review(
    review: Review,
):

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
            """
            INSERT INTO reviews (
                name,
                rating,
                review,
                created_at,
                owner_token
            )
            VALUES (?, ?, ?, ?, ?)
            """,
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
def update_review(
    request: ReviewUpdate,
):

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
            """
            SELECT *
            FROM reviews
            WHERE id = ?
            LIMIT 1
            """,
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
            """
            UPDATE reviews
            SET
                name = ?,
                rating = ?,
                review = ?
            WHERE id = ?
            """,
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
def delete_review(
    request: ReviewDelete,
):

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
            """
            SELECT *
            FROM reviews
            WHERE id = ?
            LIMIT 1
            """,
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
            """
            DELETE FROM reviews
            WHERE id = ?
            """,
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
def challenge_today(
    token: str,
):

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
                if item["id"]
                == request.challenge_id
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
                detail=(
                    "Today's challenge "
                    "is already completed."
                ),
            )

        # ----------------------------------------------------
        # STREAK
        # ----------------------------------------------------

        current_streak = int(
            user["streak"] or 0
        )

        previous_completion = db.execute(
            """
            SELECT challenge_date
            FROM challenge_completions
            WHERE user_id = ?
            ORDER BY challenge_date DESC
            LIMIT 1
            """,
            (user["id"],),
        ).fetchone()

        if previous_completion:

            previous_date = datetime.strptime(
                previous_completion[
                    "challenge_date"
                ],
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
        # IMPORTANT:
        # YOUR REAL SUPABASE TABLE HAS category NOT NULL.
        # ----------------------------------------------------

        db.execute(
            """
            INSERT INTO challenge_completions (
                user_id,
                challenge_id,
                challenge_date,
                category,
                completed_at,
                points
            )
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                challenge["id"],
                today,
                challenge["category"],
                completed_at,
                challenge["points"],
            ),
        )

        # ----------------------------------------------------
        # UPDATE USER
        # ----------------------------------------------------

        db.execute(
            """
            UPDATE users
            SET
                points = ?,
                streak = ?,
                level = ?,
                forest_actions = ?
            WHERE id = ?
            """,
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
def challenge_history(
    token: str,
):

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
            """
            SELECT
                challenge_id,
                challenge_date,
                category,
                completed_at,
                points
            FROM challenge_completions
            WHERE user_id = ?
            ORDER BY challenge_date DESC
            """,
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
                    "challenge_id": row[
                        "challenge_id"
                    ],
                    "challenge_date": row[
                        "challenge_date"
                    ],
                    "category": row[
                        "category"
                    ],
                    "completed_at": row[
                        "completed_at"
                    ],
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
def forest(
    token: str,
):

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
# FOREST — BADGES
# ============================================================

@app.get("/api/forest/badges")
def forest_badges(
    token: str,
):

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
            "earned_badges": payload[
                "earned_badges"
            ],
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
# WEATHER
# ============================================================

def weather_code_to_condition(
    weather_code: int,
):

    if weather_code == 0:
        return "clear"

    if weather_code in (1, 2):
        return "partly_cloudy"

    if weather_code == 3:
        return "cloudy"

    if weather_code in (45, 48):
        return "fog"

    if weather_code in (
        51,
        53,
        55,
        56,
        57,
    ):
        return "drizzle"

    if weather_code in (
        61,
        63,
        65,
        66,
        67,
    ):
        return "rain"

    if weather_code in (
        71,
        73,
        75,
        77,
    ):
        return "snow"

    if weather_code in (
        80,
        81,
        82,
    ):
        return "showers"

    if weather_code in (
        85,
        86,
    ):
        return "snow_showers"

    if weather_code in (
        95,
        96,
        99,
    ):
        return "thunderstorm"

    return "cloudy"


@app.get("/api/forest/weather")
def forest_weather(
    latitude: float = 28.6139,
    longitude: float = 77.2090,
):

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
                response.read().decode(
                    "utf-8"
                )
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

        theme = (
            f"{season['id']}_"
            f"{condition}_"
            f"{time_of_day}"
        )

        environment_tags = []

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

        if condition == "thunderstorm":

            environment_tags.extend(
                [
                    "storm_wind",
                    "distant_thunder",
                    "occasional_lightning",
                ]
            )

        if condition == "fog":

            environment_tags.extend(
                [
                    "mist",
                    "reduced_visibility",
                ]
            )

        if not is_day:

            environment_tags.extend(
                [
                    "night_lighting",
                    "nocturnal_ambience",
                ]
            )

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
                "description": season[
                    "description"
                ],
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
                "storm": (
                    condition
                    == "thunderstorm"
                ),
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
            "description": season[
                "description"
            ],
            "progress": get_season_progress(
                today
            ),
        },

        "source": (
            "GreenPulse seasonal calendar"
        ),
    }


# ============================================================
# ============================================================
# ADMIN SYSTEM
# ============================================================
# ============================================================


# ============================================================
# ADMIN — CURRENT ADMIN
# ============================================================

@app.get("/api/admin/me")
def admin_me(
    token: str,
):

    db = get_db()

    try:

        admin = get_admin_user(
            db,
            token,
        )

        return {
            "admin": {
                "id": admin["id"],
                "username": admin["username"],
                "role": admin["role"],
                "account_status": admin[
                    "account_status"
                ],
            }
        }

    finally:

        db.close()


# ============================================================
# ADMIN — OVERVIEW STATISTICS
# ============================================================

@app.get("/api/admin/stats")
def admin_stats(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        total_users_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            """
        ).fetchone()

        active_users_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE account_status = 'active'
            """
        ).fetchone()

        frozen_users_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE account_status = 'frozen'
            """
        ).fetchone()

        admin_count_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM users
            WHERE role = 'admin'
            """
        ).fetchone()

        calculations_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM daily_calculations
            """
        ).fetchone()

        challenges_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM challenge_completions
            """
        ).fetchone()

        reviews_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM reviews
            """
        ).fetchone()

        carbon_row = db.execute(
            """
            SELECT COALESCE(
                SUM(total_co2e),
                0
            ) AS total
            FROM daily_calculations
            """
        ).fetchone()

        points_row = db.execute(
            """
            SELECT COALESCE(
                SUM(points),
                0
            ) AS total
            FROM users
            """
        ).fetchone()

        return {
            "users": {
                "total": int(
                    total_users_row["count"]
                ),
                "active": int(
                    active_users_row["count"]
                ),
                "frozen": int(
                    frozen_users_row["count"]
                ),
                "admins": int(
                    admin_count_row["count"]
                ),
            },

            "activity": {
                "calculations": int(
                    calculations_row["count"]
                ),
                "challenges_completed": int(
                    challenges_row["count"]
                ),
                "reviews": int(
                    reviews_row["count"]
                ),
            },

            "impact": {
                "total_co2e": float(
                    carbon_row["total"] or 0
                ),
                "total_points": int(
                    points_row["total"] or 0
                ),
            },
        }

    finally:

        db.close()


# ============================================================
# ADMIN — ALL USERS
# ============================================================

@app.get("/api/admin/users")
def admin_users(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        rows = db.execute(
            """
            SELECT
                id,
                username,
                role,
                created_at,
                account_status,
                points,
                streak,
                level,
                forest_actions,
                completed_days,
                total_calculations,
                total_co2e,
                total_saved_co2e
            FROM users
            ORDER BY id DESC
            """
        ).fetchall()

        users = []

        for row in rows:

            users.append(
                {
                    **dict(row),
                    "points": int(
                        row["points"] or 0
                    ),
                    "streak": int(
                        row["streak"] or 0
                    ),
                    "level": int(
                        row["level"] or 1
                    ),
                    "forest_actions": int(
                        row["forest_actions"] or 0
                    ),
                    "completed_days": int(
                        row["completed_days"] or 0
                    ),
                    "total_calculations": int(
                        row["total_calculations"] or 0
                    ),
                    "total_co2e": float(
                        row["total_co2e"] or 0
                    ),
                    "total_saved_co2e": float(
                        row["total_saved_co2e"] or 0
                    ),
                }
            )

        return {
            "users": users,
            "count": len(users),
        }

    finally:

        db.close()


# ============================================================
# ADMIN — INDIVIDUAL USER ANALYSIS
# ============================================================

@app.get("/api/admin/users/{user_id}")
def admin_user_analysis(
    user_id: int,
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        user = db.execute(
            """
            SELECT
                id,
                username,
                role,
                created_at,
                account_status,
                points,
                streak,
                level,
                forest_actions,
                completed_days,
                total_calculations,
                total_co2e,
                total_saved_co2e,
                electricity_total,
                lpg_total,
                water_total,
                transport_total,
                food_total,
                waste_total
            FROM users
            WHERE id = ?
            LIMIT 1
            """,
            (user_id,),
        ).fetchone()

        if not user:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        # ----------------------------------------------------
        # CALCULATION HISTORY
        # ----------------------------------------------------

        calculations = db.execute(
            """
            SELECT *
            FROM daily_calculations
            WHERE user_id = ?
            ORDER BY calculation_date DESC
            """,
            (user_id,),
        ).fetchall()

        # ----------------------------------------------------
        # CHALLENGE HISTORY
        # ----------------------------------------------------

        challenges = db.execute(
            """
            SELECT
                id,
                challenge_id,
                challenge_date,
                category,
                completed_at,
                points
            FROM challenge_completions
            WHERE user_id = ?
            ORDER BY challenge_date DESC
            """,
            (user_id,),
        ).fetchall()

        # ----------------------------------------------------
        # SESSION COUNT
        # ----------------------------------------------------

        sessions_row = db.execute(
            """
            SELECT COUNT(*) AS count
            FROM sessions
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()

        # ----------------------------------------------------
        # CHALLENGE CATEGORY ANALYSIS
        # ----------------------------------------------------

        category_rows = db.execute(
            """
            SELECT
                category,
                COUNT(*) AS count,
                COALESCE(SUM(points), 0) AS points
            FROM challenge_completions
            WHERE user_id = ?
            GROUP BY category
            ORDER BY count DESC
            """,
            (user_id,),
        ).fetchall()

        # ----------------------------------------------------
        # CALCULATOR CATEGORY TOTALS
        # ----------------------------------------------------

        calculation_totals = db.execute(
            """
            SELECT
                COALESCE(SUM(electricity_co2e), 0)
                    AS electricity_co2e,

                COALESCE(SUM(lpg_co2e), 0)
                    AS lpg_co2e,

                COALESCE(SUM(transport_co2e), 0)
                    AS transport_co2e,

                COALESCE(SUM(food_co2e), 0)
                    AS food_co2e,

                COALESCE(SUM(waste_co2e), 0)
                    AS waste_co2e,

                COALESCE(SUM(total_co2e), 0)
                    AS total_co2e
            FROM daily_calculations
            WHERE user_id = ?
            """,
            (user_id,),
        ).fetchone()

        return {
            "user": dict(user),

            "summary": {
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
                "completed_days": int(
                    user["completed_days"] or 0
                ),
                "total_calculations": int(
                    user["total_calculations"] or 0
                ),
                "total_co2e": float(
                    user["total_co2e"] or 0
                ),
                "total_saved_co2e": float(
                    user["total_saved_co2e"] or 0
                ),
                "sessions": int(
                    sessions_row["count"]
                ),
            },

            "carbon": {
                "electricity_co2e": float(
                    calculation_totals[
                        "electricity_co2e"
                    ] or 0
                ),
                "lpg_co2e": float(
                    calculation_totals[
                        "lpg_co2e"
                    ] or 0
                ),
                "transport_co2e": float(
                    calculation_totals[
                        "transport_co2e"
                    ] or 0
                ),
                "food_co2e": float(
                    calculation_totals[
                        "food_co2e"
                    ] or 0
                ),
                "waste_co2e": float(
                    calculation_totals[
                        "waste_co2e"
                    ] or 0
                ),
                "total_co2e": float(
                    calculation_totals[
                        "total_co2e"
                    ] or 0
                ),
            },

            "challenge_categories": [
                dict(row)
                for row in category_rows
            ],

            "calculations": [
                dict(row)
                for row in calculations
            ],

            "challenges": [
                dict(row)
                for row in challenges
            ],
        }

    finally:

        db.close()


# ============================================================
# ADMIN — FREEZE / UNFREEZE ACCOUNT
# ============================================================

@app.post("/api/admin/users/status")
def admin_change_user_status(
    request: AdminUserStatusRequest,
):

    if request.status not in (
        "active",
        "frozen",
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Status must be "
                "'active' or 'frozen'."
            ),
        )

    db = get_db()

    try:

        admin = get_admin_user(
            db,
            request.token,
        )

        target = db.execute(
            """
            SELECT
                id,
                username,
                role,
                account_status
            FROM users
            WHERE id = ?
            LIMIT 1
            """,
            (request.user_id,),
        ).fetchone()

        if not target:

            raise HTTPException(
                status_code=404,
                detail="User not found.",
            )

        # ----------------------------------------------------
        # PROTECT THE CURRENT ADMIN FROM ACCIDENTALLY
        # FREEZING THEMSELVES.
        # ----------------------------------------------------

        if (
            int(target["id"])
            == int(admin["id"])
            and request.status == "frozen"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    "You cannot freeze your own "
                    "administrator account."
                ),
            )

        db.execute(
            """
            UPDATE users
            SET account_status = ?
            WHERE id = ?
            """,
            (
                request.status,
                request.user_id,
            ),
        )

        # ----------------------------------------------------
        # FREEZING ALSO INVALIDATES EXISTING SESSIONS.
        #
        # The account remains in the database.
        # Password remains unchanged.
        # Data remains unchanged.
        # ----------------------------------------------------

        if request.status == "frozen":

            db.execute(
                """
                DELETE FROM sessions
                WHERE user_id = ?
                """,
                (request.user_id,),
            )

        db.commit()

        return {
            "message": (
                "Account frozen."
                if request.status == "frozen"
                else "Account unfrozen."
            ),
            "user": {
                "id": target["id"],
                "username": target["username"],
                "role": target["role"],
                "account_status": request.status,
            },
        }

    except HTTPException:

        db.rollback()
        raise

    except Exception as error:

        db.rollback()

        print(
            "ADMIN STATUS ERROR:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to change account status.",
        )

    finally:

        db.close()


# ============================================================
# ADMIN — FREEZE SHORTCUT
# ============================================================

@app.post("/api/admin/users/{user_id}/freeze")
def admin_freeze_user(
    user_id: int,
    token: str,
):

    return admin_change_user_status(
        AdminUserStatusRequest(
            token=token,
            user_id=user_id,
            status="frozen",
        )
    )


# ============================================================
# ADMIN — UNFREEZE SHORTCUT
# ============================================================

@app.post("/api/admin/users/{user_id}/unfreeze")
def admin_unfreeze_user(
    user_id: int,
    token: str,
):

    return admin_change_user_status(
        AdminUserStatusRequest(
            token=token,
            user_id=user_id,
            status="active",
        )
    )


# ============================================================
# ADMIN — REVIEWS
# ============================================================

@app.get("/api/admin/reviews")
def admin_reviews(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        rows = db.execute(
            """
            SELECT
                id,
                name,
                rating,
                review,
                created_at,
                owner_token
            FROM reviews
            ORDER BY id DESC
            """
        ).fetchall()

        return {
            "reviews": [
                dict(row)
                for row in rows
            ],
            "count": len(rows),
        }

    finally:

        db.close()


# ============================================================
# ADMIN — SEARCH USERS
# ============================================================

@app.get("/api/admin/users/search")
def admin_search_users(
    token: str,
    q: str = "",
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        search = q.strip()

        if not search:

            rows = db.execute(
                """
                SELECT
                    id,
                    username,
                    role,
                    account_status,
                    points,
                    streak,
                    level,
                    forest_actions,
                    completed_days,
                    total_calculations,
                    total_co2e
                FROM users
                ORDER BY id DESC
                LIMIT 100
                """
            ).fetchall()

        else:

            rows = db.execute(
                """
                SELECT
                    id,
                    username,
                    role,
                    account_status,
                    points,
                    streak,
                    level,
                    forest_actions,
                    completed_days,
                    total_calculations,
                    total_co2e
                FROM users
                WHERE username ILIKE ?
                ORDER BY id DESC
                LIMIT 100
                """,
                (
                    f"%{search}%",
                ),
            ).fetchall()

        return {
            "users": [
                dict(row)
                for row in rows
            ],
            "count": len(rows),
        }

    finally:

        db.close()


# ============================================================
# ADMIN — ALL CALCULATIONS
# ============================================================

@app.get("/api/admin/calculations")
def admin_calculations(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        rows = db.execute(
            """
            SELECT
                daily_calculations.*,
                users.username
            FROM daily_calculations
            JOIN users
                ON users.id =
                   daily_calculations.user_id
            ORDER BY
                daily_calculations.calculation_date DESC,
                daily_calculations.id DESC
            LIMIT 1000
            """
        ).fetchall()

        return {
            "calculations": [
                dict(row)
                for row in rows
            ],
            "count": len(rows),
        }

    finally:

        db.close()


# ============================================================
# ADMIN — ALL CHALLENGES
# ============================================================

@app.get("/api/admin/challenges")
def admin_challenges(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        rows = db.execute(
            """
            SELECT
                challenge_completions.*,
                users.username
            FROM challenge_completions
            JOIN users
                ON users.id =
                   challenge_completions.user_id
            ORDER BY
                challenge_completions.challenge_date DESC,
                challenge_completions.id DESC
            LIMIT 1000
            """
        ).fetchall()

        return {
            "challenges": [
                dict(row)
                for row in rows
            ],
            "count": len(rows),
        }

    finally:

        db.close()


# ============================================================
# ADMIN — USER ACTIVITY SUMMARY
# ============================================================

@app.get("/api/admin/activity")
def admin_activity(
    token: str,
):

    db = get_db()

    try:

        get_admin_user(
            db,
            token,
        )

        calculation_activity = db.execute(
            """
            SELECT
                calculation_date,
                COUNT(*) AS count,
                COALESCE(
                    SUM(total_co2e),
                    0
                ) AS total_co2e
            FROM daily_calculations
            GROUP BY calculation_date
            ORDER BY calculation_date DESC
            LIMIT 90
            """
        ).fetchall()

        challenge_activity = db.execute(
            """
            SELECT
                challenge_date,
                COUNT(*) AS count,
                COALESCE(
                    SUM(points),
                    0
                ) AS points
            FROM challenge_completions
            GROUP BY challenge_date
            ORDER BY challenge_date DESC
            LIMIT 90
            """
        ).fetchall()

        return {
            "calculations": [
                dict(row)
                for row in calculation_activity
            ],
            "challenges": [
                dict(row)
                for row in challenge_activity
            ],
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

    print(
        "ADMIN SYSTEM:",
        "ENABLED",
    )

    print(
        "ACCOUNT CONTROL:",
        "FREEZE / UNFREEZE ENABLED",
    )

    print(
        "DAILY CALCULATIONS:",
        "SUPABASE PERSISTENCE ENABLED",
    )

    print("----------------------------------------")