FROM python:3.10-slim

WORKDIR /app

# 1. 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. 关键：直接把 backend 目录下的所有内容，复制到 /app 根目录
# 这样 /app 下面就有 app/ 文件夹，也有 app.py 文件
COPY backend/ ./

# 3. 再把前端也复制进来（如果有的话）
COPY frontend/ ./frontend/

# 4. 端口
EXPOSE 7860

# 5. 不需要 PYTHONPATH 了，因为当前目录就是根目录
# 6. 启动：直接运行 app.py 里的 app 对象
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "app:app"]