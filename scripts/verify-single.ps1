param([switch]$KeepRunning,[switch]$Advanced,[string]$Case="",[switch]$LibraryOnly,[switch]$LiveRulesOnly,[switch]$TeamsOnly,[switch]$FairOnly,[string]$FairModes="",[switch]$RankingOnly,[string]$RankingModes="",[switch]$ClockOnly,[switch]$ResetOnly)
$ErrorActionPreference='Stop'
$environmentKeys=@('DB_NAME','DB_PORT','HTTP_PORT','WEB_PORT','APP_ORIGIN','VITE_API_TARGET','AREA_ROOT','DB_PASSWORD','PGPASSWORD')
$previousEnvironment=@{}
foreach($key in $environmentKeys){$previousEnvironment[$key]=[Environment]::GetEnvironmentVariable($key,'Process')}
$projectRoot=Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
& "$PSScriptRoot/database.ps1" start
& "$PSScriptRoot/backend.ps1" writeRuntimeClasspath
$javaBin=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}else{Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe'}
$pgBin=if($env:PG_BIN){$env:PG_BIN}else{'C:/Program Files/PostgreSQL/18/bin'}
$classpath=(Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
$runKey='area_verify_'+[DateTime]::UtcNow.ToString('yyyyMMddHHmmss')+'_'+[Guid]::NewGuid().ToString('N').Substring(0,5)
# Freeze compiled classes for the whole test run; later development builds cannot invalidate them.
$compiledClasses = [System.IO.Path]::GetFullPath((Join-Path $projectRoot 'backend/target/scala-3.9.0/classes'))
$snapshotRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot ('.local/test-build-'+$runKey)))
if (!$snapshotRoot.StartsWith([System.IO.Path]::GetFullPath((Join-Path $projectRoot '.local'))+[System.IO.Path]::DirectorySeparatorChar)) { throw 'Unsafe test snapshot path' }
New-Item -ItemType Directory -Force -Path $snapshotRoot | Out-Null
Copy-Item -LiteralPath $compiledClasses -Destination (Join-Path $snapshotRoot 'classes') -Recurse
$classpath = $classpath.Replace($compiledClasses,(Join-Path $snapshotRoot 'classes'))

