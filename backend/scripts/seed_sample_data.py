"""
Seed the database with sample data for development and demo.

Creates:
- Sample users (organizer, participants, judge) — all use password: sample123
- Sample hackathons (draft, published, ongoing, ended)
- Enrollments (participants enrolled in hackathons)
- Teams and team members
- Projects (submissions)
- Judge assignments and scores for one ended hackathon

Run from backend directory with venv activated:
  cd backend && source venv/bin/activate && python scripts/seed_sample_data.py
"""

import sys
import os
from datetime import datetime, timedelta, timezone

# Add backend directory to Python path so we can import app.*
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.user import User
from app.models.hackathon import Hackathon, HackathonStatus
from app.models.enrollment import Enrollment, EnrollmentStatus
from app.models.team_project import Team, TeamMember, Project, ProjectStatus
from app.models.judge import Judge
from app.models.score import Score
from app.core.config import settings
import bcrypt


def _hash_password(password: str) -> str:
    """
    Hash password for sample users using bcrypt.
    Uses bcrypt directly so the seed script does not depend on passlib,
    which can have version compatibility issues with some bcrypt installs.
    """
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

# Default password for all sample users (easy to remember for demos)
SAMPLE_PASSWORD = "sample123"

# Resolve database URL (same logic as make_superuser.py for SQLite)
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("sqlite:///./"):
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_name = db_url.replace("sqlite:///./", "")
    db_path = os.path.join(project_root, db_name)
    db_url = f"sqlite:///{db_path}"
    print(f"Using database at: {db_path}")

engine = create_engine(db_url)


def user_exists(session: Session, email: str) -> bool:
    """Check if a user with the given email already exists."""
    stmt = select(User).where(User.email == email)
    return session.exec(stmt).first() is not None


def seed_users(session: Session) -> dict[str, User]:
    """
    Create sample users: one organizer, several participants, one judge.
    Returns a dict mapping role names to User objects for use in later steps.
    """
    users = {}
    now = datetime.now(timezone.utc)
    hashed = _hash_password(SAMPLE_PASSWORD)

    # Sample users to create: (email, full_name, nickname, is_superuser, skills)
    sample_specs = [
        ("organizer@sample.com", "Alex Organizer", "Alex", True, "Python, Event Management"),
        ("participant1@sample.com", "Xiao Wang", "Wang", False, "React, JavaScript"),
        ("participant2@sample.com", "Engineer Chen", "Chen", False, "Python, ML"),
        ("participant3@sample.com", "Sarah Designer", "Sarah", False, "UI/UX, Figma"),
        ("participant4@sample.com", "Li Ming", "Li", False, "Backend, Go"),
        ("judge@sample.com", "Dr. Judge", "Judge", False, "AI, Judging"),
    ]

    for email, full_name, nickname, is_superuser, skills in sample_specs:
        if user_exists(session, email):
            u = session.exec(select(User).where(User.email == email)).first()
            users[email.split("@")[0]] = u
            print(f"  User already exists: {email}")
            continue
        user = User(
            email=email,
            full_name=full_name,
            nickname=nickname,
            is_active=True,
            is_superuser=is_superuser,
            is_verified=True,
            hashed_password=hashed,
            skills=skills,
            interests="AI, Hackathons",
        )
        session.add(user)
        session.flush()  # get id
        session.refresh(user)
        users[email.split("@")[0]] = user
        print(f"  Created user: {email} (id={user.id})")

    session.commit()
    return users


