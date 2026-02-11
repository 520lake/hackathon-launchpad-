FROM python:3.10-slim

WORKDIR /app

# 1. 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 2. 代码
COPY app.py ./
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 3. 端口
EXPOSE 7860

# 4. 启动
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "backend.app:app"]