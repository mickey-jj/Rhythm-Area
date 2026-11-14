$ErrorActionPreference='Stop'
$projectRoot=[System.IO.Path]::GetFullPath((Split-Path $PSScriptRoot -Parent))
$cachePaths=@('frontend/dist','frontend/node_modules/.vite','frontend/node_modules/.vite-temp','backend/target','backend/project/target','frontend/tsconfig.app.tsbuildinfo','frontend/tsconfig.node.tsbuildinfo')
foreach($relative in $cachePaths){
  $target=[System.IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
  if(!$target.StartsWith($projectRoot+[System.IO.Path]::DirectorySeparatorChar,[System.StringComparison]::OrdinalIgnoreCase)){throw 'Cache path escaped project root'}
  if(Test-Path -LiteralPath $target){Remove-Item -LiteralPath $target -Recurse -Force}
}
Write-Output 'Build and Vite caches cleared. Database, evidence, source and downloaded dependencies remain available.'
