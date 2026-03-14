#!/usr/bin/env python3
import shutil
import os

src = r'd:\downlaod\hackthon\make\frontend\dist'
dst = r'd:\ms_deploy_new\frontend\dist'

# 清空目标目录
if os.path.exists(dst):
    shutil.rmtree(dst)

# 复制整个目录
shutil.copytree(src, dst)
print(f"Copied {src} to {dst}")
