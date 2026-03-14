#!/usr/bin/env python3
"""
创建新的魔搭创空间并部署代码
"""
import os
import shutil
import subprocess

# 配置
NEW_SPACE_NAME = "Aura-New"  # 新创空间名称
NAMESPACE = "SULAKE666"  # 您的命名空间
LOCAL_CODE_DIR = r"d:\downlaod\hackthon\make"
DEPLOY_TEMP_DIR = r"d:\deploy_temp_aura_new"

# 清理并创建临时目录
if os.path.exists(DEPLOY_TEMP_DIR):
    shutil.rmtree(DEPLOY_TEMP_DIR)
os.makedirs(DEPLOY_TEMP_DIR)

print("📦 准备部署文件...")

# 复制必要文件
files_to_copy = [
    "backend",
    "frontend",
    "docs",
    "scripts",
    "app.py",
    "Dockerfile",
    "requirements.txt",
    "configuration.json",
    "README.md",
    "LICENSE",
]

for item in files_to_copy:
    src = os.path.join(LOCAL_CODE_DIR, item)
    dst = os.path.join(DEPLOY_TEMP_DIR, item)
    if os.path.exists(src):
        if os.path.isdir(src):
            shutil.copytree(src, dst, ignore=shutil.ignore_patterns(
                '.git', '__pycache__', '*.pyc', '.env', 'venv', 
                'node_modules', 'dist', '*.db', '*.log'
            ))
        else:
            shutil.copy2(src, dst)
        print(f"  ✅ {item}")

print(f"\n📁 部署文件已准备到: {DEPLOY_TEMP_DIR}")
print(f"\n🚀 请手动在魔搭创建创空间: {NAMESPACE}/{NEW_SPACE_NAME}")
print("\n创建步骤:")
print("1. 访问 https://www.modelscope.cn/studios")
print("2. 点击 '创建创空间'")
print("3. 选择 '应用' 类型")
print(f"4. 填写名称: {NEW_SPACE_NAME}")
print("5. 创建完成后，告诉我创空间地址")
