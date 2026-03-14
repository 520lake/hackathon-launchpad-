#!/usr/bin/env python3
"""
创建合并请求，将 v2 分支合并到 master
"""
import requests
import json
import os

# 配置
SPACE_ID = "SULAKE666/Aurathon"
TOKEN = "ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5"
BASE_URL = "https://www.modelscope.cn/api/v1"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 创建合并请求
data = {
    "source_branch": "v2",
    "target_branch": "master",
    "title": "Deploy Aurathon with unified UI design and community features",
    "description": "This MR deploys the latest Aurathon code with:\n- Unified rounded UI design\n- Community features\n- Base64 image upload\n- Fixed TypeScript errors"
}

print("📝 创建合并请求...")
response = requests.post(
    f"{BASE_URL}/repos/{SPACE_ID}/merge_requests",
    headers=headers,
    json=data
)

if response.status_code == 201:
    mr = response.json()
    print(f"\n✅ 合并请求创建成功！")
    print(f"🔗 链接：https://www.modelscope.cn/studios/SULAKE666/Aurathon/merge_requests/{mr.get('iid', 'N/A')}")
    print("\n请在网页上点击'合并'按钮完成部署")
else:
    print(f"❌ 创建失败：{response.status_code}")
    print(response.text)
