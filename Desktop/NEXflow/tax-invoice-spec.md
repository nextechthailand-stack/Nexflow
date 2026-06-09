# Thai POS — Tax Invoice Management System
## Technical Specification v1.0

อ้างอิง: ประมวลรัษฎากร มาตรา 86/4, 86/9, 86/10 | กรมสรรพากร

---

## 1. Database Schema

### 1.1 ตาราง `invoices` (ใบกำกับภาษี / TIV / CN / DN)

```sql
CREATE TABLE invoices (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  doc_no          VARCHAR(30) UNIQUE NOT NULL,          -- TIV-202506-0001 / INV-xxx / CN-xxx / DN-xxx
  doc_type        ENUM('TIV','INV','CN','DN') NOT NULL, -- ประเภทเอกสาร
  status          ENUM('Draft','Issued','Delivered','Cancelled','Replaced') NOT NULL DEFAULT 'Draft',

  -- Reference chain
  ref_tiv_no      VARCHAR(30),   -- TIV ที่อ้างอิง (INV/CN/DN ใช้)
  ref_inv_no      VARCHAR(30),   -- INV ที่อ้างอิง (CN/DN ใช้)
  ref_inv_date    DATE,          -- วันที่ INV เดิม (Thai law requirement)
  replaced_by     VARCHAR(30),   -- เลขที่เอกสารที่มาแทน (Replaced status)
  replaces        VARCHAR(30),   -- เลขที่เอกสารที่ถูกแทน

  -- Customer
  customer_id     BIGINT,
  customer_name   VARCHAR(200) NOT NULL,
  customer_tax_id VARCHAR(20),
  customer_branch VARCHAR(10),    -- สาขา 00000 = สำนักงานใหญ่
  customer_addr   TEXT,

  -- Company (snapshot ณ วันที่ออก)
  company_name    VARCHAR(200) NOT NULL,
  company_tax_id  VARCHAR(20)  NOT NULL,
  company_addr    TEXT,

  -- Amounts
  subtotal        DECIMAL(15,2) NOT NULL DEFAULT 0,
  discount        DECIMAL(15,2) NOT NULL DEFAULT 0,
  pre_vat_amt     DECIMAL(15,2) NOT NULL DEFAULT 0,
  vat_rate        DECIMAL(5,2)  NOT NULL DEFAULT 7.00,
  vat_amt         DECIMAL(15,2) NOT NULL DEFAULT 0,
  total           DECIMAL(15,2) NOT NULL DEFAULT 0,

  -- Payment
  payment_method  ENUM('cash','transfer','credit','other'),

  -- Dates (doc_date = original date for CN/DN per Thai law)
  doc_date        DATE NOT NULL,
  issued_at       DATETIME,
  delivered_at    DATETIME,
  cancelled_at    DATETIME,

  -- Cancel/Replace fields
  cancel_reason   TEXT,
  cancel_by       BIGINT REFERENCES users(id),
  adjustment_reason TEXT,        -- สำหรับ CN/DN

  -- Meta
  note            TEXT,
  print_count     INT NOT NULL DEFAULT 0,
  created_by      BIGINT REFERENCES users(id),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME ON UPDATE CURRENT_TIMESTAMP,

  -- Soft delete only (Thai law: ห้ามลบ)
  deleted         TINYINT(1) NOT NULL DEFAULT 0,

  INDEX idx_doc_no (doc_no),
  INDEX idx_ref_inv_no (ref_inv_no),
  INDEX idx_ref_tiv_no (ref_tiv_no),
  INDEX idx_status (status),
  INDEX idx_customer_id (customer_id),
  INDEX idx_doc_date (doc_date)
);
```

### 1.2 ตาราง `invoice_items` (รายการสินค้า)

```sql
CREATE TABLE invoice_items (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  invoice_id  BIGINT NOT NULL REFERENCES invoices(id),
  line_no     INT NOT NULL,           -- ลำดับบรรทัด
  product_id  BIGINT,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  unit        VARCHAR(20),
  quantity    DECIMAL(12,4) NOT NULL, -- น้ำหนัก KG หรือจำนวน
  unit_price  DECIMAL(15,4) NOT NULL, -- ราคาต่อหน่วย (incl.VAT)
  discount    DECIMAL(15,2) NOT NULL DEFAULT 0,
  line_total  DECIMAL(15,2) NOT NULL, -- (qty × price) − discount
  tax_type    ENUM('vat7','nonvat','exempt') NOT NULL DEFAULT 'vat7',
  vat_amt     DECIMAL(15,2) NOT NULL DEFAULT 0,
  pre_vat_amt DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoice_id (invoice_id)
);
```

### 1.3 ตาราง `audit_log` (ประวัติการดำเนินการ — ห้ามแก้ไข)

