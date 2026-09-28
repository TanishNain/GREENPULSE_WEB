from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

import hashlib
import os
import secrets
import sqlite3

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import psycopg
from psycopg.rows import dict_row
from psycopg.errors import IntegrityError as PostgresIntegrityError


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="GreenPulse API",
    description="Backend API for the GreenPulse website",
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# DATABASE
# ============================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "greenpulse.db")

# Production:
# DATABASE_URL -> Supabase PostgreSQL
#
# Local development:
# No DATABASE_URL -> SQLite

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE_URL PRESENT:", bool(DATABASE_URL))


class PostgresConnection:
    """
    Compatibility wrapper allowing the existing GreenPulse
    backend to continue using SQLite-style ? placeholders.

    SQLite:
        ?

    PostgreSQL:
        %s
    """

    def __init__(self, connection):
        self.connection = connection

    def execute(self, sql, params=None):
        sql = sql.replace("?", "%s")

        cursor = self.connection.cursor()

        if params is None:
            cursor.execute(sql)
        else:
            cursor.execute(sql, params)

        return cursor

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def close(self):
        self.connection.close()


def get_db():
    if DATABASE_URL:
        connection = psycopg.connect(
            DATABASE_URL,
            row_factory=dict_row,
        )

        return PostgresConnection(connection)

    connection = sqlite3.connect(DB_FILE)

    connection.row_factory = sqlite3.Row

    return connection


# ============================================================
# TIME
# ============================================================

INDIA_TIMEZONE = ZoneInfo("Asia/Kolkata")


def get_india_now():
    """
    GreenPulse challenge dates are based on Indian Standard Time,
    not Render's server timezone.
    """
    return datetime.now(INDIA_TIMEZONE)


def get_today_date():
    return get_india_now().date().isoformat()


# ============================================================
# PASSWORD SECURITY
# ============================================================

def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
    )

    return salt.hex() + ":" + password_hash.hex()


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        salt_hex, hash_hex = stored_hash.split(":")

        salt = bytes.fromhex(salt_hex)
        expected_hash = bytes.fromhex(hash_hex)

        actual_hash = hashlib.scrypt(
            password.encode("utf-8"),
            salt=salt,
            n=16384,
            r=8,
            p=1,
        )

        return secrets.compare_digest(
            actual_hash,
            expected_hash,
        )

    except (ValueError, TypeError):
        return False


# ============================================================
# CURRENT USER
# ============================================================

