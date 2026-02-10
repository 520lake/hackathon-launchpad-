import sqlite3
import os

# Use absolute path to ensure we find the DB
db_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "vibebuild.db"))

def delete_hackathons_raw():
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    hackathon_ids = (1, 2)
    ids_str = "1, 2"
    
    try:
        print(f"Connected to {db_path}")
        
        # 1. Get Team IDs
        cursor.execute(f"SELECT id FROM team WHERE hackathon_id IN ({ids_str})")
        team_ids = [row[0] for row in cursor.fetchall()]
        team_ids_str = ",".join(map(str, team_ids)) if team_ids else None
        
        if team_ids_str:
            # 2. Get Project IDs
            cursor.execute(f"SELECT id FROM project WHERE team_id IN ({team_ids_str})")
            project_ids = [row[0] for row in cursor.fetchall()]
            project_ids_str = ",".join(map(str, project_ids)) if project_ids else None
            
            if project_ids_str:
                # 3. Delete Scores
                print(f"Deleting Scores for projects: {project_ids_str}")
                cursor.execute(f"DELETE FROM score WHERE project_id IN ({project_ids_str})")
                
                # 4. Delete Projects
                print(f"Deleting Projects: {project_ids_str}")
                cursor.execute(f"DELETE FROM project WHERE id IN ({project_ids_str})")
            
            # 5. Delete Team Members
            print(f"Deleting Team Members for teams: {team_ids_str}")
            cursor.execute(f"DELETE FROM teammember WHERE team_id IN ({team_ids_str})")
            
            # 6. Delete Teams
            print(f"Deleting Teams: {team_ids_str}")
            cursor.execute(f"DELETE FROM team WHERE id IN ({team_ids_str})")
        
        # 7. Delete Enrollments
        print("Deleting Enrollments...")
        cursor.execute(f"DELETE FROM enrollment WHERE hackathon_id IN ({ids_str})")
        
        # 8. Delete Hackathons
        print(f"Deleting Hackathons: {ids_str}")
        cursor.execute(f"DELETE FROM hackathon WHERE id IN ({ids_str})")
        
        conn.commit()
        print("Deletion complete.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    delete_hackathons_raw()
