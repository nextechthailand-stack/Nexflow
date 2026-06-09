# consolog.md — Session & Change Log

บันทึกการเปลี่ยนแปลงทั้งหมดของ project ตามลำดับเวลา

---

## Session 001 — 2026-06-04

### ภาพรวม
Bootstrap StockPro UI Kit จาก design system `qjMFi68jw8a3zbmeeTo33w`
ดึง gzip archive มาจาก Anthropic Design API แล้วสร้าง project structure ที่ `NEXflow/`

### งานที่ทำ

#### 1. Project Setup
- ดึง design file จาก `https://api.anthropic.com/v1/design/h/qjMFi68jw8a3zbmeeTo33w`
- Extract gzip → `design_extract/stockpro-design-system/`
- สร้าง directory structure: `ui_kits/stockpro/`, `assets/`
- Copy ทุกไฟล์จาก design extract ไปยัง project root

#### 2. index.html Implementation
สร้าง `ui_kits/stockpro/index.html` — entry point หลัก:
- Load React 18.3.1 + ReactDOM + Babel Standalone 7.29.0 (CDN)
- Load `data.js` (non-Babel), จากนั้น Babel scripts ตามลำดับ
- TWEAK_DEFAULTS: `{ theme: "warm", kpiStyle: "gradient", density: "relaxed" }`
- Theme variants: warm / cool / dark (CSS var overrides)
- Density CSS injection: compact / regular / relaxed
- Full App component: routing, toast system, invoice modal
- TweaksPanel wired up

#### 3. Dev Server
สร้าง `serve.pl` — Perl static file server port 3000
สร้าง `.claude/launch.json` สำหรับ Preview panel

#### 4. Redirect
สร้าง root `index.html` → redirect ไป `/ui_kits/stockpro/index.html`

### Files Created
```
NEXflow/
├── index.html                   (redirect)
├── colors_and_type.css          (copied)
├── serve.pl                     (new — Perl HTTP server)
├── .claude/launch.json          (new — preview config)
├── assets/logo-lockup.svg       (copied)
├── assets/logo-mark.svg         (copied)
└── ui_kits/stockpro/
    ├── index.html               (new — implemented)
    ├── kit.css                  (copied)
    ├── data.js                  (copied)
    ├── primitives.jsx           (copied)
    ├── tweaks-panel.jsx         (copied)
    ├── Login.jsx                (copied)
    ├── Shell.jsx                (copied)
    ├── Dashboard.jsx            (copied)
    ├── StockIn.jsx              (copied)
    ├── StockOut.jsx             (copied)
    ├── Invoice.jsx              (copied)
    ├── Reports.jsx              (copied)
    └── Extras.jsx               (copied)
```

### Verified
- Login screen ✓
- Dashboard (KPI cards, revenue chart, donut, top sellers, stock health) ✓
- Dark sidebar with active states ✓

---

## Session 002 — 2026-06-04

### ภาพรวม
แก้ไขระบบหมายเลขใบกำกับภาษีและเพิ่มรายงานสรุปยอดประจำวัน

### สาเหตุที่แก้
- หมายเลข TIV (อย่างย่อ) และ INV (เต็มรูปแบบ) ใช้ counter เดียวกัน → ผิดกฎภาษี
- รายงานภาษีซื้อ-ขายไม่มี section สรุปยอดประจำวัน
- ใบกำกับเต็มรูปไม่ได้อ้างอิงหมายเลขใบกำกับอย่างย่อ

### งานที่ทำ

#### data.js — Invoice Numbering Refactor
**ก่อน:** invoices ทุกประเภทใช้ prefix `INV-` เหมือนกัน
**หลัง:** แยก prefix ตามประเภท + separate counters

| ประเภท | Prefix | Counter |
|--------|--------|---------|
| ใบกำกับอย่างย่อ (Thermal) | `TIV-YYYYMM-XXXX` | `invCounterThermal` |
| ใบกำกับเต็มรูปแบบ (A4) | `INV-YYYYMM-XXXX` | `invCounterA4` |
| เอกสารตัดสต็อก | `ISS-XXXX` | `invCounter` |

เพิ่ม field `thermalNo` ใน invoice records (A4 ใช้อ้างอิง TIV)
อัปเดต mock data ทั้งหมดให้ consistent:
- TIV-202504-0001 ถึง TIV-202505-0002 (ไม่มีเลขกระโดด)
- INV-202504-0001 ถึง INV-202505-0001 (wholesale เท่านั้น)
เพิ่ม `thermalInv` field ใน `reportRows`
อัปเดต `recentIssues` ให้ใช้เลขใหม่