```sql
CREATE TABLE audit_log (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  action_type     ENUM(
                    'CREATE_INVOICE',
                    'ISSUE_INVOICE',
                    'DELIVER_INVOICE',
                    'CANCEL_INVOICE',
                    'REISSUE_INVOICE',
                    'CREATE_CREDIT_NOTE',
                    'CREATE_DEBIT_NOTE',
                    'PRINT_INVOICE'
                  ) NOT NULL,
  doc_no          VARCHAR(30) NOT NULL,
  ref_doc_no      VARCHAR(30),   -- เอกสารที่เกี่ยวข้อง
  user_id         BIGINT NOT NULL,
  username        VARCHAR(100) NOT NULL,
  user_role       VARCHAR(30) NOT NULL,
  reason          TEXT,
  snapshot_before JSON,          -- ข้อมูลก่อนเปลี่ยน
  snapshot_after  JSON,          -- ข้อมูลหลังเปลี่ยน
  ip_address      VARCHAR(45),
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  -- NO UPDATE / DELETE permissions on this table
  INDEX idx_doc_no (doc_no),
  INDEX idx_user_id (user_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at)
);
```

### 1.4 ตาราง `users`, `customers`, `products` (ย่อ)

```sql
CREATE TABLE users (
  id       BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  name     VARCHAR(200) NOT NULL,
  role     ENUM('cashier','supervisor','manager','admin') NOT NULL,
  active   TINYINT(1) DEFAULT 1
);

CREATE TABLE customers (
  id         BIGINT PRIMARY KEY AUTO_INCREMENT,
  code       VARCHAR(20) UNIQUE,
  name       VARCHAR(200) NOT NULL,
  tax_id     VARCHAR(20),
  branch_no  VARCHAR(10),
  address    TEXT,
  type       ENUM('retail','wholesale','online','exempt')
);

CREATE TABLE products (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  code         VARCHAR(20) UNIQUE NOT NULL,
  name         VARCHAR(200) NOT NULL,
  category     VARCHAR(50),
  sell_price   DECIMAL(12,4),
  cost_price   DECIMAL(12,4),
  stock_qty    DECIMAL(12,4),
  min_qty      DECIMAL(12,4),
  tax_type     ENUM('vat7','nonvat','exempt') DEFAULT 'vat7'
);
```

---

## 2. ER Diagram

```
┌─────────────┐       ┌──────────────────────────────────────────────┐
│   USERS     │       │                  INVOICES                     │
│─────────────│       │──────────────────────────────────────────────│
│ id (PK)     │──┐    │ id (PK)                                       │
│ username    │  │    │ doc_no (UNIQUE)         ← TIV/INV/CN/DN       │
│ name        │  │    │ doc_type               ENUM(TIV,INV,CN,DN)   │
│ role        │  │    │ status                 Draft→Issued→Delivered │
└─────────────┘  │    │                        →Cancelled/Replaced    │
                 │    │ ref_tiv_no ──────────────────────────────┐    │
┌─────────────┐  │    │ ref_inv_no ──────────────────────────┐  │    │
│  CUSTOMERS  │  │    │ ref_inv_date                          │  │    │
│─────────────│  │    │ replaced_by ◄─ self-ref ──────────────┼──┘    │
│ id (PK)     │──┼──► │ replaces   ◄─ self-ref               │       │
│ name        │  │    │ customer_id ─────────────────────────┼──────►│
│ tax_id      │  │    │ cancel_by (FK users)   ◄─────────────┘       │
│ address     │  │    │ created_by (FK users)                        │
└─────────────┘  │    │ doc_date    (= orig date for CN/DN)           │
                 │    │ subtotal / vat_amt / total                    │
┌─────────────┐  │    └──────────────────────────────────────────────┘
│  PRODUCTS   │  │                    │  1
│─────────────│  │                    │
│ id (PK)     │  │                    │ N
│ code        │  │    ┌──────────────────────────┐
│ name        │──┼──► │     INVOICE_ITEMS        │
│ sell_price  │  │    │──────────────────────────│
│ stock_qty   │  │    │ id (PK)                  │
└─────────────┘  │    │ invoice_id (FK)           │
                 │    │ product_id (FK)           │
                 │    │ quantity / unit_price      │
                 │    │ line_total / vat_amt       │
                 │    └──────────────────────────┘
                 │
                 │    ┌──────────────────────────┐
                 └──► │      AUDIT_LOG           │
                      │──────────────────────────│
                      │ id (PK)                  │
                      │ action_type              │
                      │ doc_no / ref_doc_no       │
                      │ user_id / username        │
                      │ snapshot_before / after   │
                      │ created_at (immutable)    │
                      └──────────────────────────┘
```

### Document Relationship (Self-Referencing)

```
TIV-202506-0001 ──────────────────────────────────────── (ใบเสร็จ)
     │
     └──► INV-202506-0001  (status: Replaced)
               │  replaces = INV-202506-0001
               │  replaced_by = INV-202506-0002
               │
               ├──► INV-202506-0002  (correction, status: Issued)
               │
               ├──► CN-202506-0001   (ใบลดหนี้, ref_inv_no = INV-0001)
               │
               └──► DN-202506-0001   (ใบเพิ่มหนี้, ref_inv_no = INV-0001)
```

