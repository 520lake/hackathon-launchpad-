@echo off
chcp 65001
echo === 开始部署到魔搭 ===

set TEMP_DIR=%TEMP%\modelscope_deploy_%RANDOM%
echo 临时目录: %TEMP_DIR%

REM 1. 克隆魔搭仓库
echo.
echo === 1. 克隆魔搭仓库 ===
git clone https://oauth2:ms-4dcbdd11-4e97-443d-a6ff-1a7f610480b5@www.modelscope.cn/studios/SULAKE666/Aura.git %TEMP_DIR%
if errorlevel 1 (
    echo 克隆失败
    exit /b 1
)

REM 2. 配置git
cd %TEMP_DIR%
git config user.email "trae_ide@example.com"
git config user.name "Trae IDE"

REM 3. 复制upload.py文件
echo.
echo === 2. 复制upload.py ===
copy /Y "D:\downlaod\hackthon\make\_ms_space_new\backend\aura_server\api\v1\endpoints\upload.py" "%TEMP_DIR%\backend\aura_server\api\v1\endpoints\upload.py"
echo upload.py 已更新

REM 4. 添加时间戳
echo Deploy timestamp: %date% %time% > .deploy_timestamp

REM 5. 提交更改
echo.
echo === 3. 提交更改 ===
git add -A
git commit -m "fix(upload): use Base64 encoding for images - %date% %time%"

REM 6. 推送
echo.
echo === 4. 推送到魔搭 ===
git push origin master

if errorlevel 1 (
    echo 推送失败
    exit /b 1
)

echo.
echo ✅ 部署成功！
echo 访问地址: https://www.modelscope.cn/studios/SULAKE666/Aura

REM 清理
cd %TEMP%
rmdir /S /Q %TEMP_DIR%
