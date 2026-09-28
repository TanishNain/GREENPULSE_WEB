import sqlite3
import os

files = [
    "backend/greenpulse.db",
    "backend/venv/greenpulse.db",
    "backend/venv/greenpulse_backup_before_merge.db",
]

for file in files:
    print("\n==============================")
    print("FILE:", file)
    print("SIZE:", os.path.getsize(file), "bytes")

    if os.path.getsize(file) == 0:
        print("STATUS: EMPTY FILE")
        continue

    db = sqlite3.connect(file)

    tables = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table'"
    ).fetchall()

    print("TABLES:", tables)

    try:
        reviews = db.execute(
            "SELECT COUNT(*) FROM reviews"
        ).fetchone()[0]
        print("REVIEWS:", reviews)
    except sqlite3.OperationalError:
        print("REVIEWS: reviews table does not exist")

    db.close()

print("\nDONE")