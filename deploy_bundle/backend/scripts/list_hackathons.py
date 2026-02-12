import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.hackathon import Hackathon
from app.models.user import User

sqlite_url = "sqlite:///./vibebuild.db"
engine = create_engine(sqlite_url)

def list_hackathons():
    with Session(engine) as session:
        statement = select(Hackathon)
        results = session.exec(statement).all()
        print(f"Found {len(results)} hackathons:")
        for h in results:
            organizer = session.get(User, h.organizer_id)
            organizer_name = organizer.email if organizer else "Unknown"
            print(f"ID: {h.id}, Title: {h.title}, Status: {h.status}, Organizer: {organizer_name} (ID: {h.organizer_id})")

if __name__ == "__main__":
    list_hackathons()
