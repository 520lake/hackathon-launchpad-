#!/usr/bin/env python3
"""
修复版魔搭部署脚本 - 使用 _ms_space_new 目录
"""
import os
import subprocess
import shutil
import tempfile
from datetime import datetime

# 配置
MODELSCOPE_GIT_URL = 'https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aura.git'
LOCAL_DIR = r'D:\downlaod\hackthon\make\_ms_space_new'  # 使用 _ms_space_new 目录

def run_command(cmd, cwd=None, check=True):
    """运行shell命令"""
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and result.returncode != 0:
        print(f"Error: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)
    print(result.stdout)
    return result

def main():
    # 创建临时目录
    temp_dir = tempfile.mkdtemp(prefix='modelscope_deploy_')
    print(f"Working in temporary directory: {temp_dir}")
    
    try:
        # 1. 克隆魔搭master分支
        print("\n=== 1. Cloning ModelScope master branch ===")
        run_command(f'git clone {MODELSCOPE_GIT_URL} {temp_dir}')
        
        # 2. 配置git
        run_command('git config user.email "trae_ide@example.com"', cwd=temp_dir)
        run_command('git config user.name "Trae IDE"', cwd=temp_dir)
        
        # 3. 清空目标目录（保留.git）
        print("\n=== 2. Cleaning target directory ===")
        for item in os.listdir(temp_dir):
            if item != '.git':
                item_path = os.path.join(temp_dir, item)
                if os.path.isdir(item_path):
                    shutil.rmtree(item_path)
                else:
                    os.remove(item_path)
        print("  Cleaned target directory")
        
        # 4. 复制 _ms_space_new 目录下的所有文件
        print("\n=== 3. Copying files from _ms_space_new ===")
        for item in os.listdir(LOCAL_DIR):
            src = os.path.join(LOCAL_DIR, item)
            dst = os.path.join(temp_dir, item)
            if os.path.isdir(src):
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
            print(f"  Copied: {item}")
        
        # 5. 添加部署时间戳
        timestamp_file = os.path.join(temp_dir, '.deploy_timestamp')
        with open(timestamp_file, 'w') as f:
            f.write(f"Deploy timestamp: {datetime.now().isoformat()}\n")
        print(f"  Created: .deploy_timestamp")
        
        # 6. 提交更改
        print("\n=== 4. Committing changes ===")
        run_command('git add -A', cwd=temp_dir)
        
        # 检查是否有更改要提交
        status_result = run_command('git status --porcelain', cwd=temp_dir, check=False)
        if status_result.stdout.strip():
            run_command(f'git commit -m "fix(upload): use Base64 encoding for images\n\n- Replace file system storage with Base64 encoding\n- Fix 404 errors for static images on ModelScope\n- Images now stored in database as Data URLs\n- Deploy timestamp: {datetime.now().isoformat()}"', cwd=temp_dir)
            
            # 7. 推送到魔搭master
            print("\n=== 5. Pushing to ModelScope master ===")
            run_command('git push origin master', cwd=temp_dir)
            print("\n✅ Successfully deployed to ModelScope!")
            print(f"\n访问地址: https://www.modelscope.cn/studios/SULAKE666/Aura")
        else:
            print("\n⚠️ No changes to commit")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        # 清理临时目录
        if os.path.exists(temp_dir):
            print(f"\nCleaning up: {temp_dir}")
            shutil.rmtree(temp_dir, ignore_errors=True)

if __name__ == '__main__':
    main()
