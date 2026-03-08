#!/usr/bin/env python
"""
删除所有用户账号
"""
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 强制使用 SQLite
os.environ['DATABASE_URL'] = 'sqlite:///./vibebuild.db'

from sqlmodel import Session, create_engine, select, SQLModel
from app.models.user import User

# 创建 engine
engine = create_engine('sqlite:///./vibebuild.db', echo=True)

def delete_all_users():
    print("=" * 50)
    print("Deleting all users...")
    print("=" * 50)
    
    with Session(engine) as session:
        # 删除所有用户
        users = session.exec(select(User)).all()
        for user in users:
            session.delete(user)
        
        session.commit()
        print(f"✓ Deleted {len(users)} users")
    
    print("=" * 50)
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    delete_all_users()
