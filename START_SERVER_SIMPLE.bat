@echo off
cls
echo ========================================
echo   Cursor Commander - Server Startup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Checking Python...
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python found
    echo.
    echo Starting server on port 8000...
    echo.
    echo Open in browser: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop
    echo.
    python -m http.server 8000
    exit /b
)
echo [--] Python not found
echo.

echo [2/3] Checking py command...
where py >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] py found
    echo.
    echo Starting server on port 8000...
    echo.
    echo Open in browser: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop
    echo.
    py -m http.server 8000
    exit /b
)
echo [--] py not found
echo.

echo [3/3] Checking Node.js...
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js found
    echo.
    echo Starting server on port 8000...
    echo.
    echo Press Ctrl+C to stop
    echo.
    call npx -y http-server -p 8000
    exit /b
)
echo [--] Node.js not found
echo.

echo ========================================
echo   ERROR: No server tool found
echo ========================================
echo.
echo Please install one of these:
echo.
echo Option 1: Install Python
echo   URL: https://www.python.org/downloads/
echo   ! Check "Add Python to PATH" during install
echo.
echo Option 2: Use VS Code + Live Server
echo   1. Install VS Code: https://code.visualstudio.com/
echo   2. Install "Live Server" extension
echo   3. Right-click index.html - Open with Live Server
echo.
echo Option 3: Install Node.js
echo   URL: https://nodejs.org/
echo.
echo ========================================
echo.
pause
