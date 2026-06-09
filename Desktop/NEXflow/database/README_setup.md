# StockPro — PostgreSQL Setup Guide

## ขั้นตอนการติดตั้ง

### 1. เปิด psql (Command Line)

```powershell
# Windows — เปิด Command Prompt แล้วรัน:
psql -U postgres
```

> รหัสผ่านคือที่ตั้งไว้ตอน install PostgreSQL

---

### 2. สร้าง Database

```sql
-- รันใน psql prompt:
CREATE DATABASE stockpro_db
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'Thai_Thailand.874'
  LC_CTYPE   = 'Thai_Thailand.874'
  TEMPLATE   = template0;

-- เข้าไปใน database ใหม่:
\c stockpro_db
```

---

### 3. รัน Schema (สร้างตาราง)

```powershell
# รันใน Command Prompt (ไม่ใช่ psql prompt):
psql -U postgres -d stockpro_db -f "C:\Users\EMC\Desktop\NEXflow\database\01_schema.sql"
```

---

### 4. รัน Seed Data (ข้อมูลตั้งต้น)

```powershell
psql -U postgres -d stockpro_db -f "C:\Users\EMC\Desktop\NEXflow\database\02_seed.sql"
```

---

### 5. ตรวจสอบผลลัพธ์

```sql
-- เข้า psql แล้ว connect database:
psql -U postgres -d stockpro_db

-- ดูรายชื่อตาราง:
\dt

-- ทดสอบ query:
SELECT code, name, stock_qty, sell_price FROM products ORDER BY code;
SELECT invoice_no, invoice_type, total, status FROM invoices ORDER BY invoice_date;
SELECT grn_no, grn_date, total_weight FROM grn_headers ORDER BY grn_date;
```

---

## โครงสร้างตาราง (11 ตาราง)

| ตาราง | คำอธิบาย | แถวตั้งต้น |
|-------|----------|-----------|
| `company_settings` | ข้อมูลบริษัท, prefix เอกสาร | 1 |
| `users` | ผู้ใช้งานระบบ | 3 |
| `products` | สินค้าทะเล | 6 |
| `customers` | ลูกค้า | 5 |
| `document_counters` | Running number แยก prefix+เดือน | 8 |
| `invoices` | ใบกำกับภาษี (TIV, INV, ISS, CN, DN) | 3 |
| `invoice_items` | รายการสินค้าในใบกำกับ | 3 |
| `grn_headers` | ใบรับสินค้า GRN | 3 |
| `grn_items` | รายการสินค้าใน GRN | 6 |
| `stock_ledger` | บัญชีเดินสต็อก (ทุก in/out/adj) | 8 |
| `audit_log` | บันทึกการกระทำ (immutable) | 0 |
| `adj_headers` | เอกสารปรับยอดสต็อก ADJ | 0 |
| `adj_items` | รายการปรับยอด | 0 |

---

## Query ที่ใช้บ่อย

```sql
-- ยอดสต็อกปัจจุบัน
SELECT code, name, stock_qty, min_qty,
       CASE WHEN stock_qty <= min_qty THEN 'LOW' ELSE 'OK' END AS status
FROM products
ORDER BY code;

-- ใบกำกับวันนี้
SELECT invoice_no, invoice_type, customer_name, total, payment_method
FROM invoices
WHERE invoice_date = CURRENT_DATE AND is_voided = FALSE
ORDER BY created_at DESC;

-- ยอดขายรายเดือน (ปี 2025)
SELECT
  TO_CHAR(invoice_date, 'YYYY-MM') AS month,
  SUM(total) AS revenue,
  COUNT(*) AS bill_count
FROM invoices
WHERE invoice_type = 'TIV'
  AND is_voided = FALSE
  AND EXTRACT(YEAR FROM invoice_date) = 2025
GROUP BY 1
ORDER BY 1;

-- สต็อกเคลื่อนไหวรายสินค้า
SELECT
  l.movement_date,
  l.movement_type,
  l.quantity,
  l.balance,
  l.ref_no,
  l.ref_type
FROM stock_ledger l
WHERE l.product_code = '00001'
ORDER BY l.movement_date DESC, l.created_at DESC;

-- รับ running number ใหม่ (ใช้ใน backend)
UPDATE document_counters
SET last_counter = last_counter + 1
WHERE prefix = 'TIV' AND year_month = TO_CHAR(NOW(), 'YYYYMM')
RETURNING LPAD(last_counter::text, 4, '0');
-- ถ้าไม่มี row → INSERT ก่อน แล้ว RETURNING
```

---

## หมายเหตุสำคัญ

- **password_hash** ใน seed data เป็น placeholder — ต้องเปลี่ยนเป็น bcrypt hash จริงก่อน production
- ราคาขายทุกอย่างเป็น **VAT-inclusive** (รวม VAT ในราคาแล้ว): `vat = net * 7 / 107`
- `stock_ledger` ควร insert ทุกครั้งที่มีการเปลี่ยนแปลงสต็อก — ห้ามลบ/แก้ไข
- `audit_log` ควร insert-only เช่นกัน (ไม่มี UPDATE/DELETE)
- `document_counters` ใช้ `UPDATE ... RETURNING` แบบ atomic เพื่อป้องกัน race condition
