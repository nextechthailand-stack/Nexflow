\encoding UTF8
-- NEXflow Fresh Install Seed
-- ใช้หลัง setup schema บนเครื่องลูกค้าใหม่
-- admin password: 1234

BEGIN;

-- บริษัท (placeholder — กรอกเองใน Settings > ข้อมูลบริษัท)
INSERT INTO company_settings (id, name, address, tax_id, tel, email, vat_rate, currency)
VALUES (1, 'ชื่อร้าน / บริษัทของคุณ', 'ที่อยู่ร้าน', '', '', '', 7, 'THB')
ON CONFLICT (id) DO UPDATE SET
  name    = EXCLUDED.name,
  address = EXCLUDED.address,
  tax_id  = '',
  tel     = '',
  email   = '';

-- admin user เดียว (รหัสผ่าน: 1234)
INSERT INTO users (id, name, username, password_hash, role, is_active)
VALUES (1, 'Administrator', 'admin',
        '$2b$10$pW0NHZ6dVBT3JcUTvWJfy.uvuijqqYLBKqBGCtLUKgaKtt0w491TS',
        'Administrator', TRUE)
ON CONFLICT DO NOTHING;

SELECT setval('users_id_seq', 1);

COMMIT;

SELECT 'ติดตั้งสำเร็จ! เข้าระบบด้วย admin / 1234' AS status;
SELECT username, name, role, is_active FROM users;
