@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title NEXflow - Step 2: Setup Database

:: โหมด auto (เรียกจากตัวติดตั้ง .exe) = ไม่ pause
set "NOPAUSE="
if /i "%~1"=="auto" set "NOPAUSE=1"

:: ขอสิทธิ์ Admin อัตโนมัติ (เฉพาะตอน double-click เอง)
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    if not defined NOPAUSE (
        echo กำลังขอสิทธิ์ผู้ดูแลระบบ...
        powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
    )
    exit /b
)

set PGPASSWORD=1234
set PGCLIENTENCODING=UTF8
set "NEXROOT=%~dp0.."

:: หา psql จาก PostgreSQL ที่ติดตั้ง
set PSQL=
for %%V in (18 17 16 15 14 13) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        if not defined PSQL set PSQL="C:\Program Files\PostgreSQL\%%V\bin\psql.exe"
    )
)

if not defined PSQL (
    echo [!] ไม่พบ PostgreSQL -- กรุณารัน 1_install_software.bat ก่อน
    if not defined NOPAUSE pause
    exit /b 1
)

echo ============================================================
echo  NEXflow -- ขั้นที่ 2: ตั้งค่าฐานข้อมูล
echo  พบ PostgreSQL ที่: %PSQL%
echo ============================================================
echo.

echo [1/4] สร้างฐานข้อมูล nexflow_db...
%PSQL% -U postgres -c "DROP DATABASE IF EXISTS nexflow_db;" 2>nul
%PSQL% -U postgres -c "CREATE DATABASE nexflow_db WITH ENCODING 'UTF8' TEMPLATE template0 LC_COLLATE 'C' LC_CTYPE 'C';"
if %ERRORLEVEL% neq 0 (
    echo [!] สร้างฐานข้อมูลไม่ได้ -- ตรวจสอบว่า PostgreSQL service ทำงานอยู่
    if not defined NOPAUSE pause
    exit /b 1
)
echo     OK

echo [2/4] สร้าง tables...
%PSQL% -U postgres -d nexflow_db -f "%NEXROOT%\database\01_schema.sql"
if %ERRORLEVEL% neq 0 (
    echo [!] สร้าง tables ไม่สำเร็จ
    if not defined NOPAUSE pause
    exit /b 1
)
echo     OK

echo [3/4] เพิ่ม admin user และข้อมูลเริ่มต้น...
%PSQL% -U postgres -d nexflow_db -f "%~dp0sql\seed_fresh_install.sql"
if %ERRORLEVEL% neq 0 (
    echo [!] เพิ่มข้อมูลไม่สำเร็จ
    if not defined NOPAUSE pause
    exit /b 1
)
echo     OK

echo [4/4] ติดตั้ง API dependencies...
:: หา node/npm กรณีเพิ่งติดตั้ง PATH ยังไม่ refresh
where npm >nul 2>&1 || if exist "C:\Program Files\nodejs\npm.cmd" set "PATH=C:\Program Files\nodejs;%PATH%"
cd /d "%NEXROOT%\database"
call npm install --silent
if %ERRORLEVEL% neq 0 (
    echo [!] npm install ไม่สำเร็จ -- ตรวจสอบว่าติดตั้ง Node.js แล้ว
    if not defined NOPAUSE pause
    exit /b 1
)
echo     OK

echo.
echo ============================================================
echo  ตั้งค่าฐานข้อมูลเรียบร้อย!  เข้าระบบ: admin / 1234
echo ============================================================
if not defined NOPAUSE (
    echo  ขั้นตอนต่อไป: ดับเบิลคลิก 3_open_firewall.bat
    pause
)
exit /b 0
