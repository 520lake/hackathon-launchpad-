#!/usr/bin/env python3
"""
使用 ModelScope SDK 直接上传文件到创空间（使用现有分支）
"""
import sys
import os
import shutil
from modelscope.hub.api import HubApi

# 配置
SPACE_ID = "SULAKE666/Aurathon"
TOKEN = "ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5"
SOURCE_DIR = r"d:\deploy_temp_aura_new"
TEMP_DIR = r"d:\deploy_temp_upload"

print("🔐 登录魔搭...")
api = HubApi()
api.login(TOKEN)

# 清理临时目录
if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)
os.makedirs(TEMP_DIR)

print("📦 准备上传...")

# 克隆远程仓库
import subprocess
result = subprocess.run(
    f'git clone https://oauth2:{TOKEN}@www.modelscope.cn/studios/SULAKE666/Aurathon.git {TEMP_DIR}',
    shell=True,
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"❌ 克隆失败：{result.stderr}")
    sys.exit(1)

print("✅ 克隆成功，切换到 main 分支...")

# 切换到 main 分支
os.chdir(TEMP_DIR)
subprocess.run('git checkout main', shell=True, capture_output=True)

# 复制所有文件（除了.git）
print("📁 复制文件...")
for item in os.listdir(SOURCE_DIR):
    src = os.path.join(SOURCE_DIR, item)
    dst = os.path.join(TEMP_DIR, item)
    if os.path.isdir(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    else:
        if os.path.exists(dst):
            os.remove(dst)
        shutil.copy2(src, dst)

print("🚀 提交并推送...")

# 添加所有更改
subprocess.run('git add -A', shell=True, capture_output=True)

# 提交
subprocess.run('git commit -m "Deploy Aurathon with unified UI design"', shell=True, capture_output=True)

# 推送到 main 分支
result = subprocess.run('git push origin main', shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 上传成功！")
    print("🌐 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("\n⏳ 请在魔搭网页上切换到 main 分支并重新部署")
else:
    print(f"\n❌ 推送失败：{result.stderr}")

# 清理
os.chdir(SOURCE_DIR)
shutil.rmtree(TEMP_DIR)
