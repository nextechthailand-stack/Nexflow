@echo off
title StockPro DB Setup

set PGPASSWORD=1234

:: Find psql - check versions 18 down to 13
set PSQL=
for %%V in (18 17 16 15 14 13) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        if not defined PSQL set PSQL="C:\Program Files\PostgreSQL\%%V\bin\psql.exe"
    )
)

if not defined PSQL (
    echo ERROR: psql.exe not found.
    pause
    exit /b 1
)

echo Found: %PSQL%
echo.

echo [1/4] Creating database stockpro_db...
%PSQL% -U postgres -c "DROP DATABASE IF EXISTS stockpro_db;"
%PSQL% -U postgres -c "CREATE DATABASE stockpro_db WITH ENCODING 'UTF8' TEMPLATE template0;"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Could not create database.
    pause
    exit /b 1
)
echo     OK

echo [2/4] Creating tables...
%PSQL% -U postgres -d stockpro_db -f "%~dp001_schema.sql"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Schema failed.
    pause
    exit /b 1
)
echo     OK

echo [3/4] Importing seed data...
%PSQL% -U postgres -d stockpro_db -f "%~dp002_seed.sql"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Seed failed.
    pause
    exit /b 1
)
echo     OK

echo [4/4] Verifying...
echo.
%PSQL% -U postgres -d stockpro_db -c "\dt"
echo.
%PSQL% -U postgres -d stockpro_db -c "SELECT code, name, stock_qty FROM products ORDER BY code;"
echo.
echo ============================================
echo  Done! Database: stockpro_db on localhost:5432
echo ============================================
pause
