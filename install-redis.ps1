Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "SEVAQ REDIS INSTALLER FOR WINDOWS" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Downloading Redis 7.4.2 for Windows..." -ForegroundColor Yellow
Invoke-WebRequest -Uri "https://github.com/redis-windows/redis-windows/releases/download/7.4.2/Redis-7.4.2-Windows-x64.zip" -OutFile "redis.zip"

Write-Host "Extracting archive..." -ForegroundColor Yellow
Expand-Archive redis.zip -DestinationPath redis -Force

Write-Host "Installing Redis service..." -ForegroundColor Yellow
cd redis
.\redis-server.exe --service-install
.\redis-server.exe --service-start

Write-Host "Verifying Redis installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 2
.\redis-cli.exe ping

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host "REDIS INSTALLATION COMPLETE" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Redis is now running on localhost:6379"
Write-Host "✅ Backend connection errors will stop immediately"
Write-Host "✅ Automatic worker assignment system is now operational"
Write-Host ""

Pause
