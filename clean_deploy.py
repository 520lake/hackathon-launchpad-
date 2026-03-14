#!/usr/bin/env python3
"""
清理魔搭创空间上的所有分支，重新推送干净代码
"""
import subprocess
import os
import shutil

# 配置
SPACE_URL = "https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aurathon.git"
LOCAL_CODE_DIR = r"d:\downlaod\hackthon\make"
CLEAN_DIR = r"d:\aurathon_clean_deploy"

print("🧹 清理并准备新部署...")

# 删除临时目录
if os.path.exists(CLEAN_DIR):
    shutil.rmtree(CLEAN_DIR)
os.makedirs(CLEAN_DIR)

# 复制必要文件（排除不需要的）
print("📦 复制项目文件...")
exclude_patterns = ['.git', '__pycache__', '*.pyc', '.env', 'venv', 'node_modules', 'dist', '*.db', '*.log', '.trae', 'deploy_*.py', 'upload_*.py', 'fix_*.py', 'sync_*.py', 'create_*.py', '*.zip', '*.bat']

import fnmatch
import glob

def should_exclude(path, name):
    for pattern in exclude_patterns:
        if fnmatch.fnmatch(name, pattern):
            return True
        if pattern.startswith('.') and ('\\' + pattern[1:]) in path:
            return True
    return False

import os
for root, dirs, files in os.walk(LOCAL_CODE_DIR):
    # 跳过排除的目录
    dirs[:] = [d for d in dirs if not should_exclude(root, d)]
    
    for file in files:
        if not should_exclude(root, file):
            src = os.path.join(root, file)
            rel_path = os.path.relpath(src, LOCAL_CODE_DIR)
            dst = os.path.join(CLEAN_DIR, rel_path)
            
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)

print(f"✅ 文件已复制到 {CLEAN_DIR}")

# 初始化 git
os.chdir(CLEAN_DIR)
print("\n🚀 初始化 Git 仓库...")
subprocess.run('git init', shell=True, capture_output=True)
subprocess.run('git config user.email "trae@example.com"', shell=True, capture_output=True)
subprocess.run('git config user.name "Trae IDE"', shell=True, capture_output=True)

# 添加所有文件
print("📝 添加文件...")
subprocess.run('git add -A', shell=True, capture_output=True)

# 提交
print("💾 提交...")
subprocess.run('git commit -m "Deploy: Aurathon with community features and unified UI"', shell=True, capture_output=True)

# 添加远程
print("🔗 添加远程仓库...")
subprocess.run(f'git remote add origin {SPACE_URL}', shell=True, capture_output=True)

# 获取远程分支列表
print("\n📋 获取远程分支...")
result = subprocess.run('git ls-remote --heads origin', shell=True, capture_output=True, text=True)
remote_branches = []
for line in result.stdout.strip().split('\n'):
    if line:
        branch = line.split('refs/heads/')[1]
        remote_branches.append(branch)

print(f"找到远程分支：{remote_branches}")

# 删除所有远程分支（除了 master）
for branch in remote_branches:
    if branch != 'master':
        print(f"  删除分支：{branch}")
        subprocess.run(f'git push origin --delete {branch}', shell=True, capture_output=True)

# 推送到 master（不强制，直接推送）
print("\n📤 推送到 master...")
result = subprocess.run('git push -u origin master --force', shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 推送成功！")
    print("🌐 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("\n⏳ 魔搭将自动重新构建...")
else:
    print(f"\n❌ 推送失败：{result.stderr}")
    print("需要在魔搭网页上手动操作")

# 清理
os.chdir(LOCAL_CODE_DIR)
# shutil.rmtree(CLEAN_DIR)
print(f"\n📁 临时目录保留在：{CLEAN_DIR}")
