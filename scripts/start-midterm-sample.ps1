param([switch]$OpenBrowser)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
& "$PSScriptRoot/start.ps1"
if ($LASTEXITCODE -ne 0) { throw 'Project startup failed' }
Push-Location $projectRoot
try {
  & node scripts/prepare-midterm-sample.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Sample initialization failed' }
  & node scripts/prepare-midterm-library.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Sample library initialization failed' }
} finally { Pop-Location }
$sampleConfig=Get-Content -LiteralPath (Join-Path $projectRoot 'instance.config.json') -Raw | ConvertFrom-Json
if ($OpenBrowser) { Start-Process "http://127.0.0.1:$($sampleConfig.webPort)/auth?returnTo=/manage/config" }
