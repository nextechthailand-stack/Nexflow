@echo off
setlocal EnableDelayedExpansion
title NEXflow - Install background services (API + Web)

:: Auto-request Admin rights (services can only be installed as admin)
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Requesting administrator rights...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

set "ROOT=%~dp0.."
:: normalize (remove trailing \.. weirdness)
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ============================================================
echo  NEXflow -- Install API + Web as Windows Services
echo  (no more cmd windows to accidentally close - auto-start on boot)
echo ============================================================
echo.

:: ── Find node.exe ──────────────────────────────────────────
where node >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "usebackq delims=" %%N in (`where node`) do if not defined NODE_EXE set "NODE_EXE=%%N"
) else (
    if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"
)
if not defined NODE_EXE (
    echo ERROR: node.exe not found. Run Presetup\1_install_software.bat first.
    pause
    exit /b 1
)
echo Node.js: %NODE_EXE%

:: ── Find or install nssm.exe (wraps any exe as a Windows Service) ──
set "NSSM_EXE="
where nssm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "usebackq delims=" %%S in (`where nssm`) do if not defined NSSM_EXE set "NSSM_EXE=%%S"
)
if not defined NSSM_EXE if exist "%~dp0tools\nssm.exe" set "NSSM_EXE=%~dp0tools\nssm.exe"

if not defined NSSM_EXE (
    echo.
    echo [nssm] not found, trying winget install...
    where winget >nul 2>&1
    if %ERRORLEVEL% equ 0 (
        winget install -e --id NSSM.NSSM --silent --accept-package-agreements --accept-source-agreements
        where nssm >nul 2>&1
        if %ERRORLEVEL% equ 0 (
            for /f "usebackq delims=" %%S in (`where nssm`) do if not defined NSSM_EXE set "NSSM_EXE=%%S"
        )
    )
)

if not defined NSSM_EXE (
    echo.
    echo ============================================================
    echo  ERROR: nssm.exe not found and winget install failed.
    echo  Manual fix:
    echo    1. Download from https://nssm.cc/download ^(nssm-2.24.zip or newer^)
    echo    2. Extract nssm.exe ^(win64 folder^) to:
    echo       %~dp0tools\nssm.exe
    echo    3. Run this script again.
    echo ============================================================
    pause
    exit /b 1
)
echo nssm: %NSSM_EXE%
echo.

:: ── NEXflowAPI service ──────────────────────────────────────
echo [1/2] Installing NEXflowAPI service (port 3001) ...
sc query NEXflowAPI >nul 2>&1
if %ERRORLEVEL% equ 0 (
    "%NSSM_EXE%" stop NEXflowAPI >nul 2>&1
    "%NSSM_EXE%" remove NEXflowAPI confirm >nul 2>&1
)
"%NSSM_EXE%" install NEXflowAPI "%NODE_EXE%" "\"%ROOT%\database\api_server.js\""
"%NSSM_EXE%" set NEXflowAPI AppDirectory "%ROOT%\database"
"%NSSM_EXE%" set NEXflowAPI DisplayName "NEXflow API Server"
"%NSSM_EXE%" set NEXflowAPI Description "NEXflow REST API (port 3001) - stock/invoice/report backend"
"%NSSM_EXE%" set NEXflowAPI Start SERVICE_AUTO_START
"%NSSM_EXE%" set NEXflowAPI AppStdout "%ROOT%\database\service-api.log"
"%NSSM_EXE%" set NEXflowAPI AppStderr "%ROOT%\database\service-api-err.log"
"%NSSM_EXE%" set NEXflowAPI AppRotateFiles 1
"%NSSM_EXE%" set NEXflowAPI AppRotateBytes 1048576
"%NSSM_EXE%" set NEXflowAPI AppExit Default Restart
"%NSSM_EXE%" set NEXflowAPI AppRestartDelay 3000
echo     OK

:: ── NEXflowWeb service ──────────────────────────────────────
echo [2/2] Installing NEXflowWeb service (port 3000) ...
sc query NEXflowWeb >nul 2>&1
if %ERRORLEVEL% equ 0 (
    "%NSSM_EXE%" stop NEXflowWeb >nul 2>&1
    "%NSSM_EXE%" remove NEXflowWeb confirm >nul 2>&1
)
"%NSSM_EXE%" install NEXflowWeb "%NODE_EXE%" "\"%ROOT%\database\web_server.js\""
"%NSSM_EXE%" set NEXflowWeb AppDirectory "%ROOT%"
"%NSSM_EXE%" set NEXflowWeb DisplayName "NEXflow Web Server"
"%NSSM_EXE%" set NEXflowWeb Description "NEXflow static web UI server (port 3000) for LAN client PCs"
"%NSSM_EXE%" set NEXflowWeb Start SERVICE_AUTO_START
"%NSSM_EXE%" set NEXflowWeb AppEnvironmentExtra PORT=3000
"%NSSM_EXE%" set NEXflowWeb AppStdout "%ROOT%\database\service-web.log"
"%NSSM_EXE%" set NEXflowWeb AppStderr "%ROOT%\database\service-web-err.log"
"%NSSM_EXE%" set NEXflowWeb AppRotateFiles 1
"%NSSM_EXE%" set NEXflowWeb AppRotateBytes 1048576
"%NSSM_EXE%" set NEXflowWeb AppExit Default Restart
"%NSSM_EXE%" set NEXflowWeb AppRestartDelay 3000
echo     OK

echo.
echo Starting services ...
"%NSSM_EXE%" start NEXflowAPI
"%NSSM_EXE%" start NEXflowWeb
timeout /t 2 /nobreak >nul

echo.
echo ============================================================
sc query NEXflowAPI | findstr "STATE"
sc query NEXflowWeb  | findstr "STATE"
echo ============================================================
echo  Done. Both services are set to start automatically with Windows
echo  (services.msc -^> "NEXflow API Server" / "NEXflow Web Server").
echo  You can now close this window. From now on, start-desktop.bat
echo  will only need to open the NEXflow app window (no more extra
echo  cmd windows for API/Web).
echo ============================================================
echo.
echo Don't forget: Presetup\3_open_firewall.bat (if not already run)
echo so other PCs in the shop can still reach port 3000/3001.
echo.
pause
