#!/usr/bin/env python
"""创建数据库表结构"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 删除旧数据库
if os.path.exists('vibebuild.db'):
    os.remove('vibebuild.db')
    print("Removed old database")

from app.db.session import engine
from sqlmodel import SQLModel

# 导入所有模型 - 只导入核心模型
from app.models.user import User
from app.models.hackathon import Hackathon
from app.models.enrollment import Enrollment
from app.models.notification import Notification
from app.models.discussion import Discussion, DiscussionReply
from app.models.community import CommunityPost
from app.models.team_project import Team, TeamMember, Project
from app.models.judge import Judge

# 创建所有表
SQLModel.metadata.create_all(engine)
print("✓ Database tables created successfully!")
