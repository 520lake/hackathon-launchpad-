FROM python:3.10-slim

WORKDIR /app

# 1. 依赖文件在 backend/ 里
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# 2. 后端代码
COPY backend/ ./backend/

# 3. 前端代码
COPY frontend/ ./frontend/

# 4. 入口文件（如果 app.py 在根目录就留，否则删掉这句）
# COPY app.py ./

# 5. 端口
EXPOSE 7860

# 6. 启动
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "backend.app:app"]