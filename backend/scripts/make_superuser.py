import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlmodel import create_engine, Session, select
from app.models.user import User

from app.core.config import settings

# Determine DB URL
# If it's a relative SQLite path, make it absolute relative to project root
db_url = settings.DATABASE_URL
if db_url and db_url.startswith("sqlite:///./"):
    # backend/scripts/make_superuser.py -> backend/scripts -> backend -> vibebuild.db
    # We want backend/vibebuild.db
    # os.path.dirname(__file__) is backend/scripts
    # os.path.dirname(...) is backend
    project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    db_name = db_url.replace("sqlite:///./", "")
    db_path = os.path.join(project_root, db_name)
    db_url = f"sqlite:///{db_path}"
    print(f"Using database at: {db_path}")

engine = create_engine(db_url)

def make_superuser(email_or_id):
    with Session(engine) as session:
        user = None
        if isinstance(email_or_id, int) or (isinstance(email_or_id, str) and email_or_id.isdigit()):
            user = session.get(User, int(email_or_id))
        else:
            statement = select(User).where(User.email == email_or_id)
            user = session.exec(statement).first()
        
        if not user:
            print(f"User not found: {email_or_id}")
            return

        user.is_superuser = True
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"User {user.email} (ID: {user.id}) is now a superuser.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_superuser.py <email_or_id>")
        # List users to help
        with Session(engine) as session:
            users = session.exec(select(User)).all()
            print("\nAvailable users:")
            for u in users:
                print(f"ID: {u.id}, Email: {u.email}, Is Admin: {u.is_superuser}")
    else:
        make_superuser(sys.argv[1])
