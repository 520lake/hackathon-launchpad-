#!/usr/bin/env python3
"""
部署UI更新到魔搭ModelScope
基于魔搭master分支，应用UI更改（使用本地已构建的前端）
"""
import os
import subprocess
import shutil
import tempfile

# 配置
MODELSCOPE_GIT_URL = 'https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aura.git'
LOCAL_DIR = r'D:\downlaod\hackthon\make'
FRONTEND_SRC = os.path.join(LOCAL_DIR, 'frontend', 'src')
FRONTEND_DIST = os.path.join(LOCAL_DIR, 'frontend', 'dist')

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
        
        # 3. 复制我们修改的文件
        print("\n=== 2. Copying UI update files ===")
        
        files_to_copy = [
            ('frontend/src/components/AIProjectAssistant.tsx', 'frontend/src/components/AIProjectAssistant.tsx'),
            ('frontend/src/components/SubmitProjectModal.tsx', 'frontend/src/components/SubmitProjectModal.tsx'),
            ('frontend/src/pages/EventDetailPage.tsx', 'frontend/src/pages/EventDetailPage.tsx'),
            ('backend/app/api/v1/endpoints/teams.py', 'backend/app/api/v1/endpoints/teams.py'),
            ('backend/app/models/team_project.py', 'backend/app/models/team_project.py'),
            ('backend/app/api/v1/endpoints/upload.py', 'backend/app/api/v1/endpoints/upload.py'),
        ]
        
        for src_rel, dst_rel in files_to_copy:
            src = os.path.join(LOCAL_DIR, src_rel)
            dst = os.path.join(temp_dir, dst_rel)
            if os.path.exists(src):
                os.makedirs(os.path.dirname(dst), exist_ok=True)
                shutil.copy2(src, dst)
                print(f"  Copied: {src_rel}")
            else:
                print(f"  Warning: Source file not found: {src}")
        
        # 4. 复制已构建的前端dist文件夹
        print("\n=== 3. Copying built frontend dist ===")
        if os.path.exists(FRONTEND_DIST):
            dst_dist = os.path.join(temp_dir, 'frontend', 'dist')
            if os.path.exists(dst_dist):
                shutil.rmtree(dst_dist)
            shutil.copytree(FRONTEND_DIST, dst_dist)
            print(f"  Copied: frontend/dist")
        else:
            print(f"  Warning: frontend/dist not found, skipping")
        
        # 5. 提交更改
        print("\n=== 4. Committing changes ===")
        run_command('git add -A', cwd=temp_dir)
        
        # 检查是否有更改要提交
        status_result = run_command('git status --porcelain', cwd=temp_dir, check=False)
        if status_result.stdout.strip():
            run_command('git commit -m "feat(ui): unify design language across event detail page + fix image upload\n\n- Update AIProjectAssistant modal with zinc color scheme and 24px rounded corners\n- Redesign SubmitProjectModal to match community hall style\n- Unify EventDetailPage participants section with consistent styling\n- Update all buttons to use rounded-[24px] for design consistency\n- Replace retro pixel style with modern zinc-based dark theme\n- Fix image upload to use Base64 encoding for ModelScope deployment"', cwd=temp_dir)
            
            # 6. 推送到魔搭master
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