def get_current_user(token: str):
    if not token:
        raise HTTPException(
            status_code=401,
            detail="Authentication token is required",
        )

    connection = get_db()

    try:
        user = connection.execute(
            """
            SELECT
                users.id,
                users.username,
                users.role
            FROM sessions
            JOIN users
                ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (token,),
        ).fetchone()
    finally:
        connection.close()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session",
        )

    return user


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():

    # --------------------------------------------------------
    # SUPABASE / POSTGRESQL
    # --------------------------------------------------------

    if DATABASE_URL:
        connection = get_db()

        try:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    username TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'user'
                        CHECK(role IN ('user', 'admin')),
                    created_at TEXT NOT NULL,
                    points INTEGER NOT NULL DEFAULT 0,
                    streak INTEGER NOT NULL DEFAULT 0,
                    level INTEGER NOT NULL DEFAULT 1,
                    forest_actions INTEGER NOT NULL DEFAULT 0
                )
                """
            )

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS sessions (
                    token TEXT PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
                """
            )

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS reviews (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    name TEXT NOT NULL,
                    rating INTEGER NOT NULL
                        CHECK(rating >= 1 AND rating <= 5),
                    review TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    owner_token TEXT
                )
                """
            )

            # ------------------------------------------------
            # DAILY CHALLENGES
            # ------------------------------------------------

            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS challenge_completions (
                    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
                    user_id BIGINT NOT NULL,
                    challenge_date TEXT NOT NULL,
                    challenge_id TEXT NOT NULL,
                    category TEXT NOT NULL,
                    points INTEGER NOT NULL,
                    completed_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    UNIQUE(user_id, challenge_date)
                )
                """
            )

            connection.commit()

        finally:
            connection.close()

        return

    # --------------------------------------------------------
    # LOCAL SQLITE
    # --------------------------------------------------------

    connection = get_db()

    try:
        # ----------------------------------------------------
        # USERS
        # ----------------------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
                    CHECK(role IN ('user', 'admin')),
                created_at TEXT NOT NULL
            )
            """
        )

        user_columns = [
            ("points", "INTEGER NOT NULL DEFAULT 0"),
            ("streak", "INTEGER NOT NULL DEFAULT 0"),
            ("level", "INTEGER NOT NULL DEFAULT 1"),
            ("forest_actions", "INTEGER NOT NULL DEFAULT 0"),
        ]

        existing_user_columns = {
            column["name"]
            for column in connection.execute(
                "PRAGMA table_info(users)"
            ).fetchall()
        }

        for column, definition in user_columns:
            if column not in existing_user_columns:
                connection.execute(
                    f"ALTER TABLE users ADD COLUMN {column} {definition}"
                )

        # ----------------------------------------------------
        # SESSIONS
        # ----------------------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        # ----------------------------------------------------
        # REVIEWS
        # ----------------------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                rating INTEGER NOT NULL
                    CHECK(rating >= 1 AND rating <= 5),
                review TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        existing_review_columns = {
            column["name"]
            for column in connection.execute(
                "PRAGMA table_info(reviews)"
            ).fetchall()
        }

        if "owner_token" not in existing_review_columns:
            connection.execute(
                """
                ALTER TABLE reviews
                ADD COLUMN owner_token TEXT
                """
            )

        # ----------------------------------------------------
        # DAILY CHALLENGES
        # ----------------------------------------------------

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS challenge_completions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                challenge_date TEXT NOT NULL,
                challenge_id TEXT NOT NULL,
                category TEXT NOT NULL,
                points INTEGER NOT NULL,
                completed_at TEXT NOT NULL,
                UNIQUE(user_id, challenge_date),
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """
        )

        connection.commit()

    finally:
        connection.close()


init_db()


# ============================================================
# REQUEST MODELS
# ============================================================

class Review(BaseModel):
    name: str
    rating: int = Field(ge=1, le=5)
    review: str


class ReviewUpdate(BaseModel):
    name: str
    rating: int = Field(ge=1, le=5)
    review: str
    owner_token: str


class ReviewDelete(BaseModel):
    owner_token: str


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
        "title": "Power Down What You Don't Need",
        "description": (
            "Before you leave a room today, switch off lights, "
            "fans and other appliances that are not needed."
        ),
        "action": "Switch off at least 3 unnecessary electrical devices today.",
        "points": 10,
        "forest_points": 1,
    },
    {
        "id": "water_wise",
        "category": "Water",
        "icon": "💧",
        "title": "Save Every Drop",
        "description": (
            "Pay attention to water use today and avoid letting "
            "water run when you do not need it."
        ),
        "action": "Complete 3 water-saving actions today.",
        "points": 10,
        "forest_points": 1,
    },
    {
        "id": "food_no_waste",
        "category": "Food",
        "icon": "🍽️",
        "title": "Finish What You Take",
        "description": (
            "Take only the food you realistically plan to eat "
            "and avoid unnecessary food waste."
        ),
        "action": "Have one meal today without wasting edible food.",
        "points": 10,
        "forest_points": 1,
    },
    {
        "id": "transport_walk",
        "category": "Transport",
        "icon": "🚶",
        "title": "Choose a Cleaner Trip",
        "description": (
            "Replace one short motorised trip with walking, cycling "
            "or another lower-impact option where practical."
        ),
        "action": "Walk or cycle for one short trip you would normally make by vehicle.",
        "points": 15,
        "forest_points": 1,
    },
    {
        "id": "lpg_efficient",
        "category": "LPG / Cooking",
        "icon": "🔥",
        "title": "Cook Efficiently",
        "description": (
            "Use practical cooking habits that avoid unnecessary "
            "fuel use."
        ),
        "action": "Use a lid or another efficient cooking habit for one meal today.",
        "points": 10,
        "forest_points": 1,
    },
    {
        "id": "waste_reduce",
        "category": "Waste",
        "icon": "♻️",
        "title": "Reject One Unnecessary Waste Item",
        "description": (
            "Look for one disposable or unnecessary item that you "
            "can avoid, reuse or replace."
        ),
        "action": "Avoid one unnecessary disposable item today.",
        "points": 10,
        "forest_points": 1,
    },
    {
        "id": "nature_action",
        "category": "Forest / Nature",
        "icon": "🌿",
        "title": "Give Nature a Hand",
        "description": (
            "Do one small action that supports or respects the "
            "natural environment around you."
        ),
        "action": "Care for a plant, clean a small natural area, or do another genuine nature-positive action.",
        "points": 15,
        "forest_points": 2,
    },
    {
        "id": "carbon_choice",
        "category": "Carbon Reduction",
        "icon": "🌍",
        "title": "Make One Lower-Carbon Choice",
        "description": (
            "Choose a realistic alternative that reduces unnecessary "
            "resource use or emissions."
        ),
        "action": "Make one deliberate lower-carbon choice today and stick with it.",
        "points": 15,
        "forest_points": 2,
    },
]


def get_todays_challenge():
    """
    Deterministically selects one challenge for the Indian calendar day.

    This means every user receives the same daily challenge without
    needing to store a challenge record for every user.
    """

    today = get_today_date()

    seed_value = sum(
        (index + 1) * ord(character)
        for index, character in enumerate(today)
    )

    index = seed_value % len(CHALLENGES)

    return CHALLENGES[index]


def get_level_from_points(points: int) -> int:
    """
    GreenPulse progression:

    0-99       -> Level 1
    100-199    -> Level 2
    200-299    -> Level 3
    etc.

    Existing user level is updated when challenge points are earned.
    """

    return max(1, (points // 100) + 1)


def challenge_already_completed(connection, user_id, challenge_date):
    return connection.execute(
        """
        SELECT
            id,
            challenge_id,
            category,
            points,
            completed_at
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


