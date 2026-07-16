# วิธี Compile NEXflow_Setup.exe

## ขั้นตอน (ทำที่เครื่องเรา ครั้งเดียว)

### 1. ดาวน์โหลด Inno Setup (ฟรี)
ไปที่ https://jrsoftware.org/isdl.php  
ดาวน์โหลด **innosetup-6.x.x.exe** แล้วติดตั้ง

### 2. Compile
- เปิดไฟล์ `setup.iss` ด้วย Inno Setup (double-click)
- กด **Ctrl + F9** หรือเมนู Build → Compile
- รอสักครู่...

### 3. ผลลัพธ์
ไฟล์ `NEXflow_Setup.exe` จะอยู่ที่:
```
Presetup\build_exe\Output\NEXflow_Setup.exe
```

### 4. ส่งให้ลูกค้า
ส่งแค่ไฟล์เดียว: `NEXflow_Setup.exe`  
ลูกค้าดับเบิลคลิก → ติดตั้งทุกอย่างอัตโนมัติ

---

## สิ่งที่ NEXflow_Setup.exe จะทำ
1. คัดลอกไฟล์ NEXflow ไปที่ `C:\NEXflow\`
2. สร้าง Shortcut บน Desktop
3. (ติ๊กเลือกได้) รัน setup scripts อัตโนมัติ:
   - ติดตั้ง Node.js + Git + PostgreSQL 18
   - สร้างฐานข้อมูล nexflow_db
   - เปิด Firewall port 3000 และ 3001

## หมายเหตุ
- ลูกค้าต้องต่อ Internet ขณะติดตั้ง (สำหรับดาวน์โหลด Node.js/PostgreSQL/Git)
- Windows 10 v1809+ หรือ Windows 11 เท่านั้น (ต้องมี winget)
- ขนาดไฟล์ .exe ประมาณ 5-20 MB (ขึ้นกับไฟล์ใน electron/)
