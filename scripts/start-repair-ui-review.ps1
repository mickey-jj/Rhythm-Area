$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
foreach($port in @(8187,5287)){
  $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$port)
  try{$listener.Start()}finally{$listener.Stop()}
}
$env:DB_NAME='area_verify_'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,5)+'_ui'
$env:HTTP_PORT='8187';$env:WEB_PORT='5287';$env:APP_ORIGIN='http://127.0.0.1:5287';$env:VITE_API_TARGET='http://127.0.0.1:8187'
& "$PSScriptRoot/database.ps1" start
& "$PSScriptRoot/backend.ps1" writeRuntimeClasspath
$javaBin=Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe'
$classpath=(Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
$classes=[IO.Path]::GetFullPath((Join-Path $projectRoot 'backend/target/scala-3.9.0/classes'))
$snapshot=[IO.Path]::GetFullPath((Join-Path $projectRoot ('.local/ui-build-'+$env:DB_NAME)))
if(!$snapshot.StartsWith([IO.Path]::GetFullPath((Join-Path $projectRoot '.local'))+[IO.Path]::DirectorySeparatorChar)){throw 'Unsafe snapshot path'}
New-Item -ItemType Directory -Force -Path $snapshot | Out-Null
Copy-Item -LiteralPath $classes -Destination (Join-Path $snapshot 'classes') -Recurse
$classpath=$classpath.Replace($classes,(Join-Path $snapshot 'classes'))
$env:DB_PASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim();$env:AREA_ROOT=$projectRoot
$api=Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$projectRoot/.local/repair-ui-api.out.log" -RedirectStandardError "$projectRoot/.local/repair-ui-api.err.log" -WindowStyle Hidden -PassThru
Remove-Item Env:DB_PASSWORD
$proxy=Start-Process -FilePath (Get-Command node).Source -ArgumentList @('scripts/repair-ui-proxy.mjs') -WorkingDirectory $projectRoot -RedirectStandardOutput "$projectRoot/.local/repair-ui-proxy.out.log" -RedirectStandardError "$projectRoot/.local/repair-ui-proxy.err.log" -WindowStyle Hidden -PassThru
@{database=$env:DB_NAME;api=@{id=$api.Id;startedAt=$api.StartTime.ToUniversalTime().ToString('o')};proxy=@{id=$proxy.Id;startedAt=$proxy.StartTime.ToUniversalTime().ToString('o')}} | ConvertTo-Json -Depth 4 | Set-Content "$projectRoot/.local/repair-ui-processes.json"
$ready=$false
foreach($attempt in 1..45){try{if((Invoke-RestMethod 'http://127.0.0.1:8187/api/health' -TimeoutSec 1).status -eq 'ok'){$ready=$true;break}}catch{Start-Sleep -Milliseconds 300}}
if(!$ready){throw 'Isolated UI API failed; inspect .local/repair-ui-api.err.log'}
Push-Location $projectRoot
try{& node scripts/repair-ui-seed.mjs;if($LASTEXITCODE -ne 0){throw 'UI seed failed'}}finally{Pop-Location}
Write-Output 'Isolated UI review ready: http://127.0.0.1:5287/'
