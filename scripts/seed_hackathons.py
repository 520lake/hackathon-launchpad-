import os
import sys
import json
from datetime import datetime, timedelta
from sqlmodel import Session, select

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from app.core.config import settings
from app.db.session import engine
from app.models.hackathon import Hackathon, HackathonStatus, RegistrationType, HackathonFormat
from app.models.user import User

def seed_hackathons():
    print("Checking for existing hackathons...")
    with Session(engine) as session:
        # Check if admin exists (needed for organizer_id)
        admin = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        if not admin:
            print("Admin user not found! Please run initial_data.py first.")
            return
        
        existing_hackathons = session.exec(select(Hackathon)).all()
        if existing_hackathons:
            print(f"Found {len(existing_hackathons)} hackathons. Skipping seeding.")
            return

        print("No hackathons found. Seeding initial data...")
        
        now = datetime.utcnow()
        
        # 1. Aura Global AI Challenge (Ongoing - Submission/Judging)
        h1 = Hackathon(
            title="Aura Global AI Challenge 2026",
            subtitle="Redefining the Future of AI Agents",
            description="Join us in building the next generation of autonomous agents. Focus on reasoning, multimodal interaction, and edge deployment.",
            cover_image="https://img.alicdn.com/imgextra/i4/O1CN01Z5PaLz1O793rLwB_!!6000000001644-0-tps-1024-1024.jpg",
            theme_tags="AI,Agents,LLM",
            professionalism_tags="Advanced",
            registration_type=RegistrationType.TEAM,
            format=HackathonFormat.ONLINE,
            organizer_id=admin.id,
            organizer_name="Aura Foundation",
            start_date=now - timedelta(days=10),
            end_date=now + timedelta(days=20),
            registration_start_date=now - timedelta(days=15),
            registration_end_date=now - timedelta(days=5),
            submission_start_date=now - timedelta(days=5),
            submission_end_date=now + timedelta(days=10),
            judging_start_date=now + timedelta(days=10),
            judging_end_date=now + timedelta(days=15),
            status=HackathonStatus.ONGOING,
            contact_info=json.dumps({"text": "contact@aura.com", "image": ""}),
            awards_detail=json.dumps([
                {"title": "Gold Award", "count": 1, "reward": "$10,000"},
                {"title": "Silver Award", "count": 2, "reward": "$5,000"},
                {"title": "Bronze Award", "count": 3, "reward": "$2,000"}
            ]),
            scoring_dimensions=json.dumps([
                {"name": "Innovation", "weight": 0.4, "description": "Novelty of the solution"},
                {"name": "Technicality", "weight": 0.3, "description": "Code quality and architecture"},
                {"name": "Completeness", "weight": 0.3, "description": "Finished features and UX"}
            ])
        )
        
        # 2. ModelScope Innovation Cup (Registration Open)
        h2 = Hackathon(
            title="ModelScope Innovation Cup",
            subtitle="Build with ModelScope SDK",
            description="Leverage the power of ModelScope's model-as-a-service platform to solve real-world problems in computer vision and NLP.",
            cover_image="https://img.alicdn.com/imgextra/i2/O1CN01f8gOQG1t5s5K4J7_!!6000000005844-0-tps-1024-1024.jpg",
            theme_tags="CV,NLP,ModelScope",
            professionalism_tags="Intermediate",
            registration_type=RegistrationType.INDIVIDUAL,
            format=HackathonFormat.ONLINE,
            organizer_id=admin.id,
            organizer_name="ModelScope Team",
            start_date=now + timedelta(days=5),
            end_date=now + timedelta(days=35),
            registration_start_date=now,
            registration_end_date=now + timedelta(days=15),
            status=HackathonStatus.PUBLISHED,
            contact_info=json.dumps({"text": "support@modelscope.cn", "image": ""}),
            awards_detail=json.dumps([
                {"title": "Best Model", "count": 1, "reward": "RTX 4090"},
                {"title": "Best App", "count": 1, "reward": "MacBook Pro"}
            ])
        )
        
        # 3. DeepSeek Reasoning Hackathon (Ended)
        h3 = Hackathon(
            title="DeepSeek Reasoning Hackathon",
            subtitle="Pushing the Limits of Logic",
            description="A hardcore challenge focused on mathematical reasoning and code generation tasks using DeepSeek-V3.",
            cover_image="https://img.alicdn.com/imgextra/i3/O1CN019k7y6D1w5z8H4J5_!!6000000007244-0-tps-1024-1024.jpg",
            theme_tags="Math,Code,DeepSeek",
            professionalism_tags="Expert",
            registration_type=RegistrationType.TEAM,
            format=HackathonFormat.OFFLINE,
            location="Hangzhou, China",
            organizer_id=admin.id,
            organizer_name="DeepSeek AI",
            start_date=now - timedelta(days=40),
            end_date=now - timedelta(days=10),
            registration_start_date=now - timedelta(days=50),
            registration_end_date=now - timedelta(days=40),
            submission_start_date=now - timedelta(days=30),
            submission_end_date=now - timedelta(days=15),
            judging_start_date=now - timedelta(days=15),
            judging_end_date=now - timedelta(days=10),
            status=HackathonStatus.ENDED,
            awards_detail=json.dumps([
                {"title": "Grand Prize", "count": 1, "reward": "$50,000"}
            ])
        )

        session.add(h1)
        session.add(h2)
        session.add(h3)
        session.commit()
        print("Successfully seeded 3 hackathons.")

if __name__ == "__main__":
    seed_hackathons()
