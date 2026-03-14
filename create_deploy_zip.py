#!/usr/bin/env python3
"""
创建部署用的zip文件
"""
import zipfile
import os

local_base = r'd:\downlaod\hackthon\make'
output_zip = r'd:\downlaod\hackthon\make\deploy_to_modelscope.zip'

# 需要包含的文件和目录
include_paths = [
    'backend',
    'frontend',
    'docs',
    'scripts',
    'app.py',
    'Dockerfile',
    'requirements.txt',
    'configuration.json',
    'README.md',
    'LICENSE',
]

# 排除的文件和目录
exclude_patterns = [
    '.git',
    '.gitignore',
    '__pycache__',
    '*.pyc',
    '.env',
    '.venv',
    'venv',
    'node_modules',
    'dist',
    '.deploy_temp_clone',
    '.modelscope_clone',
    '_ms_space_new',
    '_ms_space_push',
    '_ms_space_aura_clean',
    'upload_bundle',
    'deploy_bundle',
    'studio_deploy',
    'deploy_temp',
    '*.db',
    '*.log',
    '.deploy_timestamp',
    'copy_*.py',
    'fix_*.py',
    'sync_*.py',
    'create_*.py',
    'test_*.py',
    'deploy_*.py',
    '*.zip',
]

def should_exclude(path):
    for pattern in exclude_patterns:
        if pattern in path:
            return True
    return False

print(f"Creating zip file: {output_zip}")

with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
    for include_path in include_paths:
        full_path = os.path.join(local_base, include_path)
        if not os.path.exists(full_path):
            print(f"  ⚠️  Not found: {include_path}")
            continue
        
        if os.path.isdir(full_path):
            for root, dirs, files in os.walk(full_path):
                # 排除不需要的目录
                dirs[:] = [d for d in dirs if not should_exclude(os.path.join(root, d))]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    if should_exclude(file_path):
                        continue
                    
                    arcname = os.path.relpath(file_path, local_base)
                    zipf.write(file_path, arcname)
                    print(f"  ✅ Added: {arcname}")
        else:
            if not should_exclude(full_path):
                arcname = os.path.relpath(full_path, local_base)
                zipf.write(full_path, arcname)
                print(f"  ✅ Added: {arcname}")

print(f"\n🎉 Zip file created: {output_zip}")
print(f"📦 Size: {os.path.getsize(output_zip) / 1024 / 1024:.2f} MB")
