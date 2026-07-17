@echo off
title NEXflow - Remove background services (rollback)

net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Requesting administrator rights...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    exit /b
)

echo ============================================================
echo  NEXflow -- Remove NEXflowAPI / NEXflowWeb services
echo  (goes back to the old cmd-window behavior in start-desktop.bat)
echo ============================================================
echo.

set "NSSM_EXE="
where nssm >nul 2>&1
if %ERRORLEVEL% equ 0 (
    for /f "usebackq delims=" %%S in (`where nssm`) do if not defined NSSM_EXE set "NSSM_EXE=%%S"
)
if not defined NSSM_EXE if exist "%~dp0tools\nssm.exe" set "NSSM_EXE=%~dp0tools\nssm.exe"
if not defined NSSM_EXE (
    echo nssm.exe not found - removing services with sc.exe instead ^(less clean but works^)
    sc stop NEXflowAPI >nul 2>&1
    sc stop NEXflowWeb >nul 2>&1
    sc delete NEXflowAPI
    sc delete NEXflowWeb
) else (
    "%NSSM_EXE%" stop NEXflowAPI >nul 2>&1
    "%NSSM_EXE%" remove NEXflowAPI confirm
    "%NSSM_EXE%" stop NEXflowWeb >nul 2>&1
    "%NSSM_EXE%" remove NEXflowWeb confirm
)

echo.
echo Done. Services removed. start-desktop.bat will fall back to the
echo old behavior (spawning visible API/Web cmd windows) next time it runs.
pause
