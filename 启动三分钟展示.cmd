@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-presentation.ps1
if errorlevel 1 pause
