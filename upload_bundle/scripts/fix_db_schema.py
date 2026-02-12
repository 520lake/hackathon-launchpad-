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
            
    print(f"Target DB Path: {path}")
    
    # Check if file exists
    if not os.path.exists(path):
        print(f"WARNING: Database file {path} does not exist. Creating it now via connect...")
        
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        
        # Helper to check and add column
        def ensure_column(table, column, col_type="VARCHAR"):
            try:
                print(f"Checking table '{table}' for column '{column}'...")
                cursor.execute(f"PRAGMA table_info({table})")
                columns = [info[1] for info in cursor.fetchall()]
                
                if not columns:
                    print(f"  Table '{table}' does not exist! Skipping.")
                    return
                
                if column not in columns:
                    print(f"  Column '{column}' missing. Adding...")
                    try:
                        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
                        conn.commit()
                        print(f"  SUCCESS: Added '{column}'.")
                    except Exception as e:
                        print(f"  ERROR adding '{column}': {e}")
                else:
                    print(f"  OK: '{column}' exists.")
            except Exception as e:
                print(f"  ERROR checking table '{table}': {e}")

        # 1. Hackathon table
        ensure_column("hackathon", "subtitle")
        ensure_column("hackathon", "resource_detail")
        ensure_column("hackathon", "cover_image") # Some versions might miss this
        
        # 2. Project table
        ensure_column("project", "cover_image")
        
        # 3. Verify Hackathon columns
        print("Verifying 'hackathon' table schema:")
        cursor.execute("PRAGMA table_info(hackathon)")
        cols = [info[1] for info in cursor.fetchall()]
        print(f"  Columns: {cols}")
        
        if 'subtitle' in cols:
            print("  VERIFICATION PASS: 'subtitle' is present.")
        else:
            print("  VERIFICATION FAIL: 'subtitle' is MISSING after attempt.")

    except Exception as e:
        print(f"CRITICAL ERROR connecting to DB: {e}")
    finally:
        if 'conn' in locals():
            conn.close()
            print("DB Connection closed.")
            
    print("--- FORCE FIX SCHEMA END ---")

if __name__ == "__main__":
    fix_schema()
