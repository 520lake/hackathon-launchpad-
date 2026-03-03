import sys
import os
import json
from datetime import datetime, timedelta
import random

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.models.team_project import Team, TeamMember, Project, ProjectStatus
from app.models.judge import Judge
from app.core.config import settings

# Database Setup
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("sqlite:///./"):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_name = db_url.replace("sqlite:///./", "")
    db_path = os.path.join(project_root, db_name)
    db_url = f"sqlite:///{db_path}"

engine = create_engine(db_url)

def create_mock_data():
    with Session(engine) as session:
        # 1. Ensure Admin User exists
        admin_email = "admin@aura.com"
        admin = session.exec(select(User).where(User.email == admin_email)).first()
        if not admin:
            print("Creating Admin user...")
            admin = User(
                email=admin_email,
                full_name="Aura Admin",
                nickname="Admin",
                is_superuser=True,
                is_verified=True,
                is_active=True,
                avatar_url="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
            )
            session.add(admin)
            session.commit()
            session.refresh(admin)
        
        # 2. Create Participants
        participants = []
        for i in range(1, 6):
            email = f"user{i}@example.com"
            user = session.exec(select(User).where(User.email == email)).first()
            if not user:
                user = User(
                    email=email,
                    full_name=f"Developer {i}",
                    nickname=f"Dev{i}",
                    is_active=True,
                    is_verified=True,
                    avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed=Dev{i}",
                    skills="Python, React, Rust, AI" if i % 2 == 0 else "Go, Vue, Solidity"
                )
                session.add(user)
                session.commit()
                session.refresh(user)
            participants.append(user)

        # 3. Create Hackathons
        print("Creating Hackathons...")
        
        # --- Hackathon 1: Web3 Gaming (Ongoing, for testing Judging) ---
        h1_title = "Web3 Gaming Revolution"
        h1 = session.exec(select(Hackathon).where(Hackathon.title == h1_title)).first()
        if not h1:
            h1 = Hackathon(
                title=h1_title,
                subtitle="Build the next generation of decentralized games",
                description="## Overview\nCreate innovative games using blockchain technology.\n\n### Tracks\n- DeFi Kingdoms\n- NFT Integration\n- Autonomous Worlds",
                organizer_id=admin.id,
                organizer_name="Aura Labs",
                status=HackathonStatus.ONGOING,
                format=HackathonFormat.ONLINE,
                registration_type=RegistrationType.TEAM,
                cover_image="https://images.unsplash.com/photo-1614726365723-49cfae96a6f6?q=80&w=2670&auto=format&fit=crop",
                theme_tags="Web3,Gaming,Metaverse",
                professionalism_tags="Intermediate,Hardcore",
                start_date=datetime.now() - timedelta(days=5),
                end_date=datetime.now() + timedelta(days=20),
                registration_start_date=datetime.now() - timedelta(days=10),
                registration_end_date=datetime.now() + timedelta(days=10),
                submission_start_date=datetime.now() - timedelta(days=5),
                submission_end_date=datetime.now() + timedelta(days=15),
                judging_start_date=datetime.now() + timedelta(days=15),
                judging_end_date=datetime.now() + timedelta(days=20),
                # JSON Fields
                scoring_dimensions=json.dumps([
                    {"name": "Innovation", "description": "How unique is the idea?", "weight": 30},
                    {"name": "Technicality", "description": "Code quality and complexity", "weight": 30},
                    {"name": "Design", "description": "UI/UX and game mechanics", "weight": 20},
                    {"name": "Completeness", "description": "Is the game playable?", "weight": 20}
                ]),
                awards_detail=json.dumps([
                    {"name": "First Prize", "count": 1, "amount": 5000, "type": "cash"},
                    {"name": "Best Visuals", "count": 1, "amount": 1000, "type": "cash"}
                ]),
                contact_info=json.dumps({"text": "contact@web3game.io", "image": ""})
            )
            session.add(h1)
            session.commit()
            session.refresh(h1)
            
            # Add Judge (Admin is judge)
            judge = Judge(user_id=admin.id, hackathon_id=h1.id)
            session.add(judge)
            
            # Add Teams and Projects for H1
            t1 = Team(name="CryptoKnights", hackathon_id=h1.id, leader_id=participants[0].id, description="RPG on chain")
            session.add(t1)
            session.commit()
            session.refresh(t1)
            
            p1 = Project(
                title="CryptoKnights RPG",
                description="A fully on-chain RPG where every item is an NFT. Built with Solidity and Unity.",
                team_id=t1.id,
                repo_url="https://github.com/example/cryptoknights",
                demo_url="https://cryptoknights.io",
                cover_image="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=2670"
            )
            session.add(p1)
            
            t2 = Team(name="PixelVerse", hackathon_id=h1.id, leader_id=participants[1].id, description="Metaverse land")
            session.add(t2)
            session.commit()
            session.refresh(t2)
            
            p2 = Project(
                title="PixelVerse Land",
                description="Virtual world platform. Users can buy land and build experiences.",
                team_id=t2.id,
                repo_url="https://github.com/example/pixelverse",
                status=ProjectStatus.SUBMITTED
            )
            session.add(p2)
            session.commit()


        # --- Hackathon 2: AI Agent Challenge (Published, Recruiting) ---
        h2_title = "AI Agent Challenge 2026"
        h2 = session.exec(select(Hackathon).where(Hackathon.title == h2_title)).first()
        if not h2:
            h2 = Hackathon(
                title=h2_title,
                subtitle="Build autonomous agents that solve real problems",
                description="## The Challenge\nBuild AI Agents using ModelScope and Qwen.\n\n### Scenarios\n- Customer Service\n- Coding Assistants\n- Data Analysis",
                organizer_id=admin.id,
                organizer_name="ModelScope Community",
                status=HackathonStatus.PUBLISHED,
                format=HackathonFormat.ONLINE,
                registration_type=RegistrationType.INDIVIDUAL,
                cover_image="https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=2670",
                theme_tags="AI,LLM,Agents",
                professionalism_tags="Advanced",
                start_date=datetime.now() + timedelta(days=10),
                end_date=datetime.now() + timedelta(days=15),
                registration_start_date=datetime.now(),
                registration_end_date=datetime.now() + timedelta(days=10),
                submission_start_date=datetime.now() + timedelta(days=10),
                submission_end_date=datetime.now() + timedelta(days=15),
                judging_start_date=datetime.now() + timedelta(days=15),
                judging_end_date=datetime.now() + timedelta(days=17),
                scoring_dimensions=json.dumps([
                    {"name": "Intelligence", "description": "Agent capabilities", "weight": 50},
                    {"name": "Utility", "description": "Real world value", "weight": 50}
                ]),
                awards_detail=json.dumps([
                    {"name": "Grand Prize", "count": 1, "amount": 10000, "type": "cash"}
                ])
            )
            session.add(h2)
            session.commit()

        # --- Hackathon 3: Rust Systems Hack (Ended) ---
        h3_title = "Rust Systems Hack"
        h3 = session.exec(select(Hackathon).where(Hackathon.title == h3_title)).first()
        if not h3:
            h3 = Hackathon(
                title=h3_title,
                subtitle="Low level programming for high performance",
                description="Rewrite everything in Rust.",
                organizer_id=admin.id,
                organizer_name="Rust Foundation",
                status=HackathonStatus.ENDED,
                format=HackathonFormat.OFFLINE,
                location="Shanghai, China",
                cover_image="https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=2670",
                theme_tags="Rust,Systems,Database",
                start_date=datetime.now() - timedelta(days=30),
                end_date=datetime.now() - timedelta(days=28),
                scoring_dimensions=json.dumps([
                    {"name": "Performance", "description": "Benchmarks", "weight": 60},
                    {"name": "Safety", "description": "Memory safety", "weight": 40}
                ])
            )
            session.add(h3)
            session.commit()

        print("Mock data generated successfully!")

if __name__ == "__main__":
    create_mock_data()
