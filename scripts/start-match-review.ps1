param([switch]$OpenBrowser)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
$reviewApiPort=[int]$env:HTTP_PORT+2
$reviewWebPort=[int]$env:WEB_PORT+2
$recordPath=Join-Path $projectRoot '.local/match-review-processes.json'
$healthUrl="http://127.0.0.1:$reviewApiPort/api/health"
$running=$false
try { $running=(Invoke-RestMethod $healthUrl -TimeoutSec 1).status -eq 'ok' } catch { }
if ($running) {
  if (!(Test-Path -LiteralPath $recordPath)) { throw 'Review port is occupied by another instance.' }
} else {
  & "$PSScriptRoot/database.ps1" start
  & "$PSScriptRoot/backend.ps1" writeRuntimeClasspath
  if ($LASTEXITCODE -ne 0) { throw 'Backend preparation failed' }
  $pgBin=if($env:PG_BIN){$env:PG_BIN}else{'C:/Program Files/PostgreSQL/18/bin'}
  $reviewDatabase='area_match_review_midterm'
  $env:PGPASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
  try {
    $exists=& "$pgBin/psql.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -d postgres -X -tAc "SELECT 1 FROM pg_database WHERE datname='$reviewDatabase'"
    if ($LASTEXITCODE -ne 0) { throw 'Review database connection failed' }
    if ($exists -ne '1') { & "$pgBin/createdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area $reviewDatabase; if($LASTEXITCODE -ne 0){throw 'Review database creation failed'} }
  } finally { Remove-Item Env:PGPASSWORD }
  foreach($port in @($reviewApiPort,$reviewWebPort)){
    $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$port)
    try{$listener.Start()}finally{$listener.Stop()}
  }
  $savedEnvironment=@{}
  foreach($key in @('DB_NAME','HTTP_PORT','WEB_PORT','APP_ORIGIN','VITE_API_TARGET','AREA_ROOT','DB_PASSWORD')){$savedEnvironment[$key]=[Environment]::GetEnvironmentVariable($key,'Process')}
  try {
    $env:DB_NAME=$reviewDatabase;$env:HTTP_PORT=[string]$reviewApiPort;$env:WEB_PORT=[string]$reviewWebPort
    $env:APP_ORIGIN="http://127.0.0.1:$reviewWebPort";$env:VITE_API_TARGET="http://127.0.0.1:$reviewApiPort";$env:AREA_ROOT=$projectRoot
    $env:DB_PASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
    $javaCommand=Get-Command java -ErrorAction SilentlyContinue
    $javaBin=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}elseif($javaCommand){$javaCommand.Source}else{Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe'}
    $classpath=(Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
    $api=Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$projectRoot/.local/match-review-api.out.log" -RedirectStandardError "$projectRoot/.local/match-review-api.err.log" -WindowStyle Hidden -PassThru
    $web=Start-Process -FilePath (Get-Command node).Source -ArgumentList @('node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',$reviewWebPort,'--strictPort') -WorkingDirectory "$projectRoot/frontend" -RedirectStandardOutput "$projectRoot/.local/match-review-web.out.log" -RedirectStandardError "$projectRoot/.local/match-review-web.err.log" -WindowStyle Hidden -PassThru
    @([PSCustomObject]@{kind='api';id=$api.Id;startedAt=$api.StartTime.ToUniversalTime().ToString('o');port=$reviewApiPort;database=$reviewDatabase},[PSCustomObject]@{kind='web';id=$web.Id;startedAt=$web.StartTime.ToUniversalTime().ToString('o');port=$reviewWebPort}) | ConvertTo-Json | Set-Content -LiteralPath $recordPath -Encoding utf8
  } finally { foreach($key in $savedEnvironment.Keys){[Environment]::SetEnvironmentVariable($key,$savedEnvironment[$key],'Process')} }
  $ready=$false
  foreach($attempt in 1..35){try{if((Invoke-RestMethod $healthUrl -TimeoutSec 1).status -eq 'ok'){$ready=$true;break}}catch{Start-Sleep -Milliseconds 300}}
  if(!$ready){throw 'Review instance failed to start; inspect .local/match-review-api.err.log'}
}
Push-Location $projectRoot
try{& node scripts/prepare-match-review.mjs;if($LASTEXITCODE -ne 0){throw 'Review sample initialization failed'}}finally{Pop-Location}
if($OpenBrowser){Start-Process "http://127.0.0.1:$reviewWebPort/schedule"}
