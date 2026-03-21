@echo off
REM PostgreSQL and Backend Startup Script
REM Run this script as ADMINISTRATOR to ensure PostgreSQL service can be started

echo ================================================
echo SEVAQ - PostgreSQL and Backend Startup Script
echo ================================================

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] This script must be run as Administrator!
    echo [ERROR] Please right-click and select "Run as administrator"
    pause
    exit /b 1
)

echo [INFO] Running with administrator privileges...

REM Step 1: Check and Start PostgreSQL Service
echo.
echo [STEP 1] Checking PostgreSQL service status...
sc query postgresql-x64-12 >nul 2>&1
if %errorLevel% equ 0 (
    echo [INFO] PostgreSQL service exists, checking status...
    for /f "tokens=3" %%s in ('sc query postgresql-x64-12 ^| findstr /c:"STATE"') do (
        if "%%s"=="RUNNING" (
            echo [OK] PostgreSQL service is already running
        ) else (
            echo [INFO] Starting PostgreSQL service...
            net start postgresql-x64-12
            if %errorLevel% equ 0 (
                echo [OK] PostgreSQL service started successfully
            ) else (
                echo [ERROR] Failed to start PostgreSQL service
                pause
                exit /b 1
            )
        )
    )
) else (
    echo [INFO] PostgreSQL service not found, attempting to start anyway...
    net start postgresql-x64-12
    if %errorLevel% equ 0 (
        echo [OK] PostgreSQL service started successfully
    ) else (
        echo [ERROR] Could not start PostgreSQL service
        echo [INFO] Please ensure PostgreSQL is installed correctly
        pause
        exit /b 1
    )
)

REM Step 2: Wait for PostgreSQL to be ready
echo.
echo [STEP 2] Waiting for PostgreSQL to be ready (3 seconds)...
ping -n 4 127.0.0.1 >nul

REM Step 3: Verify PostgreSQL is listening on port 5432
echo.
echo [STEP 3] Verifying PostgreSQL is listening on port 5432...
netstat -ano | findstr :5432 >nul
if %errorLevel% equ 0 (
    echo [OK] PostgreSQL is listening on port 5432
) else (
    echo [WARNING] PostgreSQL might not be listening on port 5432
    echo [INFO] Attempting to connect to verify...
)

REM Step 4: Create database if it doesn't exist
echo.
echo [STEP 4] Checking if database 'sevaq_db' exists...
set PGPASSWORD=admin
psql -U postgres -h localhost -c "SELECT 1 FROM pg_database WHERE datname='sevaq_db'" 2>nul | findstr sevaq_db >nul
if %errorLevel% equ 0 (
    echo [OK] Database 'sevaq_db' already exists
) else (
    echo [INFO] Database 'sevaq_db' does not exist, creating...
    psql -U postgres -h localhost -c "CREATE DATABASE sevaq_db;" 2>nul
    if %errorLevel% equ 0 (
        echo [OK] Database 'sevaq_db' created successfully
    ) else (
        echo [WARNING] Could not create database (might already exist or permission issue)
    )
)

REM Step 5: Start the Backend Server
echo.
echo [STEP 5] Starting NestJS backend server...
echo.
cd /d "%~dp0flutter-nest-househelp-master"
echo [INFO] Working directory: %cd%
echo [INFO] Starting backend with: npm run start:dev
echo.
echo ================================================
echo [OK] All systems ready! Backend is starting...
echo [OK] You should see TypeORM connection messages shortly
echo ================================================
echo.
npm run start:dev

echo.
echo [INFO] Backend server stopped
pause
