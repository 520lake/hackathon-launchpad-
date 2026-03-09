#!/usr/bin/env python
"""恢复用户账号"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session
from app.db.session import engine
from app.models.user import User
from app.core.security import get_password_hash

def restore_user():
    with Session(engine) as session:
        # 创建 wang599119562@163.com 账号
        user = User(
            email="wang599119562@163.com",
            full_name="王用户",
            nickname="王用户",
            hashed_password=get_password_hash("123456"),  # 默认密码
            is_active=True,
            is_superuser=False,
            can_create_hackathon=True,  # 允许创建活动
            is_virtual=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)
        print(f"✓ 用户已创建: {user.email}")
        print(f"  ID: {user.id}")
        print(f"  密码: 123456")
        print(f"  可以创建活动: {user.can_create_hackathon}")

if __name__ == "__main__":
    restore_user()
