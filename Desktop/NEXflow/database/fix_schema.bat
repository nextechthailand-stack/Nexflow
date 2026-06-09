@echo off
title StockPro DB Setup

set PGPASSWORD=1234
set PGCLIENTENCODING=UTF8
set PSQL=

for %%V in (18 17 16 15 14 13) do (
    if exist "C:\Program Files\PostgreSQL\%%V\bin\psql.exe" (
        if not defined PSQL set PSQL="C:\Program Files\PostgreSQL\%%V\bin\psql.exe"
    )
)

if not defined PSQL (
    echo ERROR: psql.exe not found.
    pause & exit /b 1
)

echo Found: %PSQL%
echo.

echo [1/4] Check/create database...
%PSQL% -U postgres -c "SELECT 1 FROM pg_database WHERE datname='stockpro_db'" | findstr /c:"1 row" >nul
if %ERRORLEVEL% neq 0 (
    %PSQL% -U postgres -c "CREATE DATABASE stockpro_db WITH ENCODING 'UTF8' TEMPLATE template0;"
    echo     Created stockpro_db
) else (
    echo     stockpro_db already exists
)

echo [2/4] Creating tables (schema)...
%PSQL% -U postgres -d stockpro_db -f "%~dp001_schema.sql"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Schema failed.
    pause & exit /b 1
)
echo     OK

echo [3/4] Seeding master data (products, customers, users)...
%PSQL% -U postgres -d stockpro_db -f "%~dp002_seed_master.sql"
echo     OK

echo [4/4] Clearing transaction data (fresh start)...
%PSQL% -U postgres -d stockpro_db -f "%~dp003_reset_txn.sql"
echo     OK

echo.
echo Verifying tables:
%PSQL% -U postgres -d stockpro_db -c "\dt"
echo.
echo Products:
%PSQL% -U postgres -d stockpro_db -c "SELECT code, name, stock_qty, sell_price FROM products ORDER BY code;"

echo.
echo ============================================
echo  Setup complete! Run start.bat to launch.
echo ============================================
pause
