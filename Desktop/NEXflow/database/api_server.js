/**
 * NEXflow API Server — Node.js + Express + PostgreSQL
 * Port: 3001  (Perl static server ใช้ 3000)
 * เริ่มต้น: node api_server.js
 */

require('dotenv').config();
const express   = require('express');
const { Pool, types } = require('pg');
const cors      = require('cors');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');
const nodemailer = require('nodemailer');

// ── Fix: pg แปลงคอลัมน์ DATE เป็น JS Date object (เที่ยงคืนตามเวลาเครื่อง server)
// แล้วตอน JSON.stringify จะถูกแปลงเป็น UTC ผ่าน toISOString() — ถ้าเครื่อง server
// ตั้งโซนเวลาไทย (UTC+7) ค่าจะเลื่อนกลับไปอีก 1 วัน (เช่น '2026-06-10' → '2026-06-09T17:00:00.000Z')
// แก้โดยให้ pg คืนค่า DATE เป็น string 'YYYY-MM-DD' ดิบๆ ไม่แปลงเป็น Date object
types.setTypeParser(1082, val => val); // 1082 = DATE oid

const app  = express();
const PORT = process.env.PORT || 3001;

// ── DB Connection ─────────────────────────────────────────
// รหัสผ่านต้องมาจาก .env เท่านั้น — ไม่ฝัง fallback ไว้ในโค้ด (กันรหัสหลุดใน repo)
if (!process.env.DB_PASSWORD) {
  console.error('❌ ไม่พบ DB_PASSWORD ในไฟล์ .env');
  console.error('   คัดลอก database/.env.example เป็น database/.env แล้วใส่รหัสผ่าน PostgreSQL จริง');
  process.exit(1);
}
const pool = new Pool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'nexflow_db',
  user:     process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  client_encoding: 'UTF8',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅ Connected to PostgreSQL — nexflow_db');
});

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// ── Helper ────────────────────────────────────────────────
const q = (text, params) => pool.query(text, params);

// คืนค่าวันที่ (YYYY-MM-DD) ตามเขตเวลาไทย (Asia/Bangkok)
// ห้ามใช้ new Date().toISOString().slice(0,10) เพราะ server อาจรันด้วย UTC
// ทำให้ช่วงเที่ยงคืน-7โมงเช้า (เวลาไทย) ถูกบันทึกเป็นวันก่อนหน้า
const localISODate = (d = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(d);

// ── Mailer (Gmail SMTP) ───────────────────────────────────
// ตั้งค่า GMAIL_USER / GMAIL_APP_PASSWORD ใน database/.env
// (สร้าง App Password ได้ที่ https://myaccount.google.com/apppasswords)
let mailer = null;
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
  mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD.replace(/\s/g, ''),
    },
  });
  /* ตรวจสอบ credentials ตอน startup */
  mailer.verify().then(() => {
    console.info('[mailer] ✅ Gmail SMTP พร้อมใช้งาน');
  }).catch(err => {
    console.warn('[mailer] ❌ Gmail SMTP ใช้งานไม่ได้:', err.message);
    mailer = null;
  });
} else {
  console.warn('[mailer] GMAIL_USER/GMAIL_APP_PASSWORD not set — ระบบลืมรหัสผ่านจะไม่สามารถส่งอีเมลได้');
}

