@echo off
title StockPro Startup

set ROOT=%~dp0
set PERL="C:\Program Files\Git\usr\bin\perl.exe"

echo ============================================
echo  StockPro - Starting servers...
echo ============================================
echo.

:: Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js not found.
    echo Please install from https://nodejs.org
    pause
    exit /b 1
)

:: Install npm packages if needed
if not exist "%ROOT%database\node_modules" (
    echo [1/3] Installing npm packages...
    cd /d "%ROOT%database"
    call npm install --silent
    echo     Done.
) else (
    echo [1/3] npm packages OK
)

:: Start API server (port 3001)
echo [2/3] Starting API Server on port 3001...
start "StockPro API :3001" cmd /k "cd /d "%ROOT%database" && node api_server.js"
timeout /t 2 /nobreak > nul

:: Start Perl static server (port 3000)
echo [3/3] Starting Web Server on port 3000...
start "StockPro Web :3000" cmd /k "%PERL% "%ROOT%serve.pl""
timeout /t 2 /nobreak > nul

:: Open browser
echo.
echo ============================================
echo  Ready!
echo  Web : http://localhost:3000/ui_kits/stockpro/index.html
echo  API : http://localhost:3001/api/health
echo ============================================
echo.
start "" "http://localhost:3000/ui_kits/stockpro/index.html"
pause
