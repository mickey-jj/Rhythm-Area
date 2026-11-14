param([switch]$OpenBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
$webUrl = "http://127.0.0.1:$($env:WEB_PORT)/"
$healthUrl = "http://127.0.0.1:$($env:HTTP_PORT)/api/health"
$runtimeDir = Join-Path $projectRoot '.local'
if (Test-Path "$runtimeDir/processes.json") {
  $previous = Get-Content "$runtimeDir/processes.json" -Raw | ConvertFrom-Json
  $alive = @($previous | Where-Object {
    $process=Get-Process -Id $_.id -ErrorAction SilentlyContinue
    $saved=[DateTimeOffset]$_.startedAt
    $process -and $process.StartTime.ToUniversalTime().Ticks -eq $saved.UtcDateTime.Ticks
  })
  if ($alive.Count -gt 0) {
    $ready=Invoke-RestMethod $healthUrl -TimeoutSec 3
    $web=Invoke-WebRequest $webUrl -TimeoutSec 3
    if ($alive.Count -ne 2 -or $ready.status -ne 'ok' -or $web.StatusCode -ne 200) { throw 'Existing processes are unhealthy. Run Stop.cmd before retrying.' }
    if ($OpenBrowser) { Start-Process $webUrl }
    Write-Output "Current tournament is already running: $webUrl"
    return
  }
}
foreach ($servicePort in @([int]$env:HTTP_PORT,[int]$env:WEB_PORT)) {
  $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$servicePort)
  try { $listener.Start() } catch { throw "Port $servicePort is occupied. Change instance.config.json or stop its owner." } finally { $listener.Stop() }
}
& "$PSScriptRoot/database.ps1" start
if ($LASTEXITCODE -ne 0) { throw 'Database preparation failed' }
if (!(Test-Path "$projectRoot/frontend/node_modules")) {
  Push-Location "$projectRoot/frontend"
  try { & npm.cmd ci --cache ../.local/npm-cache --no-audit --no-fund; if ($LASTEXITCODE -ne 0) { throw 'npm ci failed' } } finally { Pop-Location }
}
Push-Location "$projectRoot/frontend"
try { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' } } finally { Pop-Location }
& "$PSScriptRoot/backend.ps1" writeRuntimeClasspath
$javaCommand = Get-Command java -ErrorAction SilentlyContinue
$javaBin = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } elseif ($javaCommand) { $javaCommand.Source } else { Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe' }
$nodeBin = (Get-Command node).Source
$env:AREA_ROOT = $projectRoot
$env:DB_PASSWORD = (Get-Content "$runtimeDir/database-password" -Raw).Trim()
$classpath = (Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
$backendProcess = Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$runtimeDir/backend.out.log" -RedirectStandardError "$runtimeDir/backend.err.log" -WindowStyle Hidden -PassThru
Remove-Item Env:DB_PASSWORD
@(@{id=$backendProcess.Id;startedAt=$backendProcess.StartTime.ToUniversalTime().ToString('o');kind='backend'}) | ConvertTo-Json -AsArray | Set-Content "$runtimeDir/processes.json"
$frontendProcess = Start-Process -FilePath $nodeBin -ArgumentList @('node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',$env:WEB_PORT,'--strictPort') -WorkingDirectory "$projectRoot/frontend" -RedirectStandardOutput "$runtimeDir/frontend.out.log" -RedirectStandardError "$runtimeDir/frontend.err.log" -WindowStyle Hidden -PassThru
@(@{id=$backendProcess.Id;startedAt=$backendProcess.StartTime.ToUniversalTime().ToString('o');kind='backend'},@{id=$frontendProcess.Id;startedAt=$frontendProcess.StartTime.ToUniversalTime().ToString('o');kind='frontend'}) | ConvertTo-Json -AsArray | Set-Content "$runtimeDir/processes.json"
$ready = $false
foreach ($attempt in 1..30) {
  try { $health = Invoke-RestMethod $healthUrl -TimeoutSec 2; $web=Invoke-WebRequest $webUrl -TimeoutSec 2; if ($health.status -eq 'ok' -and $web.StatusCode -eq 200) { $ready=$true;break } } catch { Start-Sleep -Milliseconds 700 }
}
if (!$ready) { throw 'Backend failed to start. Inspect .local/backend.err.log and run scripts/stop.ps1.' }
Write-Output "Current tournament ready: $webUrl"
if ($OpenBrowser) { Start-Process $webUrl }