# ============================================================
# AUTH — REGISTER
# ============================================================

@app.post("/api/auth/register")
def register(data: RegisterRequest):

    username = data.username.strip()

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters",
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters",
        )

    password_hash = hash_password(data.password)

    created_at = datetime.now(timezone.utc).isoformat()

    connection = get_db()

    try:
        cursor = connection.execute(
            """
            INSERT INTO users
                (username, password_hash, role, created_at)
            VALUES
                (?, ?, 'user', ?)
            RETURNING id
            """,
            (
                username,
                password_hash,
                created_at,
            ),
        )

        returned_row = cursor.fetchone()

        user_id = returned_row["id"]

        connection.commit()

    except (
        sqlite3.IntegrityError,
        PostgresIntegrityError,
    ):
        connection.close()

        raise HTTPException(
            status_code=409,
            detail="Username already exists",
        )

    connection.close()

    return {
        "message": "Account created successfully",
        "user": {
            "id": user_id,
            "username": username,
            "role": "user",
        },
    }


# ============================================================
# AUTH — LOGIN
# ============================================================

@app.post("/api/auth/login")
def login(data: LoginRequest):

    username = data.username.strip()

    connection = get_db()

    user = connection.execute(
        """
        SELECT
            id,
            username,
            password_hash,
            role
        FROM users
        WHERE username = ?
        """,
        (username,),
    ).fetchone()

    if not user:
        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    if not verify_password(
        data.password,
        user["password_hash"],
    ):
        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    token = secrets.token_urlsafe(32)

    created_at = datetime.now(timezone.utc).isoformat()

    connection.execute(
        """
        INSERT INTO sessions
            (token, user_id, created_at)
        VALUES
            (?, ?, ?)
        """,
        (
            token,
            user["id"],
            created_at,
        ),
    )

    connection.commit()
    connection.close()

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
        },
    }


# ============================================================
# AUTH — CURRENT USER
# ============================================================

@app.get("/api/auth/me")
def me(token: str):

    user = get_current_user(token)

    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
        }
    }


# ============================================================
# AUTH — LOGOUT
# ============================================================

@app.post("/api/auth/logout")
def logout(token: str):

    connection = get_db()

    connection.execute(
        """
        DELETE FROM sessions
        WHERE token = ?
        """,
        (token,),
    )

    connection.commit()
    connection.close()

    return {
        "message": "Logged out successfully",
    }


# ============================================================
# BASIC ENDPOINTS
# ============================================================

@app.get("/")
def home():

    return {
        "message": "GreenPulse API is running 🌱",
    }


@app.get("/api/health")
def health():

    return {
        "status": "healthy",
        "service": "GreenPulse backend",
    }


@app.get("/api/impact")
def impact():

    return {
        "points": 72,
        "level": 4,
        "status": "Growing",
    }


# ============================================================
# REVIEWS — CREATE
# ============================================================

