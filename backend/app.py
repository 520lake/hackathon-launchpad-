from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os

app = Flask(__name__, static_folder='frontend', static_url_path='')
CORS(app)

# API 示例
@app.route('/api/ping')
def ping():
    return jsonify({'msg': 'pong'})

# 前端托管
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

# 其余静态资源
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

if __name__ == '__main__':
    # 本地调试可改端口，gunicorn 会覆盖
    app.run(host='0.0.0.0', port=7860, debug=False)