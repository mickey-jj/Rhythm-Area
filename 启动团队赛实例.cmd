@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-playable-demo.ps1" -Mode team
if errorlevel 1 (pause & exit /b 1)
start "" "http://127.0.0.1:5198/schedule"
