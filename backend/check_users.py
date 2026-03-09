#!/usr/bin/env python
"""检查数据库中的所有用户"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from sqlmodel import Session, select
from app.db.session import engine
from app.models.user import User

def check_users():
    with Session(engine) as session:
        users = session.exec(select(User)).all()
        
        print("=" * 80)
        print(f"数据库中共有 {len(users)} 个用户")
        print("=" * 80)
        
        for user in users:
            print(f"\nID: {user.id}")
            print(f"  邮箱: {user.email}")
            print(f"  姓名: {user.full_name}")
            print(f"  昵称: {user.nickname}")
            print(f"  是否虚拟: {user.is_virtual}")
            print(f"  是否管理员: {user.is_superuser}")
            print(f"  是否活跃: {user.is_active}")
            print("-" * 80)

if __name__ == "__main__":
    check_users()
