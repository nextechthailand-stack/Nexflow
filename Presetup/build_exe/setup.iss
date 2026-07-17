; ============================================================
;  NEXflow Setup Script — Inno Setup 6.x
;  วิธีใช้: ดู HOW_TO_BUILD_EXE.md
;  Output: Presetup\build_exe\Output\NEXflow_Setup.exe
; ============================================================

#define AppName    "NEXflow"
#define AppVersion "1.0"
#define AppPublisher "NEXflow"
#define AppRootSrc "..\.."

[Setup]
AppId={{A7C3F1D2-4E89-4B2A-9F31-C8E04B7A2D56}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} v{#AppVersion}
AppPublisher={#AppPublisher}
DefaultDirName=C:\NEXflow
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir=Output
OutputBaseFilename=NEXflow_Setup
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
SetupLogging=yes
UninstallDisplayName={#AppName}
MinVersion=10.0.17763

[Languages]
Name: "en"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel1=ยินดีต้อนรับสู่ตัวติดตั้ง NEXflow
WelcomeLabel2=โปรแกรมระบบจัดการสต็อกและใบกำกับภาษี%n%nกด ถัดไป เพื่อดำเนินการต่อ
FinishedLabel=ติดตั้ง NEXflow เรียบร้อยแล้ว%n%nคลิก เสร็จสิ้น เพื่อปิดตัวติดตั้ง

[Files]
; -- UI / source files (ไม่รวม node_modules และไฟล์ dev)
Source: "{#AppRootSrc}\ui_kits\*";    DestDir: "{app}\ui_kits";    Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#AppRootSrc}\assets\*";     DestDir: "{app}\assets";     Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#AppRootSrc}\electron\*";   DestDir: "{app}\electron";   Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*"
Source: "{#AppRootSrc}\database\*";   DestDir: "{app}\database";   Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules\*"
Source: "{#AppRootSrc}\Presetup\*";   DestDir: "{app}\Presetup";   Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "build_exe\Output\*"

; -- Root files
Source: "{#AppRootSrc}\index.html";           DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRootSrc}\colors_and_type.css";  DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRootSrc}\serve.pl";             DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRootSrc}\start-desktop.bat";    DestDir: "{app}"; Flags: ignoreversion
Source: "{#AppRootSrc}\start.bat";            DestDir: "{app}"; Flags: ignoreversion; Check: FileExists('{#AppRootSrc}\start.bat')

[Icons]
Name: "{autodesktop}\NEXflow";          Filename: "{app}\start-desktop.bat"; Comment: "เปิดระบบ NEXflow"
Name: "{group}\เปิด NEXflow";           Filename: "{app}\start-desktop.bat"
Name: "{group}\ถอนการติดตั้ง NEXflow"; Filename: "{uninstallexe}"

[Run]
; รันอัตโนมัติระหว่างติดตั้ง (เฉพาะครั้งแรก) — ผู้ใช้แค่กด Next > Next > Finish
; Parameters "auto" = สคริปต์จะไม่ pause/ไม่ถามอะไร
Filename: "{app}\Presetup\1_install_software.bat"; Parameters: "auto"; \
  StatusMsg: "กำลังติดตั้ง Node.js, Git, PostgreSQL 18 (อาจใช้เวลาหลายนาที กรุณารอ)..."; \
  Flags: waituntilterminated; Check: IsFirstSetup

Filename: "{app}\Presetup\2_setup_database.bat"; Parameters: "auto"; \
  StatusMsg: "กำลังตั้งค่าฐานข้อมูล..."; \
  Flags: waituntilterminated; Check: IsFirstSetup

Filename: "{app}\Presetup\3_open_firewall.bat"; Parameters: "auto"; \
  StatusMsg: "กำลังเปิด Port สำหรับเครือข่ายในร้าน..."; \
  Flags: waituntilterminated; Check: IsFirstSetup

; เปิดแอปทันที — เป็น checkbox บนหน้า Finish
Filename: "{app}\start-desktop.bat"; \
  Description: "เปิด NEXflow ทันที"; \
  Flags: postinstall nowait skipifsilent

[Code]
function IsFirstSetup: Boolean;
begin
  // รัน setup scripts เฉพาะครั้งแรก (ไม่ใช่ตอน upgrade)
  Result := not RegKeyExists(HKLM,
    'SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\{A7C3F1D2-4E89-4B2A-9F31-C8E04B7A2D56}_is1');
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // บันทึก install path ไว้ใน Registry สำหรับ upgrade ในอนาคต
    RegWriteStringValue(HKLM,
      'SOFTWARE\{#AppPublisher}\{#AppName}',
      'InstallPath', ExpandConstant('{app}'));
  end;
end;
