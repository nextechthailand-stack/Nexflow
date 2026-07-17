# คู่มือติดตั้ง NEXflow — สำหรับร้านค้า

## วิธีที่ 1 (แนะนำ) — ติดตั้งด้วย NEXflow_Setup.exe

> ทำที่ **เครื่อง Server** (เครื่องหลักของร้าน) ครั้งเดียว · ต้องต่อ Internet

1. ดับเบิลคลิก **`NEXflow_Setup.exe`**
2. กด **Next → Next → Install**
3. รอ... ตัวติดตั้งจะทำทุกอย่างให้อัตโนมัติ (ไม่ต้องกดอะไรเพิ่ม):
   - ติดตั้ง Node.js + Git + PostgreSQL 18
   - สร้างฐานข้อมูล + user admin
   - เปิด Port ให้เครื่องอื่นเข้าได้
4. หน้าสุดท้ายติ๊ก **"เปิด NEXflow ทันที"** → กด **Finish**

> ขั้นติดตั้ง PostgreSQL อาจใช้เวลาหลายนาที — หน้าต่างจะขึ้น "กำลังติดตั้ง..." ปล่อยให้ทำงานจนเสร็จ อย่าปิด

---

## เปิดใช้งานทุกวัน

**เครื่อง Server:** ดับเบิลคลิก **NEXflow** บน Desktop (หรือ `start-desktop.bat`)
→ แอปเปิดขึ้น + แสดง URL สำหรับเครื่องอื่น

**เครื่องอื่นในร้าน:** เปิด Chrome/Edge พิมพ์ `http://<IP เครื่อง Server>:3000`
→ ลืม IP? รัน `Presetup\4_show_server_ip.bat` บนเครื่อง Server
→ ระบบจะเชื่อมต่อ API ของเครื่อง Server ให้อัตโนมัติ (ใช้ IP เดียวกับที่พิมพ์ในแถบ URL) ไม่ต้องตั้งค่าเพิ่ม
→ ถ้า API server รันอยู่คนละเครื่องกับ Web server ให้พิมพ์
  `http://<IP เครื่อง Web>:3000/?api=http://<IP เครื่อง API>:3001` ครั้งแรกครั้งเดียว (ระบบจะจำไว้ให้)

---

## สร้างไอคอนเปิดโปรแกรม (Desktop Icon)

**เครื่อง Server** — ถ้ายังไม่มีไอคอน "NEXflow" บน Desktop (เช่นติดตั้งด้วยวิธีที่ 2) ให้รัน:
```
Presetup\create_desktop_shortcut.bat
```
จะสร้างไอคอน "NEXflow" บน Desktop ให้ กดเปิดได้เลยแทนการเข้าไปหา `start-desktop.bat` เอง

**เครื่องอื่นในร้าน (Client)** — คัดลอกไฟล์เดียว `Presetup\create_client_shortcut.bat`
ไปวางที่เครื่อง Client (ผ่าน USB/แชร์โฟลเดอร์ก็ได้ ไม่ต้องมีโฟลเดอร์ NEXflow ทั้งหมด) แล้วดับเบิลคลิกรันที่เครื่องนั้น
โปรแกรมจะถามชื่อ/IP เครื่อง Server (ดูได้จาก `4_show_server_ip.bat` บนเครื่อง Server) แล้วสร้างไอคอน
"NEXflow (เข้าใช้งาน)" บน Desktop ของเครื่อง Client ให้ กดเปิดจะพาไปที่หน้าเว็บ NEXflow ทันที

---

## ทำ API + Web Server เป็น Background Service (แนะนำสำหรับเครื่อง Server ที่ใช้งานจริง)

ปกติตอนเปิด `start-desktop.bat` จะมีหน้าต่าง cmd ค้างอยู่ 2 อัน ("NexFlow API", "NexFlow Web")
ถ้ามีคนเผลอปิดหน้าต่างพวกนี้ ระบบทั้งร้านจะใช้งานไม่ได้ทันที และถ้าเครื่อง Server ดับ/restart
ก็ต้องมีคนมาเปิด `start-desktop.bat` ใหม่เองทุกครั้ง