---

## 3. Business Flow Diagram

### 3.1 Flow หลัก — การออกใบกำกับภาษี

```
[ขาย] ──► TIV ออกอัตโนมัติ ──► status: Issued
               │
               ├── ลูกค้าไม่ต้องการ INV ──► จบ (TIV เท่านั้น)
               │
               └── ลูกค้าต้องการ INV
                      │
                      ▼
               [Supervisor/Manager] กด "ออก INV"
                      │
                      ▼
               INV-XXXXXX-XXXX ──► status: Issued
                      │
                      ├── พิมพ์ ──► status: Delivered
                      │
                      └── ต้องแก้ไข ──► ดู Case 1/2/3
```

### 3.2 กรณีที่ 1 — แก้ไขข้อมูลผู้ซื้อ

```
INV (Issued / Delivered)
        │
        ▼
[Manager] ระบุเหตุผล: "ข้อมูลลูกค้าผิด"
        │
        ▼
ระบบ CANCEL INV เดิม ──► status: Cancelled
        │
        ▼
ออก INV ใหม่ (doc_date = วันที่ INV เดิม)
  - replaces = INV-เดิม
  - คัดลอกรายการสินค้าทั้งหมด
  - แก้ไขข้อมูลลูกค้าได้
        │
        ▼
บันทึก Audit Log: REISSUE_INVOICE
```

### 3.3 กรณีที่ 2.1 — สินค้าผิด (ยังไม่ส่งมอบ)

```
INV (status: Issued — ยังไม่ Delivered)
        │
        ▼
[Supervisor] ยกเลิก ──► status: Cancelled
        │
        ▼
ออก INV ใหม่ แก้ไขรายการสินค้าได้
        │
        ▼
Audit: CANCEL_INVOICE + REISSUE_INVOICE
```

### 3.4 กรณีที่ 2.2 / 3 — สินค้าผิด หรือ คืนสินค้า (ส่งมอบแล้ว)

```
INV (status: Delivered)
        │
        ├─── ยอดลดลง (สินค้าผิด/คืนสินค้า)
        │         │
        │         ▼
        │    [Manager] ออกใบลดหนี้ (CN)
        │         │ ref_inv_no = INV-เดิม
        │         │ doc_date = วันที่ INV เดิม ← กฎหมาย!
        │         │ คำนวณ VAT ที่ลดอัตโนมัติ
        │         │ ปรับสต็อกคืน (ถ้าคืนสินค้า)
        │         ▼
        │    CN-XXXXXX  ──► Audit: CREATE_CREDIT_NOTE
        │
        └─── ยอดเพิ่มขึ้น (เพิ่มสินค้า/ขึ้นราคา)
                  │
                  ▼
             [Manager] ออกใบเพิ่มหนี้ (DN)
                  │ ref_inv_no = INV-เดิม
                  │ doc_date = วันที่ INV เดิม
                  ▼
             DN-XXXXXX  ──► Audit: CREATE_DEBIT_NOTE
```

---

## 4. Sequence Diagram

### 4.1 ออก INV จาก TIV

```
User          UI           API           DB         AuditLog
 │             │             │             │             │
 │─ Click "+ INV" ──────────►│             │             │
 │             │─ GET /tiv/:no ──────────►│             │
 │             │◄─ TIV data ─────────────│             │
 │             │ (show confirm modal)     │             │
 │─ Confirm ───►│             │             │             │
 │             │─ POST /invoices ─────────►│             │
 │             │             │─ INSERT INV ►│             │
 │             │             │─ UPDATE TIV.fullInvNo ─►│  │
 │             │             │             │─ INSERT log ►│
 │             │◄─ { invNo } ─────────────│             │
 │◄ A4 Modal ──│             │             │             │
```

### 4.2 ออกใบลดหนี้ (Credit Note)

```
Manager       UI           API           DB         Stock       AuditLog
 │             │             │             │             │             │
 │─ Click "ยกเลิก INV" ────►│             │             │             │
 │             │ show AmendINVModal       │             │             │
 │─ ลบรายการสินค้า / ลดจำนวน ──────────►│             │             │
 │─ ระบุเหตุผล ─►│             │             │             │             │
 │─ Confirm ───►│             │             │             │             │
 │             │─ POST /credit-notes ─────►│             │             │
 │             │             │─ Validate status=Delivered►│            │
 │             │             │─ INSERT CN ──►│             │             │
 │             │             │─ UPDATE INV.status=Replaced ──────────►│ │
 │             │             │─ Adjust stock ──────────────►│          │
 │             │             │             │─ INSERT audit ──────────►│
 │             │◄─ { cnNo } ──────────────│             │             │
 │◄ CN A4 ─────│             │             │             │             │
```

