import sys
import os
import json
import random
from datetime import datetime
from sqlmodel import create_engine, Session, select

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus
from app.models.enrollment import Enrollment
from app.core.config import settings
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database Setup
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("sqlite:///./"):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_name = db_url.replace("sqlite:///./", "")
    db_path = os.path.join(project_root, db_name)
    db_url = f"sqlite:///{db_path}"

engine = create_engine(db_url)

MOCK_USERS = [
    {
        "email": "alex.chen@example.com", "full_name": "Alex Chen", "nickname": "AlexC",
        "personality": "INTJ", "skills": "Python, TensorFlow, PyTorch", "bio": "AI Researcher focused on NLP and LLMs. Looking for frontend devs to build demos."
    },
    {
        "email": "sarah.wu@example.com", "full_name": "Sarah Wu", "nickname": "SarahW",
        "personality": "ENFP", "skills": "React, TypeScript, Tailwind", "bio": "Creative frontend developer. I love building beautiful UIs and interactive experiences."
    },
    {
        "email": "mike.zhang@example.com", "full_name": "Mike Zhang", "nickname": "MikeZ",
        "personality": "ISTJ", "skills": "Java, Spring Boot, MySQL", "bio": "Backend specialist. I build robust and scalable APIs. Looking for a team for the FinTech hackathon."
    },
    {
        "email": "emily.liu@example.com", "full_name": "Emily Liu", "nickname": "EmilyL",
        "personality": "INFJ", "skills": "UI/UX, Figma, Product Design", "bio": "Product designer with a passion for user-centric design. I can help visualize your ideas."
    },
    {
        "email": "david.wang@example.com", "full_name": "David Wang", "nickname": "DavidW",
        "personality": "ENTP", "skills": "Rust, WebAssembly, Blockchain", "bio": "Full stack engineer interested in Web3 and decentralized technologies."
    },
    {
        "email": "jessica.li@example.com", "full_name": "Jessica Li", "nickname": "JessL",
        "personality": "ISFP", "skills": "Flutter, Dart, Mobile Dev", "bio": "Mobile app developer. I turn ideas into apps."
    },
    {
        "email": "kevin.zhao@example.com", "full_name": "Kevin Zhao", "nickname": "KevinZ",
        "personality": "ESTJ", "skills": "DevOps, Docker, Kubernetes", "bio": "Cloud infrastructure engineer. I ensure your apps run smoothly."
    },
    {
        "email": "lily.sun@example.com", "full_name": "Lily Sun", "nickname": "LilyS",
        "personality": "ESFJ", "skills": "Marketing, Pitching, Business", "bio": "Business student with a knack for pitching. I can help sell your product."
    },
    {
        "email": "tom.yang@example.com", "full_name": "Tom Yang", "nickname": "TomY",
        "personality": "INTP", "skills": "Algorithm, C++, Math", "bio": "Competitive programmer. I solve hard algorithmic problems."
    },
    {
        "email": "lucy.qian@example.com", "full_name": "Lucy Qian", "nickname": "LucyQ",
        "personality": "ENFJ", "skills": "Project Management, Scrum", "bio": "Experienced PM. I keep the team organized and on track."
    },
    {
        "email": "ryan.zhou@example.com", "full_name": "Ryan Zhou", "nickname": "RyanZ",
        "personality": "ISTP", "skills": "IoT, Arduino, Hardware", "bio": "Hardware hacker. I build things that interact with the physical world."
    },
    {
        "email": "anna.wu@example.com", "full_name": "Anna Wu", "nickname": "AnnaW",
        "personality": "ISFJ", "skills": "Data Analysis, SQL, Tableau", "bio": "Data analyst. I find insights in data."
    },
    {
        "email": "eric.zheng@example.com", "full_name": "Eric Zheng", "nickname": "EricZ",
        "personality": "ESTP", "skills": "Sales, Public Speaking", "bio": "Energetic presenter. I can make your demo shine."
    },
    {
        "email": "olivia.xu@example.com", "full_name": "Olivia Xu", "nickname": "OliviaX",
        "personality": "INFP", "skills": "Content Writing, Storytelling", "bio": "Writer and storyteller. I craft compelling narratives for projects."
    },
    {
        "email": "daniel.feng@example.com", "full_name": "Daniel Feng", "nickname": "DanF",
        "personality": "ENTJ", "skills": "Leadership, Strategy, Finance", "bio": "Aspiring CEO. I drive the vision and strategy."
    },
]

