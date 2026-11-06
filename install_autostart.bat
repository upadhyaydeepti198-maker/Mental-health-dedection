@echo off
set "DIR=%~dp0"
set "TARGET=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\mindscore_server.vbs"

> "%TARGET%" echo Set sh = CreateObject("WScript.Shell")
>> "%TARGET%" echo sh.CurrentDirectory = "%DIR%"
>> "%TARGET%" echo sh.Run """%DIR%.venv\Scripts\python.exe"" -m uvicorn main:app --host 0.0.0.0 --port 8000", 0, False

echo Done! Server will start automatically on every login.
wscript "%TARGET%"
echo Now open: http://127.0.0.1:8000
pause