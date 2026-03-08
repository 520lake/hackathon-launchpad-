#!/usr/bin/env python3
import os
os.chdir(os.path.dirname(os.path.abspath(__file__)) or '.')
import sys
sys.path.insert(0, '..')

from datetime import datetime
from sqlmodel import Session, create_engine, select
from app.models.user import InvitationCode

# 直接使用 SQLite 连接
engine = create_engine('sqlite:///../vibebuild.db')

def init_invite_codes():
    codes = [
        "AURA2024",
        "HACKADMIN",
        "ORGANIZER1",
        "TEAMLEADER",
    ]
    
    with Session(engine) as session:
        for code in codes:
            existing = session.exec(select(InvitationCode).where(InvitationCode.code == code)).first()
            if not existing:
                invite = InvitationCode(
                    code=code,
                    is_used=False,
                    created_at=datetime.utcnow()
                )
                session.add(invite)
                print(f"Created invite code: {code}")
        
        session.commit()
        print("Done!")

if __name__ == "__main__":
    init_invite_codes()