รัน (ครั้งเดียว บนเครื่อง Server, ต้องมีสิทธิ์ Admin):
```
Presetup\install-services.bat
```
จะติดตั้ง API server (พอร์ต 3001) และ Web server (พอร์ต 3000) เป็น **Windows Service**
(ดูได้ใน `services.msc` ชื่อ "NEXflow API Server" / "NEXflow Web Server") ผลคือ:
- ไม่มีหน้าต่าง cmd ค้างให้เผลอปิดอีกต่อไป — service ทำงานเบื้องหลังตลอดเวลา
- ตั้งเป็น Automatic startup — เครื่อง Server รีสตาร์ท/ไฟดับแล้วกลับมา ระบบจะเปิดใช้งานได้เองโดยไม่ต้องมีใครมากดอะไร
- ถ้า service ค้าง/crash จะ restart ตัวเองอัตโนมัติ
- หลังติดตั้งแล้ว `start-desktop.bat` จะรู้เองว่า service ทำงานอยู่แล้ว จะไม่เปิดหน้าต่าง cmd ซ้ำอีก
  (แค่เปิดหน้าต่างโปรแกรม NEXflow เท่านั้น — ยังต้องมีคนกดเปิดหน้าต่างโปรแกรมเองอยู่ เพราะฟีเจอร์พิมพ์ใบเสร็จ
  ต้องมีหน้าต่างโปรแกรมเปิดอยู่จริง ไม่สามารถทำเป็น background service ล้วนๆ ได้)

ถ้าต้องการยกเลิก กลับไปใช้แบบ cmd เดิม รัน `Presetup\uninstall-services.bat`

---

## เข้าสู่ระบบครั้งแรก

| ช่อง | ค่า |
|------|-----|
| Username | `admin` |
| Password | `1234` |

**เปลี่ยนรหัสผ่านทันทีหลังเข้าระบบ** (Settings → Users) แล้วกรอกข้อมูลร้านที่ Settings → ข้อมูลบริษัท

---

## วิธีที่ 2 (สำรอง) — ติดตั้งด้วยมือ ทีละขั้น

ถ้า .exe มีปัญหา ดับเบิลคลิกใน `Presetup\` ตามลำดับ:

1. `1_install_software.bat` — ติดตั้ง Node.js + Git + PostgreSQL 18
2. `2_setup_database.bat` — สร้างฐานข้อมูล + admin
3. `3_open_firewall.bat` — เปิด Port

(ระบบจะขอสิทธิ์ Admin → กด Yes · ทำตามที่หน้าจอบอก)

---

## ปัญหาที่พบบ่อย

**เครื่องอื่นเข้าไม่ได้**
- เครื่อง Server เปิด `start-desktop.bat` ไว้หรือยัง
- รัน `Presetup\3_open_firewall.bat` อีกครั้ง (สำคัญมากถ้าย้ายไปติดตั้งเครื่องใหม่/เปลี่ยนเครือข่าย)
- ทุกเครื่องอยู่ WiFi/LAN วงเดียวกันหรือไม่
- IP ที่พิมพ์ตรงกับ IP เครื่อง Server จริงหรือไม่ (เช็คจาก `4_show_server_ip.bat`)
- เข้าได้แต่เห็นข้อมูลเป็นตัวอย่าง/ไม่ตรงกับเครื่อง Server → Settings → เชื่อมต่อ API
  กด "ทดสอบ" เพื่อดูว่าต่อ API จริงได้หรือไม่

**เข้าระบบไม่ได้** → `admin` / `1234` · ถ้ายังไม่ได้รัน `2_setup_database.bat` อีกครั้ง

**API Error / ไม่โหลดข้อมูล** → ปิดแอปแล้วเปิด `start-desktop.bat` ใหม่ · เช็คว่า PostgreSQL service ทำงานอยู่ (Win+R → `services.msc` → `postgresql-x64-18`)

**แอปเปิดไม่ขึ้น / cmd แสดง "electron.exe not found"**
- สาเหตุที่พบบ่อยที่สุด: ระหว่าง `npm install` ตัวติดตั้งของ Electron แตกไฟล์ `electron.exe` เข้าโฟลเดอร์โปรเจกต์ไม่สำเร็จ (มักเกิดจากแอนตี้ไวรัสสแกน/บล็อกไฟล์ .exe/.dll หลายไฟล์พร้อมกันระหว่างแตกไฟล์) — `start-desktop.bat` จะพยายามซ่อมให้อัตโนมัติเมื่อเจอ (เรียก `electron\fix-electron-extract.ps1`)
- ถ้าซ่อมอัตโนมัติไม่สำเร็จ ให้รัน `electron\fix-electron-install.bat` ด้วยตัวเอง แล้วดู `electron\install.log` ประกอบ
- แนะนำให้เพิ่ม **antivirus exclusion** ให้ทั้งโฟลเดอร์โปรเจกต์นี้ไว้ล่วงหน้าก่อนติดตั้งบนเครื่อง Server ใหม่ทุกครั้ง จะช่วยลดโอกาสเจอปัญหานี้ตั้งแต่แรก
- เช็คสถานะไฟล์นี้ได้จาก `Presetup\5_diagnose_connection.bat` (ข้อ [8])

---

## สำหรับผู้ที่ build .exe เอง
ดู `build_exe\HOW_TO_BUILD_EXE.md`
