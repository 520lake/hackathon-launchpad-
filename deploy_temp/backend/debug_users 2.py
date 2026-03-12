
import sys
import os

sys.path.append(os.getcwd())

from sqlmodel import Session, select, create_engine
from app.models.user import User

db_url = "sqlite:///./vibebuild.db"
print(f"Connecting to {db_url}")
engine = create_engine(db_url)

with Session(engine) as session:
    users = session.exec(select(User)).all()
    print(f"Found {len(users)} users.")
    for user in users:
        print(f"User: {user.email}, Superuser: {user.is_superuser}, Verified: {user.is_verified}")