@app.post("/api/reviews")
def create_review(data: Review):

    name = data.name.strip()
    review_text = data.review.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    if not review_text:
        raise HTTPException(
            status_code=400,
            detail="Review cannot be empty",
        )

    created_at = datetime.now(timezone.utc).isoformat()

    owner_token = secrets.token_urlsafe(32)

    connection = get_db()

    try:
        cursor = connection.execute(
            """
            INSERT INTO reviews
                (name, rating, review, created_at, owner_token)
            VALUES
                (?, ?, ?, ?, ?)
            RETURNING id
            """,
            (
                name,
                data.rating,
                review_text,
                created_at,
                owner_token,
            ),
        )

        returned_row = cursor.fetchone()

        review_id = returned_row["id"]

        connection.commit()

    except Exception:
        connection.close()
        raise

    connection.close()

    return {
        "message": "Review saved successfully",
        "review": {
            "id": review_id,
            "name": name,
            "rating": data.rating,
            "review": review_text,
            "created_at": created_at,
        },
        "owner_token": owner_token,
    }


# ============================================================
# REVIEWS — READ
# ============================================================

@app.get("/api/reviews")
def get_reviews():

    connection = get_db()

    rows = connection.execute(
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

    connection.close()

    reviews = [dict(row) for row in rows]

    return {
        "reviews": reviews,
    }


# ============================================================
# REVIEWS — UPDATE
# ============================================================

@app.put("/api/reviews/{review_id}")
def update_review(
    review_id: int,
    data: ReviewUpdate,
):

    name = data.name.strip()
    review_text = data.review.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty",
        )

    if not review_text:
        raise HTTPException(
            status_code=400,
            detail="Review cannot be empty",
        )

    connection = get_db()

    row = connection.execute(
        """
        SELECT id
        FROM reviews
        WHERE id = ?
          AND owner_token = ?
        """,
        (
            review_id,
            data.owner_token,
        ),
    ).fetchone()

    if not row:
        connection.close()

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to edit this review",
        )

    connection.execute(
        """
        UPDATE reviews
        SET
            name = ?,
            rating = ?,
            review = ?
        WHERE id = ?
        """,
        (
            name,
            data.rating,
            review_text,
            review_id,
        ),
    )

    connection.commit()
    connection.close()

    return {
        "message": "Review updated successfully",
    }


# ============================================================
# REVIEWS — DELETE
# ============================================================

@app.delete("/api/reviews/{review_id}")
def delete_review(
    review_id: int,
    data: ReviewDelete,
):

    connection = get_db()

    row = connection.execute(
        """
        SELECT id
        FROM reviews
        WHERE id = ?
          AND owner_token = ?
        """,
        (
            review_id,
            data.owner_token,
        ),
    ).fetchone()

    if not row:
        connection.close()

        raise HTTPException(
            status_code=403,
            detail="You do not have permission to delete this review",
        )

    connection.execute(
        """
        DELETE FROM reviews
        WHERE id = ?
        """,
        (review_id,),
    )

    connection.commit()
    connection.close()

    return {
        "message": "Review deleted successfully",
    }


# ============================================================
# DAILY CHALLENGES — TODAY
# ============================================================

@app.get("/api/challenges/today")
def today_challenge(token: str):

    user = get_current_user(token)

    challenge = get_todays_challenge()

    today = get_today_date()

    connection = get_db()

    try:
        completion = challenge_already_completed(
            connection,
            user["id"],
            today,
        )
    finally:
        connection.close()

    return {
        "date": today,
        "challenge": {
            "id": challenge["id"],
            "category": challenge["category"],
            "icon": challenge["icon"],
            "title": challenge["title"],
            "description": challenge["description"],
            "action": challenge["action"],
            "points": challenge["points"],
        },
        "completed": bool(completion),
        "completion": (
            {
                "completed_at": completion["completed_at"],
                "points": completion["points"],
            }
            if completion
            else None
        ),
    }


# ============================================================
# DAILY CHALLENGES — COMPLETE
# ============================================================

