#!/usr/bin/env python3
"""
触发魔搭重新部署
"""
import subprocess
import os

SPACE_URL = "https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aurathon.git"
WORK_DIR = r"d:\aurathon_master_deploy"

os.chdir(WORK_DIR)

print("🔄 触发重新部署...")

# 添加一个空提交来触发构建
subprocess.run('git commit --allow-empty -m "Trigger rebuild"', 
               shell=True, capture_output=True)

# 推送
result = subprocess.run('git push origin master', 
                       shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 推送成功，魔搭将重新构建！")
    print("\n📋 查看日志步骤：")
    print("1. 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("2. 点击 '日志' 标签")
    print("3. 点击 '马上刷新' 按钮")
    print("4. 等待 1-2 分钟查看构建结果")
else:
    print(f"\n❌ 推送失败：{result.stderr}")
