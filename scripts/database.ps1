param([ValidateSet('start','stop','status')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
. "$PSScriptRoot/instance-environment.ps1"
$pgBin = if ($env:PG_BIN) { $env:PG_BIN } else { 'C:/Program Files/PostgreSQL/18/bin' }
$runtimeDir = Join-Path $projectRoot '.local'
$dataDir = Join-Path $runtimeDir 'postgres'
if ($Action -eq 'stop') { & "$pgBin/pg_ctl.exe" -D $dataDir stop -m fast; exit $LASTEXITCODE }
if ($Action -eq 'status') { & "$pgBin/pg_ctl.exe" -D $dataDir status; exit $LASTEXITCODE }
New-Item -ItemType Directory -Force -Path $runtimeDir | Out-Null
if (!(Test-Path "$dataDir/PG_VERSION")) {
  if (Test-Path $dataDir) { throw 'Incomplete database directory; inspect it before retrying.' }
  [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(24)) | Set-Content "$runtimeDir/database-password" -NoNewline
  & "$pgBin/initdb.exe" -D $dataDir -U area --encoding=UTF8 --locale=C --auth=scram-sha-256 "--pwfile=$runtimeDir/database-password"
  if ($LASTEXITCODE -ne 0) { throw 'initdb failed' }
}
& "$pgBin/pg_ctl.exe" -D $dataDir status | Out-Null
if ($LASTEXITCODE -ne 0) {
  $startArgs=@('-D',('"'+$dataDir+'"'),'-l',('"'+$runtimeDir+'/postgres.log"'),'-o',('"-h 127.0.0.1 -p '+$env:DB_PORT+'"'),'-t','300','-w','start')
  $pgStart=Start-Process -FilePath "$pgBin/pg_ctl.exe" -ArgumentList $startArgs -WindowStyle Hidden -RedirectStandardOutput "$runtimeDir/pg-start.out.log" -RedirectStandardError "$runtimeDir/pg-start.err.log" -PassThru
  $pgStart.WaitForExit()
  if ($pgStart.ExitCode -ne 0) { throw 'PostgreSQL start failed; inspect .local/pg-start.err.log' }
}
$env:PGPASSWORD = (Get-Content "$runtimeDir/database-password" -Raw).Trim()
$dbExists = & "$pgBin/psql.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$($env:DB_NAME)'"
if ($LASTEXITCODE -ne 0) { throw 'Database connection failed; no instance data was modified.' }
if ($dbExists -ne '1') { & "$pgBin/createdb.exe" -h 127.0.0.1 -p $env:DB_PORT -U area $env:DB_NAME; if ($LASTEXITCODE -ne 0) { throw 'createdb failed' } }
$runtimePasswordPath = Join-Path $runtimeDir 'runtime-password'
if (!(Test-Path -LiteralPath $runtimePasswordPath)) { [Convert]::ToHexString([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32)) | Set-Content -LiteralPath $runtimePasswordPath -NoNewline }
$runtimePassword = (Get-Content -LiteralPath $runtimePasswordPath -Raw).Trim()
if ($runtimePassword -notmatch '^[A-Fa-f0-9]{64}$') { throw 'Invalid local runtime credential format' }
$runtimeRoleSql = "DO `$$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='area_app') THEN CREATE ROLE area_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS PASSWORD '$runtimePassword'; END IF; END `$$;"
$runtimeRoleSql | & "$pgBin/psql.exe" -h 127.0.0.1 -p $env:DB_PORT -U area -d $env:DB_NAME -X -q -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { throw 'Runtime role preparation failed' }
Remove-Item Env:PGPASSWORD
Write-Output "HW2 PostgreSQL ready at 127.0.0.1:$($env:DB_PORT)/$($env:DB_NAME)"
