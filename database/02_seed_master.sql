\encoding UTF8
-- StockPro Master Data Only (no transactions)
-- Products, Customers, Users, Company

BEGIN;

INSERT INTO company_settings (id, name, address, tax_id, tel, email, vat_rate, currency)
VALUES (
    1,
    'บริษัท ซีฟู้ด โปรวิชั่น จำกัด',
    '123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110',
    '0105566012345',
    '02-xxx-xxxx',
    'info@seafoodprovision.co.th',
    7, 'THB'
) ON CONFLICT (id) DO UPDATE
  SET name=EXCLUDED.name, address=EXCLUDED.address, tax_id=EXCLUDED.tax_id,
      tel=EXCLUDED.tel, email=EXCLUDED.email;

INSERT INTO users (id, name, username, password_hash, role, is_active) VALUES
(1, 'Admin Kanya',  'admin',   '$2b$12$placeholder000000000000000000000000000000000000000', 'Administrator', TRUE),
(2, 'สมชาย ใจดี',  'somchai', '$2b$12$placeholder000000000000000000000000000000000000001', 'Staff',         TRUE),
(3, 'วิภา แสงทอง', 'wipa',    '$2b$12$placeholder000000000000000000000000000000000000002', 'Staff',         FALSE)
ON CONFLICT (id) DO NOTHING;
SELECT setval('users_id_seq', 3);

INSERT INTO products (id, code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type) VALUES
(1, '00001', 'ปลาแซลมอนนอร์เวย์',  'ปลา', 380,  280, 0, 20, 'vat7'),
(2, '00002', 'กุ้งขาวแวนนาไม',      'กุ้ง', 220,  160, 0, 30, 'vat7'),
(3, '00003', 'ปลาทูน่าครีบเหลือง',   'ปลา', 290,  210, 0, 15, 'vat7'),
(4, '00004', 'หอยเชลล์แช่แข็ง',      'หอย', 480,  360, 0, 10, 'vat7'),
(5, '00005', 'ปลาดอลลี่ฟิลเล่',      'ปลา',  95,   65, 0, 25, 'nonvat'),
(6, '00006', 'กุ้งมังกร',            'กุ้ง', 1200, 900, 0,  5, 'vat7')
ON CONFLICT (id) DO UPDATE
  SET name=EXCLUDED.name, sell_price=EXCLUDED.sell_price, cost_price=EXCLUDED.cost_price,
      stock_qty=EXCLUDED.stock_qty, min_qty=EXCLUDED.min_qty, tax_type=EXCLUDED.tax_type;
SELECT setval('products_id_seq', 6);

INSERT INTO customers (id, code, name, type, tax_id, tel, address, discount) VALUES
(1, 'CUS001', 'บ. ซีฟู้ด โปรวิชั่น จก.',  'wholesale', '0105566111111', '02-xxx-1111', '456 ถนนสีลม แขวงสีลม บางรัก กรุงเทพฯ 10500', 500),
(2, 'CUS002', 'ร้านอาหารโตเกียว',           'wholesale', '',             '081-234-5678', 'ย่านอโศก สุขุมวิท กรุงเทพฯ 10110', 0),
(3, 'CUS003', 'Shopee Store',               'online',    '',             '',             '', 0),
(4, 'CUS004', 'ครัวคุณนาย',                 'wholesale', '0335566009900','089-999-0001', 'ลาดพร้าว กรุงเทพฯ 10230', 0),
(5, 'CUS005', 'Lazada Official',            'online',    '',             '',             '', 0)
ON CONFLICT (id) DO UPDATE
  SET name=EXCLUDED.name, type=EXCLUDED.type, discount=EXCLUDED.discount;
SELECT setval('customers_id_seq', 5);

COMMIT;
