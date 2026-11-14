@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/start-match-review.ps1"
node "scripts/prepare-fair-double-review.mjs"
pause
