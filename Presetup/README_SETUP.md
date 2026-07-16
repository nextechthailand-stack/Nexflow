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
- รัน `Presetup\3_open_firewall.bat` อีกครั้ง
- ทุกเครื่องอยู่ WiFi/LAN วงเดียวกันหรือไม่

**เข้าระบบไม่ได้** → `admin` / `1234` · ถ้ายังไม่ได้รัน `2_setup_database.bat` อีกครั้ง

**API Error / ไม่โหลดข้อมูล** → ปิดแอปแล้วเปิด `start-desktop.bat` ใหม่ · เช็คว่า PostgreSQL service ทำงานอยู่ (Win+R → `services.msc` → `postgresql-x64-18`)

---

## สำหรับผู้ที่ build .exe เอง
ดู `build_exe\HOW_TO_BUILD_EXE.md`
