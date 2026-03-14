#!/usr/bin/env python3
"""
修复魔搭前端源代码
"""
import shutil
import os

# 源文件（已修复的本地文件）
src_files = {
    'frontend/tsconfig.app.json': 'frontend/tsconfig.app.json',
    'frontend/src/components/AIProjectAssistant.tsx': 'frontend/src/components/AIProjectAssistant.tsx',
    'frontend/src/components/AiMagicButtonV2.tsx': 'frontend/src/components/AiMagicButtonV2.tsx',
    'frontend/src/components/CreateHackathonStep2.tsx': 'frontend/src/components/CreateHackathonStep2.tsx',
    'frontend/src/components/HackathonDetailModal.tsx': 'frontend/src/components/HackathonDetailModal.tsx',
    'frontend/src/pages/EventDetailPage.tsx': 'frontend/src/pages/EventDetailPage.tsx',
}

local_base = r'd:\downlaod\hackthon\make'
modelscope_base = r'd:\ms_deploy_new'

for src_rel, dst_rel in src_files.items():
    src = os.path.join(local_base, src_rel)
    dst = os.path.join(modelscope_base, dst_rel)
    
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"✅ Copied: {src_rel}")
    else:
        print(f"❌ Not found: {src_rel}")

print("\n🎉 All files copied!")
