#!/usr/bin/env python3
"""
最简部署 - 只推送必要的文件到根目录
"""
import subprocess
import os
import shutil

# 配置
SPACE_URL = "https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aurathon.git"
LOCAL_CODE_DIR = r"d:\downlaod\hackthon\make"
CLEAN_DIR = r"d:\aurathon_final_deploy"

print("🎯 准备最终部署...")

# 删除并重建
if os.path.exists(CLEAN_DIR):
    shutil.rmtree(CLEAN_DIR)
os.makedirs(CLEAN_DIR)

# 只复制必要的文件到根目录
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

print("📦 复制文件...")
for src_name, dst_name in files_to_copy.items():
    src = os.path.join(LOCAL_CODE_DIR, src_name)
    dst = os.path.join(CLEAN_DIR, dst_name)
    
    if os.path.exists(src):
        if os.path.isdir(src):
            # 复制目录，排除不需要的
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
                '__pycache__', '*.pyc', '.env', 'venv', 
                'node_modules', 'dist', '*.db', '*.log', '.venv'
            ))
        else:
            shutil.copy2(src, dst)
        print(f"  ✅ {dst_name}")

print(f"\n✅ 文件已复制到 {CLEAN_DIR}")

# 初始化 git
os.chdir(CLEAN_DIR)
print("\n🚀 初始化 Git...")
subprocess.run('git init', shell=True, capture_output=True)
subprocess.run('git config user.email "trae@example.com"', shell=True, capture_output=True)
subprocess.run('git config user.name "Trae IDE"', shell=True, capture_output=True)

# 添加所有文件
print("📝 添加文件...")
subprocess.run('git add -A', shell=True, capture_output=True)

# 提交
print("💾 提交...")
result = subprocess.run('git commit -m "Final deploy: Aurathon with community and rounded UI"', 
                       shell=True, capture_output=True, text=True)
if result.returncode != 0:
    print(f"提交输出：{result.stdout}")
    print(f"提交错误：{result.stderr}")

# 添加远程
print("🔗 添加远程...")
subprocess.run(f'git remote add origin {SPACE_URL}', shell=True, capture_output=True)

# 推送到 release 分支
print("\n📤 推送到 release 分支...")
result = subprocess.run('git push -u origin master:release --force', 
                       shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 推送成功！")
    print("🌐 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("\n⏳ 魔搭将自动重新构建...")
else:
    print(f"\n❌ 推送失败：{result.stderr}")

print(f"\n📁 临时目录：{CLEAN_DIR}")
