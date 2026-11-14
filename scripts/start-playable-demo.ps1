param([ValidateSet('solo','team')][string]$Mode='solo')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
$offset=if($Mode -eq 'team'){14}else{12}
$demoApiPort=[int]$env:HTTP_PORT+$offset
$demoWebPort=[int]$env:WEB_PORT+$offset
$demoDatabase='area_playable_'+$Mode+'_midterm'
$recordPath=Join-Path $projectRoot ('.local/playable-'+$Mode+'-processes.json')
$healthUrl="http://127.0.0.1:$demoApiPort/api/health"
$running=$false
try{$running=(Invoke-RestMethod $healthUrl -TimeoutSec 1).status -eq 'ok'}catch{}
if($running){if(!(Test-Path -LiteralPath $recordPath)){throw 'Demo port belongs to another instance.'}}
else{
  & "$PSScriptRoot/database.ps1" start
  & "$PSScriptRoot/backend.ps1" writeRuntimeClasspath
  if($LASTEXITCODE -ne 0){throw 'Backend preparation failed'}
  if(!(Test-Path -LiteralPath (Join-Path $projectRoot 'frontend/dist/index.html'))){
    Push-Location "$projectRoot/frontend"
    try{& npm.cmd ci; if($LASTEXITCODE -ne 0){throw 'Frontend dependencies failed'}; & npm.cmd run build; if($LASTEXITCODE -ne 0){throw 'Frontend build failed'}}finally{Pop-Location}
  }
  $pgBin=if($env:PG_BIN){$env:PG_BIN}else{'C:/Program Files/PostgreSQL/18/bin'}
  $env:PGPASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
  try{
    $exists=& "$pgBin/psql.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -d postgres -X -tAc "SELECT 1 FROM pg_database WHERE datname='$demoDatabase'"
    if($LASTEXITCODE -ne 0){throw 'Demo database connection failed'}
    if($exists -ne '1'){& "$pgBin/createdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area $demoDatabase; if($LASTEXITCODE -ne 0){throw 'Demo database creation failed'}}
  }finally{Remove-Item Env:PGPASSWORD}
  foreach($port in @($demoApiPort,$demoWebPort)){
    $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$port)
    try{$listener.Start()}finally{$listener.Stop()}
  }
  $keys=@('DB_NAME','HTTP_PORT','WEB_PORT','APP_ORIGIN','VITE_API_TARGET','AREA_ROOT','DB_PASSWORD')
  $saved=@{};foreach($key in $keys){$saved[$key]=[Environment]::GetEnvironmentVariable($key,'Process')}
  try{
    $env:DB_NAME=$demoDatabase;$env:HTTP_PORT=[string]$demoApiPort;$env:WEB_PORT=[string]$demoWebPort
    $env:APP_ORIGIN="http://127.0.0.1:$demoWebPort";$env:VITE_API_TARGET="http://127.0.0.1:$demoApiPort";$env:AREA_ROOT=$projectRoot
    $env:DB_PASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
    $javaBin=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}else{Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe'}
    $classpath=(Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
    $api=Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$projectRoot/.local/playable-$Mode-api.out.log" -RedirectStandardError "$projectRoot/.local/playable-$Mode-api.err.log" -WindowStyle Hidden -PassThru
    $web=Start-Process -FilePath (Get-Command node).Source -ArgumentList @('node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',$demoWebPort,'--strictPort') -WorkingDirectory "$projectRoot/frontend" -RedirectStandardOutput "$projectRoot/.local/playable-$Mode-web.out.log" -RedirectStandardError "$projectRoot/.local/playable-$Mode-web.err.log" -WindowStyle Hidden -PassThru
    @([PSCustomObject]@{kind='api';id=$api.Id;startedAt=$api.StartTime.ToUniversalTime().ToString('o');port=$demoApiPort;database=$demoDatabase},[PSCustomObject]@{kind='web';id=$web.Id;startedAt=$web.StartTime.ToUniversalTime().ToString('o');port=$demoWebPort}) | ConvertTo-Json | Set-Content -LiteralPath $recordPath -Encoding utf8
  }finally{foreach($key in $keys){[Environment]::SetEnvironmentVariable($key,$saved[$key],'Process')}}
  $ready=$false
  foreach($attempt in 1..35){try{if((Invoke-RestMethod $healthUrl -TimeoutSec 1).status -eq 'ok'){$ready=$true;break}}catch{Start-Sleep -Milliseconds 300}}
  if(!$ready){throw 'Playable demo failed to start'}
}
Push-Location $projectRoot
try{& node scripts/prepare-playable-demo.mjs $Mode; if($LASTEXITCODE -ne 0){throw 'Demo initialization failed'}}finally{Pop-Location}
