@echo off
title Reset StockPro DB

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

echo ============================================
echo  StockPro DB Reset
echo  - Clears ALL invoices, GRN, stock ledger
echo  - Keeps products, customers, users
echo ============================================
echo.
set /p CONFIRM=Type YES to confirm:
if /i not "%CONFIRM%"=="YES" (
    echo Cancelled.
    pause & exit /b 0
)

echo.
echo [1/3] Applying schema (create tables if missing)...
%PSQL% -U postgres -d stockpro_db -f "%~dp001_schema.sql"
echo     OK

echo [2/3] Seeding master data (products, customers, users)...
%PSQL% -U postgres -d stockpro_db -f "%~dp002_seed_master.sql"
echo     OK

echo [3/3] Clearing transaction data...
%PSQL% -U postgres -d stockpro_db -f "%~dp003_reset_txn.sql"
echo     OK

echo.
echo Verifying:
%PSQL% -U postgres -d stockpro_db -c "SELECT code, name, stock_qty FROM products ORDER BY code;"
%PSQL% -U postgres -d stockpro_db -c "SELECT prefix, last_counter FROM document_counters ORDER BY prefix;"

echo.
echo ============================================
echo  Reset complete! DB is clean for testing.
echo  Restart start.bat to apply.
echo ============================================
pause
