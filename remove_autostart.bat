@echo off
del "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\mindscore_server.vbs"
taskkill /F /IM python.exe >nul 2>&1
echo Autostart removed.
pause
