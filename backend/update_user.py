#!/usr/bin/env python
"""更新用户权限"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User

def update_user(email):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            # 更新用户权限
            user.can_create_hackathon = True
            user.is_active = True
            session.add(user)
            session.commit()
            print(f"✓ 用户已更新: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  可以创建活动: {user.can_create_hackathon}")
            print(f"  账号状态: {'已激活' if user.is_active else '未激活'}")
        else:
            print(f"✗ 未找到用户: {email}")

if __name__ == "__main__":
    update_user("wang599119562@163.com")
