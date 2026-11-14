@echo off
setlocal
cd /d "%~dp0"
pwsh.exe -NoLogo -NoProfile -File "%~dp0scripts\start-midterm-sample.ps1" -OpenBrowser
if errorlevel 1 pause
endlocal
