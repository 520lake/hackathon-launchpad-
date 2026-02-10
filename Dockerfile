FROM python:3.10-slim

WORKDIR /app

# 1. 依赖
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. 复制代码
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# 3. 关键步骤：
# (a) 把入口文件复制到根目录改名 run.py
RUN cp backend/app.py ./run.py
# (b) 【重要】删除 backend/app.py，防止它干扰 "import app"
RUN rm backend/app.py

# 4. 端口
EXPOSE 7860

# 5. 设置 PYTHONPATH，让 "import app.core" 能找到 backend/app/core
ENV PYTHONPATH=/app/backend

# 6. 启动 run.py
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "run:app"]