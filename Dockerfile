FROM python:3.10-slim

WORKDIR /app

# 1. 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. 复制代码（backend 目录下是 app 包）
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 3. 关键：把 backend 目录设为 PYTHONPATH
ENV PYTHONPATH=/app/backend

# 4. 端口
EXPOSE 7860

# 5. 启动：直接运行 backend 目录下的 app.py
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "backend.app:app"]