@echo off
chcp 65001 >nul
cls
echo ========================================
echo   环境检查工具
echo ========================================
echo.

echo 正在检查可用的服务器工具...
echo.
echo ----------------------------------------

echo [Python]
where python >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 已安装
    python --version 2>nul
) else (
    echo × 未安装
)
echo.

echo [py 命令]
where py >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 已安装
    py --version 2>nul
) else (
    echo × 未安装
)
echo.

echo [Node.js]
where node >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 已安装
    node --version 2>nul
) else (
    echo × 未安装
)
echo.

echo [npm]
where npm >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 已安装
    npm --version 2>nul
) else (
    echo × 未安装
)
echo.

echo [npx]
where npx >nul 2>nul
if %errorlevel% == 0 (
    echo ✓ 已安装
) else (
    echo × 未安装
)
echo.

echo ----------------------------------------
echo.
echo 建议：
echo   如果都没安装，推荐使用 VS Code + Live Server
echo   这是最简单的方式，无需安装 Python 或 Node.js
echo.
echo   详细说明请查看：运行指南.txt
echo.
pause