/* ── Auto-migrate: เพิ่ม column + สร้าง Report Views ─────── */
(async () => {
  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note TEXT`);
  } catch(e) { console.warn('[migrate] invoices.note:', e.message); }

  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS line_discount NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bill_discount NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bill_discount_type VARCHAR(10) NOT NULL DEFAULT 'amount'`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS bill_discount_value NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS line_discount NUMERIC(12,2) NOT NULL DEFAULT 0`);
  } catch(e) { console.warn('[migrate] invoice discount columns:', e.message); }

  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS orig_total NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS orig_vat7 NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adj_amount NUMERIC(12,2) NOT NULL DEFAULT 0`);
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS adj_vat7 NUMERIC(12,2) NOT NULL DEFAULT 0`);
  } catch(e) { console.warn('[migrate] invoice CN/DN adjustment columns:', e.message); }

  try {
    await q(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS logo_url TEXT`);
  } catch(e) { console.warn('[migrate] company logo_url column:', e.message); }

  try {
    await q(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS show_logo_receipt BOOLEAN NOT NULL DEFAULT true`);
  } catch(e) { console.warn('[migrate] company show_logo_receipt column:', e.message); }

  try {
    await q(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS receipt_printer VARCHAR(255)`);
  } catch(e) { console.warn('[migrate] company receipt_printer column:', e.message); }

  try {
    await q(`ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS a4_printer VARCHAR(255)`);
  } catch(e) { console.warn('[migrate] company a4_printer column:', e.message); }

  try {
    await q(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_tax_type_check`);
    await q(`ALTER TABLE products ADD CONSTRAINT products_tax_type_check CHECK (tax_type IN ('vat7','nonvat','vat7_excl'))`);
  } catch(e) { console.warn('[migrate] products tax_type vat7_excl:', e.message); }

  try {
    await q(`ALTER TABLE grn_items DROP CONSTRAINT IF EXISTS grn_items_tax_type_check`);
    await q(`ALTER TABLE grn_items ADD CONSTRAINT grn_items_tax_type_check CHECK (tax_type IN ('vat7','nonvat','vat7_excl'))`);
  } catch(e) { console.warn('[migrate] grn_items tax_type vat7_excl:', e.message); }

  try {
    await q(`ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_tax_type_check`);
    await q(`ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_tax_type_check CHECK (tax_type IN ('vat7','nonvat','vat7_excl'))`);
  } catch(e) { console.warn('[migrate] invoice_items tax_type vat7_excl:', e.message); }

  /* ── Non-negative guards (กันค่าติดลบที่ระดับฐานข้อมูล) ──
     แยก try/catch แต่ละตาราง เพื่อให้ตัวที่ผ่านยังถูกเพิ่ม แม้ตัวอื่นจะมีข้อมูลเดิมที่ละเมิด */
  try {
    await q(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_nonneg_chk`);
    await q(`ALTER TABLE products ADD CONSTRAINT products_nonneg_chk CHECK (sell_price >= 0 AND cost_price >= 0 AND min_qty >= 0)`);
  } catch(e) { console.warn('[migrate] products_nonneg_chk:', e.message); }
  try {
    await q(`ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_nonneg_chk`);
    await q(`ALTER TABLE products ADD CONSTRAINT products_stock_nonneg_chk CHECK (stock_qty >= 0)`);
  } catch(e) { console.warn('[migrate] products_stock_nonneg_chk (มีสินค้าสต็อกติดลบอยู่? แก้ก่อนแล้วรีสตาร์ท):', e.message); }
  try {
    await q(`ALTER TABLE grn_items DROP CONSTRAINT IF EXISTS grn_items_nonneg_chk`);
    await q(`ALTER TABLE grn_items ADD CONSTRAINT grn_items_nonneg_chk CHECK (weight >= 0 AND cost_price >= 0 AND value >= 0)`);
  } catch(e) { console.warn('[migrate] grn_items_nonneg_chk:', e.message); }
  try {
    await q(`ALTER TABLE invoice_items DROP CONSTRAINT IF EXISTS invoice_items_nonneg_chk`);
    await q(`ALTER TABLE invoice_items ADD CONSTRAINT invoice_items_nonneg_chk CHECK (weight >= 0 AND price_per_kg >= 0 AND line_gross >= 0 AND line_discount >= 0)`);
  } catch(e) { console.warn('[migrate] invoice_items_nonneg_chk:', e.message); }

  /* ── ขยายรหัสสินค้าจาก 5 หลัก เป็น 6 หลัก (รองรับรหัสสินค้าใหม่ที่ยาวขึ้น) ── */
  try {
    const { rows: colInfo } = await q(
      `SELECT character_maximum_length FROM information_schema.columns
       WHERE table_schema='public' AND table_name='products' AND column_name='code'`
    );
    if (colInfo[0] && colInfo[0].character_maximum_length === 5) {
      console.log('[migrate] widening product code CHAR(5) -> CHAR(6) ...');
      /* หา FK constraints ทั้งหมดที่ชี้มาที่ products(code) แบบ dynamic */
      const { rows: fkRows } = await q(`
        SELECT tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.referential_constraints rc
          ON tc.constraint_name = rc.constraint_name AND tc.constraint_schema = rc.constraint_schema
        JOIN information_schema.key_column_usage kcu_ref
          ON rc.unique_constraint_name = kcu_ref.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND kcu_ref.table_name = 'products' AND kcu_ref.column_name = 'code'
      `);
      for (const row of fkRows) {
        await q(`ALTER TABLE "${row.table_name}" DROP CONSTRAINT IF EXISTS "${row.constraint_name}"`);
        console.log(`[migrate] dropped FK ${row.constraint_name} on ${row.table_name}`);
      }
      /* ขยายคอลัมน์ทั้งหมด */
      await q(`ALTER TABLE products ALTER COLUMN code TYPE CHAR(6)`);
      for (const t of ['invoice_items','grn_items','adj_items','price_history','stock_ledger']) {
        try { await q(`ALTER TABLE ${t} ALTER COLUMN product_code TYPE CHAR(6)`); } catch(e2) { console.warn(`[migrate] alter ${t}:`, e2.message); }
      }
      /* สร้าง FK กลับคืน */
      const fkDefs = [
        [`invoice_items`, `FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE SET NULL`],
        [`grn_items`,     `FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE SET NULL`],
        [`adj_items`,     `FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE SET NULL`],
        [`price_history`, `FOREIGN KEY (product_code) REFERENCES products(code) ON DELETE CASCADE`],
      ];
      for (const [t, def] of fkDefs) {
        const cname = `${t}_product_code_fkey`;
        try { await q(`ALTER TABLE ${t} DROP CONSTRAINT IF EXISTS "${cname}"`); } catch(_) {}
        try { await q(`ALTER TABLE ${t} ADD CONSTRAINT "${cname}" ${def}`); } catch(e2) { console.warn(`[migrate] re-add FK ${cname}:`, e2.message); }
      }
      console.log('[migrate] product code CHAR(5)->CHAR(6) done');
    }
  } catch(e) { console.warn('[migrate] product code CHAR(5)->CHAR(6):', e.message); }

  try {
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(100)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_hash VARCHAR(255)`);
    await q(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_expires TIMESTAMPTZ`);
  } catch(e) { console.warn('[migrate] users email/reset columns:', e.message); }

  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS replaces_no VARCHAR(50)`);
  } catch(e) { console.warn('[migrate] invoices replaces_no:', e.message); }

  try {
    /* backfill: INV เก่าที่ถูกออกแทนกัน — copy ref_invoice_no → replaces_no ถ้ายัง null */
    await q(`
      UPDATE invoices i1
      SET replaces_no = i1.ref_invoice_no
      WHERE i1.invoice_type = 'INV'
        AND i1.ref_invoice_no IS NOT NULL
        AND i1.replaces_no IS NULL
        AND i1.ref_invoice_no <> i1.invoice_no
        AND EXISTS (
          SELECT 1 FROM invoices i2
          WHERE i2.invoice_no = i1.ref_invoice_no
            AND i2.invoice_type = 'INV'
        )
    `);
  } catch(e) { console.warn('[migrate] backfill replaces_no from ref_invoice_no:', e.message); }

  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS customer_branch VARCHAR(100) NOT NULL DEFAULT 'head'`);
  } catch(e) { console.warn('[migrate] invoices customer_branch:', e.message); }

  /* สร้าง / อัปเดต Report Views ทั้ง 6 tabs */
  const views = [
    /* Tab 1: รายการสินค้า */
    `CREATE OR REPLACE VIEW v_rpt_product_lines AS
     SELECT i.invoice_date,
            TO_CHAR(i.invoice_date,'DD/MM/YY') AS date_display,
            i.invoice_no, i.invoice_type, i.channel,
            COALESCE(i.customer_id,0)                   AS customer_id,
            COALESCE(i.customer_name,'ลูกค้าทั่วไป')     AS customer_name,
            i.payment_method,
            ii.product_code, ii.product_name,
            ii.weight, ii.price_per_kg, ii.tax_type,
            ii.line_gross AS gross_sale,
            CASE WHEN i.gross_sale>0 THEN ROUND(i.discount*ii.line_gross/i.gross_sale,4) ELSE 0 END AS line_discount,
            ii.line_gross - CASE WHEN i.gross_sale>0 THEN ROUND(i.discount*ii.line_gross/i.gross_sale,4) ELSE 0 END AS net_sale,
            CASE WHEN ii.tax_type='vat7'
                 THEN ROUND((ii.line_gross - CASE WHEN i.gross_sale>0 THEN ROUND(i.discount*ii.line_gross/i.gross_sale,4) ELSE 0 END)*7/107,4)
                 ELSE 0 END AS vat7
     FROM invoices i JOIN invoice_items ii ON ii.invoice_id=i.id
     WHERE i.is_voided=FALSE AND i.invoice_type NOT IN ('INV')`,

    /* Tab 2: ภาษีซื้อ-ขาย */
    `CREATE OR REPLACE VIEW v_rpt_tax AS
     SELECT i.invoice_date, TO_CHAR(i.invoice_date,'DD/MM/YY') AS date_display,
            i.invoice_no, i.invoice_type, i.channel,
            COALESCE(i.customer_name,'ลูกค้าทั่วไป') AS customer_name,
            COALESCE(i.customer_tax_id,'') AS customer_tax_id,
            i.gross_sale, i.discount, i.net_sale, i.vat_base, i.vat7, i.total,
            i.payment_method, i.status, i.ref_invoice_no, i.note
     FROM invoices i WHERE i.is_voided=FALSE
     ORDER BY i.invoice_date DESC, i.invoice_no`,

    /* Tab 3: Daily Sale */
    `CREATE OR REPLACE VIEW v_rpt_daily AS
     SELECT invoice_date, TO_CHAR(invoice_date,'DD/MM/YY') AS date_display,
            COUNT(DISTINCT invoice_no) AS bill_count,
            SUM(gross_sale) AS gross, SUM(discount) AS disc,
            SUM(net_sale) AS net, SUM(vat7) AS vat, SUM(total) AS total,
            SUM(CASE WHEN payment_method='cash'     THEN total ELSE 0 END) AS cash,
            SUM(CASE WHEN payment_method='transfer' THEN total ELSE 0 END) AS transfer,
            SUM(CASE WHEN payment_method='credit'   THEN total ELSE 0 END) AS credit,
            SUM(CASE WHEN channel='wholesale' THEN total ELSE 0 END) AS wholesale,
            SUM(CASE WHEN channel='online'    THEN total ELSE 0 END) AS online,
            SUM(CASE WHEN channel='sample'    THEN total ELSE 0 END) AS sample,
            SUM(CASE WHEN channel='expired'   THEN total ELSE 0 END) AS expired,
            SUM(CASE WHEN channel='other'     THEN total ELSE 0 END) AS other
     FROM invoices WHERE is_voided=FALSE AND invoice_type NOT IN ('INV')
     GROUP BY invoice_date ORDER BY invoice_date DESC`,

    /* Tab 4: Payment */
    `CREATE OR REPLACE VIEW v_rpt_payment AS
     SELECT payment_method,
            COUNT(DISTINCT invoice_no) AS bill_count,
            SUM(net_sale) AS net, SUM(vat7) AS vat, SUM(total) AS total,
            ROUND(SUM(total)*100.0/NULLIF(SUM(SUM(total)) OVER(),0),2) AS pct
     FROM invoices WHERE is_voided=FALSE AND invoice_type NOT IN ('INV')
     GROUP BY payment_method ORDER BY total DESC`,

    /* Tab 5: % Discount */
    `CREATE OR REPLACE VIEW v_rpt_discount AS
     SELECT i.invoice_date, TO_CHAR(i.invoice_date,'DD/MM/YY') AS date_display,
            i.invoice_no, COALESCE(i.customer_name,'ลูกค้าทั่วไป') AS customer_name,
            i.channel, i.gross_sale, i.discount, i.net_sale, i.total,
            CASE WHEN i.gross_sale>0 THEN ROUND(i.discount/i.gross_sale*100,2) ELSE 0 END AS discount_pct,
            i.payment_method
     FROM invoices i
     WHERE i.is_voided=FALSE AND i.discount>0 AND i.invoice_type NOT IN ('INV')
     ORDER BY i.invoice_date DESC`,

    /* Tab 6: รายลูกค้า */
    `CREATE OR REPLACE VIEW v_rpt_customer AS
     SELECT COALESCE(i.customer_id,0) AS customer_id,
            COALESCE(c.code,'—')      AS customer_code,
            COALESCE(i.customer_name,'ไม่ระบุ') AS customer_name,
            COALESCE(c.type,'walk-in')  AS customer_type,
            COALESCE(i.customer_tax_id,'') AS customer_tax_id,
            COALESCE(c.tel,'')          AS tel,
            COALESCE(c.address,'')      AS address,
            COUNT(DISTINCT i.invoice_no) AS bill_count,
            COALESCE(SUM(ii.weight),0)   AS total_weight,
            SUM(i.discount)              AS total_discount,
            SUM(i.total)                 AS total_amount,
            MAX(i.invoice_date)          AS last_purchase
     FROM invoices i
     LEFT JOIN customers     c  ON c.id=i.customer_id
     LEFT JOIN invoice_items ii ON ii.invoice_id=i.id
     WHERE i.is_voided=FALSE AND i.invoice_type NOT IN ('INV')
     GROUP BY i.customer_id,c.code,i.customer_name,c.type,i.customer_tax_id,c.tel,c.address
     ORDER BY total_amount DESC`,
  ];

  for (const sql of views) {
    try {
      await q(sql);
    } catch(e) { console.warn('[migrate] view error:', e.message); }
  }
  console.log('✅ Report views ready (v_rpt_product_lines, v_rpt_tax, v_rpt_daily, v_rpt_payment, v_rpt_discount, v_rpt_customer)');

  /* ── Stock Management Views ──────────────────────────── */
  const stockViews = [
    /* v_rpt_stock_in: GRN รับเข้า รายวัน + รายสินค้า */
    `CREATE OR REPLACE VIEW v_rpt_stock_in AS
     SELECT
       g.grn_date,
       TO_CHAR(g.grn_date,'DD/MM/YY') AS date_display,
       g.grn_no,
       g.receiver,
       g.po_no,
       gi.product_code,
       gi.product_name,
       SUM(gi.weight)               AS total_weight,
       AVG(gi.cost_price)           AS avg_cost,
       SUM(gi.value)                AS total_value,
       gi.tax_type,
       g.note
     FROM grn_headers g
     JOIN grn_items   gi ON gi.grn_id = g.id
     GROUP BY g.grn_date, g.grn_no, g.receiver, g.po_no,
              gi.product_code, gi.product_name, gi.tax_type, g.note
     ORDER BY g.grn_date DESC, g.grn_no`,

    /* v_rpt_stock_adj: การปรับปรุงสต็อกรายวัน */
    `CREATE OR REPLACE VIEW v_rpt_stock_adj AS
     SELECT
       a.adj_date,
       TO_CHAR(a.adj_date,'DD/MM/YY') AS date_display,
       a.adj_no,
       a.reason,
       a.created_by,
       ai.product_code,
       ai.product_name,
       ai.qty_before,
       ai.qty_adjust,
       ai.qty_after,
       ai.note AS item_note
     FROM adj_headers a
     JOIN adj_items   ai ON ai.adj_id = a.id
     ORDER BY a.adj_date DESC, a.adj_no`,

    /* v_rpt_stock_ledger: stock movement log รวม */
    `CREATE OR REPLACE VIEW v_rpt_stock_ledger AS
     SELECT
       sl.movement_date                              AS date_iso,
       TO_CHAR(sl.movement_date,'DD/MM/YY')          AS date_display,
       sl.movement_time                              AS time,
       sl.movement_type                              AS type,
       sl.product_code                               AS code,
       sl.product_name                               AS prod,
       sl.quantity                                   AS w,
       sl.balance                                    AS bal,
       sl.ref_no                                     AS ref,
       sl.ref_type,
       COALESCE(sl.channel,'—')                      AS channel
     FROM stock_ledger sl
     ORDER BY sl.movement_date DESC, sl.movement_time DESC`,

    /* v_rpt_stock_summary: สรุปสต็อกรายสินค้า */
    `CREATE OR REPLACE VIEW v_rpt_stock_summary AS
     SELECT
       p.code,
       p.name,
       p.category,
       p.stock_qty                                        AS current_stock,
       p.min_qty                                          AS min_stock,
       p.cost_price,
       ROUND(p.stock_qty * p.cost_price, 2)               AS stock_value,
       CASE
         WHEN p.stock_qty <= 0             THEN 'หมด'
         WHEN p.stock_qty <= p.min_qty     THEN 'ใกล้หมด'
         ELSE 'ปกติ'
       END                                                AS status,
       COALESCE(
         (SELECT SUM(ii.weight) FROM invoice_items ii
          JOIN invoices iv ON iv.id=ii.invoice_id
          WHERE ii.product_code=p.code AND iv.is_voided=FALSE
            AND iv.invoice_date >= DATE_TRUNC('month',CURRENT_DATE)),
         0
       )                                                  AS sold_this_month,
       COALESCE(
         (SELECT SUM(gi.weight) FROM grn_items gi
          JOIN grn_headers gh ON gh.id=gi.grn_id
          WHERE gi.product_code=p.code
            AND gh.grn_date >= DATE_TRUNC('month',CURRENT_DATE)),
         0
       )                                                  AS received_this_month
     FROM products p
     WHERE p.is_active=TRUE
     ORDER BY p.stock_qty/NULLIF(p.min_qty,0) ASC`,
  ];

  for (const sql of stockViews) {
    try {
      await q(sql);
    } catch(e) { console.warn('[migrate] stock view error:', e.message); }
  }
  console.log('✅ Stock views ready (v_rpt_stock_in, v_rpt_stock_adj, v_rpt_stock_ledger, v_rpt_stock_summary)');
})();

