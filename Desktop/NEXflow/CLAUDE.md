# CLAUDE.md — NEXflow UI Kit · NEXflow

คำแนะนำสำหรับ Claude Code เมื่อทำงานกับ project นี้

---

## โครงสร้างโปรเจกต์

```
NEXflow/
├── CLAUDE.md                    ← คุณอยู่ที่นี่
├── context.md                   ← ภาพรวมระบบและ business logic
├── consolog.md                  ← บันทึกการเปลี่ยนแปลงและ session log
├── index.html                   ← redirect → ui_kits/nexflow/index.html
├── colors_and_type.css          ← Design token (root)
├── serve.pl                     ← Perl static HTTP server (port 3000)
├── assets/
│   ├── logo-mark.svg
│   └── logo-lockup.svg
└── ui_kits/nexflow/
    ├── index.html               ← Entry point หลัก (React + Babel)
    ├── kit.css                  ← Component styles (imports ../../colors_and_type.css)
    ├── data.js                  ← Mock data + parseBarcode + fmtMoney + SP_STATE
    ├── primitives.jsx           ← Icon, Button, Badge, StockPill, Card, StatCard, Field
    ├── tweaks-panel.jsx         ← TweaksPanel, TweakRadio, useTweaks (floating panel)
    ├── Login.jsx                ← Login screen
    ├── Shell.jsx                ← App shell: dark sidebar + toolbar
    ← Dashboard.jsx             ← KPI + charts + stock health
    ├── StockIn.jsx              ← Scan-to-receive flow + GRN document
    ├── StockOut.jsx             ← Scan-to-sell + TIV/INV invoice generation
    ├── Invoice.jsx              ← Full A4 tax invoice modal
    ├── Reports.jsx              ← 6-tab report suite
    └── Extras.jsx               ← InvoiceList, StockManage, Users, Settings, Products, Customers
```

---

## วิธีรัน Dev Server

```bash
# ใช้ Perl (Git for Windows)
"C:\Program Files\Git\usr\bin\perl.exe" serve.pl
# → http://localhost:3000/ui_kits/nexflow/index.html
```

หรือผ่าน `.claude/launch.json` (preview panel):
```json
{ "name": "NEXflow UI Kit", "runtimeExecutable": "C:\\Program Files\\Git\\usr\\bin\\perl.exe",
  "runtimeArgs": ["C:\\Users\\EMC\\Desktop\\NEXflow\\serve.pl"], "port": 3000 }
```

**Demo login:** `admin` / `1234`

---

## Desktop App (Electron) — วิธีใช้งานปัจจุบัน

ตั้งแต่มี silent printing feature ผู้ใช้รันแอปผ่าน **Electron** (ไม่ใช่ `start.bat` + browser แบบเดิม):

```
start-desktop.bat   ← double-click ที่ root ของ NEXflow
```

สิ่งสำคัญที่ต้องรู้เวลาแก้โค้ด:
- `electron/main.js` เซ็ต `ROOT = path.join(__dirname, '..')` แล้วรัน static server ที่ `http://127.0.0.1:3500`
  → **โฟลเดอร์ root ที่ Electron เสิร์ฟ คือ `C:\Users\EMC\Desktop\NEXflow` (โฟลเดอร์เดียวกับที่ `serve.pl`/`start.bat` ใช้)**
  → ไฟล์ UI ที่ต้องแก้ยังอยู่ที่ `ui_kits/nexflow/*` เหมือนเดิม **ไม่มีโฟลเดอร์/ไฟล์แยกสำหรับ Electron**
- `electron/preload.js` + `electron/package.json` — ของ Electron wrapper เท่านั้น ไม่ต้องแก้เมื่อแก้ UI/business logic
- `database/run-api.bat` — launcher ย่อยสำหรับเปิด API server (port 3001) จาก `start-desktop.bat`
- หลังแก้ `ui_kits/nexflow/*.jsx` หรือ `data.js` แล้วเทสต์ไม่เห็นผล ให้ **ปิดหน้าต่าง Electron ทั้งหมดแล้วรัน `start-desktop.bat` ใหม่** (ไม่ใช่แค่ reload) เพื่อให้แน่ใจว่าโหลดไฟล์ล่าสุด
- Settings → ตั้งค่าเครื่องพิมพ์ใบเสร็จ อยู่ในแท็บ "ทั่วไป" และจะแสดงเฉพาะเมื่อรันผ่าน Electron (`window.electronAPI` exists)

---

## Architecture Conventions