---

## 5. API Specification

### Base URL: `/api/v1`

### 5.1 Invoice (ใบกำกับภาษี / TIV)

```
GET    /invoices              รายการใบกำกับภาษี (TIV-centric)
GET    /invoices/:docNo        ดูรายละเอียด
POST   /invoices              สร้าง TIV ใหม่ (ระหว่างขาย)
PATCH  /invoices/:docNo/issue  เปลี่ยนสถานะ → Issued
PATCH  /invoices/:docNo/deliver เปลี่ยนสถานะ → Delivered (+printCount++)
```

#### POST /invoices — Request Body
```json
{
  "saleId": "SALE-001",
  "customerId": 1,
  "items": [
    {
      "productCode": "00001",
      "productName": "ปลาแซลมอน",
      "quantity": 5.500,
      "unitPrice": 380.00,
      "taxType": "vat7"
    }
  ],
  "discount": 500.00,
  "paymentMethod": "transfer"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": 42,
    "docNo": "TIV-202506-0003",
    "docType": "TIV",
    "status": "Issued",
    "subtotal": 2090.00,
    "vatAmt": 136.82,
    "total": 2090.00,
    "docDate": "2026-06-05"
  }
}
```

---

### 5.2 Full Invoice (ใบกำกับภาษีเต็มรูป — INV)

```
POST   /invoices/full         ออก INV จาก TIV (Supervisor+)
GET    /invoices/:invNo/print  ดึง A4 data + increment printCount
```

#### POST /invoices/full — Request Body
```json
{
  "tivNo": "TIV-202506-0003",
  "customerTaxId": "0105566012345",
  "customerBranch": "00000",
  "overrideCustomerAddr": ""
}
```

---

### 5.3 Cancel & Reissue (ยกเลิกและออกใหม่)

```
POST /invoices/:invNo/cancel            ยกเลิก INV (Supervisor+ สำหรับ Issued)
POST /invoices/:invNo/reissue           ออก INV ใหม่แทน (Manager+)
```

#### POST /invoices/:invNo/cancel — Request Body
```json
{
  "reason": "ข้อมูลลูกค้าผิดพลาด",
  "cancelledBy": 5
}
```

#### Business Rule Validation
- ถ้า status = `Issued` → Supervisor สามารถยกเลิกได้
- ถ้า status = `Delivered` → ต้องออก CN/DN แทน (ห้ามยกเลิกตรง)
- ถ้า status = `Cancelled` / `Replaced` → Error 409

---

### 5.4 Credit Note (ใบลดหนี้)

```
POST /credit-notes            ออกใบลดหนี้ (Manager+)
GET  /credit-notes            รายการใบลดหนี้
GET  /credit-notes/:cnNo       รายละเอียด
```

#### POST /credit-notes — Request Body
```json
{
  "refInvNo": "INV-202506-0001",
  "adjustmentReason": "คืนสินค้าบางส่วน",
  "returnItems": [
    {
      "productCode": "00001",
      "returnQty": 1.000,
      "unitPrice": 380.00
    }
  ],
  "restoreStock": true
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "docNo": "CN-202506-0001",
    "docType": "CN",
    "refInvNo": "INV-202506-0001",
    "refInvDate": "2026-06-01",
    "docDate": "2026-06-01",
    "adjustmentAmt": -380.00,
    "vatAdj": -24.86,
    "totalAdj": -380.00,
    "stockRestored": true
  }
}
```

---

### 5.5 Debit Note (ใบเพิ่มหนี้)

```
POST /debit-notes             ออกใบเพิ่มหนี้ (Manager+)
GET  /debit-notes             รายการใบเพิ่มหนี้
```

#### POST /debit-notes — Request Body
```json
{
  "refInvNo": "INV-202506-0001",
  "adjustmentReason": "เพิ่มสินค้าเนื่องจากราคาเปลี่ยนแปลง",
  "addItems": [
    {
      "productCode": "00002",
      "qty": 2.000,
      "unitPrice": 220.00,
      "taxType": "vat7"
    }
  ]
}
```

---

### 5.6 Audit Log

```
GET /audit-log?docNo=INV-001   ประวัติการดำเนินการของเอกสาร
GET /audit-log?userId=5        ประวัติการดำเนินการของผู้ใช้
GET /audit-log?action=CANCEL_INVOICE&from=2026-06-01&to=2026-06-30
```

---

### 5.7 Reports

```
GET /reports/cancelled-invoices?from=&to=    รายงานใบกำกับที่ยกเลิก
GET /reports/reissued-invoices?from=&to=     รายงานใบกำกับที่ออกใหม่แทน
GET /reports/credit-notes?from=&to=          รายงานใบลดหนี้
GET /reports/debit-notes?from=&to=           รายงานใบเพิ่มหนี้
```

---

### 5.8 Error Codes

