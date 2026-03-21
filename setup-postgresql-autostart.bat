@echo off
REM PostgreSQL Auto-Start Configuration Script
REM Run this script as ADMINISTRATOR to configure PostgreSQL to start automatically

echo ================================================
echo SEVAQ - PostgreSQL Auto-Start Configuration
echo ================================================

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo [ERROR] Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [INFO] Configuring PostgreSQL service...

REM Set PostgreSQL service to start automatically
sc config postgresql-x64-12 start= auto
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL service set to start automatically
) else (
    echo [ERROR] Failed to configure auto-start
    pause
    exit /b 1
)

REM Start the service now
echo [INFO] Starting PostgreSQL service...
net start postgresql-x64-12
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL service started successfully
) else (
    echo [WARNING] Could not start service (might already be running or different status)
)

echo.
echo [INFO] PostgreSQL is now configured to start automatically with Windows
echo.
echo ================================================
echo [SUCCESS] Configuration complete!
echo ================================================
pause