### JSX Global Exports
ทุกไฟล์ `.jsx` ต้อง export component ผ่าน `window` เพราะ Babel standalone ไม่แชร์ scope:
```js
window.MyComponent = MyComponent;
// หรือ
Object.assign(window, { Foo, Bar, Baz });
```

เพิ่มไฟล์ใหม่ใน `index.html` ก่อน inline `<App>` script:
```html
<script type="text/babel" src="MyNew.jsx"></script>
```

### Design Tokens
แก้ token ที่ `colors_and_type.css` — ทุก component จะตาม CSS variables อัตโนมัติ:
- `--bg`, `--sur`, `--s2`, `--s3` — พื้นหลัง / surface
- `--ac`, `--gn`, `--am`, `--rd`, `--pu` — สี semantic
- `--r`, `--rs`, `--r4` — border radius
- `--sh`, `--sh2`, `--sh-modal` — shadows
- `--font-sans`, `--font-mono`

### SP_DATA vs SP_STATE
- `window.SP_DATA` — read-only mock data (products, customers, company)
- `window.SP_STATE` — mutable runtime state (invoices, grnLogs, counters)

---

## Invoice Numbering Rules (สำคัญมาก)

| ประเภท | Format | กฎ |
|--------|--------|-----|
| TIV (อย่างย่อ) | `TIV-YYYYMM-XXXX` | ออกทุก commercial sale (wholesale + online) |
| INV (เต็มรูปแบบ) | `INV-YYYYMM-XXXX` | Wholesale เท่านั้น อ้างอิง TIV เสมอ |
| ISS | `ISS-XXXX` | Sample / Expired / Other |

```js
// Counters แยกกัน — ห้ามใช้ invCounter เดียวกัน
SP_STATE.invCounterThermal  // → TIV
SP_STATE.invCounterA4       // → INV
SP_STATE.invCounter         // → ISS
```

ทุก A4 invoice ต้องมี `thermalNo` field อ้างอิง TIV:
```js
{ no: 'INV-202505-0001', thermalNo: 'TIV-202505-0002', type: 'A4', ... }
```

---

## Barcode Format

13 หลัก: `[1 prefix][6 product code][5 weight×1000][1 check]`
- ตัวที่ 2-7 = รหัสสินค้า 6 หลัก (`slice(1,7)`)
- ตัวที่ 8-12 = น้ำหนัก ×1000 → ทศนิยม 3 ตำแหน่ง (`slice(7,12)/1000`)

```js
// ตัวอย่าง: 1000001239090
// → prefix:1, code:000001, weight:23.909 KG
window.parseBarcode('1000001239090')
// → { code:'000001', weight:23.909, prod:{ name:'ปลาแซลมอนนอร์เวย์', ... } }
```

---

## Themes (Tweaks Panel)

เปิด tweaks panel ผ่าน host UI แล้วเลือก:
- `warm` (default) — พื้นหลัง `#f0efe9`
- `cool` — พื้นหลัง `#edf1f7`
- `dark` — พื้นหลัง `#13111e`

KPI styles: `gradient` | `minimal` | `glass`
Density: `compact` | `regular` | `relaxed`

---

## Git Workflow

**หลังทำ task เสร็จทุกครั้งให้ commit และ push ทันที** — ไม่ต้องรอให้ผู้ใช้สั่ง

```bash
git add <ไฟล์ที่แก้>
git commit -m "feat/fix: สรุปสิ่งที่ทำ"
git push origin dev
```

- **Branch หลักที่ใช้งาน: `dev`** — commit และ push ทุกงานขึ้น `dev` เสมอ
- ใช้ prefix `feat:` สำหรับ feature ใหม่, `fix:` สำหรับแก้ bug, `style:` สำหรับแก้ UI/สี
- Commit message เป็นภาษาไทยหรืออังกฤษก็ได้ ขอให้สื่อความหมาย
- Add เฉพาะไฟล์ที่แก้ในงานนั้น — ห้าม `git add .` หรือ `git add -A`

---

## Common Patterns

### เพิ่ม Nav Item ใหม่
แก้ `Shell.jsx` → array `NAV` และ `PAGE_META`

### Toast notifications
```jsx
toast('ok', 'บันทึกเรียบร้อย')
toast('err', 'เกิดข้อผิดพลาด')
toast('info', 'กำลังดำเนินการ')
```
`toast` ส่งมาจาก `App` ผ่าน props

### Icon
```jsx
<Icon name="check" size={16} />
```
รายชื่อ icon: `dashboard`, `arrow-right`, `arrow-left`, `file-text`, `bar-chart`,
`warehouse`, `package`, `users`, `user`, `settings`, `check`, `x-circle`,
`search`, `download`, `printer`, `coin`, `chevron-right`, `chevron-down`
