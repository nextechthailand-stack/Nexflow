\encoding UTF8
-- StockPro Database Schema - PostgreSQL
-- Created by NEXflow / Claude

BEGIN;

CREATE TABLE IF NOT EXISTS company_settings (
    id              INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    name            VARCHAR(200)    NOT NULL,
    address         TEXT,
    tax_id          VARCHAR(20),
    tel             VARCHAR(30),
    email           VARCHAR(100),
    vat_rate        NUMERIC(4,2)    NOT NULL DEFAULT 7,
    currency        CHAR(3)         NOT NULL DEFAULT 'THB',
    prefix_grn      VARCHAR(10)     NOT NULL DEFAULT 'GRN',
    prefix_adj      VARCHAR(10)     NOT NULL DEFAULT 'ADJ',
    prefix_iss      VARCHAR(10)     NOT NULL DEFAULT 'ISS',
    prefix_tiv      VARCHAR(10)     NOT NULL DEFAULT 'TIV',
    prefix_inv      VARCHAR(10)     NOT NULL DEFAULT 'INV',
    prefix_cn       VARCHAR(10)     NOT NULL DEFAULT 'CN',
    prefix_dn       VARCHAR(10)     NOT NULL DEFAULT 'DN',
    updated_at      TIMESTAMPTZ     DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100)    NOT NULL,
    username        VARCHAR(50)     NOT NULL UNIQUE,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     NOT NULL DEFAULT 'Staff'
                    CHECK (role IN ('Administrator','Staff')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id              SERIAL PRIMARY KEY,
    code            CHAR(5)         NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    category        VARCHAR(50),
    sell_price      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    cost_price      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    stock_qty       NUMERIC(12,3)   NOT NULL DEFAULT 0,
    min_qty         NUMERIC(12,3)   NOT NULL DEFAULT 0,
    tax_type        VARCHAR(10)     NOT NULL DEFAULT 'vat7'
                    CHECK (tax_type IN ('vat7','nonvat')),
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(10)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    type            VARCHAR(20)     NOT NULL DEFAULT 'wholesale'
                    CHECK (type IN ('wholesale','online','walk-in')),
    tax_id          VARCHAR(20),
    tel             VARCHAR(30),
    address         TEXT,
    discount        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_counters (
    prefix          VARCHAR(10)     NOT NULL,
    year_month      CHAR(6)         NOT NULL,
    last_counter    INT             NOT NULL DEFAULT 0,
    PRIMARY KEY (prefix, year_month)
);

CREATE TABLE IF NOT EXISTS invoices (
    id              SERIAL PRIMARY KEY,
    invoice_no      VARCHAR(25)     NOT NULL UNIQUE,
    invoice_type    VARCHAR(10)     NOT NULL
                    CHECK (invoice_type IN ('TIV','INV','ISS','CN','DN')),
    channel         VARCHAR(20)     NOT NULL DEFAULT 'wholesale'
                    CHECK (channel IN ('wholesale','online','sample','expired','other')),
    ref_invoice_no  VARCHAR(25),
    customer_id     INT             REFERENCES customers(id) ON DELETE SET NULL,
    customer_name   VARCHAR(100),
    customer_tax_id VARCHAR(20),
    invoice_date    DATE            NOT NULL DEFAULT CURRENT_DATE,
    gross_sale      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    discount        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    net_sale        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    vat_base        NUMERIC(12,2)   NOT NULL DEFAULT 0,
    vat7            NUMERIC(12,2)   NOT NULL DEFAULT 0,
    total           NUMERIC(12,2)   NOT NULL DEFAULT 0,
    payment_method  VARCHAR(20)
                    CHECK (payment_method IN ('cash','transfer','credit')),
    status          VARCHAR(10)     NOT NULL DEFAULT 'paid'
                    CHECK (status IN ('paid','voided')),
    is_voided       BOOLEAN         NOT NULL DEFAULT FALSE,
    voided_at       TIMESTAMPTZ,
    voided_by       VARCHAR(100),
    void_reason     TEXT,
    stock_restored  BOOLEAN         NOT NULL DEFAULT FALSE,
    print_count     INT             NOT NULL DEFAULT 0,
    full_inv_no     VARCHAR(25),
    note            TEXT,
    created_by      INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_date     ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_type     ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_invoices_channel  ON invoices(channel);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_ref      ON invoices(ref_invoice_no);

CREATE TABLE IF NOT EXISTS invoice_items (
    id              SERIAL PRIMARY KEY,
    invoice_id      INT             NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_code    CHAR(5)         REFERENCES products(code) ON DELETE SET NULL,
    product_name    VARCHAR(100)    NOT NULL,
    weight          NUMERIC(12,3)   NOT NULL DEFAULT 0,
    price_per_kg    NUMERIC(12,2)   NOT NULL DEFAULT 0,
    tax_type        VARCHAR(10)     NOT NULL DEFAULT 'vat7'
                    CHECK (tax_type IN ('vat7','nonvat')),
    line_gross      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    sort_order      INT             NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_code);

CREATE TABLE IF NOT EXISTS grn_headers (
    id              SERIAL PRIMARY KEY,
    grn_no          VARCHAR(20)     NOT NULL UNIQUE,
    grn_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
    po_no           VARCHAR(50),
    receiver        VARCHAR(100),
    note            TEXT,
    total_packs     INT             NOT NULL DEFAULT 0,
    total_weight    NUMERIC(12,3)   NOT NULL DEFAULT 0,
    total_value     NUMERIC(12,2)   NOT NULL DEFAULT 0,
    created_by      INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grn_date ON grn_headers(grn_date);

CREATE TABLE IF NOT EXISTS grn_items (
    id              SERIAL PRIMARY KEY,
    grn_id          INT             NOT NULL REFERENCES grn_headers(id) ON DELETE CASCADE,
    product_code    CHAR(5)         REFERENCES products(code) ON DELETE SET NULL,
    product_name    VARCHAR(100)    NOT NULL,
    pack_no         VARCHAR(50),
    weight          NUMERIC(12,3)   NOT NULL DEFAULT 0,
    cost_price      NUMERIC(12,2)   NOT NULL DEFAULT 0,
    value           NUMERIC(12,2)   NOT NULL DEFAULT 0,
    tax_type        VARCHAR(10)     NOT NULL DEFAULT 'vat7'
                    CHECK (tax_type IN ('vat7','nonvat')),
    sort_order      INT             NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_grn_items_grn     ON grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_product ON grn_items(product_code);

CREATE TABLE IF NOT EXISTS adj_headers (
    id              SERIAL PRIMARY KEY,
    adj_no          VARCHAR(20)     NOT NULL UNIQUE,
    adj_date        DATE            NOT NULL DEFAULT CURRENT_DATE,
    reason          TEXT,
    created_by      INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS adj_items (
    id              SERIAL PRIMARY KEY,
    adj_id          INT             NOT NULL REFERENCES adj_headers(id) ON DELETE CASCADE,
    product_code    CHAR(5)         REFERENCES products(code) ON DELETE SET NULL,
    product_name    VARCHAR(100)    NOT NULL,
    qty_before      NUMERIC(12,3)   NOT NULL DEFAULT 0,
    qty_adjust      NUMERIC(12,3)   NOT NULL DEFAULT 0,
    qty_after       NUMERIC(12,3)   NOT NULL DEFAULT 0,
    note            TEXT
);

CREATE TABLE IF NOT EXISTS stock_ledger (
    id              BIGSERIAL PRIMARY KEY,
    product_code    CHAR(5)         NOT NULL,
    product_name    VARCHAR(100)    NOT NULL,
    movement_type   VARCHAR(5)      NOT NULL CHECK (movement_type IN ('in','out','adj')),
    quantity        NUMERIC(12,3)   NOT NULL,
    balance         NUMERIC(12,3)   NOT NULL,
    ref_no          VARCHAR(30),
    ref_type        VARCHAR(50),
    channel         VARCHAR(20),
    movement_date   DATE            NOT NULL DEFAULT CURRENT_DATE,
    movement_time   TIME,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_code);
CREATE INDEX IF NOT EXISTS idx_ledger_date    ON stock_ledger(movement_date);
CREATE INDEX IF NOT EXISTS idx_ledger_ref     ON stock_ledger(ref_no);

-- ============================================================
--  CHECKS (เช็ครับ / เช็คจ่าย)
-- ============================================================
CREATE TABLE IF NOT EXISTS checks (
    id              SERIAL PRIMARY KEY,
    check_no        VARCHAR(30)     NOT NULL,           -- เลขที่เช็ค
    check_type      VARCHAR(10)     NOT NULL DEFAULT 'received'
                    CHECK (check_type IN ('received','issued')), -- รับเข้า / ออกให้
    bank_name       VARCHAR(100),                       -- ชื่อธนาคาร
    branch          VARCHAR(100),                       -- สาขา
    account_no      VARCHAR(30),                        -- เลขบัญชี
    amount          NUMERIC(12,2)   NOT NULL DEFAULT 0,
    check_date      DATE            NOT NULL,            -- วันที่บนเช็ค
    due_date        DATE,                               -- วันที่นำฝาก / ครบกำหนด
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','cleared','bounced','cancelled')),
    customer_id     INT             REFERENCES customers(id) ON DELETE SET NULL,
    customer_name   VARCHAR(100),                       -- snapshot
    note            TEXT,
    created_by      INT             REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_checks_date       ON checks(check_date);
CREATE INDEX IF NOT EXISTS idx_checks_status     ON checks(status);
CREATE INDEX IF NOT EXISTS idx_checks_customer   ON checks(customer_id);
CREATE INDEX IF NOT EXISTS idx_checks_type       ON checks(check_type);

CREATE TABLE IF NOT EXISTS check_details (
    id              SERIAL PRIMARY KEY,
    check_id        INT             NOT NULL REFERENCES checks(id) ON DELETE CASCADE,
    invoice_id      INT             REFERENCES invoices(id) ON DELETE SET NULL,
    invoice_no      VARCHAR(25),                        -- snapshot
    amount          NUMERIC(12,2)   NOT NULL DEFAULT 0, -- ยอดที่ตัดจากใบนี้
    note            TEXT,
    sort_order      INT             NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_check_details_check   ON check_details(check_id);
CREATE INDEX IF NOT EXISTS idx_check_details_invoice ON check_details(invoice_id);

-- ============================================================
--  PRINT LOGS (บันทึกการพิมพ์เอกสาร)
-- ============================================================
CREATE TABLE IF NOT EXISTS print_logs (
    id              BIGSERIAL PRIMARY KEY,
    doc_type        VARCHAR(10)     NOT NULL
                    CHECK (doc_type IN ('TIV','INV','GRN','ADJ','ISS','CN','DN')),
    doc_no          VARCHAR(30)     NOT NULL,
    copy_no         INT             NOT NULL DEFAULT 1, -- ครั้งที่พิมพ์
    printed_by      VARCHAR(100),
    printed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_print_logs_doc ON print_logs(doc_no);
CREATE INDEX IF NOT EXISTS idx_print_logs_date ON print_logs(printed_at);

-- ============================================================
--  SUPPLIERS (ผู้จัดจำหน่าย / Vendor)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
    id              SERIAL PRIMARY KEY,
    code            VARCHAR(10)     NOT NULL UNIQUE,    -- SUP001
    name            VARCHAR(100)    NOT NULL,
    tax_id          VARCHAR(20),
    contact_name    VARCHAR(100),
    tel             VARCHAR(30),
    email           VARCHAR(100),
    address         TEXT,
    payment_terms   INT             DEFAULT 30,         -- วันเครดิต
    note            TEXT,
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- ============================================================
--  PRODUCT CATEGORIES (หมวดหมู่สินค้า)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_categories (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(50)     NOT NULL UNIQUE,    -- ปลา, กุ้ง, หอย, ปู
    name_en         VARCHAR(50),
    sort_order      INT             DEFAULT 0
);

-- ============================================================
--  PRICE HISTORY (ประวัติการเปลี่ยนแปลงราคา)
-- ============================================================
CREATE TABLE IF NOT EXISTS price_history (
    id              SERIAL PRIMARY KEY,
    product_code    CHAR(5)         NOT NULL REFERENCES products(code) ON DELETE CASCADE,
    price_type      VARCHAR(10)     NOT NULL CHECK (price_type IN ('sell','cost')),
    old_price       NUMERIC(12,2)   NOT NULL,
    new_price       NUMERIC(12,2)   NOT NULL,
    changed_by      VARCHAR(100),
    changed_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_price_history_product ON price_history(product_code);
CREATE INDEX IF NOT EXISTS idx_price_history_date    ON price_history(changed_at);

-- ============================================================
--  DASHBOARD METRICS (snapshot ข้อมูล dashboard รายวัน)
-- ============================================================
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id              BIGSERIAL PRIMARY KEY,
    metric_date     DATE            NOT NULL DEFAULT CURRENT_DATE,
    sales_today     NUMERIC(15,2)   NOT NULL DEFAULT 0,
    sales_month     NUMERIC(15,2)   NOT NULL DEFAULT 0,
    bills_today     INT             NOT NULL DEFAULT 0,
    low_stock_count INT             NOT NULL DEFAULT 0,
    channel_data    JSONB,          -- salesByChannel array
    top_sellers     JSONB,          -- top 5 products
    revenue_7d      JSONB,          -- { values:[], labels:[] }
    snapshot_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE (metric_date)            -- 1 record per day
);

CREATE INDEX IF NOT EXISTS idx_dashboard_metrics_date ON dashboard_metrics(metric_date);

CREATE TABLE IF NOT EXISTS audit_log (
    id              BIGSERIAL PRIMARY KEY,
    action_type     VARCHAR(50)     NOT NULL,
    doc_no          VARCHAR(30),
    ref_doc_no      VARCHAR(30),
    username        VARCHAR(100),
    user_role       VARCHAR(50),
    reason          TEXT,
    details         JSONB,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_doc    ON audit_log(doc_no);
CREATE INDEX IF NOT EXISTS idx_audit_date   ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action_type);

COMMIT;
