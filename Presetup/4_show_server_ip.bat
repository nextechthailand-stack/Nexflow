@echo off
title NEXflow - Server IP

for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get_lan_ip.ps1" 2^>nul`) do set "MY_IP=%%I"

echo.
echo ============================================================
echo  NEXflow -- URL for other PCs in the shop
echo ============================================================
echo.
if defined MY_IP (
    echo  This Server's computer name : %COMPUTERNAME%
    echo  This Server's IP            : %MY_IP%
    echo.
    echo  On other PCs, open a browser and type EITHER of these:
    echo.
    echo     http://%COMPUTERNAME%:3000     ^(recommended - keeps working even
    echo                                      if the IP below changes later^)
    echo     http://%MY_IP%:3000
    echo.
    echo  Tip: run Presetup\create_client_shortcut.bat on each client PC to
    echo  make a Desktop icon for this automatically ^(it will ask for the
    echo  computer name or IP shown above^).
    echo.
    echo  (Server PC must have start-desktop.bat running)
    echo  (and must have run 3_open_firewall.bat at least once on this PC)
) else (
    echo  [!] No IP address found
    echo      Check the LAN/WiFi connection on this PC
)
echo ============================================================
echo.
echo  If this PC has multiple network adapters (e.g. both WiFi and
echo  wired LAN) and the IP above does not work, check the full list
echo  of adapters below and pick the one on the same network as the
echo  client PCs:
echo ------------------------------------------------------------
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get_lan_ip.ps1" -All
echo ------------------------------------------------------------
echo.
pause
