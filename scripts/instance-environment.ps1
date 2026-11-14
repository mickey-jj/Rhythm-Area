$projectRoot = Split-Path $PSScriptRoot -Parent
$instanceConfig = Get-Content -LiteralPath (Join-Path $projectRoot 'instance.config.json') -Raw | ConvertFrom-Json
if ($instanceConfig.databaseName -notmatch '^[a-z][a-z0-9_]{0,50}$') { throw 'databaseName must use lowercase English letters, digits and underscores.' }
foreach ($portKey in @('databasePort','apiPort','webPort')) {
  if ($instanceConfig.$portKey -isnot [long] -and $instanceConfig.$portKey -isnot [int]) { throw "Invalid $portKey" }
  if ($instanceConfig.$portKey -lt 1024 -or $instanceConfig.$portKey -gt 65535) { throw "Invalid $portKey" }
}
if (@(@($instanceConfig.databasePort,$instanceConfig.apiPort,$instanceConfig.webPort) | Select-Object -Unique).Count -ne 3) { throw 'The three service ports must be different.' }
if (!$env:DB_NAME) { $env:DB_NAME = $instanceConfig.databaseName }
if (!$env:DB_PORT) { $env:DB_PORT = [string]$instanceConfig.databasePort }
if (!$env:HTTP_PORT) { $env:HTTP_PORT = [string]$instanceConfig.apiPort }
if (!$env:WEB_PORT) { $env:WEB_PORT = [string]$instanceConfig.webPort }
if ($env:DB_NAME -notmatch '^[a-z][a-z0-9_]{0,50}$') { throw 'Invalid DB_NAME' }
$env:APP_ORIGIN = "http://127.0.0.1:$($env:WEB_PORT)"
$env:VITE_API_TARGET = "http://127.0.0.1:$($env:HTTP_PORT)"