**SP_STATE counters เริ่มต้น:**
```js
invCounterThermal: 3   // TIV ต่อไป: TIV-YYYYMM-0003
invCounterA4:      2   // INV ต่อไป: INV-YYYYMM-0002
invCounter:        3   // ISS ต่อไป: ISS-0003
grnCounter:        3
```

#### StockOut.jsx — doSave() Refactor
**ก่อน:** generate `INV-` หรือ `ISS-` แล้วแต่ `typeInfo.hasInv`
**หลัง:** 3-step logic
```
1. Commercial sale → TIV (invCounterThermal++)
2. Wholesale → เพิ่ม INV ที่อ้างอิง TIV (invCounterA4++)
3. Non-commercial → ISS (invCounter++)
```
Invoice record เก็บ `{ no, thermalNo, type }`
Toast message แสดง: `"บันทึก INV-... (TIV: TIV-...) เรียบร้อย"`

#### StockOut.jsx — ThermalReceipt UI
เพิ่มแสดง 2 บรรทัดสำหรับ wholesale:
- เลขที่ (TIV): สีฟ้า `#7dd3fc`
- เลขที่ (INV): สี accent `var(--ac)`

#### Extras.jsx — InvoiceList
เพิ่ม **แท็บ "สรุปประจำวัน"** (tab index 2 ในชุด):
- KPI chips: ใบกำกับทั้งหมด / TIV count / INV count
- ตาราง: วันที่ | TIV range | INV range | จำนวนบิล | KG | ยอดรวม
- Footer: แสดงตัวเลข counter ถัดไปของ TIV และ INV

เพิ่มคอลัมน์ "อ้างอิง TIV" ใน list tab
ปรับ void search ให้รับทั้ง `iv.no` และ `iv.thermalNo`
Void preview แสดง TIV reference ด้วย

#### Reports.jsx — ภาษีซื้อ-ขาย Tab
เพิ่ม Card **"สรุปยอดประจำวัน"** ก่อน detailed tables:
- คอลัมน์: วันที่ | TIV range | INV range | จำนวนบิล | น้ำหนัก | ยอดรวม
- Footer: counter ถัดไปของ TIV + INV

### Files Modified
```
data.js          — invoice model + mock data + SP_STATE counters
StockOut.jsx     — doSave() + ThermalReceipt display
Extras.jsx       — InvoiceList daily summary tab + list columns + void search
Reports.jsx      — ภาษีซื้อ-ขาย daily summary card
```

### Verified
- สรุปประจำวัน tab ใน InvoiceList ✓ (แสดง TIV-202505-0002 / INV-202505-0001)
- สรุปยอดประจำวัน card ใน Reports ✓ (แสดงทุกวัน 10/05–15/05)
- Counter display: TIV ต่อไป: …-0003 / INV ต่อไป: …-0002 ✓

---

## Session 003 — 2026-06-04

### ภาพรวม
สร้าง documentation files สำหรับ Cowork / Claude Code

### Files Created
```
CLAUDE.md      — คำแนะนำสำหรับ Claude Code (architecture, commands, patterns)
context.md     — Business context + data model + flows
consolog.md    — Session & change log (ไฟล์นี้)
```

---

## Session 004 — 2026-06-05

### ภาพรวม
Tax Invoice System: CN/DN/Correction flow + Full Technical Spec

### งานที่ทำ

#### 1. Invoice Columns Restructure (TIV-centric)
- เปลี่ยน list tab เป็น TIV-centric (1 row = 1 sale)
- Columns: TIV / INV / วันที่ / ลูกค้า / ส่วนลด / ยอดรวม / ยอดชำระ / สถานะ (ต้นฉบับ/สำเนา) / จัดการ
- สถานะ = ต้นฉบับ ถ้า printCount=0, สำเนา ถ้า >0

#### 2. Actions ต่อ Row
- TIV ไม่มี INV: 🖨ใบเสร็จ + [+ INV] + [ยกเลิกบิล]
- มี INV: 🖨ใบเสร็จ + 🖨ใบกำกับ + [ยกเลิก INV]

#### 3. AmendINVModal — ยกเลิก/แก้ไข INV
- ถ้ายอดลดลง → CN (ใบลดหนี้) — `CN-YYYYMM-XXXX`
- ถ้ายอดเพิ่มขึ้น → DN (ใบเพิ่มหนี้) — `DN-YYYYMM-XXXX`
- ถ้าแก้ข้อมูลอย่างเดียว → INV ใหม่แทน
- Thai law: doc_date = วันที่ INV เดิมเสมอ
- หมายเหตุ: "ออกใบกำกับฉบับใหม่แทนฉบับเดิมเลขที่ INV-xxx วันที่..."

