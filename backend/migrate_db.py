#!/usr/bin/env python3
"""数据库迁移脚本 - 添加 notification_settings 列"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'vibebuild.db')

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 检查列是否存在
    cursor.execute("PRAGMA table_info(user)")
    columns = [col[1] for col in cursor.fetchall()]
    
    if 'notification_settings' not in columns:
        print("添加 notification_settings 列...")
        cursor.execute("""
            ALTER TABLE user 
            ADD COLUMN notification_settings TEXT 
            DEFAULT '{"activity_reminder": true, "new_hackathon_push": true, "system_announcement": true, "general_notification": true}'
        """)
        conn.commit()
        print("✅ 迁移完成")
    else:
        print("✅ notification_settings 列已存在")
    
    conn.close()

if __name__ == "__main__":
    migrate()
