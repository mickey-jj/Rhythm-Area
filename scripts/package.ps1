$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$outputDir = Join-Path $projectRoot 'deliverables'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
$zipPath = Join-Path $outputDir 'rhythm-area-source.zip'
$temporaryZipPath = Join-Path $outputDir ('rhythm-area-source.'+[Guid]::NewGuid().ToString('N')+'.tmp.zip')
$include = @('frontend','backend','database','scripts','docs','data','examples')
$files = @($include | ForEach-Object { Get-ChildItem -LiteralPath (Join-Path $projectRoot $_) -Recurse -File } | Where-Object { $_.FullName -notmatch '[\\/](node_modules|target|dist|\.local|\.bsp|\.metals)[\\/]' -and $_.Name -notmatch '^\.env($|\.)' -and $_.Extension -ne '.tsbuildinfo' -and $_.Name -ne 'template-center.png' })
$files += Get-ChildItem -LiteralPath $projectRoot -File | Where-Object { $_.Extension -in '.md','.txt','.cmd' -or $_.Name -in '.gitignore','instance.config.json' }
$archive = [System.IO.Compression.ZipFile]::Open($temporaryZipPath,[System.IO.Compression.ZipArchiveMode]::Create)
try {
  foreach ($file in $files) {
    $relative = [System.IO.Path]::GetRelativePath($projectRoot,$file.FullName).Replace([System.IO.Path]::DirectorySeparatorChar,[char]'/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive,$file.FullName,$relative,[System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
  }
} finally { $archive.Dispose() }
$bytes = (Get-Item -LiteralPath $temporaryZipPath).Length
$existingVideoPath=Join-Path $projectRoot 'demo.mp4'
$videoBytes=if(Test-Path -LiteralPath $existingVideoPath){(Get-Item -LiteralPath $existingVideoPath).Length}else{0}
if (($bytes+$videoBytes) -ge 100000000) { throw "Source and existing demo video exceed the submission budget: $($bytes+$videoBytes)" }
Move-Item -LiteralPath $temporaryZipPath -Destination $zipPath -Force
Write-Output "Source archive: $zipPath ($bytes bytes); existing demo video: $videoBytes bytes; combined: $($bytes+$videoBytes) bytes."
