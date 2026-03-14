#!/usr/bin/env python3
"""
复制缺失的组件文件到魔搭目录
"""
import shutil
import os

# 需要复制的文件
files_to_copy = [
    'frontend/src/components/CriteriaSection.tsx',
    'frontend/src/components/PrizesSection.tsx',
    'frontend/src/components/AIGenerateImageButton.tsx',
]

local_base = r'd:\downlaod\hackthon\make'
modelscope_base = r'd:\ms_deploy_new'

for rel_path in files_to_copy:
    src = os.path.join(local_base, rel_path)
    dst = os.path.join(modelscope_base, rel_path)
    
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"✅ Copied: {rel_path}")
    else:
        print(f"❌ Not found: {rel_path}")

print("\n🎉 All missing components copied!")
