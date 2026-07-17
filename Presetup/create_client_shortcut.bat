@echo off
setlocal EnableDelayedExpansion
title NEXflow - Create Desktop Icon (Client PC)

echo ============================================================
echo  NEXflow -- Create a Desktop icon on this PC to open NEXflow
echo  (this PC connects to the Server PC through a web browser)
echo ============================================================
echo.
echo  Ask whoever manages the Server PC for either:
echo    - the Server's computer name  (e.g. SHOP-SERVER)   -- recommended,
echo      stays correct even if the Server's IP address changes later
echo    - or the Server's IP address  (e.g. 192.168.1.50)  -- shown by
echo      running Presetup\4_show_server_ip.bat on the Server PC
echo.

set /p SERVER_ADDR="Type the Server's computer name or IP address: "
if "%SERVER_ADDR%"=="" (
    echo No address entered - cancelled.
    pause
    exit /b 1
)

set "URL_FILE=%USERPROFILE%\Desktop\NEXflow (เข้าใช้งาน).url"
(
    echo [InternetShortcut]
    echo URL=http://%SERVER_ADDR%:3000
    echo IconIndex=0
) > "%URL_FILE%"

if exist "%URL_FILE%" (
    echo.
    echo Done! Icon "NEXflow (เข้าใช้งาน)" created on the Desktop.
    echo It opens: http://%SERVER_ADDR%:3000
    echo.
    echo If it doesn't connect, double-check:
    echo   - the Server PC is powered on and NEXflow is running
    echo   - this PC and the Server PC are on the same WiFi/LAN
    echo   - Presetup\3_open_firewall.bat has been run on the Server PC
) else (
    echo ERROR: could not create the shortcut.
)
echo.
pause
