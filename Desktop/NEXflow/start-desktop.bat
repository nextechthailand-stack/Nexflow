@echo off
title NexFlow Desktop

set ROOT=%~dp0

echo ============================================
echo  NexFlow Desktop - Starting...
echo ============================================
echo.

:: โหลด PATH ล่าสุดจาก registry (กรณีเพิ่ง install Node.js มา)
for /f "usebackq tokens=2,*" %%A in (`reg query "HKLM\SYSTEM\CurrentControlSet\Control\Session Manager\Environment" /v Path 2^>nul`) do set "SYS_PATH=%%B"
if defined SYS_PATH set "PATH=%SYS_PATH%;%PATH%"

:: หา node.exe — ลอง PATH ก่อน แล้ว fallback ไป install path ตรงๆ
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\nodejs\node.exe" (
        set "PATH=C:\Program Files\nodejs;%PATH%"
    ) else if exist "%ProgramFiles%\nodejs\node.exe" (
        set "PATH=%ProgramFiles%\nodejs;%PATH%"
    ) else (
        echo.
        echo ERROR: Node.js not found.
        echo กรุณาติดตั้ง Node.js ก่อน:
        echo   1. เปิดโฟลเดอร์ Presetup
        echo   2. ดับเบิลคลิก 1_install_software.bat
        echo   3. รอให้เสร็จแล้วเปิด start-desktop.bat ใหม่
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
