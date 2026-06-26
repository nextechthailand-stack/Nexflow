@echo off
setlocal EnableDelayedExpansion
title NEXflow — ขั้นที่ 1: ติดตั้งโปรแกรมที่จำเป็น

:: ขอสิทธิ์ Admin อัตโนมัติ
net session >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo กำลังขอสิทธิ์ผู้ดูแลระบบ...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"%~f0\"' -Verb RunAs"
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
echo กด Enter เพื่อเริ่มติดตั้ง...
pause >nul

:: ตรวจสอบ winget
where winget >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] ไม่พบ winget บนเครื่องนี้
    echo     กรุณาทำอย่างใดอย่างหนึ่ง:
    echo     - อัปเดต Windows ให้เป็นเวอร์ชันล่าสุด
    echo     - หรือค้นหา "App Installer" ใน Microsoft Store แล้วติดตั้ง
    echo.
    pause & exit /b 1
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
    echo       PostgreSQL 18: สำเร็จ! (รหัสผ่าน postgres = 1234)
) else (
    echo.
    echo ============================================================
    echo  [!] PostgreSQL ติดตั้งอัตโนมัติไม่สำเร็จ
    echo      กรุณาติดตั้งด้วยตนเอง:
    echo.
    echo  1. ไปที่: https://www.postgresql.org/download/windows/
    echo  2. ดาวน์โหลด PostgreSQL 18 (Windows x86-64)
    echo  3. ติดตั้ง -- ตั้งรหัสผ่าน postgres เป็น: 1234
    echo  4. Port: 5432 (ค่าเริ่มต้น อย่าเปลี่ยน)
    echo  5. กลับมารัน 2_setup_database.bat หลังติดตั้งเสร็จ
    echo ============================================================
    pause & exit /b 1
)

echo.
echo ============================================================
echo  ติดตั้งโปรแกรมทั้งหมดเสร็จสิ้น!
echo.
echo  ขั้นตอนต่อไป:
echo  ดับเบิลคลิกที่ 2_setup_database.bat
echo ============================================================
pause
