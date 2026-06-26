@echo off
chcp 65001 >nul
title NexFlow Desktop

set "ROOT=%~dp0"

echo ============================================
echo  NexFlow Desktop - Starting...
echo ============================================
echo.

:: Find Node.js (covers fresh installs where PATH not refreshed in this session)
where node >nul 2>&1
if errorlevel 1 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "C:\Program Files (x86)\nodejs\node.exe" (
        set "PATH=C:\Program Files (x86)\nodejs;%PATH%"
    ) else (
        echo ERROR: Node.js not found.
        echo.
        echo Please open the Presetup folder and run 1_install_software.bat
        echo Then close this window and run start-desktop.bat again.
        echo.
        pause
        exit /b 1
    )
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
timeout /t 2 /nobreak >nul

echo [2b] Starting Web UI Server on port 3000 (LAN access)...
start "NexFlow Web" cmd /k ""C:\Program Files\Git\usr\bin\perl.exe" "%ROOT%serve.pl""
timeout /t 1 /nobreak >nul

:: Show URL for other PCs in the shop
set "LAN_IP="
powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress" > "%TEMP%\nfip.tmp" 2>nul
set /p LAN_IP=<"%TEMP%\nfip.tmp"
del "%TEMP%\nfip.tmp" 2>nul
echo.
if defined LAN_IP (
    echo ============================================
    echo  Other PCs in the shop open this URL:
    echo  http://%LAN_IP%:3000
    echo ============================================
) else (
    echo  ^(LAN IP not found - check network connection^)
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
