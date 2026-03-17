"""
Seed script for testing the judging & scoring workflow.

Creates:
  - 1 hackathon ("AI 创新大赛 — 评审测试") with judging criteria
  - 5 participant users with submitted projects
  - 2 judge users appointed to the hackathon
  - admin@aura.com as organizer + judge

Usage:
  cd backend
  .venv/bin/python3 scripts/seed_judging.py
"""

import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.db.session import engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus, HackathonFormat, RegistrationType
from app.models.hackathon_organizer import HackathonOrganizer, OrganizerRole, OrganizerStatus
from app.models.hackathon_host import HackathonHost
from app.models.section import Section, SectionType
from app.models.judging_criteria import JudgingCriteria
from app.models.team_project import Team, TeamMember, Submission, SubmissionStatus
from app.models.judge import Judge
from app.models.enrollment import Enrollment, EnrollmentStatus


PASSWORD_HASH = get_password_hash("password123")
NOW = datetime.utcnow()


def get_or_create_user(session, email, **kwargs):
    user = session.exec(select(User).where(User.email == email)).first()
    if user:
        print(f"  [exists] {email} (id={user.id})")
        return user
    user = User(email=email, hashed_password=PASSWORD_HASH, is_active=True, **kwargs)
    session.add(user)
    session.flush()
    print(f"  [created] {email} (id={user.id})")
    return user


def seed():
    with Session(engine) as session:
        print("\n=== Users ===")
        admin = get_or_create_user(
            session, "admin@aura.com",
            full_name="Aura Admin",
            is_superuser=True,
            can_create_hackathon=True,
        )

        judge1 = get_or_create_user(
            session, "judge1@aura.com",
            full_name="张评委",
            city="北京",
            bio="资深技术评审，10年AI领域经验",
        )
        judge2 = get_or_create_user(
            session, "judge2@aura.com",
            full_name="李评委",
            city="上海",
            bio="创业导师，专注产品创新",
        )

        participants = []
        participant_data = [
            ("alice@test.com", "Alice Wang", "全栈开发者"),
            ("bob@test.com", "Bob Chen", "AI/ML工程师"),
            ("carol@test.com", "Carol Li", "前端设计师"),
            ("dave@test.com", "Dave Zhang", "后端架构师"),
            ("eve@test.com", "Eve Liu", "产品经理"),
        ]
        for email, name, bio in participant_data:
            u = get_or_create_user(session, email, full_name=name, bio=bio)
            participants.append(u)

        print("\n=== Hackathon ===")
        TITLE = "AI 创新大赛 — 评审测试"
        existing = session.exec(select(Hackathon).where(Hackathon.title == TITLE)).first()
        if existing:
            print(f"  [exists] '{TITLE}' (id={existing.id}) — skipping rest of seed")
            session.commit()
            return

        hackathon = Hackathon(
            title=TITLE,
            description="专为测试评审打分流程而创建的黑客松",
            tags='["AI", "评审测试"]',
            registration_type=RegistrationType.INDIVIDUAL,
            format=HackathonFormat.ONLINE,
            start_date=NOW - timedelta(days=7),
            end_date=NOW + timedelta(days=7),
            status=HackathonStatus.ONGOING,
            created_by=admin.id,
            created_at=NOW,
            updated_at=NOW,
            updated_by=admin.id,
        )
        session.add(hackathon)
        session.flush()
        hid = hackathon.id
        print(f"  [created] '{TITLE}' (id={hid})")

        session.add(HackathonOrganizer(
            hackathon_id=hid, user_id=admin.id,
            role=OrganizerRole.OWNER, status=OrganizerStatus.ACCEPTED,
            created_at=NOW, created_by=admin.id, updated_at=NOW, updated_by=admin.id,
        ))

        session.add(HackathonHost(
            hackathon_id=hid, name="Aura Platform", display_order=0,
            created_at=NOW, created_by=admin.id, updated_at=NOW, updated_by=admin.id,
        ))

        print("\n=== Sections ===")

        sec_md = Section(
            hackathon_id=hid, section_type=SectionType.MARKDOWN,
            title="活动介绍", display_order=0,
            content="# AI 创新大赛\n\n本次比赛聚焦人工智能创新应用，评审测试专用。",
            created_at=NOW, updated_at=NOW,
        )
        session.add(sec_md)

        sec_jc = Section(
            hackathon_id=hid, section_type=SectionType.JUDGING_CRITERIA,
            title="评审标准", display_order=1,
            created_at=NOW, updated_at=NOW,
        )
        session.add(sec_jc)
        session.flush()

        criteria_data = [
            ("创新性", 30, "方案的原创性和创新程度"),
            ("技术实现", 25, "代码质量、架构设计、技术深度"),
            ("完成度", 20, "功能完整性、Demo可运行程度"),
            ("实用价值", 15, "解决真实问题的潜力和市场前景"),
            ("展示效果", 10, "演示质量、文档清晰度"),
        ]
        for i, (name, weight, desc) in enumerate(criteria_data):
            session.add(JudgingCriteria(
                hackathon_id=hid, section_id=sec_jc.id,
                name=name, weight_percentage=weight, description=desc,
                display_order=i, created_at=NOW, updated_at=NOW,
            ))
        print(f"  [created] {len(criteria_data)} judging criteria (weights sum to 100)")

        print("\n=== Submissions ===")

        submission_data = [
            ("智能代码审查助手", "基于LLM的代码Review工具，自动检测安全漏洞和代码异味", "Python, FastAPI, GPT-4"),
            ("AI健康管家", "利用计算机视觉分析食物营养成分，个性化饮食建议", "React Native, TensorFlow, Node.js"),
            ("知识图谱问答系统", "企业级知识管理平台，支持自然语言查询", "Neo4j, LangChain, Vue.js"),
            ("智能合同分析器", "自动提取合同关键条款，风险评估和对比分析", "Python, Transformers, React"),
            ("创意写作伙伴", "AI辅助创意写作工具，支持多种文体风格", "Next.js, Claude API, PostgreSQL"),
        ]
        for user, (title, desc, tech) in zip(participants, submission_data):
            session.add(Enrollment(
                hackathon_id=hid, user_id=user.id,
                status=EnrollmentStatus.APPROVED,
            ))
            sub = Submission(
                hackathon_id=hid, user_id=user.id,
                title=title, description=desc, tech_stack=tech,
                status=SubmissionStatus.SUBMITTED,
                created_at=NOW,
            )
            session.add(sub)
            print(f"  [created] '{title}' by {user.full_name}")

        print("\n=== Judges ===")
        for judge_user in [admin, judge1, judge2]:
            session.add(Judge(
                user_id=judge_user.id, hackathon_id=hid, appointed_at=NOW,
            ))
            print(f"  [appointed] {judge_user.email} as judge")

        session.commit()
        print(f"\n✅ Seed complete! Hackathon id={hid}")
        print(f"   Login as admin@aura.com / password: password123")
        print(f"   Login as judge1@aura.com / password123 to test judge-only access")
        print(f"   Login as judge2@aura.com / password123 to test multi-judge scoring")


if __name__ == "__main__":
    seed()
