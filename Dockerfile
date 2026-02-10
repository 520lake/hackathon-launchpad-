FROM python:3.10-slim

WORKDIR /app

# 1. 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. 复制代码
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 3. 端口
EXPOSE 7860

# 4. 关键修正：设置 PYTHONPATH 让 Python 能找到 backend 目录下的 app 模块
ENV PYTHONPATH=/app/backend

# 5. 启动：直接运行 app 模块（因为 PYTHONPATH 已经指向 backend 了）
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "app:app"]