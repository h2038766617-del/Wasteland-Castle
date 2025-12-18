@echo off
echo ===================================
echo   光标指挥官 - 游戏服务器启动
echo ===================================
echo.
echo 正在启动本地服务器...
echo.

:: 尝试使用 Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 Python 启动服务器（端口 8000）
    echo.
    echo 请在浏览器访问: http://localhost:8000
    echo.
    echo 按 Ctrl+C 可停止服务器
    echo.
    python -m http.server 8000
    goto :eof
)

:: 尝试使用 Python（旧版本）
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo 使用 Python 启动服务器（端口 8000）
    echo.
    echo 请在浏览器访问: http://localhost:8000
    echo.
    echo 按 Ctrl+C 可停止服务器
    echo.
    py -m http.server 8000
    goto :eof
)

:: 如果没有 Python
echo 错误: 未找到 Python！
echo.
echo 请安装 Python 或使用其他方式启动服务器：
echo 1. 安装 Python: https://www.python.org/downloads/
echo 2. 使用 VS Code Live Server 扩展
echo 3. 使用 Node.js: npx http-server
echo.
pause