HACKATHON_DETAILS = {
    "requirements": """
## 参赛要求 / Requirements

1. **团队规模**：每队 1-5 人。
2. **原创性**：提交的项目必须是本次黑客松期间开发的原创作品。
3. **技术栈**：不限技术栈，但必须包含代码实现。
4. **提交材料**：必须提交源代码（GitHub链接）、演示视频（或链接）和项目说明文档。
""",
    "rules_detail": """
## 评审规则 / Judging Rules

1. **创新性 (30%)**：想法是否新颖？是否解决了真实问题？
2. **技术难度 (30%)**：技术实现是否具有挑战性？代码质量如何？
3. **完成度 (20%)**：项目是否是一个可运行的原型？功能是否完整？
4. **用户体验 (10%)**：界面是否友好？交互是否流畅？
5. **展示表现 (10%)**：演示是否清晰？文档是否规范？
""",
    "awards_detail": json.dumps([
        {"name": "一等奖", "count": 1, "prize": "¥50,000", "description": "最佳综合表现奖"},
        {"name": "二等奖", "count": 2, "prize": "¥20,000", "description": "优秀项目奖"},
        {"name": "三等奖", "count": 3, "prize": "¥10,000", "description": "潜力项目奖"},
        {"name": "最佳创意奖", "count": 1, "prize": "¥5,000", "description": "最具创新思维奖"},
    ], ensure_ascii=False),
    "resource_detail": """
## 资源与支持 / Resources

- **API 访问**：所有参赛者将获得 ModelScope API 的免费额度。
- **导师指导**：每天下午 2:00 - 4:00 有技术导师在线答疑。
- **云资源**：阿里云提供免费的 ECS 实例供部署使用。
"""
}

ORGANIZER_NAMES = ["AI Innovators", "Future Tech Labs", "Global Hack Foundation", "Open Source Community", "Tech Giants Alliance"]
COVER_IMAGES = [
    "https://images.unsplash.com/photo-1504384308090-c54be3855485?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2672&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop"
]

def enrich_data():
    with Session(engine) as session:
        print("Starting data enrichment...")

        # 1. Create Mock Users
        created_users = []
        for u_data in MOCK_USERS:
            user = session.exec(select(User).where(User.email == u_data["email"])).first()
            if not user:
                user = User(
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    nickname=u_data["nickname"],
                    personality=u_data["personality"],
                    skills=u_data["skills"],
                    bio=u_data["bio"],
                    hashed_password=pwd_context.hash("123456"),
                    is_active=True,
                    is_verified=True,
                    avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={u_data['nickname']}"
                )
                session.add(user)
                session.commit()
                session.refresh(user)
                print(f"Created user: {user.nickname}")
            created_users.append(user)
        
        # 2. Update Hackathon Details
        hackathons = session.exec(select(Hackathon)).all()
        for h in hackathons:
            # Only update if fields are empty
            updated = False
            if not h.requirements:
                h.requirements = HACKATHON_DETAILS["requirements"]
                updated = True
            if not h.rules_detail:
                h.rules_detail = HACKATHON_DETAILS["rules_detail"]
                updated = True
            if not h.awards_detail:
                h.awards_detail = HACKATHON_DETAILS["awards_detail"]
                updated = True
            if not h.resource_detail:
                h.resource_detail = HACKATHON_DETAILS["resource_detail"]
                updated = True
            
            if not h.organizer_name or h.organizer_name == "Unknown":
                h.organizer_name = random.choice(ORGANIZER_NAMES)
                updated = True
            
            if not h.cover_image:
                h.cover_image = random.choice(COVER_IMAGES)
                updated = True

            if updated:
                session.add(h)
                print(f"Updated details for hackathon: {h.title}")
        
        session.commit()

        # 3. Random Enrollments
        # Shuffle users for each hackathon to ensure variety
        print("Enrolling users...")
        for h in hackathons:
            if h.status == HackathonStatus.ENDED:
                continue # Skip ended ones or maybe enroll them as past participants? Let's enroll to populate data
            
            # Select 5-10 random users
            participants = random.sample(created_users, k=random.randint(5, 10))
            
            for p in participants:
                # Check if already enrolled
                enrollment = session.exec(select(Enrollment).where(
                    Enrollment.hackathon_id == h.id,
                    Enrollment.user_id == p.id
                )).first()
                
                if not enrollment:
                    enrollment = Enrollment(
                        hackathon_id=h.id,
                        user_id=p.id,
                        status="approved",
                        created_at=datetime.utcnow()
                    )
                    session.add(enrollment)
            print(f"Enrolled {len(participants)} users to {h.title}")
        
        session.commit()
        print("Data enrichment completed successfully!")

if __name__ == "__main__":
    enrich_data()