| Code | HTTP | Message |
|------|------|---------|
| `INV_001` | 404 | Invoice not found |
| `INV_002` | 409 | Invoice already cancelled |
| `INV_003` | 409 | Cannot cancel delivered invoice — use CN/DN |
| `INV_004` | 403 | Insufficient role for this action |
| `INV_005` | 422 | Reference invoice date mismatch |
| `INV_006` | 422 | Cannot delete invoice (soft-delete only) |
| `INV_007` | 409 | CN/DN already issued for this invoice |

---

## 6. UI/UX Screen Design

### 6.1 หน้ารายการใบกำกับภาษี

```
┌──────────────────────────────────────────────────────────────────────┐
│ ใบกำกับภาษี                              [+ ขาย] [CSV] [PDF]         │
├──────────────────────────────────────────────────────────────────────┤
│ 🔍 ค้นหา TIV / INV / ลูกค้า   [วันที่ from]─[to]  [สถานะ ▼]         │
├──────────┬──────────┬──────────┬──────────┬────────┬───┬──────────────┤
│ เลขที่ TIV │เลขที่ INV│  วันที่  │  ลูกค้า  │ยอดรวม │สถ.│   จัดการ    │
├──────────┼──────────┼──────────┼──────────┼────────┼───┼──────────────┤
│TIV-0003  │INV-0001  │05/06/69  │บ. ABC    │฿12,658 │✅ │🖨ใบเสร็จ     │
│          │          │          │          │        │   │🖨ใบกำกับ     │
│          │          │          │          │        │   │[ยกเลิก INV] │
├──────────┼──────────┼──────────┼──────────┼────────┼───┼──────────────┤
│TIV-0002  │  CN-0001 │05/06/69  │ร้านโตเกียว│฿1,760 │🔴 │🖨ใบเสร็จ     │
│          │(ลดหนี้)  │          │          │        │   │🖨ใบลดหนี้   │
├──────────┼──────────┼──────────┼──────────┼────────┼───┼──────────────┤
│TIV-0001  │   —      │04/06/69  │ Lazada   │฿4,066  │🟢 │🖨ใบเสร็จ     │
│          │          │          │          │        │   │[+ ออก INV]  │
│          │          │          │          │        │   │[ยกเลิกบิล] │
└──────────┴──────────┴──────────┴──────────┴────────┴───┴──────────────┘

สถานะ:  🟢 ต้นฉบับ   🟡 สำเนา   🔴 ยกเลิก   🔵 ถูกแทนที่
```

### 6.2 Modal ออก INV

```
┌────────────────────────────────────────────────────────┐
│ ออกใบกำกับภาษีเต็มรูปแบบ (A4)              [✕]         │
├────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐  │
│  │  เลขที่ INV ที่จะออก                             │  │
│  │       INV-202506-0002                            │  │
│  │  อ้างอิง TIV: TIV-202506-0003                   │  │
│  └─────────────────────────────────────────────────┘  │
│                                                        │
│  ข้อมูลจาก TIV                                         │
│  ───────────────────────────────────────────────────   │
│  ลูกค้า:    บ. ซีฟู้ด โปรวิชั่น จำกัด                 │
│  เลขภาษี:  0105566012345                              │
│  วันที่:    05/06/69                                   │
│  รายการ:   2 รายการ                                   │
│  VAT 7%:   ฿828.10                                    │
│  ยอดรวม:   ฿12,658.10                                 │
│                                                        │
│  ℹ️ เมื่อกดยืนยัน ระบบจะสร้างเอกสาร INV-202506-0002  │
│     และเปิดให้พิมพ์ทันที                               │
├────────────────────────────────────────────────────────┤
│              [ยกเลิก]  [ออกใบกำกับ INV-202506-0002]   │
└────────────────────────────────────────────────────────┘
```

### 6.3 Modal ยกเลิก/แก้ไข INV (AmendINVModal)

