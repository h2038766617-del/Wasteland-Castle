@echo off
cls
echo =======================================
echo   Cursor Commander - Server Startup
echo =======================================
echo.

cd /d "%~dp0"

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python found
    echo.
    echo Starting server on port 8000...
    echo Please open: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop
    echo.
    python -m http.server 8000
    goto :end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Python found (py)
    echo.
    echo Starting server on port 8000...
    echo Please open: http://localhost:8000
    echo.
    echo Press Ctrl+C to stop
    echo.
    py -m http.server 8000
    goto :end
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Node.js found
    echo.
    echo Starting server...
    echo Please check the URL below
    echo.
    echo Press Ctrl+C to stop
    echo.
    call npx -y http-server -p 8000
    goto :end
)

echo [ERROR] No server tool found!
echo.
echo Please install one of:
echo  1. Python: https://www.python.org/downloads/
echo  2. Node.js: https://nodejs.org/
echo  3. VS Code + Live Server extension
echo.
pause

:end
