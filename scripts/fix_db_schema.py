import sqlite3
import os
import sys

def fix_schema():
    # Get DB path from env or default
    db_url = os.environ.get("DATABASE_URL", "sqlite:///./vibebuild.db")
    print(f"Checking schema for DB: {db_url}")
    
    if db_url.startswith("sqlite:///"):
        path = db_url.replace("sqlite:///", "")
        
        # Handle absolute paths in docker
        if path.startswith("/mnt/workspace"):
            # Ensure we are using the correct absolute path
            pass
            
        if not os.path.exists(path):
            print(f"Database file {path} does not exist yet. Skipping fix.")
            return
            
        print(f"Connecting to {path}...")
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        
        # Check hackathon table
        try:
            cursor.execute("PRAGMA table_info(hackathon)")
            columns = [info[1] for info in cursor.fetchall()]
            print(f"Existing columns in hackathon: {columns}")
            
            if not columns:
                print("Table 'hackathon' not found (empty DB?).")
                return

            if 'subtitle' not in columns:
                print("Column 'subtitle' missing in 'hackathon'. Adding it...")
                cursor.execute("ALTER TABLE hackathon ADD COLUMN subtitle VARCHAR")
                conn.commit()
                print("Added 'subtitle' column.")
            else:
                print("'subtitle' column already exists.")
                
        except Exception as e:
            print(f"Error checking schema: {e}")
        finally:
            conn.close()

if __name__ == "__main__":
    fix_schema()