```
┌──────────────────────────────────────────────────────────────────┐
│ ยกเลิก/แก้ไขใบกำกับภาษี · INV-202506-0001              [✕]      │
├──────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐   │
│ │ 📋 ใบลดหนี้ (Credit Note)                                  │   │
│ │ อ้างอิง INV-202506-0001 วันที่ 05/06/69 · ผลต่าง: -฿380  │   │
│ │ ⚠️ วันที่เอกสารใหม่จะใช้ 05/06/69 (วันเดิม) ตามกฎหมาย   │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ข้อมูลลูกค้า (แก้ไขได้)                                           │
│ ชื่อ: [บ. ซีฟู้ด โปรวิชั่น จำกัด____________]                   │
│ เลขภาษี: [0105566012345_____]                                     │
│ ที่อยู่: [______________________________]                         │
│                                                                    │
│ รายการสินค้า                                                       │
│ ┌───┬────────┬──────────────┬──────────┬─────────┬──────┬────┐   │
│ │ # │  รหัส  │    สินค้า    │น้ำหนัก KG│ราคา/KG │ รวม  │ลบ │   │
│ ├───┼────────┼──────────────┼──────────┼─────────┼──────┼────┤   │
│ │ 1 │ 00001  │ ปลาแซลมอน   │[ 36.500] │[ 380 ] │13,870│[ลบ]│   │
│ │ 2 │ 00001  │ (ถูกลบ)      │strikeout │         │    0 │[คืน│   │
│ └───┴────────┴──────────────┴──────────┴─────────┴──────┴────┘   │
│                                                                    │
│ ยอดเดิม: ฿12,658.10    ยอดใหม่: ฿12,278.10  (ลดลง ฿380.00)      │
│                                                                    │
│ เหตุผล (*):  [คืนสินค้า กุ้งขาวแวนนาไม 1 แพ็ค น้ำหนัก 1 KG__]   │
│                                                                    │
│ หมายเหตุในเอกสาร:                                                  │
│ "ออกใบกำกับภาษีฉบับใหม่แทนฉบับเดิมเลขที่ INV-202506-0001        │
│  วันที่ 05/06/69 เหตุผล: คืนสินค้า..."                           │
├──────────────────────────────────────────────────────────────────┤
│                     [ยกเลิก]  [ออกใบลดหนี้ (CN)]                │
└──────────────────────────────────────────────────────────────────┘
```

### 6.4 หน้า Audit Log

```
┌──────────────────────────────────────────────────────────────────┐
│ Audit Log                               [Export CSV] [Export PDF] │
├──────────────────────────────────────────────────────────────────┤
│ 🔍 ค้นหา  [เอกสาร ▼] [ประเภท ▼] [ผู้ใช้ ▼] [วันที่ from─to]    │
├────────────┬──────────────────┬───────────┬──────────┬───────────┤
│  วันเวลา   │  ประเภทการดำเนิน │  เอกสาร   │  ผู้ดำเนิน │  เหตุผล  │
├────────────┼──────────────────┼───────────┼──────────┼───────────┤
│05/06 14:32 │CREATE_CREDIT_NOTE│CN-0001    │ Manager  │คืนสินค้า │
│            │                  │→INV-0001  │ Kanya    │           │
├────────────┼──────────────────┼───────────┼──────────┼───────────┤
│05/06 10:15 │ISSUE_INVOICE     │INV-0001   │Supervisor│—          │
│            │                  │←TIV-0003  │ Somchai  │           │
├────────────┼──────────────────┼───────────┼──────────┼───────────┤
│05/06 09:42 │CREATE_INVOICE    │TIV-0003   │ Cashier  │—          │
│            │                  │           │ Wipa     │           │
└────────────┴──────────────────┴───────────┴──────────┴───────────┘
```

---

## 7. Validation Rules

### 7.1 การออกใบกำกับภาษี (TIV/INV)

| Rule | Description |
|------|-------------|
| V-001 | `doc_date` ต้องเป็นวันที่ปัจจุบันหรือย้อนหลังไม่เกิน 7 วัน |
| V-002 | ต้องมี `customer_name` และ `customer_tax_id` สำหรับ INV ที่ขายให้นิติบุคคล |
| V-003 | `customer_branch` ต้องเป็น 5 หลัก (00000 = สำนักงานใหญ่) |
| V-004 | `items` ต้องมีอย่างน้อย 1 รายการ |
| V-005 | `total` ต้องมากกว่า 0 |
| V-006 | `vat_amt` = `pre_vat_amt` × `vat_rate/100` (±0.01 tolerance) |
| V-007 | ต้องมีสิทธิ์ `cashier` ขึ้นไปจึงออก TIV ได้ |
| V-008 | ต้องมีสิทธิ์ `supervisor` ขึ้นไปจึงออก INV ได้ |

### 7.2 การยกเลิก

| Rule | Description |
|------|-------------|
| V-101 | สถานะ `Issued` → ยกเลิกได้ (Supervisor+) |
| V-102 | สถานะ `Delivered` → **ห้ามยกเลิก** ต้องออก CN/DN |
| V-103 | สถานะ `Cancelled` / `Replaced` → ไม่สามารถดำเนินการซ้ำ |
| V-104 | ต้องระบุ `cancel_reason` ความยาว ≥ 10 ตัวอักษร |
| V-105 | ต้องมีสิทธิ์ `supervisor` ขึ้นไปจึงยกเลิกได้ |

### 7.3 ใบลดหนี้ (CN)

| Rule | Description |
|------|-------------|
| V-201 | `ref_inv_no` ต้องมีอยู่ในระบบ และสถานะ `Delivered` |
| V-202 | `doc_date` ต้องเท่ากับ `ref_inv_date` (กฎหมายไทย) |
| V-203 | `totalAdj` ต้องเป็นลบเท่านั้น |
| V-204 | จำนวนสินค้าที่ลดต้อง ≤ จำนวนในใบกำกับเดิม |
| V-205 | ต้องมีสิทธิ์ `manager` ขึ้นไปจึงออก CN ได้ |
| V-206 | 1 INV สามารถมี CN ได้หลายฉบับ แต่รวมกันต้องไม่เกินยอดเดิม |
| V-207 | ต้องระบุ `adjustment_reason` ความยาว ≥ 10 ตัวอักษร |

