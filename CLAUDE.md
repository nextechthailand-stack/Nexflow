# CLAUDE.md — StockPro UI Kit · NEXflow

คำแนะนำสำหรับ Claude Code เมื่อทำงานกับ project นี้

---

## โครงสร้างโปรเจกต์

```
NEXflow/
├── CLAUDE.md                    ← คุณอยู่ที่นี่
├── context.md                   ← ภาพรวมระบบและ business logic
├── consolog.md                  ← บันทึกการเปลี่ยนแปลงและ session log
├── index.html                   ← redirect → ui_kits/stockpro/index.html
├── colors_and_type.css          ← Design token (root)
├── serve.pl                     ← Perl static HTTP server (port 3000)
├── assets/
│   ├── logo-mark.svg
│   └── logo-lockup.svg
└── ui_kits/stockpro/
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
# → http://localhost:3000/ui_kits/stockpro/index.html
```

หรือผ่าน `.claude/launch.json` (preview panel):
```json
{ "name": "StockPro UI Kit", "runtimeExecutable": "C:\\Program Files\\Git\\usr\\bin\\perl.exe",
  "runtimeArgs": ["C:\\Users\\EMC\\Desktop\\NEXflow\\serve.pl"], "port": 3000 }
```

**Demo login:** `admin` / `1234`

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

13 หลัก: `[2 prefix][5 product code][5 weight×1000][1 check]`

```js
// ตัวอย่าง: 1200001239094
// → prefix:02, code:00001, weight:23.909 KG
window.parseBarcode('1200001239094')
// → { code:'00001', weight:23.909, prod:{ name:'ปลาแซลมอนนอร์เวย์', ... } }
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
