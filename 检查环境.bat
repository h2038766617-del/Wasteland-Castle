@echo off
cls
echo ========================================
echo   Environment Check Tool
echo ========================================
echo.

echo Checking available server tools...
echo.
echo ----------------------------------------

echo [Python]
where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Installed
    python --version 2>nul
) else (
    echo [--] Not installed
)
echo.

echo [py command]
where py >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Installed
    py --version 2>nul
) else (
    echo [--] Not installed
)
echo.

echo [Node.js]
where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Installed
    node --version 2>nul
) else (
    echo [--] Not installed
)
echo.

echo [npm]
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Installed
    npm --version 2>nul
) else (
    echo [--] Not installed
)
echo.

echo [npx]
where npx >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Installed
) else (
    echo [--] Not installed
)
echo.

echo ----------------------------------------
echo.
echo Recommendation:
echo   If nothing is installed, use VS Code + Live Server
echo   This is the easiest way, no Python or Node.js needed
echo.
echo   See: README_How_To_Run.txt for details
echo.
pause
