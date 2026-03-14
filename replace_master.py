#!/usr/bin/env python3
"""
正确方法：拉取远程 master，重置为最新代码，然后推送
"""
import subprocess
import os
import shutil

# 配置
SPACE_URL = "https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aurathon.git"
LOCAL_CODE_DIR = r"d:\downlaod\hackthon\make"
WORK_DIR = r"d:\aurathon_master_deploy"

print("🔄 拉取远程 master 并替换...")

# 删除并重建
if os.path.exists(WORK_DIR):
    shutil.rmtree(WORK_DIR)
os.makedirs(WORK_DIR)

# 克隆远程仓库
print("📥 克隆远程 master...")
result = subprocess.run(
    f'git clone {SPACE_URL} {WORK_DIR}',
    shell=True, capture_output=True, text=True
)

if result.returncode != 0:
    print(f"❌ 克隆失败：{result.stderr}")
    exit(1)

os.chdir(WORK_DIR)

# 复制新代码覆盖
print("📦 复制最新代码...")
files_to_copy = {
    'backend': 'backend',
    'frontend': 'frontend',
    'docs': 'docs',
    'scripts': 'scripts',
    'app.py': 'app.py',
    'Dockerfile': 'Dockerfile',
    'requirements.txt': 'requirements.txt',
    'configuration.json': 'configuration.json',
    'README.md': 'README.md',
    'LICENSE': 'LICENSE',
    '.dockerignore': '.dockerignore',
    'nginx.conf': 'nginx.conf',
}

# 先删除旧文件
for item in os.listdir(WORK_DIR):
    if item not in ['.git', '.gitattributes']:
        path = os.path.join(WORK_DIR, item)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)

# 复制新文件
for src_name, dst_name in files_to_copy.items():
    src = os.path.join(LOCAL_CODE_DIR, src_name)
    dst = os.path.join(WORK_DIR, dst_name)
    
    if os.path.exists(src):
        if os.path.isdir(src):
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
                '__pycache__', '*.pyc', '.env', 'venv', 
                'node_modules', 'dist', '*.db', '*.log', '.venv'
            ))
        else:
            shutil.copy2(src, dst)
        print(f"  ✅ {dst_name}")

# Git 操作
print("\n🔄 Git 操作...")
subprocess.run('git config user.email "trae@example.com"', shell=True, capture_output=True)
subprocess.run('git config user.name "Trae IDE"', shell=True, capture_output=True)

# 添加所有文件
print("📝 添加文件...")
subprocess.run('git add -A', shell=True, capture_output=True)

# 提交
print("💾 提交...")
subprocess.run('git commit -m "Replace with latest Aurathon code"', 
               shell=True, capture_output=True)

# 推送到 master
print("\n📤 推送到 master...")
result = subprocess.run('git push origin master', 
                       shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 推送成功！")
    print("🌐 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("\n⏳ 魔搭将自动重新构建...")
else:
    print(f"\n❌ 推送失败：{result.stderr}")
    print("\n尝试强制推送...")
    result = subprocess.run('git push origin master --force', 
                           shell=True, capture_output=True, text=True)
    if result.returncode == 0:
        print("\n✅ 强制推送成功！")
    else:
        print(f"\n❌ 强制推送也失败：{result.stderr}")

print(f"\n📁 工作目录：{WORK_DIR}")