def seed_hackathons(session: Session, organizer: User) -> list[Hackathon]:
    """Create sample hackathons with different statuses and dates."""
    now = datetime.now(timezone.utc)
    hackathons = []

    # 1) Draft hackathon (not yet published)
    base_start = now + timedelta(days=30)
    base_end = base_start + timedelta(days=2)
    h1 = Hackathon(
        title="AI for Good – Draft",
        description="A draft hackathon focused on AI for social impact. This event is still being prepared.",
        theme_tags="AI, Social Impact, Sustainability",
        professionalism_tags="Beginner, Intermediate",
        start_date=base_start,
        end_date=base_end,
        registration_start_date=now + timedelta(days=7),
        registration_end_date=base_start - timedelta(days=1),
        submission_start_date=base_start,
        submission_end_date=base_end,
        judging_start_date=base_end,
        judging_end_date=base_end + timedelta(days=1),
        location="Shanghai (TBD)",
        is_online=True,
        max_participants=100,
        status=HackathonStatus.DRAFT,
        organizer_id=organizer.id,
    )
    session.add(h1)
    session.flush()
    session.refresh(h1)
    hackathons.append(h1)
    print(f"  Created hackathon: {h1.title} (id={h1.id}, status={h1.status})")

    # 2) Published / upcoming
    start_pub = now + timedelta(days=14)
    end_pub = start_pub + timedelta(days=2)
    h2 = Hackathon(
        title="GenAI Campus Hackathon 2025",
        description="Join the premier campus hackathon focused on Generative AI. Build apps with LLMs, image generation, and more. Prizes and mentorship included.",
        theme_tags="GenAI, LLM, Campus",
        professionalism_tags="Student, Beginner",
        start_date=start_pub,
        end_date=end_pub,
        registration_start_date=now - timedelta(days=1),
        registration_end_date=start_pub - timedelta(days=1),
        submission_start_date=start_pub,
        submission_end_date=end_pub,
        judging_start_date=end_pub,
        judging_end_date=end_pub + timedelta(days=1),
        awards_detail="1st: ¥10,000 | 2nd: ¥5,000 | 3rd: ¥2,000",
        rules_detail="Teams of 2–5. Original work only. 48-hour build.",
        location="Online",
        is_online=True,
        max_participants=200,
        status=HackathonStatus.PUBLISHED,
        organizer_id=organizer.id,
    )
    session.add(h2)
    session.flush()
    session.refresh(h2)
    hackathons.append(h2)
    print(f"  Created hackathon: {h2.title} (id={h2.id}, status={h2.status})")

    # 3) Ongoing (currently running)
    start_ongoing = now - timedelta(days=1)
    end_ongoing = now + timedelta(days=1)
    h3 = Hackathon(
        title="Sustainability Tech Sprint",
        description="Build solutions for climate and sustainability. IoT, data viz, and green tech encouraged.",
        theme_tags="Sustainability, IoT, Data",
        professionalism_tags="All levels",
        start_date=start_ongoing,
        end_date=end_ongoing,
        registration_start_date=now - timedelta(days=14),
        registration_end_date=start_ongoing,
        submission_start_date=start_ongoing,
        submission_end_date=end_ongoing,
        judging_start_date=end_ongoing,
        judging_end_date=end_ongoing + timedelta(days=2),
        location="Hybrid – Beijing + Online",
        is_online=False,
        max_participants=150,
        status=HackathonStatus.ONGOING,
        organizer_id=organizer.id,
    )
    session.add(h3)
    session.flush()
    session.refresh(h3)
    hackathons.append(h3)
    print(f"  Created hackathon: {h3.title} (id={h3.id}, status={h3.status})")

    # 4) Ended (with results)
    start_ended = now - timedelta(days=14)
    end_ended = now - timedelta(days=7)
    h4 = Hackathon(
        title="Spring AI Challenge 2025",
        description="A past hackathon that showcased the best AI projects from students and professionals. Winners have been announced.",
        theme_tags="AI, Innovation",
        professionalism_tags="All levels",
        start_date=start_ended,
        end_date=end_ended,
        registration_start_date=now - timedelta(days=30),
        registration_end_date=start_ended - timedelta(days=1),
        submission_start_date=start_ended,
        submission_end_date=end_ended,
        judging_start_date=end_ended,
        judging_end_date=end_ended + timedelta(days=3),
        results_detail='{"winners":[{"rank":1,"team":"Team Alpha","project":"AI Tutor"},{"rank":2,"team":"Data Squad","project":"Analytics Dashboard"}]}',
        location="Online",
        is_online=True,
        max_participants=120,
        status=HackathonStatus.ENDED,
        organizer_id=organizer.id,
    )
    session.add(h4)
    session.flush()
    session.refresh(h4)
    hackathons.append(h4)
    print(f"  Created hackathon: {h4.title} (id={h4.id}, status={h4.status})")

    session.commit()
    return hackathons


