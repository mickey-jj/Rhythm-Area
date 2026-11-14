param([string]$Task = 'run')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$profileDir = [Environment]::GetFolderPath('UserProfile')
$javaCommand = Get-Command java -ErrorAction SilentlyContinue
$javaBin = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin/java.exe' } elseif ($javaCommand) { $javaCommand.Source } else { Join-Path $profileDir '.jdks/corretto-22.0.2/bin/java.exe' }
$launcher = if ($env:SBT_LAUNCH_JAR) { $env:SBT_LAUNCH_JAR } else { Join-Path $profileDir 'AppData/Roaming/JetBrains/IntelliJIdea2026.2/plugins/Scala/launcher/sbt-launch.jar' }
if (!(Test-Path -LiteralPath $javaBin) -or !(Test-Path -LiteralPath $launcher)) { throw 'Set JAVA_HOME and SBT_LAUNCH_JAR. See README.md.' }
$env:AREA_ROOT = $projectRoot
if (!$env:DB_PASSWORD -and (Test-Path "$projectRoot/.local/database-password")) { $env:DB_PASSWORD = (Get-Content "$projectRoot/.local/database-password" -Raw).Trim() }
$env:COURSIER_REPOSITORIES = 'https://repo.maven.apache.org/maven2'
$env:COURSIER_CACHE = "$projectRoot/.local/coursier"
$bootDir = "$projectRoot/.local/sbt/boot"
if (!(Test-Path $bootDir)) {
  New-Item -ItemType Directory -Force $bootDir | Out-Null
  $existingBoot = Join-Path $profileDir '.sbt/boot'
  if (Test-Path $existingBoot) { Copy-Item "$existingBoot/*" $bootDir -Recurse -Force }
}
Push-Location "$projectRoot/backend"
try { & $javaBin '-Xss8m' '-Dfile.encoding=UTF-8' "-Dsbt.boot.directory=$bootDir" "-Dsbt.global.base=$projectRoot/.local/sbt" "-Dsbt.ivy.home=$projectRoot/.local/ivy" '-Dsbt.log.noformat=true' '-Dsbt.supershell=false' '-Dsbt.override.build.repos=true' "-Dsbt.repository.config=$projectRoot/scripts/repositories" '-jar' $launcher $Task; if ($LASTEXITCODE -ne 0) { throw "sbt exited $LASTEXITCODE" } } finally { Pop-Location }
