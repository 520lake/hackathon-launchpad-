from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

# 修改点1：正确指向 Docker 容器内的 frontend 目录
app = Flask(__name__, static_folder='../frontend', static_url_path='')
CORS(app)

# API 示例
@app.route('/api/ping')
def ping():
    return jsonify({'msg': 'pong'})

# 修改点2：根路由明确返回 index.html
@app.route('/')
def index():
    # 注意：在 Dockerfile 里，我们把 frontend 复制到了 /app/frontend
    # 而 backend 代码在 /app/backend，所以要往上找一层
    return send_from_directory('../frontend', 'index.html')

# 修改点3：通用静态文件托管
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('../frontend', path)

if __name__ == '__main__':
    # 本地调试可改端口，gunicorn 会覆盖
    app.run(host='0.0.0.0', port=7860, debug=False)