foreach($testPort in @(8083,8084)){
  $listener=[System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback,$testPort)
  try{$listener.Start()}catch{throw "Test port $testPort is occupied. Stop the prior KeepRunning test instance before retrying."}finally{$listener.Stop()}
}
$servers=[System.Collections.Generic.List[object]]::new()
$succeeded=$false
function Start-TestApi([string]$suffix,[int]$port,[int]$webPort){
  $dbName=$runKey+'_'+$suffix
  $env:PGPASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
  & "$pgBin/createdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area $dbName
  if($LASTEXITCODE -ne 0){throw 'Test database creation failed'}
  Remove-Item Env:PGPASSWORD
  $env:DB_NAME=$dbName;$env:HTTP_PORT=[string]$port;$env:APP_ORIGIN="http://127.0.0.1:$webPort";$env:AREA_ROOT=$projectRoot
  $env:DB_PASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
  $process=Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$projectRoot/.local/test-$suffix.out.log" -RedirectStandardError "$projectRoot/.local/test-$suffix.err.log" -WindowStyle Hidden -PassThru
  Remove-Item Env:DB_PASSWORD
  $record=[PSCustomObject]@{id=$process.Id;startedAt=$process.StartTime.ToUniversalTime().ToString('o');database=$dbName;port=$port}
  $servers.Add($record)
  $ready=$false
  foreach($attempt in 1..35){try{$health=Invoke-RestMethod "http://127.0.0.1:$port/api/health" -TimeoutSec 1;if($health.status -eq 'ok'){$ready=$true;break}}catch{Start-Sleep -Milliseconds 300}}
  if(!$ready){throw "Test API $port failed; see .local/test-$suffix.err.log"}
  return $record
}
function Stop-TestApi($record){
  $process=Get-Process -Id $record.id -ErrorAction SilentlyContinue
  $saved=[DateTimeOffset]$record.startedAt
  if($process -and $process.StartTime.ToUniversalTime().Ticks -eq $saved.UtcDateTime.Ticks){Stop-Process -Id $record.id}
}
try{
  if($ResetOnly){
    foreach($mode in @('solo','team','fixed','group','group-team','double')){
      $resetServer=Start-TestApi ('reset_'+$mode.Replace('-','_')) 8083 5175
      Push-Location $projectRoot
      try{
        if($mode -eq 'double'){& node scripts/reset-double-integration.mjs}
        elseif($mode.StartsWith('group')){& node scripts/fair-group-integration.mjs $mode.Replace('group','reset')}
        else{& node scripts/match-reset-integration.mjs $mode}
        if($LASTEXITCODE -ne 0){throw "Match reset test failed: $mode"}
      }finally{Pop-Location}
      Stop-TestApi $resetServer
    }
    $succeeded=$true
    return
  }
  if((!$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly) -and !$ClockOnly){
  $a=Start-TestApi 'a' 8083 5175
  $b=Start-TestApi 'b' 8084 5176
  Push-Location $projectRoot
  try{& node scripts/integration.mjs;if($LASTEXITCODE -ne 0){throw 'Single-instance integration failed'}}finally{Pop-Location}
  Stop-TestApi $a
  foreach($count in @(3,5,8)){
    $bracket=Start-TestApi "bracket$count" 8083 5175
    Push-Location $projectRoot
    try{& node scripts/bracket-integration.mjs $count;if($LASTEXITCODE -ne 0){throw "Bracket $count failed"}}finally{Pop-Location}
    if(!$KeepRunning -or $count -ne 8){Stop-TestApi $bracket}
  }
  }
  if(((!$Case -or $LibraryOnly) -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly) -and !$ClockOnly){
    $libraryServer=Start-TestApi 'library' 8083 5175
    Push-Location $projectRoot
    try{& node scripts/library-integration.mjs;if($LASTEXITCODE -ne 0){throw 'Library integration failed'}}finally{Pop-Location}
    Stop-TestApi $libraryServer
  }
  if(($LiveRulesOnly -or (!$Case -and !$LibraryOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly)) -and !$ClockOnly){
    $liveServer=Start-TestApi 'live_rules' 8083 5175
    Push-Location $projectRoot
    try{& node scripts/live-rules-integration.mjs;if($LASTEXITCODE -ne 0){throw 'Live rules integration failed'}}finally{Pop-Location}
    Stop-TestApi $liveServer
  }
  if(($RankingOnly -or ($Advanced -and !$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly)) -and !$ClockOnly){
    $rankingCases=if($RankingModes){@($RankingModes.Split(','))}else{@('fixed','duration','threshold','threshold-low','team-threshold','scheduled','legacy','stages')}
    foreach($mode in $rankingCases){
      $rankingServer=Start-TestApi ('ranking_'+$mode.Replace('-','_')) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/ranking-integration.mjs $mode;if($LASTEXITCODE -ne 0){throw "Ranking integration failed: $mode"}}finally{Pop-Location}
      Stop-TestApi $rankingServer
    }
  }
  if(($TeamsOnly -or ($Advanced -and !$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$FairOnly -and !$RankingOnly)) -and !$ClockOnly){
    foreach($spec in @('free:free','appointed:draft','application:free','random:random','free:draft','appointed:random','application:draft')){
      $parts=$spec.Split(':')
      $teamServer=Start-TestApi ('teams_'+$parts[0]+'_'+$parts[1]) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/team-formation-integration.mjs $parts[0] $parts[1];if($LASTEXITCODE -ne 0){throw "Team formation failed: $spec"}}finally{Pop-Location}
      Stop-TestApi $teamServer
    }
  }
  if(($FairOnly -or ($Advanced -and !$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$RankingOnly)) -and !$ClockOnly){
    $fairCases=if($FairModes){@($FairModes.Split(','))}else{@('normal','team','playing-replan','completed-replan')}
    foreach($mode in $fairCases){
      $fairServer=Start-TestApi ('fair_'+$mode.Replace('-','_')) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/fair-group-integration.mjs $mode;if($LASTEXITCODE -ne 0){throw "Fair double integration failed: $mode"}}finally{Pop-Location}
      Stop-TestApi $fairServer
    }
  }
  if((($Advanced -or $Case) -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly) -and !$ClockOnly){
    $cases=if($Case){@($Case.Split(','))}else{@('ranking:3','advantage:3','round-tie:3','double:3','double:5','double:8','round-robin:3','round-robin:5','multi:5','first-to:3','sealed:3','remove:3','team:3','team-qualifier:2','qualifier:2','window:2','fixed:3','mystery:3','assign:3','overlap:3','cut:5','preset:9')}
    foreach($spec in $cases){
      $parts=$spec.Split(':');$kind=$parts[0];$count=if($parts.Length -gt 1){$parts[1]}else{'3'}
      $caseServer=Start-TestApi ('adv_'+$kind.Replace('-','_')+'_'+$count) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/advanced-integration.mjs $kind $count;if($LASTEXITCODE -ne 0){throw "Advanced integration failed: $spec"}}finally{Pop-Location}
      Stop-TestApi $caseServer
    }
  }
  if($ClockOnly -or ($Advanced -and !$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly)){
    foreach($mode in @('solo','team')){
      $clockServer=Start-TestApi ('clock_'+$mode) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/match-clock-integration.mjs $mode;if($LASTEXITCODE -ne 0){throw "Clock test failed: $mode"}}finally{Pop-Location}
      Stop-TestApi $clockServer
    }
  }
  if($ClockOnly -or ($Advanced -and !$Case -and !$LibraryOnly -and !$LiveRulesOnly -and !$TeamsOnly -and !$FairOnly -and !$RankingOnly)){
    foreach($mode in @('clock','clock-team')){
      $clockGroup=Start-TestApi ('group_'+$mode.Replace('-','_')) 8083 5175
      Push-Location $projectRoot
      try{& node scripts/fair-group-integration.mjs $mode;if($LASTEXITCODE -ne 0){throw "Group clock test failed: $mode"}}finally{Pop-Location}
      Stop-TestApi $clockGroup
    }
  }
  $succeeded=$true
}finally{
  try{
  if(!$KeepRunning -or !$succeeded){foreach($server in $servers){Stop-TestApi $server}}
  else{$servers | ConvertTo-Json -AsArray | Set-Content "$projectRoot/.local/test-servers.json"}
  if($succeeded -and !$KeepRunning){
    $env:PGPASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
    try{
      foreach($server in $servers){
        if(!$server.database.StartsWith($runKey+'_') -or $server.database -notmatch '^area_verify_[0-9]{14}_[a-f0-9]{5}_[a-z0-9_]+$'){throw 'Unexpected test database name; cleanup stopped'}
        & "$pgBin/dropdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -w --if-exists --force $server.database
        if($LASTEXITCODE -ne 0){throw 'Test database cleanup failed; existing event databases were not targeted'}
      }
    }finally{[Environment]::SetEnvironmentVariable('PGPASSWORD',$previousEnvironment['PGPASSWORD'],'Process')}
  }
  }finally{foreach($key in $environmentKeys){[Environment]::SetEnvironmentVariable($key,$previousEnvironment[$key],'Process')}}
}
