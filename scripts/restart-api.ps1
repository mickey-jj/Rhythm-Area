param([switch]$MatchReview,[switch]$TeamDraft,[switch]$TeamFree,[switch]$RankingReview,[switch]$Presentation,[switch]$DemoSolo,[switch]$DemoTeam)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$config=Get-Content -LiteralPath (Join-Path $projectRoot 'instance.config.json') -Raw | ConvertFrom-Json
$recordPath=Join-Path $projectRoot $(if($DemoSolo){'.local/playable-solo-processes.json'}elseif($DemoTeam){'.local/playable-team-processes.json'}elseif($Presentation){'.local/presentation-processes.json'}elseif($RankingReview){'.local/ranking-review-processes.json'}elseif($TeamDraft){'.local/team-draft-processes.json'}elseif($TeamFree){'.local/team-free-processes.json'}elseif($MatchReview){'.local/match-review-processes.json'}else{'.local/processes.json'})
$records=@(Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json)
$record=$records | Where-Object {$_.kind -in @('api','backend')}
if(@($record).Count -ne 1){throw 'Expected one owned API process'}
$process=Get-Process -Id $record.id -ErrorAction SilentlyContinue
if($process){
  $saved=[DateTimeOffset]$record.startedAt
  $details=Get-CimInstance Win32_Process -Filter "ProcessId=$($record.id)"
  if($process.StartTime.ToUniversalTime().Ticks -ne $saved.UtcDateTime.Ticks -or !$details.CommandLine.Replace('/','\').Contains($projectRoot)){throw 'Process identity mismatch; no process was stopped'}
  Stop-Process -Id $record.id
}
$savedEnvironment=@{}
foreach($key in @('DB_NAME','DB_PORT','HTTP_PORT','APP_ORIGIN','AREA_ROOT','DB_PASSWORD')){$savedEnvironment[$key]=[Environment]::GetEnvironmentVariable($key,'Process')}
try{
  $offset=if($DemoSolo){12}elseif($DemoTeam){14}elseif($Presentation){10}elseif($RankingReview){8}elseif($TeamDraft){4}elseif($TeamFree){6}elseif($MatchReview){2}else{0}
  $apiPort=[int]$config.apiPort+$offset
  $webPort=[int]$config.webPort+$offset
  $env:DB_NAME=if($DemoSolo){'area_playable_solo_midterm'}elseif($DemoTeam){'area_playable_team_midterm'}elseif($Presentation){'area_presentation_midterm'}elseif($RankingReview){'area_ranking_review_midterm'}elseif($TeamDraft){'area_team_draft_midterm'}elseif($TeamFree){'area_team_free_midterm'}elseif($MatchReview){'area_match_review_midterm'}else{$config.databaseName}
  $env:DB_PORT=[string]$config.databasePort;$env:HTTP_PORT=[string]$apiPort;$env:APP_ORIGIN="http://127.0.0.1:$webPort";$env:AREA_ROOT=$projectRoot
  $env:DB_PASSWORD=(Get-Content "$projectRoot/.local/database-password" -Raw).Trim()
  $javaCommand=Get-Command java -ErrorAction SilentlyContinue
  $javaBin=if($env:JAVA_HOME){Join-Path $env:JAVA_HOME 'bin/java.exe'}elseif($javaCommand){$javaCommand.Source}else{Join-Path ([Environment]::GetFolderPath('UserProfile')) '.jdks/corretto-22.0.2/bin/java.exe'}
  $classpath=(Get-Content "$projectRoot/backend/target/runtime-classpath.txt" -Raw).Trim()
  $logPrefix=if($DemoSolo){'playable-solo-api'}elseif($DemoTeam){'playable-team-api'}elseif($Presentation){'presentation-api'}elseif($RankingReview){'ranking-review-api'}elseif($TeamDraft){'team-draft-api'}elseif($TeamFree){'team-free-api'}elseif($MatchReview){'match-review-api'}else{'backend'}
  $started=Start-Process -FilePath $javaBin -ArgumentList @('-Dfile.encoding=UTF-8','-cp',('"'+$classpath+'"'),'services.system.api.Main') -WorkingDirectory "$projectRoot/backend" -RedirectStandardOutput "$projectRoot/.local/$logPrefix.out.log" -RedirectStandardError "$projectRoot/.local/$logPrefix.err.log" -WindowStyle Hidden -PassThru
  $records | ForEach-Object {if($_.kind -eq $record.kind){[PSCustomObject]@{id=$started.Id;startedAt=$started.StartTime.ToUniversalTime().ToString('o');kind=$record.kind;port=$apiPort;database=$env:DB_NAME}}else{$_}} | ConvertTo-Json -AsArray | Set-Content -LiteralPath $recordPath -Encoding utf8
  $ready=$false
  foreach($attempt in 1..35){try{if((Invoke-RestMethod "http://127.0.0.1:$apiPort/api/health" -TimeoutSec 1).status -eq 'ok'){$ready=$true;break}}catch{Start-Sleep -Milliseconds 300}}
  if(!$ready){throw 'API did not become ready; inspect its local error log'}
  Write-Output "API ready on $apiPort; existing event data preserved."
}finally{foreach($key in $savedEnvironment.Keys){[Environment]::SetEnvironmentVariable($key,$savedEnvironment[$key],'Process')}}
