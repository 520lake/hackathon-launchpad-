#!/usr/bin/env python
"""查找特定用户"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User

def find_user(email):
    with Session(engine) as session:
        user = session.exec(select(User).where(User.email == email)).first()
        if user:
            print(f"✓ 找到用户: {user.email}")
            print(f"  ID: {user.id}")
            print(f"  姓名: {user.full_name}")
            print(f"  昵称: {user.nickname}")
            print(f"  是否虚拟: {user.is_virtual}")
            print(f"  是否管理员: {user.is_superuser}")
            print(f"  可以创建活动: {user.can_create_hackathon}")
        else:
            print(f"✗ 未找到用户: {email}")

if __name__ == "__main__":
    find_user("wang599119562@163.com")
