import os
import argparse
from modelscope.hub.api import HubApi

def deploy_to_modelscope(token, space_id, local_dir):
    """
    将本地目录推送到魔搭创空间
    """
    api = HubApi()
    
    print(f"正在登录魔搭平台...")
    try:
        api.login(token)
        print("登录成功！")
    except Exception as e:
        print(f"登录失败: {e}")
        return

    print(f"准备推送内容从 {local_dir} 到创空间 {space_id}...")
    
    # 确保 local_dir 存在
    if not os.path.exists(local_dir):
        print(f"错误: 本地目录 {local_dir} 不存在")
        return

    try:
        # 使用 upload_folder 接口推送
        # upload_folder 会将本地文件夹内容同步到远程仓库（Studio/Space）
        # 指定 repo_type='space' 以确保推送到创空间而非模型仓库
        print(f"正在通过 upload_folder 接口推送到 Studio(master) ...")
        api.upload_folder(
            repo_id=space_id,
            folder_path=local_dir,
            repo_type='space',
            commit_message="Auto-deploy from Trae IDE: Aura Platform v2.8.3 (Full Refresh)",
            revision='master'
        )
        print(f"推送成功！请访问: https://www.modelscope.cn/studios/{space_id}/summary")
    except Exception as e:
        print(f"推送过程中出现错误: {e}")
        print("如果是因为 master 分支受保护，请尝试推送到其他分支或在网页端修改设置。")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ModelScope 创空间部署工具")
    parser.add_argument("--token", required=True, help="魔搭 SDK 令牌 (Token)")
    parser.add_argument("--space", default="SULAKE666/Aura", help="创空间 ID (例如: SULAKE666/Aura)")
    parser.add_argument("--dir", default="./deploy_temp", help="要推送的本地目录")

    args = parser.parse_args()
    deploy_to_modelscope(args.token, args.space, args.dir)
