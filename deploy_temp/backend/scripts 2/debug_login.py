import logging
import sys
import os

# Ensure app can be imported
sys.path.append(os.getcwd())

from sqlmodel import Session, select, create_engine
from app.models.user import User
from app.core.config import settings
from app.core.security import verify_password, get_password_hash

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_admin_login():
    print(f"Connecting to DB: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with Session(engine) as session:
        # 1. Check if user exists
        user = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        if not user:
            print("❌ ERROR: User 'admin@aura.com' NOT found in database.")
            return
        
        print(f"✅ User found: {user.email} (ID: {user.id})")
        print(f"   Is Active: {user.is_active}")
        print(f"   Is Superuser: {user.is_superuser}")
        print(f"   Hashed Password: {user.hashed_password}")
        
        # 2. Check password verification
        password = "admin123"
        is_valid = verify_password(password, user.hashed_password)
        
        if is_valid:
            print(f"✅ Password verification SUCCESS for '{password}'")
        else:
            print(f"❌ Password verification FAILED for '{password}'")
            # Try to see if re-hashing works
            new_hash = get_password_hash(password)
            print(f"   New Hash would be: {new_hash}")
            print("   Verify against new hash:", verify_password(password, new_hash))

if __name__ == "__main__":
    check_admin_login()
