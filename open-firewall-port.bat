@echo off
echo ============================================
echo Windows Firewall Configuration for NestJS
echo ============================================
echo.

echo This script requires Administrator privileges.
echo Please right-click and select "Run as administrator"
echo.
echo Press any key to exit, or run manually:
echo.
echo Command to run in Admin Command Prompt:
echo netsh advfirewall firewall add rule name="NestJS Backend" dir=in action=allow protocol=TCP localport=45357
echo.
echo OR for all profiles:
echo netsh advfirewall firewall add rule name="NestJS Backend All" dir=in action=allow protocol=TCP localport=45357 profile=any
echo.

pause
