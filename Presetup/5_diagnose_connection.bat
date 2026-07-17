@echo off
title NEXflow - Step 5: Diagnose Connection Issues

echo ============================================================
echo  NEXflow -- Diagnose connection issues (run on the Server PC)
echo  Copy ALL the output below and send it to the support team
echo ============================================================
echo.

echo [1] IP addresses of this PC (all possible LAN adapters):
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get_lan_ip.ps1" -All
echo.

echo [2] Ports actually listening right now (must see :3000 and :3001 LISTENING):
netstat -ano | findstr "LISTENING" | findstr ":3000 :3001"
echo    (if nothing shows up here, serve.pl / node is not really running,
echo     even if the cmd window is still open)
echo.

echo [3] Test opening the web page from this PC itself (3 ways, to isolate IPv4/IPv6 issues):
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:3000' -UseBasicParsing -TimeoutSec 3; Write-Host ('  http://127.0.0.1:3000  -> OK (' + $r.StatusCode + ')') } catch { Write-Host ('  http://127.0.0.1:3000  -> FAIL: ' + $_.Exception.Message) }"
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3; Write-Host ('  http://localhost:3000  -> OK (' + $r.StatusCode + ')') } catch { Write-Host ('  http://localhost:3000  -> FAIL: ' + $_.Exception.Message) }"
set "MY_IP="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0get_lan_ip.ps1" 2^>nul`) do set "MY_IP=%%I"
if defined MY_IP (
    powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://%MY_IP%:3000' -UseBasicParsing -TimeoutSec 3; Write-Host ('  http://%MY_IP%:3000  -> OK (' + $r.StatusCode + ')') } catch { Write-Host ('  http://%MY_IP%:3000  -> FAIL: ' + $_.Exception.Message) }"
)
echo.

echo [4] Windows Network Profile per adapter (Public/Private/DomainAuthenticated):
powershell -NoProfile -Command "Get-NetConnectionProfile | Select-Object InterfaceAlias, NetworkCategory | Format-Table -AutoSize"
echo.

echo [5] NEXflow firewall rules (must show Enabled=Yes, Profiles=Any):
netsh advfirewall firewall show rule name="NEXflow Web" | findstr /i "Enabled Profiles Direction Action LocalPort"
echo.
netsh advfirewall firewall show rule name="NEXflow API" | findstr /i "Enabled Profiles Direction Action LocalPort"
echo.

echo [6] Proxy settings on this PC (if ProxyEnable = 0x1, the browser may fail to
echo     reach localhost/LAN addresses through the proxy):
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyEnable 2>nul
reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer 2>nul
echo.

echo [7] Windows Firewall service (MpsSvc) state per profile:
netsh advfirewall show allprofiles state | findstr /i "Profile State"
echo.

echo [8] Electron desktop app binary (should say True):
if exist "%~dp0..\electron\node_modules\electron\dist\electron.exe" (
    echo    electron.exe present: True
) else (
    echo    electron.exe present: False
    echo    ^(if False, the desktop app window won't open - run
    echo     electron\fix-electron-install.bat to repair^)
)
echo.

echo ============================================================
echo  Done - copy all the output above and send it for analysis
echo ============================================================
pause
