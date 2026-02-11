@echo off
echo 正在启动前端服务...
start cmd /k "cd /d d:\downlaod\hackthon\make\frontend && npm run dev"
echo 正在启动后端服务...
start cmd /k "cd /d d:\downlaod\hackthon\make\backend && uvicorn aura_server.main:app --host 0.0.0.0 --port 8000 --reload"
echo 前端和后端服务已在单独的窗口中启动。
echo 要停止服务，请在每个服务对应的命令行窗口中按 Ctrl+C。
