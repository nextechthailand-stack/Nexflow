# context.md — StockPro UI Kit

ภาพรวมระบบ business context และ data model สำหรับ Claude / Cowork

---

## ระบบคืออะไร

**StockPro** คือ Thai seafood inventory management web app สร้างขึ้นเป็น high-fidelity
interactive UI kit จากซอร์ส `nextechthailand-stack/Stockpro` ใช้สำหรับ prototyping และ
design reference — ไม่ใช่ production backend

ลูกค้าตัวอย่าง: **บริษัท ซีฟู้ด โปรวิชั่น จำกัด**
ภาษาหลัก: ไทย (Thai Buddhist calendar พ.ศ.)

---

## Tech Stack

| Layer | Tech |
|-------|------|
| UI Framework | React 18.3 (UMD) + Babel Standalone 7.29 |
| Styling | Vanilla CSS + CSS Custom Properties (design tokens) |
| Fonts | Sarabun (Google Fonts) — Thai-optimized |
| Data | Static mock (`data.js`) — ไม่มี backend / API |
| Server (dev) | Perl `IO::Socket::INET` static file server |
| Build | ไม่มี build step — ใช้ `<script type="text/babel">` ตรงๆ |

---

## Business Flows

### 1. รับสินค้าเข้า (Stock In)
1. สแกนบาร์โค้ด 13 หลัก → ระบบอ่าน product code + น้ำหนักอัตโนมัติ
2. กรอก PO reference, วันที่, ผู้รับ
3. บันทึก → สร้าง **GRN document** (`GRN-YYYYMM-XXXX`) + อัปเดตสต็อก

### 2. ตัดสต็อก / ขาย (Stock Out)
1. สแกนบาร์โค้ดสินค้า
2. เลือกประเภท: **Wholesale** | **Online** | **Sample** | **Expired** | **Other**
3. เลือกลูกค้า (ถ้า Wholesale/Online) + วิธีชำระ + ส่วนลด
4. บันทึก → สร้างใบกำกับภาษี (ดูระบบเลขด้านล่าง)

### 3. ใบกำกับภาษี (Tax Invoice System)
```
ทุก commercial sale:
  └── TIV-YYYYMM-XXXX  (ใบกำกับอย่างย่อ — Thermal receipt)

Wholesale เพิ่มเติม:
  └── INV-YYYYMM-XXXX  (ใบกำกับเต็มรูปแบบ A4 — อ้างอิง TIV)

Non-commercial (Sample/Expired/Other):
  └── ISS-XXXX          (เอกสารตัดสต็อก — ไม่ใช่ใบกำกับ)
```

**กฎสำคัญ:** ห้ามเลขกระโดด, แต่ละ sequence นับแยกกัน

### 4. รายงาน (Reports)
- **รายการสินค้า** — ยอดขายแต่ละ product
- **ภาษีซื้อ-ขาย** — สรุปยอดประจำวัน (TIV range / INV range) + ภาษีแยกประเภท
- **Daily Sale** — ยอดรายวัน แยก channel
- **Payment** — สัดส่วน เงินสด / โอน / เครดิต + pie chart
- **% Discount** — รายการที่มีส่วนลด + อัตราเฉลี่ย
- **รายลูกค้า** — ยอดสะสมต่อลูกค้า + ประวัติการซื้อ

---

## Data Model (Mock)

### Products
```js
{ id, code, name, cat, sell, cost, stock, min, tax }
// tax: 'vat7' | 'nonvat'
// stock: KG (float), min: reorder point KG
```

รายการสินค้า: ปลาแซลมอนนอร์เวย์, กุ้งขาวแวนนาไม, ปลาทูน่าครีบเหลือง,
หอยเชลล์แช่แข็ง, ปลาดอลลี่ฟิลเล่, กุ้งมังกร

### Invoices
```js
{
  id, no,           // primary number (INV-... หรือ TIV-...)
  thermalNo,        // TIV number เสมอ (A4 ใช้อ้างอิง)
  type,             // 'A4' | 'Thermal'
  channel,          // 'wholesale' | 'online' | 'sample' | 'expired' | 'other'
  custId, custName, custTax,
  date, dateDisplay,// ISO + Thai Buddhist display
  items,            // [{ code, name, weight, price, tax }]
  grossSale, discount, netSale, vatBase, vat7, total,
  pay,              // 'cash' | 'transfer' | 'credit'
  status,           // 'paid' | 'voided'
  voided, voidedAt, voidedBy, voidReason, stockRestored
}
```

### GRN (Goods Received Note)
```js
{
  id,               // GRN-YYYYMM-XXXX
  date, dateDisplay,
  poNo, receiver, note,
  totalPacks, totalWeight, totalValue,
  items             // [{ code, name, packNo, weight, cost, value, tax }]
}
```

### ReportRows
```js
{
  dateISO, date, inv,       // primary invoice no
  thermalInv,               // TIV number (เพิ่มใหม่)
  code, prod, channel, custId,
  w, grossSale, discount, netSale, vat, total, pay
}
```

---

## SP_STATE Counters

```js
SP_STATE.invCounterThermal  // TIV sequence: เริ่มต้น 3 (mock มี 1-2)
SP_STATE.invCounterA4       // INV sequence: เริ่มต้น 2 (mock มี 1)
SP_STATE.invCounter         // ISS sequence
SP_STATE.grnCounter         // GRN sequence: เริ่มต้น 3
```

---

## VAT Calculation

ราคาขายทุกรายการเป็น **VAT-inclusive** (รวม VAT ในราคาแล้ว):
```js
const vat    = net * 7 / 107     // VAT ที่แฝงในราคา
const preVat = net - vat         // ราคาก่อน VAT
```

---

## Users & Roles

| User | Username | Role |
|------|----------|------|
| Admin Kanya | admin | Administrator |
| สมชาย ใจดี | somchai | Staff |
| วิภา แสงทอง | wipa | Staff (inactive) |

Demo credentials: **admin / 1234**

---

## Pages / Routes

| route | component | description |
|-------|-----------|-------------|
| `dashboard` | Dashboard | KPI + charts + stock health |
| `stock-in` | StockIn | รับสินค้าเข้า + GRN |
| `stock-out` | StockOut | ตัดสต็อก + ใบกำกับ |
| `invoices` | InvoiceList | รายการ + สรุปวัน + void |
| `reports` | Reports | 6-tab report suite |
| `stock-manage` | StockManage | ยอดคงเหลือ + movement + GRN log |
| `products` | Products | ตาราง products |
| `customers` | Customers | ตาราง customers |
| `users` | Users | จัดการ users |
| `settings` | Settings | ตั้งค่าบริษัท |

---

## Known Limitations / Intentional Stubs

- ไม่มี backend — ข้อมูลอยู่ใน memory เท่านั้น (reload = reset)
- Invoice print เป็น toast แจ้ง (ไม่มี window.print)
- Reports export CSV เป็น placeholder
- `stock-manage` adjustment log ไม่ persist ใน ledger จริง