def seed_enrollments_teams_projects(
    session: Session,
    users: dict[str, User],
    hackathons: list[Hackathon],
) -> tuple[list[Enrollment], list[Team], list[Project]]:
    """
    Enroll participants in hackathons, create teams and projects.
    Uses the first two hackathons (published + ongoing) and the ended one for teams/projects.
    """
    organizer = users["organizer"]
    p1, p2, p3, p4 = users["participant1"], users["participant2"], users["participant3"], users["participant4"]
    participants = [p1, p2, p3, p4]

    # Map hackathon by title for clarity
    h_published = next((h for h in hackathons if "GenAI Campus" in h.title), None)
    h_ongoing = next((h for h in hackathons if "Sustainability" in h.title), None)
    h_ended = next((h for h in hackathons if "Spring AI Challenge" in h.title), None)

    enrollments = []
    teams = []
    projects = []

    # Enroll participants in published hackathon and create one team + project
    if h_published:
        for p in participants:
            en = Enrollment(
                user_id=p.id,
                hackathon_id=h_published.id,
                status=EnrollmentStatus.APPROVED,
            )
            session.add(en)
            session.flush()
            session.refresh(en)
            enrollments.append(en)
        t1 = Team(
            name="GenAI Builders",
            description="We build cool AI demos.",
            hackathon_id=h_published.id,
            leader_id=p1.id,
        )
        session.add(t1)
        session.flush()
        session.refresh(t1)
        teams.append(t1)
        for p in [p1, p2]:
            tm = TeamMember(team_id=t1.id, user_id=p.id)
            session.add(tm)
        proj1 = Project(
            team_id=t1.id,
            title="AI Study Buddy",
            description="An LLM-powered study assistant for students.",
            repo_url="https://github.com/sample/ai-study-buddy",
            status=ProjectStatus.SUBMITTED,
        )
        session.add(proj1)
        session.flush()
        session.refresh(proj1)
        projects.append(proj1)

    # Enroll in ongoing hackathon, one team
    if h_ongoing:
        for p in [p1, p3, p4]:
            en = Enrollment(
                user_id=p.id,
                hackathon_id=h_ongoing.id,
                status=EnrollmentStatus.APPROVED,
            )
            session.add(en)
            session.flush()
            session.refresh(en)
            enrollments.append(en)
        t2 = Team(
            name="Green Data",
            description="Sustainability analytics team.",
            hackathon_id=h_ongoing.id,
            leader_id=p3.id,
        )
        session.add(t2)
        session.flush()
        session.refresh(t2)
        teams.append(t2)
        for p in [p3, p4]:
            tm = TeamMember(team_id=t2.id, user_id=p.id)
            session.add(tm)

    # Ended hackathon: two teams with projects (for judging demo)
    if h_ended:
        for p in participants:
            en = Enrollment(
                user_id=p.id,
                hackathon_id=h_ended.id,
                status=EnrollmentStatus.APPROVED,
            )
            session.add(en)
            session.flush()
            session.refresh(en)
            enrollments.append(en)
        t3 = Team(
            name="Team Alpha",
            description="AI Tutor team.",
            hackathon_id=h_ended.id,
            leader_id=p1.id,
        )
        session.add(t3)
        session.flush()
        session.refresh(t3)
        teams.append(t3)
        for p in [p1, p2]:
            tm = TeamMember(team_id=t3.id, user_id=p.id)
            session.add(tm)
        proj2 = Project(
            team_id=t3.id,
            title="AI Tutor",
            description="Personalized learning with AI.",
            repo_url="https://github.com/sample/ai-tutor",
            status=ProjectStatus.GRADED,
            total_score=88.0,
        )
        session.add(proj2)
        session.flush()
        session.refresh(proj2)
        projects.append(proj2)

        t4 = Team(
            name="Data Squad",
            description="Analytics and dashboards.",
            hackathon_id=h_ended.id,
            leader_id=p2.id,
        )
        session.add(t4)
        session.flush()
        session.refresh(t4)
        teams.append(t4)
        for p in [p2, p4]:
            tm = TeamMember(team_id=t4.id, user_id=p.id)
            session.add(tm)
        proj3 = Project(
            team_id=t4.id,
            title="Analytics Dashboard",
            description="Real-time sustainability metrics dashboard.",
            demo_url="https://demo.sample.com/dashboard",
            status=ProjectStatus.GRADED,
            total_score=82.0,
        )
        session.add(proj3)
        session.flush()
        session.refresh(proj3)
        projects.append(proj3)

    session.commit()
    print(f"  Created {len(enrollments)} enrollments, {len(teams)} teams, {len(projects)} projects.")
    return enrollments, teams, projects


