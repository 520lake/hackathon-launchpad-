#!/usr/bin/env python3
"""
使用 ModelScope SDK 直接上传文件到创空间
"""
import sys
import os

# 添加 SDK 路径
sys.path.insert(0, r'd:\downlaod\hackthon\make')

try:
    from modelscope.hub.api import HubApi
    
    # 配置
    SPACE_ID = "SULAKE666/Aurathon"
    TOKEN = "ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5"
    SOURCE_DIR = r"d:\deploy_temp_aura_new"
    
    print("🔐 登录魔搭...")
    api = HubApi()
    api.login(TOKEN)
    
    print(f"📦 上传到 {SPACE_ID}...")
    api.push_model(
        model_id=SPACE_ID,
        model_dir=SOURCE_DIR,
        commit_message="Deploy Aurathon with unified UI design"
    )
    
    print("\n✅ 上传成功！")
    print("🌐 访问：https://www.modelscope.cn/studios/SULAKE666/Aurathon")
    
except ImportError:
    print("❌ 未安装 modelscope SDK")
    print("请运行：pip install modelscope")
except Exception as e:
    print(f"❌ 错误：{e}")
    import traceback
    traceback.print_exc()