#### 4. Technical Specification Document
สร้าง `tax-invoice-spec.md` ครบ 9 หัวข้อ:
1. Database Schema (invoices, invoice_items, audit_log)
2. ER Diagram (TIV→INV→CN/DN self-referencing)
3. Business Flow Diagrams (Case 1/2.1/2.2/3)
4. Sequence Diagrams (ออก INV, ออก CN)
5. API Specification (REST endpoints + payloads)
6. UI/UX Screen Designs (ASCII wireframes)
7. Validation Rules (V-001 ถึง V-403)
8. Test Cases (TC-001 ถึง TC-010)
9. Role Permission Matrix (Cashier/Supervisor/Manager/Admin)

#### 5. data.js Updates
- เพิ่ม `invCounterCN`, `invCounterDN` ใน SP_STATE
- เพิ่ม `docPrefixes.cn = 'CN'`, `.dn = 'DN'`
- Settings: เพิ่ม CN/DN ในหน้าตั้งค่า prefix
- Mock invoices: TIV+INV linked, demo CN flow

### Files Modified/Created
```
data.js                    — CN/DN counters + prefixes
Extras.jsx                 — InvoiceList restructure + AmendINVModal + IssueINVModal
tax-invoice-spec.md        — Technical Specification (ใหม่)
consolog.md                — บันทึก session นี้
```

### Thai Law Compliance
- ม.86/4: ออก TIV ทุก sale อัตโนมัติ ✓
- ม.86/9: CN ออกเมื่อลดราคา/คืนสินค้า ✓
- ม.86/10: DN ออกเมื่อเพิ่มราคา ✓
- ม.87/2: doc_date CN/DN = วันที่ INV เดิม ✓
- ม.19: Soft-delete เท่านั้น (ห้ามลบ) ✓

---

## Session 006 — 2026-06-09

### ภาพรวม
กู้คืนไฟล์ Extras.jsx ที่ถูกตัดทอนบน disk จาก session ก่อน + แก้ไข doVoid ให้รองรับ INV + ลบ duplicate function declarations

### งานที่ทำ

#### 1. กู้คืน Extras.jsx (disk truncation)
- ไฟล์บน disk ถูกตัดที่ `window.IssueINVModal = IssueINVModal;` (3271 lines)
- ใช้ Python ดึง original content จาก JSONL transcript session ก่อน
- ต่อ lines 3272–4208 กลับเข้าไป (AmendINVModal + TIVDocModal + CnDnDocument + AdjDocument + Object.assign)
- ผลลัพธ์: ไฟล์ครบ 4208 lines พร้อม Object.assign export ครบถ้วน

#### 2. ลบ duplicate function declarations
- Original file มี AmendINVModal (line 3695, CN/DN version) ซ้ำกับที่เพิ่มใน session ก่อน (line 3273)
- Original file มี IssueINVModal (line 3999, mock-only) ซ้ำกับที่เพิ่มใน session ก่อน (line 3102)
- ลบ originals ออก → เหลือเฉพาะ DB-saving versions ที่ถูกต้อง
- ผลลัพธ์: ไฟล์ 3811 lines ไม่มี duplicate

#### 3. แก้ doVoid ใน InvoiceList รองรับ INV
- เพิ่ม `isINV = iv.type === 'A4'` check
- INV: `restore_stock: false` (TIV ตัดสต็อกไปแล้ว), ไม่ reloadProducts
- INV: เคลียร์ `full_inv_no` บน TIV ที่อ้างอิง (ทั้ง DB + in-state)
- Toast message แยกตามประเภท

### Files Modified
- `ui_kits/stockpro/Extras.jsx` — กู้คืน + ลบ duplicate + แก้ doVoid
- `database/api_server.js` — (ผ่าน node --check, 1057 lines, ไม่มีการแก้เพิ่ม)

### Verified
- No duplicate IssueINVModal / AmendINVModal
- Object.assign export ครบ
- api_server.js ผ่าน node --check
- doVoid ใช้ restore_stock แยกตาม type

### Known Issues / TODO
- ยังไม่ได้ทดสอบจริงกับ DB — ควรทดสอบ flow ทั้งหมด

---

## Template สำหรับ Session ใหม่

```markdown
## Session XXX — YYYY-MM-DD

### ภาพรวม
[อธิบายสั้นๆ ว่าทำอะไร]

### งานที่ทำ
[รายละเอียดแต่ละ task]

### Files Modified / Created
[รายชื่อไฟล์]

### Verified
[สิ่งที่ test แล้วผ่าน]

### Known Issues / TODO
[ถ้ามี]
```