### 7.4 ใบเพิ่มหนี้ (DN)

| Rule | Description |
|------|-------------|
| V-301 | `ref_inv_no` ต้องมีอยู่ในระบบ และสถานะ `Delivered` |
| V-302 | `doc_date` ต้องเท่ากับ `ref_inv_date` (กฎหมายไทย) |
| V-303 | `totalAdj` ต้องเป็นบวกเท่านั้น |
| V-304 | ต้องมีสิทธิ์ `manager` ขึ้นไปจึงออก DN ได้ |
| V-305 | ต้องระบุ `adjustment_reason` ความยาว ≥ 10 ตัวอักษร |

### 7.5 Audit Trail

| Rule | Description |
|------|-------------|
| V-401 | ทุก action ต้อง INSERT audit_log ก่อน COMMIT transaction |
| V-402 | ห้าม UPDATE/DELETE audit_log (enforce via DB permission) |
| V-403 | `snapshot_before` ต้อง capture ก่อนแก้ไข |

---

## 8. Test Cases

### TC-001 ออก TIV ปกติ
```
Given: ผู้ใช้ role = cashier, ลูกค้า = Retail (ไม่มีเลขภาษี)
When:  POST /invoices พร้อมรายการสินค้า 2 รายการ
Then:  TIV ถูกสร้าง, status = Issued
       doc_no format = "TIV-YYYYMM-XXXX"
       vat_amt = pre_vat_amt × 0.07 (±0.01)
       audit_log บันทึก CREATE_INVOICE
```

### TC-002 ออก INV จาก TIV (สำเร็จ)
```
Given: TIV มีสถานะ Issued, ผู้ใช้ role = supervisor
When:  POST /invoices/full { tivNo: "TIV-202506-0001" }
Then:  INV ถูกสร้าง, thermalNo = TIV-202506-0001
       TIV.fullInvNo = INV-202506-0001
       audit_log บันทึก ISSUE_INVOICE
```

### TC-003 ยกเลิก INV ที่ Issued (สำเร็จ)
```
Given: INV status = Issued, ผู้ใช้ role = supervisor
When:  POST /invoices/INV-0001/cancel { reason: "ข้อมูลลูกค้าผิดพลาด" }
Then:  INV.status = Cancelled
       audit_log บันทึก CANCEL_INVOICE
       HTTP 200
```

### TC-004 ยกเลิก INV ที่ Delivered (ต้องล้มเหลว)
```
Given: INV status = Delivered, ผู้ใช้ role = manager
When:  POST /invoices/INV-0001/cancel
Then:  HTTP 409
       error.code = INV_003
       "Cannot cancel delivered invoice — use CN/DN"
       audit_log ไม่มีการบันทึก
```

### TC-005 ออกใบลดหนี้ (กรณีคืนสินค้า)
```
Given: INV-0001 status = Delivered, ยอด ฿12,658.10
       สินค้า A จำนวน 37.5 KG ราคา 380/KG
When:  POST /credit-notes {
         refInvNo: "INV-0001",
         returnItems: [{ code: "00001", qty: 1.000, price: 380 }],
         reason: "ลูกค้าคืนสินค้า 1 KG เนื่องจากสินค้าเสีย",
         restoreStock: true
       }
Then:  CN ถูกสร้าง, doc_no = "CN-YYYYMM-0001"
       CN.doc_date = INV.doc_date (same as original)
       CN.totalAdj = -380.00
       CN.vatAdj = -24.86
       Product stock += 1.000 KG
       audit_log บันทึก CREATE_CREDIT_NOTE
```

### TC-006 วันที่ CN ต้องเท่ากับ INV (กฎหมาย)
```
Given: INV-0001 doc_date = "2026-06-01"
When:  POST /credit-notes { refInvNo: "INV-0001", ... }
Then:  CN.doc_date = "2026-06-01"  (NOT today)
```

### TC-007 CN ยอดเกิน INV (ต้องล้มเหลว)
```
Given: INV-0001 ยอดรวม ฿380.00
When:  POST /credit-notes { totalAdj: -500.00 }
Then:  HTTP 422
       "CN amount cannot exceed original invoice total"
```

### TC-008 Audit Log immutable
```
Given: audit_log มีรายการ id=42
When:  UPDATE audit_log SET reason='xxx' WHERE id=42
Then:  Database Permission Error (ห้าม UPDATE)
```

### TC-009 Permission check — Cashier ออก CN (ต้องล้มเหลว)
```
Given: ผู้ใช้ role = cashier
When:  POST /credit-notes
Then:  HTTP 403
       "Insufficient role for this action"
```

