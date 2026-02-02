import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models.user import User
from app.core.security import get_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_db() -> None:
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()

    try:
        user = db.query(User).filter(User.email == "admin@aura.com").first()
        if not user:
            user = User(
                email="admin@aura.com",
                full_name="Admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True,
            )
            db.add(user)
            db.commit()
            logger.info("Superuser created: admin@aura.com / admin123")
        else:
            # Update password in case it was created with a broken bcrypt version
            user.hashed_password = get_password_hash("admin123")
            user.is_superuser = True  # Force superuser status
            user.is_active = True     # Force active status
            db.add(user)
            db.commit()
            logger.info("Superuser already exists. Password reset to: admin123. Privileges updated.")
    except Exception as e:
        logger.error(f"Error creating superuser: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    logger.info("Creating superuser...")
    init_db()
