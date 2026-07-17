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

:: ── ถ้าติดตั้งเป็น Windows Service ไว้แล้ว (Presetup\install-services.bat) ──
:: ไม่ต้องเปิดหน้าต่าง cmd แยกสำหรับ API/Web อีกเลย - service วิ่งอยู่เบื้องหลัง
:: อัตโนมัติตั้งแต่เครื่องบูตแล้ว (กันปัญหาคนเผลอปิด cmd แล้วระบบใช้งานไม่ได้)
set "USING_SERVICES="
set "API_SVC_UP="
set "WEB_SVC_UP="
sc query NEXflowAPI 2>nul | findstr /i "RUNNING" >nul 2>&1 && set "API_SVC_UP=1"
sc query NEXflowWeb 2>nul | findstr /i "RUNNING" >nul 2>&1 && set "WEB_SVC_UP=1"
if defined API_SVC_UP if defined WEB_SVC_UP set "USING_SERVICES=1"

if defined USING_SERVICES (
    echo [2/3] API + Web Server: running as Windows Service ^(background, no cmd window^)
) else (
    echo [2/3] Starting API Server on port 3001...
    start "NexFlow API" cmd /k "%ROOT%database\run-api.bat"
    timeout /t 2 /nobreak >nul

    echo [2b] Starting Web UI Server on port 3000 (LAN access)...

    :: Find perl.exe - do NOT hardcode the path. Git for Windows can be installed
    :: to different locations (C:\Program Files\Git, C:\Program Files (x86)\Git,
    :: a custom drive/folder chosen during install, or not installed at all).
    :: A hardcoded path here causes cmd to print "The system cannot find the path
    :: specified" and the web server never actually starts, even though everything
    :: else (API server, firewall, etc.) looks fine.
    set "PERL_EXE="
    where perl >nul 2>&1
    if not errorlevel 1 (
        for /f "usebackq delims=" %%P in (`where perl`) do if not defined PERL_EXE set "PERL_EXE=%%P"
    )
    if not defined PERL_EXE if exist "C:\Program Files\Git\usr\bin\perl.exe" set "PERL_EXE=C:\Program Files\Git\usr\bin\perl.exe"
    if not defined PERL_EXE if exist "C:\Program Files (x86)\Git\usr\bin\perl.exe" set "PERL_EXE=C:\Program Files (x86)\Git\usr\bin\perl.exe"
    if not defined PERL_EXE if exist "C:\Git\usr\bin\perl.exe" set "PERL_EXE=C:\Git\usr\bin\perl.exe"

    if not defined PERL_EXE (
        echo.
        echo ============================================
        echo  ERROR: perl.exe not found on this PC.
        echo  Web UI server ^(port 3000^) will NOT start.
        echo  Fix: install Git for Windows ^(includes Perl^)
        echo  from https://git-scm.com/download/win
        echo  then close this window and run start-desktop.bat again.
        echo ============================================
        echo.
        pause
    ) else (
        start "NexFlow Web" cmd /k ""%PERL_EXE%" "%ROOT%serve.pl""
    )
    timeout /t 1 /nobreak >nul

    echo.
    echo  TIP: run Presetup\install-services.bat once to turn API/Web into
    echo  background Windows Services - no more cmd windows to accidentally
    echo  close, and they auto-start if the server PC restarts or loses power.
)

:: Show URL for other PCs in the shop (get_lan_ip.ps1 = more reliable than "first IP found")
set "LAN_IP="
for /f "usebackq delims=" %%I in (`powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%Presetup\get_lan_ip.ps1" 2^>nul`) do set "LAN_IP=%%I"
echo.
if defined LAN_IP (
    echo ============================================
    echo  Other PCs in the shop open this URL:
    echo  http://%LAN_IP%:3000
    echo ============================================
    echo  If other PCs still can't connect, on THIS PC run:
    echo    Presetup\3_open_firewall.bat
    echo  ^(opens port 3000/3001 through Windows Firewall for ALL network profiles^)
) else (
    echo  ^(LAN IP not found - check network connection^)
)
echo.

:: กัน env var ค้างจากเครื่อง (เช่นโปรเจกต์ electron อื่น) ที่ทำให้ electron
:: ข้ามดาวน์โหลด electron.exe ไปเงียบๆ ระหว่าง npm install (ดู electron\install.js)
set "ELECTRON_SKIP_BINARY_DOWNLOAD="

if not exist "%ROOT%electron\node_modules" (
    echo [3/3] Installing Electron packages, first run, may take a while...
    cd /d "%ROOT%electron"
    call npm install
) else (
    echo [3/3] Electron packages OK
)

:: node_modules can exist but be incomplete (e.g. antivirus interrupted electron.exe
:: being extracted during npm install) - check the actual binary, not just
:: the folder, otherwise "npm start" fails almost instantly with no clear reason
:: and this window looks like it "closes itself" when it's really just erroring out fast.
if not exist "%ROOT%electron\node_modules\electron\dist\electron.exe" (
    echo.
    echo  [!] electron.exe missing after npm install - attempting automatic repair...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%electron\fix-electron-extract.ps1"
)

if not exist "%ROOT%electron\node_modules\electron\dist\electron.exe" (
    echo.
    echo ============================================
    echo  ERROR: electron.exe still not found in electron\node_modules
    echo  This usually means antivirus is deleting it right after it's
    echo  written. Add an antivirus exclusion for this whole project
    echo  folder, then run electron\fix-electron-install.bat
    echo  and try start-desktop.bat again.
    echo ============================================
    echo.
    pause
    exit /b 1
)

cd /d "%ROOT%electron"
echo [Electron] Launching app...
call npm start
set "ELECTRON_EXIT=%errorlevel%"

echo.
echo ============================================
echo  NexFlow Desktop closed. (exit code: %ELECTRON_EXIT%)
if not "%ELECTRON_EXIT%"=="0" (
    echo  Electron exited with an ERROR - this is why the app closed.
    echo  Scroll up to see the actual error message from npm/electron,
    echo  or check electron\error.log for details, and send it over.
) else (
    echo  If this happened right after opening ^(not because you closed
    echo  the app window yourself^), scroll up for errors or check
    echo  electron\error.log
)
echo ============================================
pause