### TC-010 รายงานใบกำกับที่ยกเลิก
```
Given: มี 3 INV ที่ status = Cancelled ในเดือน 06/2026
When:  GET /reports/cancelled-invoices?from=2026-06-01&to=2026-06-30
Then:  response.data.length = 3
       แต่ละรายการมี: doc_no, doc_date, customer_name, cancel_by, reason
```

---

## 9. สิทธิ์การใช้งาน (Role Permission Matrix)

| Action | Cashier | Supervisor | Manager | Admin |
|--------|:-------:|:----------:|:-------:|:-----:|
| ออก TIV | ✅ | ✅ | ✅ | ✅ |
| ออก INV จาก TIV | ❌ | ✅ | ✅ | ✅ |
| พิมพ์ใบเสร็จ/ใบกำกับ | ✅ | ✅ | ✅ | ✅ |
| ยกเลิก TIV/INV (Issued) | ❌ | ✅ | ✅ | ✅ |
| ยกเลิก TIV/INV (Delivered) | ❌ | ❌ | ❌ | ✅* |
| ออก INV ใหม่แทน (Reissue) | ❌ | ✅ | ✅ | ✅ |
| ออกใบลดหนี้ (CN) | ❌ | ❌ | ✅ | ✅ |
| ออกใบเพิ่มหนี้ (DN) | ❌ | ❌ | ✅ | ✅ |
| ดู Audit Log | ❌ | ❌ | ✅ | ✅ |
| Export รายงาน | ❌ | ✅ | ✅ | ✅ |
| จัดการ Users | ❌ | ❌ | ❌ | ✅ |
| ตั้งค่า Prefix เอกสาร | ❌ | ❌ | ❌ | ✅ |

*Admin ยกเลิก Delivered ได้เฉพาะกรณีพิเศษ พร้อม 2-factor confirm

### Permission Enforcement

```javascript
// Middleware ตัวอย่าง (Node.js)
const PERMISSIONS = {
  'issue_inv':        ['supervisor','manager','admin'],
  'cancel_issued':    ['supervisor','manager','admin'],
  'create_cn':        ['manager','admin'],
  'create_dn':        ['manager','admin'],
  'view_audit_log':   ['manager','admin'],
};

function requireRole(action) {
  return (req, res, next) => {
    const allowed = PERMISSIONS[action];
    if (!allowed || !allowed.includes(req.user.role)) {
      return res.status(403).json({
        code: 'INV_004',
        message: 'Insufficient role for this action',
        required: allowed,
        current: req.user.role
      });
    }
    next();
  };
}
```

---

## ภาคผนวก — Document Number Format

| ประเภท | Format | ตัวอย่าง | ออกโดย |
|--------|--------|---------|-------|
| TIV | TIV-YYYYMM-XXXX | TIV-202506-0001 | Auto (ทุก Sale) |
| INV | INV-YYYYMM-XXXX | INV-202506-0001 | Manual (Supervisor+) |
| CN | CN-YYYYMM-XXXX | CN-202506-0001 | Manual (Manager+) |
| DN | DN-YYYYMM-XXXX | DN-202506-0001 | Manual (Manager+) |
| ISS | ISS-XXXX | ISS-0001 | Auto (Non-commercial) |
| GRN | GRN-YYYYMM-XXXX | GRN-202506-0001 | Auto (Stock In) |
| ADJ | ADJ-YYYYMM-XXXX | ADJ-202506-0001 | Manual (Staff+) |

> **YYYYMM** = ปี พ.ศ. 4 หลัก + เดือน 2 หลัก
> **Prefix** ตั้งค่าได้ใน Settings → หมายเลขเอกสาร

---

## ภาคผนวก — Thai Law References

| มาตรา | สาระสำคัญ |
|-------|----------|
| ม.86/4 | ผู้ประกอบการ VAT ต้องจัดทำใบกำกับภาษีเมื่อมีการขายสินค้า/บริการ |
| ม.86/9 | ใบลดหนี้ต้องออกเมื่อมีการลดราคา/คืนสินค้า พร้อมอ้างอิงใบกำกับเดิม |
| ม.86/10 | ใบเพิ่มหนี้ต้องออกเมื่อมีการเพิ่มราคา พร้อมอ้างอิงใบกำกับเดิม |
| ม.87/2 | วันที่ในใบลดหนี้/เพิ่มหนี้ต้องเป็นวันที่เดียวกับใบกำกับภาษีต้นฉบับ |
| ม.19 | ต้องเก็บรักษาเอกสารภาษีไม่น้อยกว่า 5 ปี |

---

*เอกสารนี้จัดทำโดย StockPro Development Team | อ้างอิงกฎหมายภาษีมูลค่าเพิ่ม พ.ศ. 2534 และฉบับแก้ไขเพิ่มเติม*
