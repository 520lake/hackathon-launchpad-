#!/usr/bin/env python3
"""
从本地同步最新代码到魔搭目录
"""
import shutil
import os
import subprocess

local_base = r'd:\downlaod\hackthon\make'
ms_base = r'd:\ms_deploy_new'

# 复制前端源代码
frontend_files = [
    'frontend/src',
    'frontend/package.json',
    'frontend/package-lock.json',
    'frontend/tsconfig.json',
    'frontend/tsconfig.app.json',
    'frontend/tsconfig.node.json',
    'frontend/vite.config.ts',
    'frontend/tailwind.config.js',
    'frontend/index.html',
    'frontend/eslint.config.js',
]

# 复制后端代码
backend_files = [
    'backend',
]

print("Syncing frontend files...")
for f in frontend_files:
    src = os.path.join(local_base, f)
    dst = os.path.join(ms_base, f)
    if os.path.exists(src):
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        else:
            os.makedirs(os.path.dirname(dst), exist_ok=True)
            shutil.copy2(src, dst)
        print(f"  ✅ {f}")
    else:
        print(f"  ❌ {f} not found")

print("\nSyncing backend files...")
for f in backend_files:
    src = os.path.join(local_base, f)
    dst = os.path.join(ms_base, f)
    if os.path.exists(src):
        if os.path.isdir(src):
            if os.path.exists(dst):
                shutil.rmtree(dst)
            shutil.copytree(src, dst)
        print(f"  ✅ {f}")
    else:
        print(f"  ❌ {f} not found")

print("\n🎉 Sync complete!")
