@echo off
title NexFlow Desktop - Fix Electron Install

echo ============================================
echo  Remove incomplete Electron install and reinstall
echo ============================================
echo.

cd /d "%~dp0"

:: หาก env var นี้ถูกตั้งไว้ในเครื่อง (เช่นค้างจากโปรเจกต์ electron อื่น) มันจะทำให้
:: node_modules\electron\install.js ข้ามการดาวน์โหลด electron.exe ไปเงียบๆ
:: โดยไม่ error เลย (exit 0 ทันที) - unset ทิ้งก่อนติดตั้งเพื่อกันปัญหานี้
if defined ELECTRON_SKIP_BINARY_DOWNLOAD (
    echo  ^(พบ ELECTRON_SKIP_BINARY_DOWNLOAD=%ELECTRON_SKIP_BINARY_DOWNLOAD% ในเครื่อง - จะปิดชั่วคราวสำหรับการติดตั้งนี้^)
)
set "ELECTRON_SKIP_BINARY_DOWNLOAD="

echo [1/4] Removing node_modules ...
if exist node_modules (
    rmdir /s /q node_modules
)

echo [2/4] Removing electron download cache ...
if exist "%LOCALAPPDATA%\electron\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron\Cache"
)
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
)

echo [3/4] npm install (this may take a few minutes) ...
echo  ^(full output also being saved to install.log for troubleshooting^)
echo --- npm config (ignore-scripts should be false/blank) --- > install.log
call npm config list >> install.log 2>&1
echo --- npm install --- >> install.log
call npm install --ignore-scripts=false --foreground-scripts >> install.log 2>&1
set "NPM_EXIT=%errorlevel%"
type install.log

if not exist node_modules\electron\dist\electron.exe (
    echo.
    echo  electron.exe still missing after npm install ^(this is a known
    echo  issue with electron's own extract-zip step being interrupted
    echo  mid-way, usually by antivirus real-time scanning^) - running the
    echo  manual-extraction repair as a fallback...
    echo.
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-electron-extract.ps1"
)

echo [4/4] Checking for electron.exe ...
if exist node_modules\electron\dist\electron.exe (
    echo.
    echo ============================================
    echo  Success! electron.exe is fully installed.
    echo  You can close this window and run start-desktop.bat.
    echo ============================================
) else (
    echo.
    echo ============================================
    echo  electron.exe still missing from node_modules\electron\dist
    echo  npm install exit code: %NPM_EXIT%
    echo.
    echo  Full log saved to: %CD%\install.log
    echo.
    echo  The automatic repair above also could not get electron.exe to
    echo  stick in this folder - this points to antivirus real-time
    echo  protection actively deleting it right after it's written here.
    echo  Add a folder exclusion for this whole project in your antivirus
    echo  settings, then run this file again.
    echo ============================================
)

echo.
pause
