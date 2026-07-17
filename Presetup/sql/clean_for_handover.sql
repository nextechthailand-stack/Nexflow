\encoding UTF8
-- clean_for_handover.sql
-- รันบนเครื่องเรา ก่อนส่ง backup ให้ลูกค้า
-- ลบข้อมูลทั้งหมด เหลือแค่ user admin

BEGIN;

-- ลบข้อมูล transaction ทั้งหมด
TRUNCATE TABLE audit_log         RESTART IDENTITY CASCADE;
TRUNCATE TABLE print_logs        RESTART IDENTITY CASCADE;
TRUNCATE TABLE dashboard_metrics RESTART IDENTITY CASCADE;
TRUNCATE TABLE stock_ledger      RESTART IDENTITY CASCADE;
TRUNCATE TABLE adj_items         RESTART IDENTITY CASCADE;
TRUNCATE TABLE adj_headers       RESTART IDENTITY CASCADE;
TRUNCATE TABLE check_details     RESTART IDENTITY CASCADE;
TRUNCATE TABLE checks            RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoice_items     RESTART IDENTITY CASCADE;
TRUNCATE TABLE invoices          RESTART IDENTITY CASCADE;
TRUNCATE TABLE grn_items         RESTART IDENTITY CASCADE;
TRUNCATE TABLE grn_headers       RESTART IDENTITY CASCADE;

DELETE FROM document_counters;
DELETE FROM price_history;

-- ลบ master data ทั้งหมด (ลูกค้ากรอกสินค้าและผู้ซื้อเอง)
DELETE FROM products;
ALTER SEQUENCE products_id_seq RESTART WITH 1;

DELETE FROM customers;
ALTER SEQUENCE customers_id_seq RESTART WITH 1;

DELETE FROM suppliers;
ALTER SEQUENCE suppliers_id_seq RESTART WITH 1;

DELETE FROM product_categories;
ALTER SEQUENCE product_categories_id_seq RESTART WITH 1;

-- เหลือแค่ admin — ลบ user อื่นทั้งหมด
DELETE FROM users WHERE username != 'admin';
UPDATE users SET
  name           = 'Administrator',
  password_hash  = '$2b$10$pW0NHZ6dVBT3JcUTvWJfy.uvuijqqYLBKqBGCtLUKgaKtt0w491TS',
  is_active      = TRUE,
  last_login_at  = NULL,
  reset_code_hash    = NULL,
  reset_code_expires = NULL
WHERE username = 'admin';
SELECT setval('users_id_seq', 1);

-- ล้างข้อมูลบริษัทให้ลูกค้ากรอกเอง
UPDATE company_settings SET
  name     = 'ชื่อร้าน / บริษัทของคุณ',
  address  = 'ที่อยู่ร้าน',
  tax_id   = '',
  tel      = '',
  email    = '',
  logo_url = NULL
WHERE id = 1;

COMMIT;

SELECT 'เคลียร์ข้อมูลเรียบร้อย — พร้อมส่งให้ลูกค้า (admin / 1234)' AS status;
SELECT username, name, role FROM users;
