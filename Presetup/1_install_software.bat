@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion
title NEXflow - Step 1: Install Software

:: โหมด auto (เรียกจากตัวติดตั้ง .exe) = ไม่ pause ไม่ถามอะไร
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

echo ============================================================
echo  NEXflow -- ขั้นที่ 1: ติดตั้งโปรแกรมที่จำเป็น
echo  (ต้องต่อ Internet ขณะติดตั้ง)
echo ============================================================
echo.
echo โปรแกรมที่จะติดตั้งอัตโนมัติ:
echo   [1] Node.js LTS     -- สำหรับ API server ของ NEXflow
echo   [2] Git for Windows -- มี Perl ในตัว สำหรับ Web server
echo   [3] PostgreSQL 18   -- ฐานข้อมูล (รหัสผ่าน postgres: 1234)
echo.

if not defined NOPAUSE (
    echo กด Enter เพื่อเริ่มติดตั้ง...
    pause >nul
)

:: ตรวจสอบ winget
where winget >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] ไม่พบ winget บนเครื่องนี้
    echo     กรุณาอัปเดต Windows หรือติดตั้ง "App Installer" จาก Microsoft Store
    echo.
    if not defined NOPAUSE pause
    exit /b 1
)

echo.
echo [1/3] กำลังติดตั้ง Node.js LTS...
winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if %ERRORLEVEL% equ 0 (
    echo       Node.js: สำเร็จ!
) else (
    echo       Node.js: อาจติดตั้งอยู่แล้ว หรือไม่สำเร็จ -- ข้ามต่อไป
)

echo.
echo [2/3] กำลังติดตั้ง Git for Windows...
winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements
if %ERRORLEVEL% equ 0 (
    echo       Git: สำเร็จ!
) else (
    echo       Git: อาจติดตั้งอยู่แล้ว หรือไม่สำเร็จ -- ข้ามต่อไป
)

echo.
echo [3/3] กำลังติดตั้ง PostgreSQL 18 (อาจใช้เวลา 3-5 นาที)...
echo       กรุณารอ -- อย่าปิดหน้าต่างนี้...
echo.

winget install -e --id PostgreSQL.PostgreSQL.18 --accept-package-agreements --accept-source-agreements --override "--mode unattended --unattendedmodeui none --superpassword 1234 --serverport 5432 --locale C --servicename postgresql-x64-18"
set PG_ERR=%ERRORLEVEL%

if %PG_ERR% neq 0 (
    echo       ลอง ID สำรอง...
    winget install -e --id EDB.PostgreSQL.18 --accept-package-agreements --accept-source-agreements --override "--mode unattended --unattendedmodeui none --superpassword 1234 --serverport 5432 --locale C"
    set PG_ERR=!ERRORLEVEL!
)

if %PG_ERR% equ 0 (
    echo       PostgreSQL 18: สำเร็จ! ^(รหัสผ่าน postgres = 1234^)
) else (
    echo.
    echo ============================================================
    echo  [!] PostgreSQL ติดตั้งอัตโนมัติไม่สำเร็จ
    echo      ติดตั้งเองจาก https://www.postgresql.org/download/windows/
    echo      ตั้งรหัสผ่าน postgres = 1234, Port = 5432
    echo ============================================================
    if not defined NOPAUSE pause
    exit /b 1
)

echo.
echo ============================================================
echo  ติดตั้งโปรแกรมทั้งหมดเสร็จสิ้น!
echo ============================================================
if not defined NOPAUSE (
    echo  ขั้นตอนต่อไป: ดับเบิลคลิก 2_setup_database.bat
    pause
)
exit /b 0
