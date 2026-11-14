@echo off
setlocal
cd /d "%~dp0"
where pwsh.exe >nul 2>nul
if errorlevel 1 (
  echo PowerShell 7 is required. Install it from Microsoft, then retry.
  pause
  exit /b 1
)
pwsh.exe -NoLogo -NoProfile -File "%~dp0scripts\start.ps1" -OpenBrowser
if errorlevel 1 (
  echo Startup failed. Read the message above and README.md.
  pause
  exit /b 1
)
endlocal
