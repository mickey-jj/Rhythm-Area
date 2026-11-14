@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/start-ranking-review.ps1
if errorlevel 1 pause