@app.post("/api/challenges/complete")
def complete_challenge(data: ChallengeCompleteRequest):

    user = get_current_user(data.token)

    challenge = get_todays_challenge()

    today = get_today_date()

    # --------------------------------------------------------
    # IMPORTANT:
    # The client is NOT trusted to decide which challenge
    # exists today.
    #
    # We compare the submitted challenge_id with the server's
    # actual challenge.
    # --------------------------------------------------------

    if data.challenge_id != challenge["id"]:
        raise HTTPException(
            status_code=400,
            detail="This challenge is no longer active",
        )

    connection = get_db()

    try:

        # ----------------------------------------------------
        # DUPLICATE PROTECTION
        # ----------------------------------------------------

        existing = challenge_already_completed(
            connection,
            user["id"],
            today,
        )

        if existing:
            connection.close()

            raise HTTPException(
                status_code=409,
                detail="Today's challenge has already been completed",
            )

        # ----------------------------------------------------
        # GET CURRENT USER STATS
        # ----------------------------------------------------

        current_user = connection.execute(
            """
            SELECT
                points,
                streak,
                level,
                forest_actions
            FROM users
            WHERE id = ?
            """,
            (user["id"],),
        ).fetchone()

        if not current_user:
            connection.close()

            raise HTTPException(
                status_code=404,
                detail="User account not found",
            )

        old_points = int(current_user["points"])
        old_streak = int(current_user["streak"])
        old_forest_actions = int(current_user["forest_actions"])

        # ----------------------------------------------------
        # STREAK LOGIC
        # ----------------------------------------------------

        previous_date = (
            get_india_now().date()
        )

        from datetime import timedelta

        yesterday = (
            previous_date - timedelta(days=1)
        ).isoformat()

        yesterday_completion = connection.execute(
            """
            SELECT id
            FROM challenge_completions
            WHERE user_id = ?
              AND challenge_date = ?
            LIMIT 1
            """,
            (
                user["id"],
                yesterday,
            ),
        ).fetchone()

        if yesterday_completion:
            new_streak = old_streak + 1
        else:
            new_streak = 1

        # ----------------------------------------------------
        # POINTS
        # ----------------------------------------------------

        challenge_points = int(challenge["points"])

        new_points = old_points + challenge_points

        # ----------------------------------------------------
        # LEVEL
        # ----------------------------------------------------

        new_level = get_level_from_points(new_points)

        # ----------------------------------------------------
        # FOREST
        # ----------------------------------------------------

        forest_gain = int(challenge["forest_points"])

        new_forest_actions = (
            old_forest_actions + forest_gain
        )

        completed_at = datetime.now(timezone.utc).isoformat()

        # ----------------------------------------------------
        # RECORD COMPLETION FIRST
        # ----------------------------------------------------

        try:
            connection.execute(
                """
                INSERT INTO challenge_completions
                    (
                        user_id,
                        challenge_date,
                        challenge_id,
                        category,
                        points,
                        completed_at
                    )
                VALUES
                    (?, ?, ?, ?, ?, ?)
                """,
                (
                    user["id"],
                    today,
                    challenge["id"],
                    challenge["category"],
                    challenge_points,
                    completed_at,
                ),
            )

        except (
            sqlite3.IntegrityError,
            PostgresIntegrityError,
        ):
            connection.rollback()
            connection.close()

            raise HTTPException(
                status_code=409,
                detail="Today's challenge has already been completed",
            )

        # ----------------------------------------------------
        # UPDATE USER PROGRESS
        # ----------------------------------------------------

        connection.execute(
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

        connection.commit()

    except HTTPException:
        raise

    except Exception:
        try:
            connection.rollback()
        except Exception:
            pass

        raise

    finally:
        try:
            connection.close()
        except Exception:
            pass

    return {
        "message": "Challenge completed successfully",
        "challenge": {
            "id": challenge["id"],
            "category": challenge["category"],
            "title": challenge["title"],
            "points": challenge_points,
        },
        "progress": {
            "points": new_points,
            "streak": new_streak,
            "level": new_level,
            "forest_actions": new_forest_actions,
        },
        "forest": {
            "actions_added": forest_gain,
        },
    }


# ============================================================
# DAILY CHALLENGES — HISTORY
# ============================================================

@app.get("/api/challenges/history")
def challenge_history(
    token: str,
    limit: int = 30,
):

    user = get_current_user(token)

    limit = max(1, min(limit, 100))

    connection = get_db()

    try:
        rows = connection.execute(
            f"""
            SELECT
                challenge_date,
                challenge_id,
                category,
                points,
                completed_at
            FROM challenge_completions
            WHERE user_id = ?
            ORDER BY challenge_date DESC
            LIMIT {limit}
            """,
            (user["id"],),
        ).fetchall()
    finally:
        connection.close()

    return {
        "history": [dict(row) for row in rows],
    }


# ============================================================
# DASHBOARD
# ============================================================

@app.get("/api/dashboard")
def dashboard(token: str):

    user = get_current_user(token)

    connection = get_db()

    stats = connection.execute(
        """
        SELECT
            username,
            points,
            streak,
            level,
            forest_actions
        FROM users
        WHERE id = ?
        """,
        (user["id"],),
    ).fetchone()

    connection.close()

    if not stats:
        raise HTTPException(
            status_code=404,
            detail="User account not found",
        )

    return {
        "username": stats["username"],
        "points": stats["points"],
        "streak": stats["streak"],
        "level": stats["level"],
        "forest_actions": stats["forest_actions"],
    }

