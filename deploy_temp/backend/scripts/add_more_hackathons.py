import sys
import os
import json
import random
from datetime import datetime, timedelta

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.core.config import settings

# Database Setup
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("sqlite:///./"):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_name = db_url.replace("sqlite:///./", "")
    db_path = os.path.join(project_root, db_name)
    db_url = f"sqlite:///{db_path}"

engine = create_engine(db_url)

def create_more_hackathons():
    with Session(engine) as session:
        print("Creating more hackathons...")
        
        # Get Admin User
        admin = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        if not admin:
            print("Admin user not found. Using first user as organizer.")
            admin = session.exec(select(User)).first()
            if not admin:
                print("No users found. Run generate_mock_data.py first.")
                return

        hackathons_data = [
            {
                "title": "AI for Social Good 2026",
                "description": "Build AI solutions that address global challenges like climate change, inequality, and healthcare access. Let's make the world better with code.",
                "start_date": datetime.utcnow(),
                "end_date": datetime.utcnow() + timedelta(days=14),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "Global / Remote",
                "organizer_id": admin.id,
                "max_teams": 100,
                "prize_pool": "$50,000",
                "cover_image": "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&q=80&w=2070",
                "tags": ["AI", "Social Good", "SDGs", "Python"]
            },
            {
                "title": "FinTech Future Summit",
                "description": "Redefining the future of finance. From DeFi to Neo-banking, explore the next generation of financial technology. Hosted in Shanghai.",
                "start_date": datetime.utcnow() + timedelta(days=30),
                "end_date": datetime.utcnow() + timedelta(days=32),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.OFFLINE,
                "location": "Shanghai Convention Center",
                "organizer_id": admin.id,
                "max_teams": 50,
                "prize_pool": "¥200,000",
                "cover_image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=2070",
                "tags": ["FinTech", "Blockchain", "DeFi", "Payments"]
            },
            {
                "title": "CyberDefense CTF 2025",
                "description": "The ultimate Capture The Flag competition. Test your skills in penetration testing, cryptography, and reverse engineering. (Ended)",
                "start_date": datetime.utcnow() - timedelta(days=60),
                "end_date": datetime.utcnow() - timedelta(days=58),
                "status": HackathonStatus.ENDED,
                "format": HackathonFormat.OFFLINE,
                "location": "Beijing & Online",
                "organizer_id": admin.id,
                "max_teams": 200,
                "prize_pool": "¥100,000",
                "cover_image": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070",
                "tags": ["Security", "CTF", "Hacking", "Cyber"]
            },
            {
                "title": "HealthTech Innovation Marathon",
                "description": "Innovating for a healthier tomorrow. Focus on telemedicine, wearable tech, and personalized medicine.",
                "start_date": datetime.utcnow() - timedelta(days=5),
                "end_date": datetime.utcnow() + timedelta(days=25),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "Online",
                "organizer_id": admin.id,
                "max_teams": 80,
                "prize_pool": "$30,000",
                "cover_image": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070",
                "tags": ["Health", "MedTech", "Wearables", "Data"]
            },
            {
                "title": "EduTech Global Hack",
                "description": "Transforming education through technology. Create tools for remote learning, gamification, and accessible education.",
                "start_date": datetime.utcnow() + timedelta(days=10),
                "end_date": datetime.utcnow() + timedelta(days=12),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.ONLINE,
                "location": "Online",
                "organizer_id": admin.id,
                "max_teams": 150,
                "prize_pool": "$25,000",
                "cover_image": "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=2022",
                "tags": ["Education", "EdTech", "Gamification"]
            },
             {
                "title": "Green Energy Challenge",
                "description": "Sustainable energy solutions for a greener planet. Smart grids, renewable optimization, and carbon tracking.",
                "start_date": datetime.utcnow() - timedelta(days=1),
                "end_date": datetime.utcnow() + timedelta(days=2),
                "status": HackathonStatus.PUBLISHED,
                "format": HackathonFormat.OFFLINE,
                "location": "Shenzhen",
                "organizer_id": admin.id,
                "max_teams": 30,
                "prize_pool": "¥150,000",
                "cover_image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&q=80&w=2070",
                "tags": ["Energy", "Green", "Sustainability", "IoT"]
            }
        ]

        count = 0
        for h_data in hackathons_data:
            # Check if exists
            existing = session.exec(select(Hackathon).where(Hackathon.title == h_data["title"])).first()
            if not existing:
                hackathon = Hackathon(**h_data)
                session.add(hackathon)
                count += 1
        
        session.commit()
        print(f"Successfully added {count} new hackathons!")

if __name__ == "__main__":
    create_more_hackathons()
