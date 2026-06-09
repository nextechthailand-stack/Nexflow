\encoding UTF8
-- StockPro Seed Data
-- Run after 01_schema.sql

BEGIN;

INSERT INTO company_settings (id, name, address, tax_id, tel, email, vat_rate, currency)
VALUES (
    1,
    'บริษัท ซีฟู้ด โปรวิชั่น จำกัด',
    '123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110',
    '0105566012345',
    '02-xxx-xxxx',
    'info@seafoodprovision.co.th',
    7,
    'THB'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, name, username, password_hash, role, is_active) VALUES
(1, 'Admin Kanya',   'admin',   '$2b$12$placeholder000000000000000000000000000000000000000', 'Administrator', TRUE),
(2, 'สมชาย ใจดี',   'somchai', '$2b$12$placeholder000000000000000000000000000000000000001', 'Staff',         TRUE),
(3, 'วิภา แสงทอง',  'wipa',    '$2b$12$placeholder000000000000000000000000000000000000002', 'Staff',         FALSE)
ON CONFLICT (id) DO NOTHING;

SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

INSERT INTO products (id, code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type) VALUES
(1, '00001', 'ปลาแซลมอนนอร์เวย์',  'ปลา', 380,  280, 124.500, 20, 'vat7'),
(2, '00002', 'กุ้งขาวแวนนาไม',      'กุ้ง', 220,  160,  89.000, 30, 'vat7'),
(3, '00003', 'ปลาทูน่าครีบเหลือง',   'ปลา', 290,  210,  56.500, 15, 'vat7'),
(4, '00004', 'หอยเชลล์แช่แข็ง',      'หอย', 480,  360,   8.500, 10, 'vat7'),
(5, '00005', 'ปลาดอลลี่ฟิลเล่',      'ปลา',  95,   65,   0.000, 25, 'nonvat'),
(6, '00006', 'กุ้งมังกร',            'กุ้ง', 1200, 900,  22.000,  5, 'vat7')
ON CONFLICT (id) DO NOTHING;

SELECT setval('products_id_seq', (SELECT MAX(id) FROM products));

INSERT INTO customers (id, code, name, type, tax_id, tel, address, discount) VALUES
(1, 'CUS001', 'บ. ซีฟู้ด โปรวิชั่น จก.',  'wholesale', '0105566111111', '02-xxx-1111', '456 ถนนสีลม แขวงสีลม บางรัก กรุงเทพฯ 10500', 500),
(2, 'CUS002', 'ร้านอาหารโตเกียว',           'wholesale', '',             '081-234-5678', 'ย่านอโศก สุขุมวิท กรุงเทพฯ 10110',              0),
(3, 'CUS003', 'Shopee Store',               'online',    '',             '',             '',                                               0),
(4, 'CUS004', 'ครัวคุณนาย',                 'wholesale', '0335566009900', '089-999-0001', 'ลาดพร้าว กรุงเทพฯ 10230',                       0),
(5, 'CUS005', 'Lazada Official',            'online',    '',             '',             '',                                               0)
ON CONFLICT (id) DO NOTHING;

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

INSERT INTO document_counters (prefix, year_month, last_counter) VALUES
('TIV', '202504', 5),
('TIV', '202505', 2),
('INV', '202504', 3),
('INV', '202505', 1),
('GRN', '202505', 2),
('GRN', '202506', 1),
('ISS', '000000', 4),
('ADJ', '000000', 0)
ON CONFLICT (prefix, year_month) DO NOTHING;

INSERT INTO invoices (
    id, invoice_no, invoice_type, channel, ref_invoice_no,
    customer_id, customer_name, customer_tax_id,
    invoice_date, gross_sale, discount, net_sale,
    vat_base, vat7, total, payment_method, status,
    is_voided, stock_restored, print_count, full_inv_no, created_by
) VALUES (
    3, 'TIV-202505-0002', 'TIV', 'wholesale', NULL,
    1, 'บ. ซีฟู้ด โปรวิชั่น จก.', '0105566111111',
    '2025-05-15', 14250, 500, 13750,
    11830, 828.10, 12658.10, 'transfer', 'paid',
    FALSE, FALSE, 1, 'INV-202505-0001', 1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
    id, invoice_no, invoice_type, channel, ref_invoice_no,
    customer_id, customer_name, customer_tax_id,
    invoice_date, gross_sale, discount, net_sale,
    vat_base, vat7, total, payment_method, status,
    is_voided, voided_at, voided_by, void_reason, stock_restored, print_count, created_by
) VALUES (
    2, 'TIV-202505-0001', 'TIV', 'wholesale', NULL,
    2, 'ร้านอาหารโตเกียว', '',
    '2025-05-15', 1760, 0, 1760,
    1760, 115.14, 1760, 'cash', 'voided',
    TRUE, NOW(), 'Admin Kanya', 'ลูกค้าต้องการอย่างย่อ', TRUE, 0, 1
) ON CONFLICT (id) DO NOTHING;

