@echo off
echo This script will temporarily DISABLE Windows Firewall for testing.
echo After testing, you should RE-ENABLE it for security.
echo.
echo Running as Administrator...
netsh advfirewall set allprofiles state off
echo.
echo Firewall is now DISABLED.
echo To re-enable, run: netsh advfirewall set allprofiles state on
pause
