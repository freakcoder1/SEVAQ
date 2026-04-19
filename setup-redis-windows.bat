@echo off
echo ==============================================
echo SEVAQ REDIS SETUP FOR WINDOWS
echo ==============================================
echo.

echo Downloading Redis for Windows...
powershell -Command "& {Invoke-WebRequest -Uri 'https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.msi' -OutFile 'Redis-x64-3.2.100.msi'}"

echo.
echo Installing Redis...
start /wait msiexec /i Redis-x64-3.2.100.msi /quiet ADDLOCAL=ALL

echo.
echo Starting Redis service...
sc config redis start= auto
net start redis

echo.
echo Verifying Redis installation...
timeout /t 3 /nobreak > nul
redis-cli ping

echo.
echo ==============================================
echo REDIS INSTALLATION COMPLETE
echo ==============================================
echo Redis is now running on localhost:6379
echo The backend server will now connect successfully
echo.
pause