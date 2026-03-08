#!/usr/bin/env python
"""
确保数据库存在并包含初始管理员账号
"""
import os
import sys

# 添加项目路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 强制使用 SQLite
os.environ['DATABASE_URL'] = 'sqlite:///./vibebuild.db'

from datetime import datetime
from sqlmodel import Session, create_engine, select, SQLModel
from app.models.user import User
from app.core.security import get_password_hash, verify_password

# 创建 engine
engine = create_engine('sqlite:///./vibebuild.db', echo=True)

def init_db():
    print("=" * 50)
    print("Initializing database with SQLite...")
    print("=" * 50)
    
    # 创建所有表
    SQLModel.metadata.create_all(engine)
    print("✓ Database tables created")
    
    # 检查并创建管理员账号
    with Session(engine) as session:
        admin = session.exec(select(User).where(User.email == "admin@aura.com")).first()
        
        if admin:
            print(f"✓ Admin user exists: {admin.email}")
            print(f"  - is_active: {admin.is_active}")
            print(f"  - is_superuser: {admin.is_superuser}")
            print(f"  - hashed_password: {'Yes' if admin.hashed_password else 'No'}")
            
            # 检查密码是否正确
            if admin.hashed_password and verify_password("admin123", admin.hashed_password):
                print("  - Password: CORRECT")
            else:
                # 重置密码
                admin.hashed_password = get_password_hash("admin123")
                session.add(admin)
                session.commit()
                print("  - Password: RESET to admin123")
        else:
            print("✗ Admin user NOT FOUND, creating...")
            admin = User(
                email="admin@aura.com",
                full_name="Admin",
                hashed_password=get_password_hash("admin123"),
                is_active=True,
                is_superuser=True,
                can_create_hackathon=True,
            )
            session.add(admin)
            session.commit()
            print(f"✓ Admin user created: admin@aura.com / admin123")
    
    print("=" * 50)
    print("Done!")
    print("=" * 50)

if __name__ == "__main__":
    init_db()
