$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$processFile = Join-Path $projectRoot '.local/processes.json'
if (Test-Path $processFile) {
  $owned = Get-Content $processFile -Raw | ConvertFrom-Json
  foreach ($record in $owned) {
    $process = Get-Process -Id $record.id -ErrorAction SilentlyContinue
    $savedStart = [DateTimeOffset]$record.startedAt
    if ($process -and $process.StartTime.ToUniversalTime().Ticks -eq $savedStart.UtcDateTime.Ticks) {
      $details = Get-CimInstance Win32_Process -Filter "ProcessId=$($record.id)"
      $command = $details.CommandLine.Replace('/','\')
      if ($command.Contains($projectRoot) -or ($record.kind -eq 'frontend' -and $command.Contains('node_modules\vite\bin\vite.js'))) { Stop-Process -Id $record.id }
      else { throw "Process identity could not be verified: $($record.id). No process was stopped." }
    }
  }
  Remove-Item -LiteralPath $processFile
}
& "$PSScriptRoot/database.ps1" stop
Write-Output 'HW2 stopped. All database records remain in .local/postgres.'
