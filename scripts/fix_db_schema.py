import sqlite3
import os
import sys

def fix_schema():
    # Force flushing of stdout for logs
    sys.stdout.reconfigure(line_buffering=True)

    print("--- FORCE FIX SCHEMA START ---")
    
    # Get DB path from env or default
    db_url = os.environ.get("DATABASE_URL", "sqlite:///./vibebuild.db")
    print(f"Checking schema for DB_URL: {db_url}")
    
    path = "vibebuild.db" # default relative
    
    if db_url.startswith("sqlite:///"):
        extracted_path = db_url.replace("sqlite:///", "")
        if extracted_path:
            path = extracted_path
            
    # Handle Docker absolute path consistency
    # If path starts with /mnt/workspace, ensure we check that exact file
    print(f"Target DB Path: {path}")
    
    if not os.path.exists(path):
        print(f"WARNING: Database file {path} does not exist yet. It should have been created by Alembic.")
        # Try to list directory contents to help debugging
        dir_path = os.path.dirname(path)
        if dir_path and os.path.exists(dir_path):
            print(f"Listing contents of {dir_path}:")
            try:
                print(os.listdir(dir_path))
            except Exception as e:
                print(f"Error listing dir: {e}")
        else:
            print(f"Directory {dir_path} does not exist.")
        return

    print(f"Connecting to {path}...")
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        
        # 1. Check hackathon table
        try:
            cursor.execute("PRAGMA table_info(hackathon)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Existing columns in 'hackathon': {columns}")
            
            if not columns:
                print("Table 'hackathon' not found (empty DB?).")
            else:
                if 'subtitle' not in columns:
                    print("Column 'subtitle' missing in 'hackathon'. Adding it...")
                    cursor.execute("ALTER TABLE hackathon ADD COLUMN subtitle VARCHAR")
                    conn.commit()
                    print("SUCCESS: Added 'subtitle' column.")
                else:
                    print("OK: 'subtitle' column already exists.")
                    
                if 'resource_detail' not in columns:
                    print("Column 'resource_detail' missing in 'hackathon'. Adding it...")
                    cursor.execute("ALTER TABLE hackathon ADD COLUMN resource_detail VARCHAR")
                    conn.commit()
                    print("SUCCESS: Added 'resource_detail' column.")
                    
        except Exception as e:
            print(f"Error checking 'hackathon' table: {e}")

        # 2. Check project table (for cover_image issue)
        try:
            cursor.execute("PRAGMA table_info(project)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Existing columns in 'project': {columns}")
            
            if columns:
                if 'cover_image' not in columns:
                    print("Column 'cover_image' missing in 'project'. Adding it...")
                    cursor.execute("ALTER TABLE project ADD COLUMN cover_image VARCHAR")
                    conn.commit()
                    print("SUCCESS: Added 'cover_image' column.")
                else:
                    print("OK: 'cover_image' column already exists.")
        except Exception as e:
            print(f"Error checking 'project' table: {e}")
            
    except Exception as e:
        print(f"CRITICAL ERROR connecting to DB: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("DB Connection closed.")
            
    print("--- FORCE FIX SCHEMA END ---")

if __name__ == "__main__":
    fix_schema()
