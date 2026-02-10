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

# 4. 关键：设置 PYTHONPATH，让 Python 能从 backend 目录加载包
ENV PYTHONPATH=/app/backend

# 5. 启动：直接指向 backend.app.main 模块里的 app 对象
# 注意：这里我们绕过那个有问题的 app.py，直接用原本的 main.py 启动！
# 然后通过挂载 Gradio 的方式来补救。
# 但为了不改代码，我们还是用你的 app.py，但要换个名字复制过去。
RUN cp backend/app.py ./run.py

# 6. 启动 run.py（避免和 app 包重名）
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--workers", "1", "run:app"]