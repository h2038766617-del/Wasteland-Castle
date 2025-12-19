@echo off
title Cursor Commander Server
color 0A
cls

echo.
echo ========================================
echo   Cursor Commander - Game Server
echo ========================================
echo.
echo Starting server...
echo.

REM Change to script directory
cd /d "%~dp0"

REM Try python
python -m http.server 8000 2>nul
if %errorlevel% equ 0 goto :eof

REM Try py
py -m http.server 8000 2>nul
if %errorlevel% equ 0 goto :eof

REM Try node
call npx -y http-server -p 8000 2>nul
if %errorlevel% equ 0 goto :eof

REM Nothing worked
cls
echo.
echo ========================================
echo   ERROR: Cannot start server
echo ========================================
echo.
echo You need to install one of these:
echo.
echo 1. Python
echo    Download: https://www.python.org/downloads/
echo.
echo 2. Node.js
echo    Download: https://nodejs.org/
echo.
echo 3. Or use VS Code + Live Server extension
echo    (Easiest method, no installation needed)
echo.
echo ========================================
echo.
echo Press any key to exit...
pause >nul
