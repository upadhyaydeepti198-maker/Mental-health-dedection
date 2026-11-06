@echo off
title Mental Score Prediction Server
cd /d "%~dp0"
echo Starting server...
"%~dp0.venv\Scripts\python.exe" -m uvicorn main:app --host 0.0.0.0 --port 8000
pause