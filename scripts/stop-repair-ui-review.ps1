$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$recordPath=Join-Path $projectRoot '.local/repair-ui-processes.json'
if(!(Test-Path -LiteralPath $recordPath)){Write-Output 'No isolated repair UI instance is recorded.';return}
$record=Get-Content -LiteralPath $recordPath -Raw | ConvertFrom-Json
if($record.database -notmatch '^area_verify_[0-9]{14}_[a-f0-9]{5}_ui$'){throw 'Unexpected database name; cleanup stopped'}
foreach($server in @($record.api,$record.proxy)){
  $process=Get-Process -Id $server.id -ErrorAction SilentlyContinue
  $saved=[DateTimeOffset]$server.startedAt
  if($process -and $process.StartTime.ToUniversalTime().Ticks -eq $saved.UtcDateTime.Ticks){Stop-Process -Id $server.id}
}
. "$PSScriptRoot/instance-environment.ps1"
$pgBin=if($env:PG_BIN){$env:PG_BIN}else{'C:/Program Files/PostgreSQL/18/bin'}
$previousPassword=[Environment]::GetEnvironmentVariable('PGPASSWORD','Process')
try{
  $env:PGPASSWORD=(Get-Content -LiteralPath "$projectRoot/.local/database-password" -Raw).Trim()
  & "$pgBin/dropdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -w --if-exists --force $record.database
  if($LASTEXITCODE -ne 0){throw 'Isolated UI database cleanup failed'}
}finally{[Environment]::SetEnvironmentVariable('PGPASSWORD',$previousPassword,'Process')}
Remove-Item -LiteralPath $recordPath
Write-Output 'Stopped the recorded repair UI processes and removed only their isolated test database.'