def seed_judges_and_scores(
    session: Session,
    users: dict[str, User],
    hackathons: list[Hackathon],
    projects: list[Project],
) -> None:
    """Assign the sample judge to the ended hackathon and add scores for its projects."""
    judge_user = users.get("judge")
    h_ended = next((h for h in hackathons if "Spring AI Challenge" in h.title), None)
    if not judge_user or not h_ended:
        return

    # Judge table links user to hackathon
    existing = session.exec(
        select(Judge).where(Judge.user_id == judge_user.id, Judge.hackathon_id == h_ended.id)
    ).first()
    if not existing:
        j = Judge(user_id=judge_user.id, hackathon_id=h_ended.id)
        session.add(j)
        session.commit()
        session.refresh(j)
        print(f"  Assigned judge {judge_user.email} to hackathon id={h_ended.id}")

    # Score uses judge_id = user.id (Judge is a User per model comment)
    ended_project_ids = [p.id for p in projects if p.total_score is not None and p.total_score > 0]
    for proj in projects:
        if proj.id not in ended_project_ids:
            continue
        existing_score = session.exec(
            select(Score).where(Score.project_id == proj.id, Score.judge_id == judge_user.id)
        ).first()
        if existing_score:
            continue
        score_val = int(proj.total_score) if proj.total_score else 80
        s = Score(
            judge_id=judge_user.id,
            project_id=proj.id,
            score_value=min(100, score_val),
            comment="Strong submission. Great demo.",
        )
        session.add(s)
    session.commit()
    print("  Created judge assignment and sample scores for ended hackathon.")


def main() -> None:
    print("Seeding sample data...")
    with Session(engine) as session:
        print("1. Users")
        users = seed_users(session)
        if not users:
            print("No users created or found. Aborting.")
            return

        organizer = users.get("organizer")
        if not organizer:
            print("Organizer user not found. Aborting.")
            return

        print("2. Hackathons")
        hackathons = seed_hackathons(session, organizer)

        print("3. Enrollments, teams, projects")
        enrollments, teams, projects = seed_enrollments_teams_projects(session, users, hackathons)

        print("4. Judges and scores")
        seed_judges_and_scores(session, users, hackathons, projects)

    print("\nDone. Sample logins (password for all):", SAMPLE_PASSWORD)
    print("  Organizer (admin): organizer@sample.com")
    print("  Participants: participant1@sample.com ... participant4@sample.com")
    print("  Judge: judge@sample.com")


if __name__ == "__main__":
    main()
