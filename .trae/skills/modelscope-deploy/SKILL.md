---
name: "modelscope-deploy"
description: "将项目部署到魔搭（ModelScope）创空间或模型仓库。当用户需要将代码推送到 ModelScope 平台进行展示或部署时调用。"
---

# ModelScope Deploy Skill

此 Skill 用于指导和自动化将项目推送到魔搭（ModelScope）平台的过程。

## 核心流程

1. **环境准备**
   - 安装 modelscope SDK: `pip install modelscope`
   - 获取魔搭 SDK 令牌（Token）：从 [魔搭控制台](https://modelscope.cn/user/center/token) 获取。

2. **登录验证**
   ```python
   from modelscope.hub.api import HubApi
   api = HubApi()
   api.login('YOUR_MODELSCOPE_SDK_TOKEN')
   ```

3. **创建/选择创空间 (Space)**
   - 在魔搭官网手动创建创空间，获取 `namespace/space_name`。
   - 准备部署文件（如 `app.py`, `requirements.txt`）。

4. **推送代码**
   - 使用 Git 或 ModelScope SDK 推送。
   - 推荐使用 SDK 快速上传：
   ```python
   from modelscope.hub.api import HubApi
   api = HubApi()
   api.push_model(
       model_id='namespace/project_name', 
       model_dir='./local_dir'
   )
   ```

## 部署建议
- **创空间部署**：适用于 Gradio/Streamlit 展示。
- **模型部署**：适用于纯模型权重或推理代码。
- **文件结构**：确保根目录下有入口文件。
