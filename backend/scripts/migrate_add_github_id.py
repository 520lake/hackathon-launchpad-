import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "..", "vibebuild.db")
db_path = os.path.abspath(db_path)

print(f"Database path: {db_path}")

if not os.path.exists(db_path):
    print("Database file not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE user ADD COLUMN github_id VARCHAR")
    print("Successfully added github_id column to user table")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e):
        print("Column github_id already exists")
    else:
        print(f"Error: {e}")

conn.commit()
conn.close()
