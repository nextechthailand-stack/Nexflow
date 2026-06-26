@echo off
chcp 65001 >nul
title NEXflow - Step 3: Open Firewall Ports

:: ขอสิทธิ์ Admin อัตโนมัติ
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo กำลังขอสิทธิ์ผู้ดูแลระบบ...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ============================================================
echo  NEXflow -- ขั้นที่ 3: เปิด Port สำหรับเครื่องอื่นในร้าน
echo  (ทำเพียงครั้งเดียว)
echo ============================================================
echo.

echo [1/2] เปิด Port 3000 (Web UI สำหรับเครื่องอื่น)...
netsh advfirewall firewall delete rule name="NEXflow Web" >nul 2>&1
netsh advfirewall firewall add rule name="NEXflow Web" dir=in action=allow protocol=TCP localport=3000 profile=private,domain
if %ERRORLEVEL% equ 0 (echo     OK) else (echo     [!] ไม่สำเร็จ)

echo [2/2] เปิด Port 3001 (API Server)...
netsh advfirewall firewall delete rule name="NEXflow API" >nul 2>&1
netsh advfirewall firewall add rule name="NEXflow API" dir=in action=allow protocol=TCP localport=3001 profile=private,domain
if %ERRORLEVEL% equ 0 (echo     OK) else (echo     [!] ไม่สำเร็จ)

:: แสดง IP เครื่องนี้
powershell -NoProfile -Command ^
  "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown'} | Select-Object -First 1).IPAddress" ^
  > "%TEMP%\nfip.tmp" 2>nul
set /p MY_IP=<"%TEMP%\nfip.tmp"
del "%TEMP%\nfip.tmp" 2>nul

echo.
echo ============================================================
echo  เปิด Port เรียบร้อย!
echo.
if defined MY_IP (
    echo  IP เครื่อง Server นี้: %MY_IP%
    echo.
    echo  เครื่องอื่นในร้านเปิด Browser แล้วพิมพ์:
    echo  http://%MY_IP%:3000
) else (
    echo  เครื่องอื่นในร้านเปิด Browser แล้วพิมพ์:
    echo  http://[IP เครื่องนี้]:3000
    echo  ^(ดู IP ได้จาก 4_show_server_ip.bat^)
)
echo.
echo  ขั้นตอนต่อไป:
echo  ไปที่โฟลเดอร์หลัก NEXflow
echo  แล้วดับเบิลคลิก start-desktop.bat เพื่อเปิดแอป
echo ============================================================
pause
