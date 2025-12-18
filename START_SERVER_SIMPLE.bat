@echo off
chcp 65001 >nul
cls
echo ========================================
echo   光标指挥官 - 游戏服务器启动
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 尝试 Python...
where python >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 找到 Python
    echo.
    echo 启动服务器在端口 8000...
    echo 请在浏览器访问: http://localhost:8000
    echo.
    echo [按 Ctrl+C 停止服务器]
    echo.
    python -m http.server 8000
    exit /b
)

echo × Python 未找到
echo.
echo [2/3] 尝试 py 命令...
where py >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 找到 py
    echo.
    echo 启动服务器在端口 8000...
    echo 请在浏览器访问: http://localhost:8000
    echo.
    echo [按 Ctrl+C 停止服务器]
    echo.
    py -m http.server 8000
    exit /b
)

echo × py 命令未找到
echo.
echo [3/3] 尝试 Node.js...
where node >nul 2>nul
if %errorlevel% == 0 (
    where npx >nul 2>nul
    if %errorlevel% == 0 (
        echo ✓ 找到 Node.js
        echo.
        echo 启动服务器...
        echo 请查看下方显示的访问地址
        echo.
        echo [按 Ctrl+C 停止服务器]
        echo.
        npx -y http-server -p 8000
        exit /b
    )
)

echo × Node.js 未找到
echo.
echo ========================================
echo   未找到可用的服务器工具！
echo ========================================
echo.
echo 请选择以下任一方式：
echo.
echo 方式 1：安装 Python
echo   下载地址: https://www.python.org/downloads/
echo   安装时勾选 "Add Python to PATH"
echo.
echo 方式 2：使用 VS Code
echo   1. 安装 VS Code: https://code.visualstudio.com/
echo   2. 安装 Live Server 扩展
echo   3. 右键 index.html - Open with Live Server
echo.
echo 方式 3：安装 Node.js
echo   下载地址: https://nodejs.org/
echo.
echo ========================================
echo.
pause
