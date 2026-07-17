# Repairs a broken Electron install where npm's own postinstall script
# (node_modules\electron\install.js, using the extract-zip library) silently
# extracts only 1-2 files into node_modules\electron\dist and stops, with no
# error - most commonly caused by antivirus/real-time protection interfering
# with extract-zip's rapid sequential writes of many .exe/.dll files.
#
# Workaround: extract the same (already-downloaded, verified-good) cached zip
# using PowerShell's Expand-Archive instead, into a temp folder, then copy the
# complete result into place. This has proven reliable even when the direct
# in-place extraction fails.
#
# Safe to run multiple times. Fully unattended (no prompts) so it can be
# called automatically from start-desktop.bat / fix-electron-install.bat.

$ErrorActionPreference = 'Stop'

$electronDir = Join-Path $PSScriptRoot 'node_modules\electron'
$distDir     = Join-Path $electronDir 'dist'
$cacheRoot   = Join-Path $env:LOCALAPPDATA 'electron\Cache'

if (-not (Test-Path $electronDir)) {
    Write-Host "ERROR: $electronDir not found. Run npm install in the electron folder first."
    exit 1
}

Write-Host "Searching for electron zip in cache ($cacheRoot) ..."
$zip = Get-ChildItem -Path $cacheRoot -Recurse -Filter 'electron-v*-win32-x64.zip' -ErrorAction SilentlyContinue |
       Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $zip) {
    Write-Host "ERROR: No electron zip found in cache. Run npm install again first (let it finish downloading)."
    exit 1
}

Write-Host "Found: $($zip.FullName) ($([math]::Round($zip.Length/1MB,1)) MB)"

# Extract to a temp folder first, so a failed/partial extraction never touches
# the real dist folder.
$tmpExtract = Join-Path $env:TEMP "electron-extract-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $tmpExtract | Out-Null

Write-Host "Extracting to $tmpExtract ..."
Expand-Archive -Path $zip.FullName -DestinationPath $tmpExtract -Force
Start-Sleep -Seconds 1

if (-not (Test-Path (Join-Path $tmpExtract 'electron.exe'))) {
    Write-Host "ERROR: electron.exe not found after extracting to $tmpExtract"
    Write-Host "The zip file may be corrupt or incomplete. Delete this file and run npm install again:"
    Write-Host "  $($zip.FullName)"
    Remove-Item -Recurse -Force $tmpExtract -ErrorAction SilentlyContinue
    exit 1
}

Write-Host "Copying files to $distDir ..."
if (Test-Path $distDir) { Remove-Item -Recurse -Force $distDir }
New-Item -ItemType Directory -Path $distDir | Out-Null
Copy-Item -Path (Join-Path $tmpExtract '*') -Destination $distDir -Recurse -Force

Set-Content -Path (Join-Path $electronDir 'path.txt') -Value 'electron.exe' -NoNewline -Encoding ascii

Start-Sleep -Seconds 1
Remove-Item -Recurse -Force $tmpExtract -ErrorAction SilentlyContinue

if (Test-Path (Join-Path $distDir 'electron.exe')) {
    $count = (Get-ChildItem -Path $distDir -Recurse -File | Measure-Object).Count
    Write-Host ""
    Write-Host "============================================"
    Write-Host " SUCCESS! electron.exe is now installed. ($count files in dist)"
    Write-Host "============================================"
    exit 0
} else {
    Write-Host ""
    Write-Host "============================================"
    Write-Host " electron.exe still missing from $distDir"
    Write-Host " It disappeared right after copying, which points to"
    Write-Host " antivirus/real-time protection specifically targeting"
    Write-Host " this folder. Add an exclusion for this whole project"
    Write-Host " folder in your antivirus, then run this script again."
    Write-Host "============================================"
    exit 1
}
