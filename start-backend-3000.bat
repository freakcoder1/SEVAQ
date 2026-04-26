@echo off
echo Stopping backend on port 45357...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :45357 ^| findstr LISTENING') do (
    echo Killing process %%a
    taskkill /F /PID %%a
)
timeout /t 2 /nobreak >nul
echo Starting backend on port 3000...
cd flutter-nest-househelp-master
set PORT=3000
npm run start:prod
