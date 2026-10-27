# Builds the Chrome Web Store upload ZIP with only the extension files.
$root = Split-Path -Parent $PSScriptRoot
$version = (Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json).version
$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'suitejump'
$zip = Join-Path $dist "suitejump-$version.zip"

if (Test-Path $stage) { Remove-Item -Recurse -Force $stage }
New-Item -ItemType Directory -Force (Join-Path $stage 'icons') | Out-Null

$files = 'manifest.json', 'background.js', 'fetcher.js', 'i18n.js', 'indexer.js', 'registry.js', 'popup.html', 'popup.css', 'popup.js'
foreach ($f in $files) { Copy-Item (Join-Path $root $f) $stage }
Copy-Item (Join-Path $root 'icons\icon*.png') (Join-Path $stage 'icons')
Copy-Item (Join-Path $root '_locales') $stage -Recurse

if (Test-Path $zip) { Remove-Item -Force $zip }
# PowerShell 5.1 Compress-Archive stores paths with "\", which the Web Store rejects.
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
  Get-ChildItem $stage -Recurse -File | ForEach-Object {
    $entry = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entry) | Out-Null
  }
} finally {
  $archive.Dispose()
}
Remove-Item -Recurse -Force $stage
Write-Output "Package ready: $zip"
