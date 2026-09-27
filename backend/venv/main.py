from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import sqlite3
import os
import secrets
import hashlib
from datetime import datetime, timezone


app = FastAPI(
    title="GreenPulse API",
    description="Backend API for the GreenPulse website",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "greenpulse.db")


def get_db():
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)

    password_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=16384,
        r=8,
        p=1,
    )

    return (
        salt.hex()
        + ":"
        + password_hash.hex()
    )


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

def get_current_user(token: str):
    connection = get_db()

    user = connection.execute(
        """
        SELECT users.id, users.username, users.role
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ?
        """,
        (token,),
    ).fetchone()

    connection.close()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired session"
        )

    return user

def init_db():
    connection = get_db()

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

    for column, definition in [
        ("points", "INTEGER NOT NULL DEFAULT 0"),
        ("streak", "INTEGER NOT NULL DEFAULT 0"),
        ("level", "INTEGER NOT NULL DEFAULT 1"),
        ("forest_actions", "INTEGER NOT NULL DEFAULT 0"),
    ]:
        try:
            connection.execute(
                f"ALTER TABLE users ADD COLUMN {column} {definition}"
            )
        except sqlite3.OperationalError:
            pass

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

    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            review TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )

    columns = connection.execute(
        "PRAGMA table_info(reviews)"
    ).fetchall()

    column_names = [column["name"] for column in columns]

    if "owner_token" not in column_names:
        connection.execute(
            "ALTER TABLE reviews ADD COLUMN owner_token TEXT"
        )

    connection.commit()
    connection.close()

init_db()


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

@app.post("/api/auth/register")
def register(data: RegisterRequest):
    username = data.username.strip()

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters"
        )

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    password_hash = hash_password(data.password)
    created_at = datetime.now(timezone.utc).isoformat()

    connection = get_db()

    try:
        cursor = connection.execute(
            """
            INSERT INTO users
            (username, password_hash, role, created_at)
            VALUES (?, ?, 'user', ?)
            """,
            (
                username,
                password_hash,
                created_at,
            ),
        )

        connection.commit()

    except sqlite3.IntegrityError:
        connection.close()

        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    connection.close()

    return {
        "message": "Account created successfully",
        "user": {
            "id": cursor.lastrowid,
            "username": username,
            "role": "user",
        },
    }
@app.post("/api/auth/login")
def login(data: LoginRequest):
    username = data.username.strip()

    connection = get_db()

    user = connection.execute(
        """
        SELECT id, username, password_hash, role
        FROM users
        WHERE username = ?
        """,
        (username,),
    ).fetchone()

    if not user or not verify_password(
        data.password,
        user["password_hash"],
    ):
        connection.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    token = secrets.token_urlsafe(32)
    created_at = datetime.now(timezone.utc).isoformat()

    connection.execute(
        """
        INSERT INTO sessions
        (token, user_id, created_at)
        VALUES (?, ?, ?)
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
        "message": "Logged out successfully"
    }

@app.get("/")
def home():
    return {
        "message": "GreenPulse API is running 🌱"
    }


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "GreenPulse backend"
    }


@app.get("/api/impact")
def impact():
    return {
        "points": 72,
        "level": 4,
        "status": "Growing"
    }


@app.post("/api/reviews")
def create_review(data: Review):
    name = data.name.strip()
    review_text = data.review.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name cannot be empty"
        )

    if not review_text:
        raise HTTPException(
            status_code=400,
            detail="Review cannot be empty"
        )

    created_at = datetime.now(timezone.utc).isoformat()

    owner_token = secrets.token_urlsafe(32)

    connection = get_db()

    cursor = connection.execute(
        """
        INSERT INTO reviews
        (name, rating, review, created_at, owner_token)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            name,
            data.rating,
            review_text,
            created_at,
            owner_token
        ),
    )

    connection.commit()

    review_id = cursor.lastrowid

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


@app.get("/api/reviews")
def get_reviews():
    connection = get_db()

    rows = connection.execute(
        """
        SELECT id, name, rating, review, created_at
        FROM reviews
        ORDER BY id DESC
        """
    ).fetchall()

    connection.close()

    reviews = [dict(row) for row in rows]

    return {
        "reviews": reviews
    }


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
            detail="Name cannot be empty"
        )

    if not review_text:
        raise HTTPException(
            status_code=400,
            detail="Review cannot be empty"
        )

    connection = get_db()

    row = connection.execute(
        """
        SELECT id
        FROM reviews
        WHERE id = ? AND owner_token = ?
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
            detail="You do not have permission to edit this review"
        )

    connection.execute(
        """
        UPDATE reviews
        SET name = ?, rating = ?, review = ?
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
        "message": "Review updated successfully"
    }


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
        WHERE id = ? AND owner_token = ?
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
            detail="You do not have permission to delete this review"
        )

    connection.execute(
        """
        DELETE FROM reviews
        WHERE id = ?
        """,
        (review_id,),
    )
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

    return {
        "username": stats["username"],
        "points": stats["points"],
        "streak": stats["streak"],
        "level": stats["level"],
        "forest_actions": stats["forest_actions"],
    }

    connection.commit()
    connection.close()

    return {
        "message": "Review deleted successfully"
    }

