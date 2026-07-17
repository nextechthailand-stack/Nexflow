@echo off
title NEXflow - Create Desktop Icon (Server PC)

set "ROOT=%~dp0.."
for %%I in ("%ROOT%") do set "ROOT=%%~fI"

echo ============================================================
echo  NEXflow -- Creating Desktop icon for this Server PC
echo ============================================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ws = New-Object -ComObject WScript.Shell;" ^
  "$s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\NEXflow.lnk');" ^
  "$s.TargetPath = '%ROOT%\start-desktop.bat';" ^
  "$s.WorkingDirectory = '%ROOT%';" ^
  "$s.IconLocation = '%ROOT%\assets\app-icon.ico';" ^
  "$s.Description = 'เปิดระบบ NEXflow (สต็อก + ขายสินค้า + ใบกำกับภาษี)';" ^
  "$s.Save()"

if exist "%USERPROFILE%\Desktop\NEXflow.lnk" (
    echo Done! Icon "NEXflow" created on the Desktop.
) else (
    echo ERROR: Could not create the shortcut. Try running as Administrator.
)
echo.
pause
