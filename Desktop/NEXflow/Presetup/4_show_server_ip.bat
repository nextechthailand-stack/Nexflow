@echo off
title NEXflow -- IP เครื่อง Server นี้

powershell -NoProfile -Command ^
  "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown'} | Select-Object -First 1).IPAddress" ^
  > "%TEMP%\nfip.tmp" 2>nul
set /p MY_IP=<"%TEMP%\nfip.tmp"
del "%TEMP%\nfip.tmp" 2>nul

echo.
echo ============================================================
echo  NEXflow -- URL สำหรับเครื่องอื่นในร้าน
echo ============================================================
echo.
if defined MY_IP (
    echo  IP เครื่อง Server นี้ : %MY_IP%
    echo.
    echo  เครื่องอื่นเปิด Browser แล้วพิมพ์:
    echo.
    echo     http://%MY_IP%:3000
    echo.
    echo  (เครื่อง Server ต้องเปิด start-desktop.bat ไว้ก่อน)
) else (
    echo  [!] ไม่พบ IP address
    echo      ตรวจสอบการเชื่อมต่อ LAN/WiFi
)
echo ============================================================
echo.
pause
