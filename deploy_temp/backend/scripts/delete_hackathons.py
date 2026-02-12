import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.hackathon import Hackathon

sqlite_url = "sqlite:///./vibebuild.db"
engine = create_engine(sqlite_url)

def delete_hackathons():
    with Session(engine) as session:
        # Find hackathons 1 and 2
        statement = select(Hackathon).where(Hackathon.id.in_([1, 2]))
        results = session.exec(statement).all()
        
        if not results:
            print("No hackathons found with ID 1 or 2.")
            return

        print(f"Deleting {len(results)} hackathons...")
        for h in results:
            print(f"Deleting Hackathon ID: {h.id}, Title: {h.title}")
            session.delete(h)
        
        session.commit()
        print("Deletion complete.")

if __name__ == "__main__":
    delete_hackathons()