INSERT INTO invoices (
    id, invoice_no, invoice_type, channel, ref_invoice_no,
    customer_id, customer_name, customer_tax_id,
    invoice_date, gross_sale, discount, net_sale,
    vat_base, vat7, total, payment_method, status,
    is_voided, stock_restored, print_count, created_by
) VALUES (
    1, 'INV-202505-0001', 'INV', 'wholesale', 'TIV-202505-0002',
    1, 'บ. ซีฟู้ด โปรวิชั่น จก.', '0105566111111',
    '2025-05-15', 14250, 500, 13750,
    11830, 828.10, 12658.10, 'transfer', 'paid',
    FALSE, FALSE, 1, 1
) ON CONFLICT (id) DO NOTHING;

SELECT setval('invoices_id_seq', (SELECT MAX(id) FROM invoices));

INSERT INTO invoice_items (invoice_id, product_code, product_name, weight, price_per_kg, tax_type, line_gross)
VALUES
(3, '00001', 'ปลาแซลมอนนอร์เวย์', 37.5, 380, 'vat7', 14250),
(2, '00002', 'กุ้งขาวแวนนาไม',    8.0,  220, 'vat7', 1760),
(1, '00001', 'ปลาแซลมอนนอร์เวย์', 37.5, 380, 'vat7', 14250)
ON CONFLICT DO NOTHING;

INSERT INTO grn_headers (id, grn_no, grn_date, po_no, receiver, note, total_packs, total_weight, total_value, created_by) VALUES
(1, 'GRN-202506-0001', '2025-06-01', 'PO-2506-001', 'Admin Kanya', 'รับสินค้าปกติ', 1,  8.900,   1424.00, 1),
(2, 'GRN-202505-0002', '2025-05-14', 'PO-2505-042', 'Admin Kanya', 'รับสินค้าปกติ', 3, 68.459,  20785.00, 1),
(3, 'GRN-202505-0001', '2025-05-10', 'PO-2505-039', 'สมชาย ใจดี', '',               2, 32.000,   9240.00, 2)
ON CONFLICT (id) DO NOTHING;

SELECT setval('grn_headers_id_seq', (SELECT MAX(id) FROM grn_headers));

INSERT INTO grn_items (grn_id, product_code, product_name, pack_no, weight, cost_price, value, tax_type, sort_order) VALUES
(1, '00002', 'กุ้งขาวแวนนาไม',    'PKG-001',  8.900, 160,  1424.00,  'vat7', 1),
(2, '00001', 'ปลาแซลมอนนอร์เวย์', 'PKG-001', 32.500, 280,  9100.00,  'vat7', 1),
(2, '00003', 'ปลาทูน่าครีบเหลือง', 'PKG-002', 22.959, 210,  4821.39,  'vat7', 2),
(2, '00006', 'กุ้งมังกร',          'PKG-003', 13.000, 900, 11700.00,  'vat7', 3),
(3, '00001', 'ปลาแซลมอนนอร์เวย์', 'PKG-001', 20.000, 280,  5600.00,  'vat7', 1),
(3, '00002', 'กุ้งขาวแวนนาไม',    'PKG-002', 12.000, 160,  1920.00,  'vat7', 2);

INSERT INTO stock_ledger (product_code, product_name, movement_type, quantity, balance, ref_no, ref_type, channel, movement_date, movement_time) VALUES
('00001', 'ปลาแซลมอนนอร์เวย์', 'out', 37.5,   124.5, 'TIV-202505-0002', 'ขายออก',  'wholesale', '2025-06-01', '23:01'),
('00002', 'กุ้งขาวแวนนาไม',    'in',   8.9,    89.0, 'GRN-202506-0001', 'รับเข้า', NULL,        '2025-06-01', '18:00'),
('00002', 'กุ้งขาวแวนนาไม',    'out', 12.0,    80.1, 'TIV-202505-0001', 'ขายออก',  'wholesale', '2025-05-15', '22:30'),
('00002', 'กุ้งขาวแวนนาไม',    'in',  30.009, 101.0, 'GRN-202505-0002', 'รับเข้า', NULL,        '2025-05-14', NULL),
('00006', 'กุ้งมังกร',          'in',  13.0,    22.0, 'GRN-202505-0002', 'รับเข้า', NULL,        '2025-05-14', NULL),
('00001', 'ปลาแซลมอนนอร์เวย์', 'out', 25.5,   124.5, 'TIV-202505-0002', 'ขายออก',  'wholesale', '2025-05-15', '23:01'),
('00001', 'ปลาแซลมอนนอร์เวย์', 'in',  32.5,   150.0, 'GRN-202505-0002', 'รับเข้า', NULL,        '2025-05-14', NULL),
('00004', 'หอยเชลล์แช่แข็ง',   'out',  5.5,     8.5, 'ISS-0002',        'ตัดออก (Expired)', 'expired', '2025-05-13', '10:00');

COMMIT;
