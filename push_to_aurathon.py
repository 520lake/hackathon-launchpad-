#!/usr/bin/env python3
"""
推送代码到 Aurathon 创空间
"""
import subprocess
import os

# 配置
SPACE_URL = "https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aurathon.git"
LOCAL_DIR = r"d:\deploy_temp_aura_new"

def run_cmd(cmd, cwd=None):
    """运行命令并打印输出"""
    print(f"\n$ {cmd}")
    result = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if result.stdout:
        print(result.stdout)
    if result.stderr:
        print(result.stderr)
    return result.returncode == 0

# 进入部署目录
os.chdir(LOCAL_DIR)

# 初始化 git
print("🚀 开始推送到 Aurathon...")

# 删除旧的 .git 目录（如果存在）
if os.path.exists(".git"):
    import shutil
    shutil.rmtree(".git")

# 初始化新仓库
run_cmd("git init")
run_cmd("git config user.email 'trae@example.com'")
run_cmd("git config user.name 'Trae IDE'")

# 添加所有文件
run_cmd("git add -A")

# 提交
run_cmd('git commit -m "Initial deployment: Aurathon with unified UI design"')

# 添加远程仓库
run_cmd(f"git remote add origin {SPACE_URL}")

# 强制推送到 master
print("\n📤 推送到魔搭...")
success = run_cmd("git push -u origin master --force")

if success:
    print("\n✅ 推送成功！")
    print(f"\n🌐 访问地址: https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    print("\n⏳ 请等待几分钟让魔搭完成构建和部署...")
else:
    print("\n❌ 推送失败，请检查错误信息")
