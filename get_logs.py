#!/usr/bin/env python3
"""
获取魔搭最新部署日志
"""
import requests

SPACE_ID = "SULAKE666/Aurathon"
TOKEN = "ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5"

headers = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

# 获取构建历史
print("📋 获取最新构建日志...\n")

try:
    response = requests.get(
        f"https://www.modelscope.cn/api/v1/spaces/{SPACE_ID}/builds",
        headers=headers,
        params={"limit": 5}
    )
    
    if response.status_code == 200:
        builds = response.json().get('builds', [])
        if builds:
            latest_build = builds[0]
            build_id = latest_build.get('id')
            status = latest_build.get('status')
            print(f"最新构建 ID: {build_id}")
            print(f"状态：{status}")
            print(f"\n详细日志:")
            print("=" * 80)
            
            # 获取详细日志
            log_response = requests.get(
                f"https://www.modelscope.cn/api/v1/spaces/{SPACE_ID}/builds/{build_id}/logs",
                headers=headers
            )
            
            if log_response.status_code == 200:
                logs = log_response.json().get('logs', '')
                # 只显示最后 100 行
                lines = logs.split('\n')
                if len(lines) > 100:
                    print("... (前部分日志已省略)")
                    for line in lines[-100:]:
                        print(line)
                else:
                    print(logs)
            else:
                print(f"获取日志失败：{log_response.status_code}")
        else:
            print("没有找到构建记录")
    else:
        print(f"获取构建历史失败：{response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"错误：{e}")
    print("\n💡 建议：")
    print("1. 在魔搭网页上点击 '日志' 标签")
    print("2. 使用搜索功能搜索 'error' 或 'ERROR'")
    print("3. 查看最新的错误信息")
