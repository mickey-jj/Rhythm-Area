@echo off
setlocal
cd /d "%~dp0"
where pwsh.exe >nul 2>nul
if errorlevel 1 (
  echo PowerShell 7 is required.
  pause
  exit /b 1
)
pwsh.exe -NoLogo -NoProfile -File "%~dp0scripts\stop.ps1"
if errorlevel 1 (
  echo Stop failed. Read README.md.
  pause
  exit /b 1
)
endlocal