// ── HEALTH ────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: new Date() }));

// ══════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════
app.get('/api/products', async (_, res) => {
  try {
    const { rows } = await q(
      `SELECT id, code, name, category AS cat, sell_price AS sell,
              cost_price AS cost, stock_qty AS stock, min_qty AS min,
              tax_type AS tax, unit_type AS "unitType", unit_label AS "unitLabel", is_active
       FROM products WHERE is_active = TRUE ORDER BY code`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:code/stock', async (req, res) => {
  const { code } = req.params;
  const { stock_qty } = req.body;
  try {
    await q(`UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE code = $2`, [stock_qty, code]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  CUSTOMERS
// ══════════════════════════════════════════════════════════
app.get('/api/customers', async (_, res) => {
  try {
    const { rows } = await q(
      `SELECT id, code, name, type, tax_id AS tax, tel, address AS addr, discount, is_active, branch
       FROM customers WHERE is_active = TRUE ORDER BY code`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  INVOICES
// ══════════════════════════════════════════════════════════
app.get('/api/invoices', async (req, res) => {
  const { type, channel, from, to, voided } = req.query;
  try {
    let where = ['1=1'];
    let params = [];
    let i = 1;
    if (type)    { where.push(`invoice_type = $${i++}`); params.push(type); }
    if (channel) { where.push(`channel = $${i++}`);      params.push(channel); }
    if (from)    { where.push(`invoice_date >= $${i++}`); params.push(from); }
    if (to)      { where.push(`invoice_date <= $${i++}`); params.push(to); }
    if (voided === 'false') { where.push('is_voided = FALSE'); }

    const { rows } = await q(
      `SELECT
         i.id,
         i.invoice_no AS no,
         -- Map DB type to frontend type
         CASE WHEN i.invoice_type = 'TIV' THEN 'Thermal'
              WHEN i.invoice_type = 'INV' THEN 'A4'
              ELSE i.invoice_type END AS type,
         i.invoice_type AS "invoiceType",
         i.channel,
         -- thermalNo: TIV = own number, INV = ref TIV number, others = null
         CASE WHEN i.invoice_type = 'TIV' THEN i.invoice_no
              WHEN i.invoice_type = 'INV' THEN i.ref_invoice_no
              ELSE NULL END AS "thermalNo",
         i.full_inv_no AS "fullInvNo",
         i.customer_id AS "custId",
         i.customer_name AS "custName",
         i.customer_tax_id AS "custTax",
         i.invoice_date AS date,
         TO_CHAR(i.invoice_date,'DD/MM/') || (EXTRACT(YEAR FROM i.invoice_date)+543-2500)::int AS "dateDisplay",
         i.gross_sale AS "grossSale",
         i.discount,
         i.line_discount AS "lineDiscount",
         i.bill_discount AS "billDiscount",
         i.bill_discount_type AS "billDiscType",
         i.bill_discount_value AS "billDiscNum",
         i.net_sale AS "netSale",
         i.vat_base AS "vatBase",
         i.vat7,
         i.total,
         i.orig_total AS "origTotal",
         i.orig_vat7 AS "origVat7",
         i.adj_amount AS "adjAmount",
         i.adj_vat7 AS "adjVat7",
         i.payment_method AS pay,
         i.status,
         i.is_voided AS voided,
         i.voided_at AS "voidedAt",
         i.voided_by AS "voidedBy",
         i.void_reason AS "voidReason",
         i.stock_restored AS "stockRestored",
         i.print_count AS "printCount",
         i.note,
         COALESCE(i.customer_branch,'head') AS "custBranch",
         i.replaces_no AS replaces,
         COALESCE(
           json_agg(
             json_build_object(
               'code', ii.product_code,
               'name', ii.product_name,
               'weight', ii.weight,
               'price', ii.price_per_kg,
               'tax', ii.tax_type,
               'disc', ii.line_discount
             ) ORDER BY ii.sort_order
           ) FILTER (WHERE ii.id IS NOT NULL), '[]'
         ) AS items
       FROM invoices i
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE ${where.join(' AND ')}
       GROUP BY i.id
       ORDER BY i.invoice_date DESC, i.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// สร้างใบกำกับใหม่ (TIV หรือ ISS)
app.post('/api/invoices', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      invoice_type, prefix: reqPrefix, channel, ref_invoice_no, customer_id, customer_name,
      customer_tax_id, invoice_date, gross_sale, discount, net_sale,
      vat_base, vat7, total, payment_method, items, created_by,
      line_discount, bill_discount, bill_discount_type, bill_discount_value,
      orig_total, orig_vat7, adj_amount, adj_vat7, replaces_no, customer_branch
    } = req.body;

    // Get next invoice number — ใช้ prefix จาก frontend หรือ company_settings
    const now    = new Date(invoice_date || Date.now());
    const yyCE   = String(now.getFullYear()).slice(-2);
    const mm     = String(now.getMonth() + 1).padStart(2, '0');
    const ym     = `${now.getFullYear()}${mm}`;     // สำหรับ document_counters key
    const yymm   = `${yyCE}${mm}`;                  // สำหรับหมายเลขเอกสาร (26 06)

    // prefix: ถ้า frontend ส่งมา ใช้นั้น, ไม่งั้นอ่านจาก company_settings
    let prefix = reqPrefix || invoice_type;
    if (!reqPrefix) {
      const pfxCol = `prefix_${invoice_type.toLowerCase()}`;
      const pfxMap = { 'prefix_tiv':'prefix_tiv','prefix_iss':'prefix_iss','prefix_inv':'prefix_inv',
                       'prefix_cn':'prefix_cn','prefix_dn':'prefix_dn' };
      if (pfxMap[pfxCol]) {
        const cs = await client.query(`SELECT ${pfxCol} FROM company_settings WHERE id=1`);
        if (cs.rows[0]?.[pfxCol]) prefix = cs.rows[0][pfxCol];
      }
    }

    // ISS ไม่ reset รายเดือน → ใช้ year_month '000000' เป็น global key
    const ctrKey = invoice_type === 'ISS' ? '000000' : ym;
    const ctrRes = await client.query(
      `INSERT INTO document_counters (prefix, year_month, last_counter)
       VALUES ($1, $2, 1)
       ON CONFLICT (prefix, year_month) DO UPDATE
         SET last_counter = document_counters.last_counter + 1
       RETURNING last_counter`,
      [prefix, ctrKey]
    );
    const num = ctrRes.rows[0].last_counter;
    // format: PREFIX + YYMM + 3-digit (e.g. TIV2606001) — ไม่มีขีดกลาง
    const invoice_no = invoice_type === 'ISS'
      ? `${prefix}${String(num).padStart(3,'0')}`           // ISS ไม่มี YYMM
      : `${prefix}${yymm}${String(num).padStart(3,'0')}`;

    // Insert invoice
    const invRes = await client.query(
      `INSERT INTO invoices (
         invoice_no, invoice_type, channel, ref_invoice_no,
         customer_id, customer_name, customer_tax_id, customer_branch,
         invoice_date, gross_sale, discount, net_sale,
         vat_base, vat7, total, payment_method, note, created_by,
         line_discount, bill_discount, bill_discount_type, bill_discount_value,
         orig_total, orig_vat7, adj_amount, adj_vat7, replaces_no
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       RETURNING id`,
      [invoice_no, invoice_type, channel, ref_invoice_no || null,
       customer_id || null, customer_name, customer_tax_id || null, customer_branch || 'head',
       invoice_date, gross_sale, discount, net_sale,
       vat_base, vat7, total, payment_method, req.body.note || null, created_by || 1,
       line_discount || 0, bill_discount || 0, bill_discount_type || 'amount', bill_discount_value || 0,
       orig_total || 0, orig_vat7 || 0, adj_amount || 0, adj_vat7 || 0, replaces_no || null]
    );
    const invoice_id = invRes.rows[0].id;

    // Insert items
    if (items && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];

        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_code, product_name, weight, price_per_kg, tax_type, line_gross, line_discount, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [invoice_id, it.code, it.name, it.weight, it.price, it.tax, it.weight * it.price, it.disc || 0, idx + 1]
        );

        // INV (เต็มรูป) อ้างอิง TIV ที่ตัดสต็อกไปแล้ว — ไม่ตัดสต็อกซ้ำ
        if (invoice_type !== 'INV') {
          // Server-side guard: ห้ามขายติดลบ
          const stockCheck = await client.query(
            `SELECT stock_qty FROM products WHERE code = $1`, [it.code]
          );
          const currentStock = Number(stockCheck.rows[0]?.stock_qty ?? 0);
          if (currentStock < Number(it.weight)) {
            throw new Error(
              `สต็อกไม่เพียงพอ: ${it.name} มี ${currentStock.toFixed(3)} KG ต้องการ ${Number(it.weight).toFixed(3)} KG`
            );
          }
          // Update stock
          await client.query(
            `UPDATE products SET stock_qty = stock_qty - $1, updated_at = NOW() WHERE code = $2`,
            [it.weight, it.code]
          );
          // Ledger entry
          const bal = await client.query(`SELECT stock_qty FROM products WHERE code = $1`, [it.code]);
          await client.query(
            `INSERT INTO stock_ledger (product_code, product_name, movement_type, quantity, balance, ref_no, ref_type, channel, movement_date, movement_time)
             VALUES ($1,$2,'out',$3,$4,$5,'ขายออก',$6,$7,CURRENT_TIME)`,
            [it.code, it.name, it.weight, bal.rows[0]?.stock_qty ?? 0, invoice_no, channel, invoice_date]
          );
        }
      }
    }

    await client.query('COMMIT');
    res.json({ ok: true, invoice_no, invoice_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// Update TIV's full_inv_no after INV is issued (or clear it on void)
app.patch('/api/invoices/:id/full_inv_no', async (req, res) => {
  const { id } = req.params;
  const { full_inv_no } = req.body; // null to clear
  try {
    await q(
      `UPDATE invoices SET full_inv_no = $1, updated_at = NOW() WHERE id = $2`,
      [full_inv_no || null, id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Void invoice
app.patch('/api/invoices/:id/void', async (req, res) => {
  const { id } = req.params;
  const { voided_by, void_reason, restore_stock } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const inv = await client.query(`SELECT * FROM invoices WHERE id = $1`, [id]);
    if (!inv.rows.length) throw new Error('Invoice not found');
    const invoice = inv.rows[0];
    if (invoice.is_voided) throw new Error('Already voided');

    await client.query(
      `UPDATE invoices SET is_voided=TRUE, status='voided', voided_at=NOW(),
       voided_by=$1, void_reason=$2, stock_restored=$3, updated_at=NOW()
       WHERE id=$4`,
      [voided_by, void_reason, !!restore_stock, id]
    );

    if (restore_stock) {
      const items = await client.query(`SELECT * FROM invoice_items WHERE invoice_id = $1`, [id]);
      for (const it of items.rows) {
        await client.query(
          `UPDATE products SET stock_qty = stock_qty + $1, updated_at = NOW() WHERE code = $2`,
          [it.weight, it.product_code]
        );
        const bal = await client.query(`SELECT stock_qty FROM products WHERE code = $1`, [it.product_code]);
        await client.query(
          `INSERT INTO stock_ledger (product_code, product_name, movement_type, quantity, balance, ref_no, ref_type, channel, movement_date, movement_time)
           VALUES ($1,$2,'in',$3,$4,$5,'คืนสต็อก (Void)',NULL,CURRENT_DATE,CURRENT_TIME)`,
          [it.product_code, it.product_name, it.weight, bal.rows[0]?.stock_qty ?? 0, invoice.invoice_no]
        );
      }
    }
    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ══════════════════════════════════════════════════════════
//  GRN
// ══════════════════════════════════════════════════════════
app.get('/api/grn', async (_, res) => {
  try {
    const { rows } = await q(
      `SELECT
         h.id, h.grn_no AS id_str, h.grn_date AS date,
         TO_CHAR(h.grn_date,'DD/MM/') || (EXTRACT(YEAR FROM h.grn_date)+543-2500)::int AS "dateDisplay",
         h.po_no AS "poNo", h.receiver, h.note,
         h.total_packs AS "totalPacks",
         h.total_weight AS "totalWeight",
         h.total_value AS "totalValue",
         COALESCE(
           json_agg(
             json_build_object(
               'code', gi.product_code,
               'name', gi.product_name,
               'packNo', gi.pack_no,
               'weight', gi.weight,
               'cost', gi.cost_price,
               'value', gi.value,
               'tax', gi.tax_type
             ) ORDER BY gi.sort_order
           ) FILTER (WHERE gi.id IS NOT NULL), '[]'
         ) AS items
       FROM grn_headers h
       LEFT JOIN grn_items gi ON gi.grn_id = h.id
       GROUP BY h.id
       ORDER BY h.grn_date DESC, h.id DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/grn', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { grn_date, prefix: reqPrefix, po_no, receiver, note, items, created_by } = req.body;

    const now   = new Date(grn_date || Date.now());
    const yyCE  = String(now.getFullYear()).slice(-2);
    const mm    = String(now.getMonth() + 1).padStart(2, '0');
    const ym    = `${now.getFullYear()}${mm}`;
    const yymm  = `${yyCE}${mm}`;

    let prefix = reqPrefix || 'GRN';
    if (!reqPrefix) {
      const cs = await client.query(`SELECT prefix_grn FROM company_settings WHERE id=1`);
      if (cs.rows[0]?.prefix_grn) prefix = cs.rows[0].prefix_grn;
    }

    const ctr = await client.query(
      `INSERT INTO document_counters (prefix, year_month, last_counter)
       VALUES ($1, $2, 1)
       ON CONFLICT (prefix, year_month) DO UPDATE SET last_counter = document_counters.last_counter + 1
       RETURNING last_counter`,
      [prefix, ym]
    );
    const grn_no = `${prefix}${yymm}${String(ctr.rows[0].last_counter).padStart(3,'0')}`;

    const totWeight = items.reduce((s, i) => s + Number(i.weight), 0);
    const totValue  = items.reduce((s, i) => s + Number(i.value),  0);

    const gRes = await client.query(
      `INSERT INTO grn_headers (grn_no, grn_date, po_no, receiver, note, total_packs, total_weight, total_value, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [grn_no, grn_date, po_no, receiver, note, items.length, totWeight, totValue, created_by || 1]
    );
    const grn_id = gRes.rows[0].id;

    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      await client.query(
        `INSERT INTO grn_items (grn_id, product_code, product_name, pack_no, weight, cost_price, value, tax_type, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [grn_id, it.code, it.name, it.pack_no, it.weight, it.cost, it.value, it.tax || 'vat7', idx + 1]
      );
      await client.query(
        `UPDATE products SET stock_qty = stock_qty + $1, updated_at = NOW() WHERE code = $2`,
        [it.weight, it.code]
      );
      const bal = await client.query(`SELECT stock_qty FROM products WHERE code = $1`, [it.code]);
      await client.query(
        `INSERT INTO stock_ledger (product_code, product_name, movement_type, quantity, balance, ref_no, ref_type, channel, movement_date, movement_time)
         VALUES ($1,$2,'in',$3,$4,$5,'รับเข้า',NULL,$6,CURRENT_TIME)`,
        [it.code, it.name, it.weight, bal.rows[0]?.stock_qty ?? 0, grn_no, grn_date]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, grn_no, grn_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

// ══════════════════════════════════════════════════════════
//  STOCK LEDGER
// ══════════════════════════════════════════════════════════
app.get('/api/ledger', async (req, res) => {
  const { code } = req.query;
  try {
    let where = '1=1';
    const params = [];
    if (code) { where = 'product_code = $1'; params.push(code); }
    const { rows } = await q(
      `SELECT product_code AS code, product_name AS prod, movement_type AS type,
              quantity AS w, balance AS bal, ref_no AS ref, ref_type AS "refType",
              channel, movement_date AS "dateISO",
              TO_CHAR(movement_date,'DD/MM/') || (EXTRACT(YEAR FROM movement_date)+543-2500)::int AS date,
              movement_time AS time
       FROM stock_ledger WHERE ${where}
       ORDER BY movement_date DESC, created_at DESC LIMIT 500`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  DOCUMENT COUNTERS (สำหรับ UI แสดง next number)
// ══════════════════════════════════════════════════════════
app.get('/api/counters', async (_, res) => {
  try {
    const { rows } = await q(`SELECT prefix, year_month, last_counter FROM document_counters ORDER BY prefix, year_month`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  COMPANY SETTINGS
// ══════════════════════════════════════════════════════════
app.get('/api/company', async (_, res) => {
  try {
    const { rows } = await q(`SELECT * FROM company_settings WHERE id = 1`);
    res.json(rows[0] || {});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/company', async (req, res) => {
  const { name, address, tax_id, tel, email, vat_rate, logo_url, show_logo_receipt, receipt_printer, a4_printer,
          prefix_grn, prefix_adj, prefix_iss, prefix_tiv, prefix_inv, prefix_cn, prefix_dn } = req.body;
  try {
    await q(
      `UPDATE company_settings
       SET name=$1, address=$2, tax_id=$3, tel=$4, email=$5,
           vat_rate=COALESCE($6, vat_rate),
           logo_url=$7,
           show_logo_receipt=COALESCE($8, show_logo_receipt),
           receipt_printer=$9,
           a4_printer=$10,
           prefix_grn=COALESCE(NULLIF($11,''), prefix_grn),
           prefix_adj=COALESCE(NULLIF($12,''), prefix_adj),
           prefix_iss=COALESCE(NULLIF($13,''), prefix_iss),
           prefix_tiv=COALESCE(NULLIF($14,''), prefix_tiv),
           prefix_inv=COALESCE(NULLIF($15,''), prefix_inv),
           prefix_cn =COALESCE(NULLIF($16,''), prefix_cn),
           prefix_dn =COALESCE(NULLIF($17,''), prefix_dn),
           updated_at=NOW()
       WHERE id=1`,
      [name, address, tax_id, tel, email||'', vat_rate||null, logo_url || null,
       typeof show_logo_receipt === 'boolean' ? show_logo_receipt : null,
       receipt_printer || null, a4_printer || null,
       prefix_grn||'', prefix_adj||'', prefix_iss||'', prefix_tiv||'', prefix_inv||'', prefix_cn||'', prefix_dn||'']
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════
app.get('/api/users', async (_, res) => {
  try {
    const { rows } = await q(
      `SELECT id, name, username, email, role, is_active AS active, last_login_at AS last FROM users ORDER BY id`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  AUTH (login / forgot password / reset password)
// ══════════════════════════════════════════════════════════
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'กรุณากรอก Username และ Password' });
  try {
    const { rows } = await q(
      `SELECT id, name, username, role, password_hash, is_active FROM users WHERE username=$1`,
      [username]
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Username หรือ Password ไม่ถูกต้อง' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Username หรือ Password ไม่ถูกต้อง' });

    await q(`UPDATE users SET last_login_at=NOW() WHERE id=$1`, [user.id]);
    res.json({ ok: true, user: { id: user.id, name: user.name, username: user.username, role: user.role } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'กรุณากรอก Username' });
  try {
    const { rows } = await q(`SELECT id, name, email FROM users WHERE username=$1 AND is_active`, [username]);
    const user = rows[0];
    // ไม่บอกว่าพบ/ไม่พบ username เพื่อความปลอดภัย — ตอบ ok เสมอถ้า request ถูกต้อง
    if (!user || !user.email) {
      return res.status(404).json({ error: 'ไม่พบบัญชีผู้ใช้นี้ หรือยังไม่มีอีเมลผูกกับบัญชี กรุณาติดต่อผู้ดูแลระบบ' });
    }
    if (!mailer) {
      return res.status(503).json({ error: 'เซิร์ฟเวอร์ยังไม่ได้ตั้งค่าระบบส่งอีเมล (GMAIL_USER/GMAIL_APP_PASSWORD)' });
    }

    const code = String(crypto.randomInt(100000, 1000000)); // 6 หลัก
    const codeHash = await bcrypt.hash(code, 10);
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 นาที

    await q(`UPDATE users SET reset_code_hash=$1, reset_code_expires=$2 WHERE id=$3`,
      [codeHash, expires, user.id]);

    await mailer.sendMail({
      from: `NEXflow <${process.env.GMAIL_USER}>`,
      to: user.email,
      subject: 'รหัสยืนยันสำหรับรีเซ็ตรหัสผ่าน NEXflow',
      text: `สวัสดีคุณ ${user.name}\n\nรหัสยืนยันสำหรับรีเซ็ตรหัสผ่านของคุณคือ: ${code}\nรหัสนี้จะหมดอายุภายใน 10 นาที\n\nหากคุณไม่ได้เป็นผู้ขอรีเซ็ตรหัสผ่าน กรุณาเพิกเฉยต่ออีเมลนี้`,
    });

    // ปกปิดอีเมลผู้ใช้บางส่วนตอนตอบกลับ
    const masked = user.email.replace(/^(.{2}).+(@.+)$/, '$1***$2');
    res.json({ ok: true, email: masked });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { username, code, newPassword } = req.body;
  if (!username || !code || !newPassword) return res.status(400).json({ error: 'ข้อมูลไม่ครบถ้วน' });
  if (newPassword.length < 4) return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 4 ตัวอักษร' });
  try {
    const { rows } = await q(
      `SELECT id, reset_code_hash, reset_code_expires FROM users WHERE username=$1 AND is_active`,
      [username]
    );
    const user = rows[0];
    if (!user || !user.reset_code_hash || !user.reset_code_expires) {
      return res.status(400).json({ error: 'ไม่พบคำขอรีเซ็ตรหัสผ่าน กรุณาขอรหัสยืนยันใหม่' });
    }
    if (new Date(user.reset_code_expires) < new Date()) {
      return res.status(400).json({ error: 'รหัสยืนยันหมดอายุแล้ว กรุณาขอรหัสใหม่' });
    }
    const ok = await bcrypt.compare(code, user.reset_code_hash);
    if (!ok) return res.status(400).json({ error: 'รหัสยืนยันไม่ถูกต้อง' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await q(
      `UPDATE users SET password_hash=$1, reset_code_hash=NULL, reset_code_expires=NULL, updated_at=NOW() WHERE id=$2`,
      [password_hash, user.id]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('USER_PASSWORD_RESET', $1, $2, $3)`,
      [username, username, 'รีเซ็ตรหัสผ่านผ่านอีเมลยืนยัน']);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  STOCK ADJUSTMENTS (ADJ)
// ══════════════════════════════════════════════════════════
app.post('/api/adj', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { adj_date, prefix: reqPrefix, adj_type, reason, note, approver, items, created_by } = req.body;

    const now   = new Date(adj_date || Date.now());
    const yyCE  = String(now.getFullYear()).slice(-2);
    const mm    = String(now.getMonth() + 1).padStart(2, '0');
    const ym    = `${now.getFullYear()}${mm}`;
    const yymm  = `${yyCE}${mm}`;

    let prefix = reqPrefix || 'ADJ';
    if (!reqPrefix) {
      const cs = await client.query(`SELECT prefix_adj FROM company_settings WHERE id=1`);
      if (cs.rows[0]?.prefix_adj) prefix = cs.rows[0].prefix_adj;
    }

    const ctr = await client.query(
      `INSERT INTO document_counters (prefix, year_month, last_counter)
       VALUES ($1, $2, 1)
       ON CONFLICT (prefix, year_month) DO UPDATE SET last_counter = document_counters.last_counter + 1
       RETURNING last_counter`,
      [prefix, ym]
    );
    const adj_no = `${prefix}${yymm}${String(ctr.rows[0].last_counter).padStart(3,'0')}`;

    const adjRes = await client.query(
      `INSERT INTO adj_headers (adj_no, adj_date, adj_type, reason, note, approver, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [adj_no, adj_date || localISODate(now), adj_type, reason, note || null, approver || null, created_by || 1]
    );
    const adj_id = adjRes.rows[0].id;

    for (const it of items) {
      const qty_before = it.before;
      const qty_adjust = it.adj;     // signed: + = add, - = deduct
      const qty_after  = Math.max(0, qty_before + qty_adjust);

      await client.query(
        `INSERT INTO adj_items (adj_id, product_code, product_name, qty_before, qty_adjust, qty_after, note)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [adj_id, it.code, it.name, qty_before, qty_adjust, qty_after, note || null]
      );
      await client.query(
        `UPDATE products SET stock_qty = $1, updated_at = NOW() WHERE code = $2`,
        [qty_after, it.code]
      );
      // Audit log
      await client.query(
        `INSERT INTO audit_log (action_type, doc_no, username, reason, details)
         VALUES ('STOCK_ADJ', $1, $2, $3, $4)`,
        [adj_no, approver || 'Admin Kanya', `${adj_type}: ${reason}`,
         JSON.stringify({ code: it.code, before: qty_before, adjust: qty_adjust, after: qty_after })]
      );
      // Ledger
      const mv_type = qty_adjust >= 0 ? 'adj' : 'adj';
      await client.query(
        `INSERT INTO stock_ledger (product_code, product_name, movement_type, quantity, balance, ref_no, ref_type, channel, movement_date, movement_time)
         VALUES ($1,$2,'adj',$3,$4,$5,$6,$7,$8,CURRENT_TIME)`,
        [it.code, it.name, Math.abs(qty_adjust), qty_after, adj_no,
         `ปรับปรุงสต็อก (${reason})`, adj_type, adj_date || localISODate(now)]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true, adj_no, adj_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.get('/api/adj', async (_, res) => {
  try {
    const { rows } = await q(
      `SELECT h.id, h.adj_no, h.adj_date,
              TO_CHAR(h.adj_date,'DD/MM/') || (EXTRACT(YEAR FROM h.adj_date)+543-2500)::int AS date_display,
              h.adj_type, h.reason, h.note, h.approver, h.created_at,
              COALESCE(json_agg(json_build_object(
                'code', i.product_code, 'name', i.product_name,
                'before', i.qty_before, 'adj', i.qty_adjust, 'after', i.qty_after, 'note', i.note
              ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS items
       FROM adj_headers h LEFT JOIN adj_items i ON i.adj_id = h.id
       GROUP BY h.id ORDER BY h.created_at DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  PRODUCTS CRUD
// ══════════════════════════════════════════════════════════
app.post('/api/products', async (req, res) => {
  const { code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type, unit_type, unit_label } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO products (code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type, unit_type, unit_label)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [code, name, category, sell_price, cost_price, stock_qty || 0, min_qty, tax_type || 'vat7',
       unit_type === 'unit' ? 'unit' : 'kg', unit_label || (unit_type === 'unit' ? 'หน่วย' : 'KG')]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('PRODUCT_CREATE', $1, $2)`,
      [code, `สร้างสินค้า ${name}`]);
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:code', async (req, res) => {
  const { code } = req.params;
  const { name, category, sell_price, cost_price, min_qty, tax_type, unit_type, unit_label, is_active, updated_by } = req.body;
  try {
    await q(
      `UPDATE products SET name=$1, category=$2, sell_price=$3, cost_price=$4,
       min_qty=$5, tax_type=$6, unit_type=$7, unit_label=$8, is_active=$9, updated_at=NOW() WHERE code=$10`,
      [name, category, sell_price, cost_price, min_qty, tax_type,
       unit_type === 'unit' ? 'unit' : 'kg', unit_label || (unit_type === 'unit' ? 'หน่วย' : 'KG'),
       is_active !== false, code]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('PRODUCT_UPDATE', $1, $2, $3)`,
      [code, updated_by || 'Admin Kanya', `แก้ไขสินค้า ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  CUSTOMERS CRUD
// ══════════════════════════════════════════════════════════
app.post('/api/customers', async (req, res) => {
  const { code, name, type, tax_id, tel, address, discount, branch } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO customers (code, name, type, tax_id, tel, address, discount, branch)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [code, name, type || 'wholesale', tax_id || '', tel || '', address || '', discount || 0, branch || 'head']
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('CUSTOMER_CREATE', $1, $2)`,
      [code, `สร้างลูกค้า ${name}`]);
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:code', async (req, res) => {
  const { code } = req.params;
  const { name, type, tax_id, tel, address, discount, branch, is_active, updated_by } = req.body;
  try {
    await q(
      `UPDATE customers SET name=$1, type=$2, tax_id=$3, tel=$4, address=$5,
       discount=$6, branch=$7, is_active=$8, updated_at=NOW() WHERE code=$9`,
      [name, type, tax_id || '', tel || '', address || '', discount || 0, branch || 'head', is_active !== false, code]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('CUSTOMER_UPDATE', $1, $2, $3)`,
      [code, updated_by || 'Admin Kanya', `แก้ไขลูกค้า ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  USERS CRUD
// ══════════════════════════════════════════════════════════
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, role, is_active, password, updated_by } = req.body;
  try {
    if (password) {
      const password_hash = await bcrypt.hash(password, 10);
      await q(
        `UPDATE users SET name=$1, email=$2, role=$3, is_active=$4, password_hash=$5, updated_at=NOW() WHERE id=$6`,
        [name, email || null, role, is_active !== false, password_hash, id]
      );
    } else {
      await q(
        `UPDATE users SET name=$1, email=$2, role=$3, is_active=$4, updated_at=NOW() WHERE id=$5`,
        [name, email || null, role, is_active !== false, id]
      );
    }
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('USER_UPDATE', $1, $2, $3)`,
      [String(id), updated_by || 'Admin Kanya', `แก้ไขผู้ใช้ ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  const { name, username, email, password, role } = req.body;
  try {
    const password_hash = await bcrypt.hash(password || Math.random().toString(36).slice(2), 10);
    const { rows } = await q(
      `INSERT INTO users (name, username, email, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      [name, username, email || null, password_hash, role || 'Staff']
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('USER_CREATE', $1, $2)`,
      [username, `สร้างผู้ใช้ ${name}`]);
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Toggle product active/inactive (suspend / reactivate)
app.patch('/api/products/:code/active', async (req, res) => {
  const { code } = req.params;
  const { is_active } = req.body;
  try {
    await q(`UPDATE products SET is_active=$1, updated_at=NOW() WHERE code=$2`, [is_active, code]);
    const action = is_active ? 'เปิดการใช้งาน' : 'ปิดการใช้งาน';
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('PRODUCT_UPDATE', $1, $2, $3)`,
      [code, 'Admin', `${action}สินค้า`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Soft-delete product
app.delete('/api/products/:code', async (req, res) => {
  const { code } = req.params;
  const { deleted_by } = req.body || {};
  try {
    await q(`UPDATE products SET is_active = FALSE, updated_at = NOW() WHERE code = $1`, [code]);
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('PRODUCT_DELETE', $1, $2, $3)`,
      [code, deleted_by || 'Admin', 'ลบสินค้า']);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Soft-delete user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { deleted_by } = req.body || {};
  try {
    await q(`UPDATE users SET is_active=false, updated_at=NOW() WHERE id=$1`, [id]);
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('USER_DELETE', $1, $2, $3)`,
      [String(id), deleted_by || 'Admin', 'ลบผู้ใช้งาน']);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Toggle customer active/inactive (suspend / reactivate)
app.patch('/api/customers/:code/active', async (req, res) => {
  const { code } = req.params;
  const { is_active } = req.body;
  try {
    await q(`UPDATE customers SET is_active=$1, updated_at=NOW() WHERE code=$2`, [is_active, code]);
    const action = is_active ? 'เปิดการใช้งาน' : 'ปิดการใช้งาน';
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('CUSTOMER_UPDATE', $1, $2, $3)`,
      [code, 'Admin', `${action}ลูกค้า`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Soft-delete customer
app.delete('/api/customers/:code', async (req, res) => {
  const { code } = req.params;
  const { deleted_by } = req.body || {};
  try {
    await q(`UPDATE customers SET is_active=false, updated_at=NOW() WHERE code=$1`, [code]);
    await q(`INSERT INTO audit_log (action_type, doc_no, username, reason) VALUES ('CUSTOMER_DELETE', $1, $2, $3)`,
      [code, deleted_by || 'Admin', 'ลบข้อมูลลูกค้า']);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  AUDIT LOG
// ══════════════════════════════════════════════════════════
app.get('/api/audit', async (req, res) => {
  const { limit = 200 } = req.query;
  try {
    const { rows } = await q(
      `SELECT id, action_type AS "actionType", doc_no AS "docNo", ref_doc_no AS "refDocNo",
              username, user_role AS "userRole", reason, details,
              TO_CHAR(created_at,'DD/MM/') || (EXTRACT(YEAR FROM created_at)+543-2500)::int
              || ' ' || TO_CHAR(created_at,'HH24:MI:SS') AS "timestampDisplay",
              created_at AS timestamp
       FROM audit_log ORDER BY created_at DESC LIMIT $1`,
      [Number(limit)]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/audit', async (req, res) => {
  const { action_type, doc_no, ref_doc_no, username, user_role, reason, details } = req.body;
  try {
    await q(
      `INSERT INTO audit_log (action_type, doc_no, ref_doc_no, username, user_role, reason, details)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [action_type, doc_no || '', ref_doc_no || null,
       username || 'Admin Kanya', user_role || 'Administrator', reason || '', details ? JSON.stringify(details) : null]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  CHECKS (เช็ครับ / เช็คจ่าย)
// ══════════════════════════════════════════════════════════
app.get('/api/checks', async (req, res) => {
  const { status, type } = req.query;
  try {
    let where = ['1=1'];
    const params = [];
    let i = 1;
    if (status) { where.push(`c.status = $${i++}`); params.push(status); }
    if (type)   { where.push(`c.check_type = $${i++}`); params.push(type); }

    const { rows } = await q(
      `SELECT
         c.id, c.check_no AS "checkNo", c.check_type AS "checkType",
         c.bank_name AS "bankName", c.branch, c.account_no AS "accountNo",
         c.amount, c.check_date AS "checkDate", c.due_date AS "dueDate",
         c.status, c.customer_id AS "customerId", c.customer_name AS "customerName",
         c.note, c.created_at AS "createdAt",
         COALESCE(json_agg(
           json_build_object(
             'id', cd.id, 'invoiceId', cd.invoice_id,
             'invoiceNo', cd.invoice_no, 'amount', cd.amount, 'note', cd.note
           ) ORDER BY cd.sort_order
         ) FILTER (WHERE cd.id IS NOT NULL), '[]') AS details
       FROM checks c
       LEFT JOIN check_details cd ON cd.check_id = c.id
       WHERE ${where.join(' AND ')}
       GROUP BY c.id
       ORDER BY c.check_date DESC, c.id DESC`,
      params
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/checks', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const {
      check_no, check_type, bank_name, branch, account_no,
      amount, check_date, due_date, status, customer_id,
      customer_name, note, details, created_by
    } = req.body;

    const { rows } = await client.query(
      `INSERT INTO checks (check_no, check_type, bank_name, branch, account_no,
         amount, check_date, due_date, status, customer_id, customer_name, note, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [check_no, check_type || 'received', bank_name || '', branch || '',
       account_no || '', amount, check_date, due_date || null,
       status || 'pending', customer_id || null, customer_name || '', note || '', created_by || 1]
    );
    const check_id = rows[0].id;

    if (details && details.length > 0) {
      for (let idx = 0; idx < details.length; idx++) {
        const d = details[idx];
        await client.query(
          `INSERT INTO check_details (check_id, invoice_id, invoice_no, amount, note, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [check_id, d.invoice_id || null, d.invoice_no || null, d.amount, d.note || null, idx + 1]
        );
      }
    }

    await client.query(
      `INSERT INTO audit_log (action_type, doc_no, username, reason)
       VALUES ('CHECK_CREATE', $1, $2, $3)`,
      [check_no, customer_name || 'System', `สร้างเช็ค ${check_type} ${check_no}`]
    );

    await client.query('COMMIT');
    res.json({ ok: true, check_id });
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: e.message });
  } finally {
    client.release();
  }
});

app.patch('/api/checks/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  try {
    await q(
      `UPDATE checks SET status=$1, note=COALESCE($2, note), updated_at=NOW() WHERE id=$3`,
      [status, note || null, id]
    );
    await q(
      `INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('CHECK_STATUS_UPDATE', $1, $2)`,
      [String(id), `เปลี่ยนสถานะเช็คเป็น ${status}`]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  PRINT LOGS
// ══════════════════════════════════════════════════════════
app.post('/api/print-log', async (req, res) => {
  const { doc_type, doc_no, printed_by } = req.body;
  try {
    // Get current copy number
    const cnt = await q(`SELECT COUNT(*) FROM print_logs WHERE doc_no=$1`, [doc_no]);
    const copy_no = parseInt(cnt.rows[0].count) + 1;
    await q(
      `INSERT INTO print_logs (doc_type, doc_no, copy_no, printed_by) VALUES ($1,$2,$3,$4)`,
      [doc_type, doc_no, copy_no, printed_by || 'Admin Kanya']
    );
    // อัปเดต print_count ในตาราง invoices เพื่อให้ reloadInvoices() ได้ค่าล่าสุด
    await q(
      `UPDATE invoices SET print_count = $1 WHERE invoice_no = $2`,
      [copy_no, doc_no]
    );
    res.json({ ok: true, copy_no });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  SUPPLIERS
// ══════════════════════════════════════════════════════════
app.get('/api/suppliers', async (_, res) => {
  try {
    const { rows } = await q(`SELECT * FROM suppliers WHERE is_active=TRUE ORDER BY code`);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/suppliers', async (req, res) => {
  const { code, name, tax_id, contact_name, tel, email, address, payment_terms, note } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO suppliers (code, name, tax_id, contact_name, tel, email, address, payment_terms, note)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [code, name, tax_id||'', contact_name||'', tel||'', email||'', address||'', payment_terms||30, note||'']
    );
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/suppliers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, tax_id, contact_name, tel, email, address, payment_terms, note, is_active } = req.body;
  try {
    await q(
      `UPDATE suppliers SET name=$1,tax_id=$2,contact_name=$3,tel=$4,email=$5,
       address=$6,payment_terms=$7,note=$8,is_active=$9,updated_at=NOW() WHERE id=$10`,
      [name, tax_id||'', contact_name||'', tel||'', email||'', address||'', payment_terms||30, note||'', is_active!==false, id]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  DASHBOARD  — query live จาก DB tables
//  GET /api/dashboard?period=7d|1m|3m|6m|1y
// ══════════════════════════════════════════════════════════
app.get('/api/dashboard', async (req, res) => {
  const period = req.query.period || '7d';
  try {
    const today    = localISODate();
    const thisMonth = today.slice(0, 7);
    const yd       = new Date(); yd.setDate(yd.getDate() - 1);
    const ydStr    = localISODate(yd);

    // ── KPI: ยอดวันนี้ / เมื่อวาน / เดือนนี้ ────────────
    const kpiRes = await q(`
      SELECT
        COALESCE(SUM(CASE WHEN invoice_date = $1 AND NOT is_voided THEN total ELSE 0 END), 0) AS today_total,
        COALESCE(SUM(CASE WHEN invoice_date = $2 AND NOT is_voided THEN total ELSE 0 END), 0) AS yd_total,
        COALESCE(SUM(CASE WHEN TO_CHAR(invoice_date,'YYYY-MM') = $3 AND NOT is_voided THEN total ELSE 0 END), 0) AS month_total,
        COUNT(DISTINCT CASE WHEN invoice_date = $1 AND NOT is_voided THEN invoice_no END) AS today_bills
      FROM invoices
      WHERE invoice_type IN ('TIV','ISS')
    `, [today, ydStr, thisMonth]);
    const kpi = kpiRes.rows[0];
    const todayTotal = Number(kpi.today_total);
    const ydTotal    = Number(kpi.yd_total);
    const monthTotal = Number(kpi.month_total);
    const todayBills = Number(kpi.today_bills);
    const todayDelta = ydTotal > 0 ? Math.round((todayTotal - ydTotal) / ydTotal * 100) : 0;

    // ── ยอดขายตามช่องทาง ──────────────────────────────────
    const chanRes = await q(`
      SELECT channel, COALESCE(SUM(total), 0) AS value
      FROM invoices
      WHERE NOT is_voided AND invoice_type IN ('TIV','ISS')
      GROUP BY channel ORDER BY value DESC
    `);
    const CHAN_META = {
      wholesale: { label: 'ค้าส่ง',   tone: 'ac' },
      online:    { label: 'ออนไลน์',  tone: 'pu' },
      other:     { label: 'หน้าร้าน', tone: 'gn' },
      sample:    { label: 'Sample',   tone: 'am' },
      expired:   { label: 'Expired',  tone: 'rd' },
    };
    const salesByChannel = chanRes.rows.map(r => ({
      id: r.channel, value: Math.round(Number(r.value)),
      label: CHAN_META[r.channel]?.label || r.channel,
      tone:  CHAN_META[r.channel]?.tone  || 'ac',
    }));

    // ── Top 5 สินค้าขายดี ─────────────────────────────────
    const topRes = await q(`
      SELECT ii.product_name AS name,
             COALESCE(SUM(ii.weight), 0) AS kg,
             COALESCE(SUM(ii.line_gross), 0) AS revenue
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE NOT i.is_voided AND ii.product_code IS NOT NULL
      GROUP BY ii.product_name
      ORDER BY revenue DESC LIMIT 5
    `);
    const topSellers = topRes.rows.map(r => ({
      name: r.name,
      kg:   Math.round(Number(r.kg) * 10) / 10,
      revenue: Math.round(Number(r.revenue)),
    }));

    // ── สต็อกต่ำกว่า min ─────────────────────────────────
    const lowRes = await q(`
      SELECT COUNT(*) AS cnt FROM products WHERE stock_qty <= min_qty AND is_active = TRUE
    `);
    const lowStock = Number(lowRes.rows[0].cnt);

    // ── Revenue chart ─────────────────────────────────────
    const DAY_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
    const MONTH_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

    // helper: ดึงยอดรายวัน/เดือน จาก DB
    const chartRes = await q(`
      SELECT invoice_date::text AS d,
             COALESCE(SUM(CASE WHEN NOT is_voided THEN total ELSE 0 END), 0) AS total
      FROM invoices
      WHERE invoice_type IN ('TIV','ISS')
        AND invoice_date >= CURRENT_DATE - INTERVAL '365 days'
      GROUP BY invoice_date ORDER BY invoice_date
    `);
    const dayMap = {};
    chartRes.rows.forEach(r => { dayMap[r.d] = Math.round(Number(r.total)); });

    // 7d
    const days7v = [], days7l = [];
    for (let i = 6; i >= 0; i--) {
      const dd = new Date(); dd.setDate(dd.getDate() - i);
      const dStr = localISODate(dd);
      days7v.push(dayMap[dStr] || 0);
      days7l.push(DAY_TH[dd.getDay()]);
    }
    // 1m
    const days30v = [], days30l = [];
    for (let i = 29; i >= 0; i--) {
      const dd = new Date(); dd.setDate(dd.getDate() - i);
      const dStr = localISODate(dd);
      days30v.push(dayMap[dStr] || 0);
      days30l.push(String(30 - i));
    }
    // 6m / 1y (by month)
    const last12months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - 11 + i);
      return localISODate(d).slice(0, 7);
    });
    const rev1y = last12months.map(m => {
      return Object.entries(dayMap)
        .filter(([d]) => d.startsWith(m))
        .reduce((s, [, v]) => s + v, 0);
    });
    const lab1y = last12months.map(m => MONTH_TH[parseInt(m.slice(5, 7)) - 1]);
    const rev6m = rev1y.slice(6);
    const lab6m = lab1y.slice(6);

    res.json({
      sales: {
        today: Math.round(todayTotal),
        todayDelta,
        month: Math.round(monthTotal),
        monthTarget: 600000,
        bills: todayBills,
        avgPerBill: todayBills > 0 ? Math.round(todayTotal / todayBills) : 0,
      },
      lowStock,
      salesByChannel: salesByChannel.length ? salesByChannel : [
        { id: 'wholesale', label: 'ค้าส่ง', value: 0, tone: 'ac' },
      ],
      topSellers,
      revenue: {
        '7d': { values: days7v,  labels: days7l,  unit: 'วัน' },
        '1m': { values: days30v, labels: days30l, unit: 'วัน' },
        '6m': { values: rev6m,   labels: lab6m,   unit: 'เดือน' },
        '1y': { values: rev1y,   labels: lab1y,   unit: 'เดือน' },
      },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  DASHBOARD METRICS — บันทึก snapshot รายวัน
// ══════════════════════════════════════════════════════════
app.post('/api/dashboard/snapshot', async (req, res) => {
  const { sales_today, sales_month, bills_today, low_stock_count,
          channel_data, top_sellers, revenue_7d } = req.body;
  try {
    await q(
      `INSERT INTO dashboard_metrics
         (metric_date, sales_today, sales_month, bills_today, low_stock_count,
          channel_data, top_sellers, revenue_7d, snapshot_at)
       VALUES (CURRENT_DATE,$1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (metric_date) DO UPDATE SET
         sales_today     = EXCLUDED.sales_today,
         sales_month     = EXCLUDED.sales_month,
         bills_today     = EXCLUDED.bills_today,
         low_stock_count = EXCLUDED.low_stock_count,
         channel_data    = EXCLUDED.channel_data,
         top_sellers     = EXCLUDED.top_sellers,
         revenue_7d      = EXCLUDED.revenue_7d,
         snapshot_at     = NOW()`,
      [sales_today||0, sales_month||0, bills_today||0, low_stock_count||0,
       JSON.stringify(channel_data||[]),
       JSON.stringify(top_sellers||[]),
       JSON.stringify(revenue_7d||{})]
    );
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/dashboard/history', async (req, res) => {
  const days = Math.min(parseInt(req.query.days) || 30, 365);
  try {
    const { rows } = await q(
      `SELECT metric_date, sales_today, sales_month, bills_today, low_stock_count,
              channel_data, top_sellers, revenue_7d, snapshot_at
       FROM dashboard_metrics
       WHERE metric_date >= CURRENT_DATE - INTERVAL '` + days + ` days'
       ORDER BY metric_date DESC`
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  REPORTS API — 6 tabs
//  รองรับ query params: ?from=YYYY-MM-DD&to=YYYY-MM-DD
// ══════════════════════════════════════════════════════════

/* helper: สร้าง WHERE clause สำหรับ date range */
function dateWhere(from, to, col='invoice_date') {
  const conds = [];
  const vals  = [];
  if (from) { vals.push(from); conds.push(`${col} >= $${vals.length}`); }
  if (to)   { vals.push(to);   conds.push(`${col} <= $${vals.length}`); }
  return { where: conds.length ? 'WHERE ' + conds.join(' AND ') : '', vals };
}

/* Tab 1: รายการสินค้า */
app.get('/api/reports/products', async (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = dateWhere(from, to);
  try {
    const { rows } = await q(
      `SELECT * FROM v_rpt_product_lines ${where} ORDER BY invoice_date DESC, invoice_no`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Tab 2: ภาษีซื้อ-ขาย */
app.get('/api/reports/tax', async (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = dateWhere(from, to);
  try {
    const { rows } = await q(
      `SELECT * FROM v_rpt_tax ${where} ORDER BY invoice_date DESC, invoice_no`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Tab 3: Daily Sale */
app.get('/api/reports/daily', async (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = dateWhere(from, to);
  try {
    const { rows } = await q(
      `SELECT * FROM v_rpt_daily ${where} ORDER BY invoice_date DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Tab 4: Payment */
app.get('/api/reports/payment', async (req, res) => {
  const { from, to } = req.query;
  try {
    /* payment view is aggregate — need to re-query with date filter */
    const conds = ['is_voided=FALSE', "invoice_type NOT IN ('INV')"];
    const vals  = [];
    if (from) { vals.push(from); conds.push(`invoice_date >= $${vals.length}`); }
    if (to)   { vals.push(to);   conds.push(`invoice_date <= $${vals.length}`); }
    const where = 'WHERE ' + conds.join(' AND ');
    const { rows } = await q(
      `SELECT payment_method,
              COUNT(DISTINCT invoice_no) AS bill_count,
              SUM(net_sale) AS net, SUM(vat7) AS vat, SUM(total) AS total,
              ROUND(SUM(total)*100.0/NULLIF(SUM(SUM(total)) OVER(),0),2) AS pct
       FROM invoices ${where}
       GROUP BY payment_method ORDER BY total DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Tab 5: % Discount */
app.get('/api/reports/discount', async (req, res) => {
  const { from, to } = req.query;
  const { where, vals } = dateWhere(from, to);
  try {
    const { rows } = await q(
      `SELECT * FROM v_rpt_discount ${where} ORDER BY invoice_date DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Tab 6: รายลูกค้า */
app.get('/api/reports/customers', async (req, res) => {
  const { from, to } = req.query;
  try {
    /* customer view is aggregate — need to re-query with date filter */
    const conds = ['i.is_voided=FALSE', "i.invoice_type NOT IN ('INV')"];
    const vals  = [];
    if (from) { vals.push(from); conds.push(`i.invoice_date >= $${vals.length}`); }
    if (to)   { vals.push(to);   conds.push(`i.invoice_date <= $${vals.length}`); }
    const where = 'WHERE ' + conds.join(' AND ');
    const { rows } = await q(
      `SELECT COALESCE(i.customer_id,0)            AS customer_id,
              COALESCE(c.code,'—')                 AS customer_code,
              COALESCE(i.customer_name,'ไม่ระบุ')  AS customer_name,
              COALESCE(c.type,'walk-in')            AS customer_type,
              COALESCE(i.customer_tax_id,'')        AS customer_tax_id,
              COALESCE(c.tel,'')                    AS tel,
              COALESCE(c.address,'')               AS address,
              COUNT(DISTINCT i.invoice_no)          AS bill_count,
              COALESCE(SUM(ii.weight),0)            AS total_weight,
              SUM(i.discount)                       AS total_discount,
              SUM(i.total)                          AS total_amount,
              MAX(i.invoice_date)                   AS last_purchase
       FROM invoices i
       LEFT JOIN customers     c  ON c.id=i.customer_id
       LEFT JOIN invoice_items ii ON ii.invoice_id=i.id
       ${where}
       GROUP BY i.customer_id,c.code,i.customer_name,c.type,i.customer_tax_id,c.tel,c.address
       ORDER BY total_amount DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  STOCK MANAGEMENT REPORTS
// ══════════════════════════════════════════════════════════

/* รับสินค้า (GRN) — รายการรับสินค้า */
app.get('/api/reports/stock-in', async (req, res) => {
  const { from, to } = req.query;
  try {
    const conds = ['1=1'];
    const vals  = [];
    if (from) { vals.push(from); conds.push(`g.grn_date >= $${vals.length}`); }
    if (to)   { vals.push(to);   conds.push(`g.grn_date <= $${vals.length}`); }
    const where = 'WHERE ' + conds.join(' AND ');
    const { rows } = await q(
      `SELECT g.grn_date,
              TO_CHAR(g.grn_date,'DD/MM/YY') AS date_display,
              g.grn_no,
              g.receiver,
              g.po_no,
              g.total_packs,
              g.total_weight,
              g.total_value,
              g.note,
              g.created_by,
              JSON_AGG(JSON_BUILD_OBJECT(
                'code', gi.product_code,
                'name', gi.product_name,
                'weight', gi.weight,
                'cost',  gi.cost_price,
                'value', gi.value,
                'tax',   gi.tax_type
              ) ORDER BY gi.sort_order) AS items
       FROM grn_headers g
       JOIN grn_items gi ON gi.grn_id = g.id
       ${where}
       GROUP BY g.id, g.grn_date, g.grn_no, g.receiver, g.po_no,
                g.total_packs, g.total_weight, g.total_value, g.note, g.created_by
       ORDER BY g.grn_date DESC, g.grn_no DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* ปรับปรุงสต็อก (ADJ) — รายการปรับปรุง */
app.get('/api/reports/stock-adj', async (req, res) => {
  const { from, to } = req.query;
  try {
    const conds = ['1=1'];
    const vals  = [];
    if (from) { vals.push(from); conds.push(`a.adj_date >= $${vals.length}`); }
    if (to)   { vals.push(to);   conds.push(`a.adj_date <= $${vals.length}`); }
    const where = 'WHERE ' + conds.join(' AND ');
    const { rows } = await q(
      `SELECT a.adj_date,
              TO_CHAR(a.adj_date,'DD/MM/YY') AS date_display,
              a.adj_no,
              a.reason,
              a.created_by,
              COUNT(ai.id)            AS item_count,
              SUM(ABS(ai.qty_adjust)) AS total_adjusted,
              JSON_AGG(JSON_BUILD_OBJECT(
                'code',       ai.product_code,
                'name',       ai.product_name,
                'qty_before', ai.qty_before,
                'qty_adjust', ai.qty_adjust,
                'qty_after',  ai.qty_after,
                'note',       ai.note
              ) ORDER BY ai.id) AS items
       FROM adj_headers a
       JOIN adj_items   ai ON ai.adj_id = a.id
       ${where}
       GROUP BY a.id, a.adj_date, a.adj_no, a.reason, a.created_by
       ORDER BY a.adj_date DESC, a.adj_no DESC`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* สรุปสต็อกรายสินค้า */
app.get('/api/reports/stock-summary', async (_, res) => {
  try {
    const { rows } = await q(`SELECT * FROM v_rpt_stock_summary`);
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

/* Stock Ledger — รายการเคลื่อนไหวสต็อก */
app.get('/api/reports/stock-ledger', async (req, res) => {
  const { from, to, code } = req.query;
  try {
    const conds = ['1=1'];
    const vals  = [];
    if (from) { vals.push(from); conds.push(`sl.movement_date >= $${vals.length}`); }
    if (to)   { vals.push(to);   conds.push(`sl.movement_date <= $${vals.length}`); }
    if (code) { vals.push(code); conds.push(`sl.product_code = $${vals.length}`); }
    const where = 'WHERE ' + conds.join(' AND ');
    const { rows } = await q(
      `SELECT sl.movement_date AS "dateISO",
              TO_CHAR(sl.movement_date,'DD/MM/YY') AS date,
              sl.movement_time AS time,
              sl.movement_type AS type,
              sl.product_code  AS code,
              sl.product_name  AS prod,
              sl.quantity      AS w,
              sl.balance       AS bal,
              sl.ref_no        AS ref,
              sl.ref_type      AS "refType",
              COALESCE(sl.channel,'—') AS channel
       FROM stock_ledger sl
       ${where}
       ORDER BY sl.movement_date DESC, sl.movement_time DESC
       LIMIT 500`, vals
    );
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\u{1F680} NEXflow API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
