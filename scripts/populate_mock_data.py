import os
import sys
import random
import json
import sqlite3
from datetime import datetime
from sqlmodel import Session, select

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.config import settings
# Force update DATABASE_URL if needed, but better to check what it is
print(f"Current DATABASE_URL: {settings.DATABASE_URL}")

from app.db.session import engine
from app.models.hackathon import Hackathon
from app.models.team_project import Team, Project
from app.models.enrollment import Enrollment
from app.models.user import User
from app.models.judge import Judge

def check_db():
    print(f"Checking database...")
    # Parse path from settings.DATABASE_URL
    url = settings.DATABASE_URL
    if url.startswith("sqlite:///"):
        path = url.replace("sqlite:///", "")
        if path.startswith("./"):
            # Resolve relative to CWD
            path = os.path.abspath(path)
        print(f"Resolved DB path: {path}")
        
        if os.path.exists(path):
            print(f"Database found at {path}")
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
            tables = cursor.fetchall()
            print("Tables in DB:", [t[0] for t in tables])
            conn.close()
        else:
            print(f"Database file {path} not found!")

def populate_mock_data():
    check_db()
    print("Starting mock data population...")
    
    try:
        with Session(engine) as session:
            # Get existing hackathons
            hackathons = session.exec(select(Hackathon)).all()
            if not hackathons:
                print("No hackathons found. Please create some hackathons first.")
                return

            # Get some users (excluding ID 1)
            users = session.exec(select(User).where(User.id > 1)).all()
            if not users:
                print("No users found. Creating dummy users...")
                for i in range(5):
                    u = User(
                        email=f"user{i}@example.com",
                        hashed_password="hashed_password",
                        full_name=f"User {i}",
                        nickname=f"Dev_{i}",
                        is_active=True
                    )
                    session.add(u)
                session.commit()
                users = session.exec(select(User).where(User.id > 1)).all()

            for h in hackathons:
                print(f"Processing hackathon: {h.title} (ID: {h.id})")
                
                # 1. Create Enrollments
                participants = random.sample(users, min(len(users), random.randint(3, 5)))
                for user in participants:
                    existing = session.exec(select(Enrollment).where(Enrollment.user_id == user.id, Enrollment.hackathon_id == h.id)).first()
                    if not existing:
                        enroll = Enrollment(
                            user_id=user.id,
                            hackathon_id=h.id,
                            status='approved',
                            created_at=datetime.utcnow()
                        )
                        session.add(enroll)
                session.commit()

                # 2. Create Teams and Projects
                for i in range(random.randint(2, 5)): # Increase number of projects
                    leader = participants[i % len(participants)]
                    
                    team_name = f"Team {leader.nickname} @ {h.id}-{i}"
                    team = session.exec(select(Team).where(Team.hackathon_id == h.id, Team.name == team_name)).first()
                    
                    if not team:
                        team = Team(
                            name=team_name,
                            hackathon_id=h.id,
                            leader_id=leader.id,
                            description=f"A specialized team for {h.title}"
                        )
                        session.add(team)
                        session.commit()
                        session.refresh(team)
                    
                    project_title = f"Project {['Alpha', 'Beta', 'Gamma', 'Delta', 'Omega'][i % 5]} {h.id}-{i}"
                    project = session.exec(select(Project).where(Project.team_id == team.id)).first()
                    
                    if not project:
                        # Logic for status
                        if h.status == 'ended':
                            status = 'graded' # Should be graded
                            score = random.randint(60, 95)
                        elif h.status == 'judging':
                            status = 'submitted' # Submitted, waiting for grading
                            score = 0
                        elif h.status == 'ongoing':
                             status = 'submitted' if i % 2 == 0 else 'draft' # Mix
                             score = 0
                        else:
                            status = 'draft'
                            score = 0

                        project = Project(
                            title=project_title,
                            description=f"This is a demo project for {h.title}. It features AI integration and cool UI.",
                            hackathon_id=h.id,
                            team_id=team.id,
                            status=status,
                            cover_image=f"https://picsum.photos/seed/{h.id}{i}/800/400",
                            repo_url="https://github.com/example/project",
                            demo_url="https://example.com/demo",
                            total_score=score
                        )
                        session.add(project)
                
                session.commit()
                
                # 3. Create Results & Dimensions
                # Add dimensions to all hackathons if missing
                if not h.scoring_dimensions:
                     dims = [
                         {"name": "Innovation", "description": "Novelty of the idea", "weight": 30},
                         {"name": "Technical", "description": "Code quality and complexity", "weight": 30},
                         {"name": "Design", "description": "UI/UX and aesthetics", "weight": 20},
                         {"name": "Completeness", "description": "Functional features", "weight": 20}
                     ]
                     h.scoring_dimensions = json.dumps(dims)
                     session.add(h)
                     session.commit()

                if h.status == 'ended':
                    winners = []
                    teams = session.exec(select(Team).where(Team.hackathon_id == h.id)).all()
                    for idx, team in enumerate(teams[:3]):
                        project = session.exec(select(Project).where(Project.team_id == team.id)).first()
                        if project:
                            winners.append({
                                "award_name": ["First Prize", "Second Prize", "Third Prize"][idx],
                                "team_name": team.name,
                                "project_name": project.title,
                                "project_id": project.id,
                                "prize": ["¥10,000", "¥5,000", "¥2,000"][idx]
                            })
                    
                    h.results_detail = json.dumps(winners)
                    session.add(h)
                    session.commit()
                    print(f"  Added results for {h.title}")

                # 4. Make User ID 1 a Judge for Judging/Ended Hackathons
                if h.status in ['judging', 'ended']:
                    # Assuming User 1 is the main admin/tester
                    admin_id = 1
                    existing_judge = session.exec(select(Judge).where(Judge.hackathon_id == h.id, Judge.user_id == admin_id)).first()
                    if not existing_judge:
                        judge = Judge(user_id=admin_id, hackathon_id=h.id)
                        session.add(judge)
                        session.commit()
                        print(f"  Added User {admin_id} as Judge for {h.title}")


        print("Mock data population completed!")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    populate_mock_data()
