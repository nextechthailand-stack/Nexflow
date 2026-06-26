@echo off
title NexFlow Desktop

set ROOT=%~dp0

echo ============================================
echo  NexFlow Desktop - Starting...
echo ============================================
echo.

where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found.
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

if not exist "%ROOT%database\node_modules" (
    echo [1/3] Installing API server packages...
    cd /d "%ROOT%database"
    call npm install --silent
) else (
    echo [1/3] API server packages OK
)

echo [2/3] Starting API Server on port 3001...
start "NexFlow API" cmd /k "%ROOT%database\run-api.bat"
timeout /t 2 /nobreak > nul

echo [2b] Starting Web UI Server on port 3000 (LAN access)...
start "NexFlow Web" cmd /k ""C:\Program Files\Git\usr\bin\perl.exe" "%ROOT%serve.pl""
timeout /t 1 /nobreak > nul

:: แสดง URL สำหรับเครื่องอื่นในร้าน
powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown'} | Select-Object -First 1).IPAddress" > "%TEMP%\nfip.tmp" 2>nul
set /p LAN_IP=<"%TEMP%\nfip.tmp"
del "%TEMP%\nfip.tmp" 2>nul
echo.
if defined LAN_IP (
    echo ============================================
    echo  เครื่องอื่นในร้านเข้าได้ที่:
    echo  http://%LAN_IP%:3000
    echo ============================================
) else (
    echo  (ไม่พบ LAN IP -- ตรวจสอบการเชื่อมต่อ Network)
)
echo.

if not exist "%ROOT%electron\node_modules" (
    echo [3/3] Installing Electron packages, first run, may take a while...
    cd /d "%ROOT%electron"
    call npm install
) else (
    echo [3/3] Electron packages OK
)

cd /d "%ROOT%electron"
call npm start

echo.
echo ============================================
echo  NexFlow Desktop closed.
echo  If there was an error above, copy it and send it over.
echo ============================================
pause
