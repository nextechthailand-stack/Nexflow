/**
 * StockPro API Server — Node.js + Express + PostgreSQL
 * Port: 3001  (Perl static server ใช้ 3000)
 * เริ่มต้น: node api_server.js
 */

const express = require('express');
const { Pool } = require('pg');
const cors    = require('cors');

const app  = express();
const PORT = 3001;

// ── DB Connection ─────────────────────────────────────────
const pool = new Pool({
  host:     'localhost',
  port:     5432,
  database: 'stockpro_db',
  user:     'postgres',
  password: '1234',
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ PostgreSQL connection failed:', err.message);
    process.exit(1);
  }
  release();
  console.log('✅ Connected to PostgreSQL — stockpro_db');
});

app.use(cors());
app.use(express.json());

// ── Helper ────────────────────────────────────────────────
const q = (text, params) => pool.query(text, params);

/* ── Auto-migrate: เพิ่ม column ที่อาจยังไม่มีใน DB เดิม ─ */
(async () => {
  try {
    await q(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS note TEXT`);
  } catch(e) { console.warn('[migrate] invoices.note:', e.message); }
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
              tax_type AS tax, is_active
       FROM products ORDER BY code`
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
      `SELECT id, code, name, type, tax_id AS tax, tel, address AS addr, discount, is_active
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
         i.net_sale AS "netSale",
         i.vat_base AS "vatBase",
         i.vat7,
         i.total,
         i.payment_method AS pay,
         i.status,
         i.is_voided AS voided,
         i.voided_at AS "voidedAt",
         i.voided_by AS "voidedBy",
         i.void_reason AS "voidReason",
         i.stock_restored AS "stockRestored",
         i.print_count AS "printCount",
         i.note,
         COALESCE(
           json_agg(
             json_build_object(
               'code', ii.product_code,
               'name', ii.product_name,
               'weight', ii.weight,
               'price', ii.price_per_kg,
               'tax', ii.tax_type
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
      vat_base, vat7, total, payment_method, items, created_by
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
         customer_id, customer_name, customer_tax_id,
         invoice_date, gross_sale, discount, net_sale,
         vat_base, vat7, total, payment_method, note, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       RETURNING id`,
      [invoice_no, invoice_type, channel, ref_invoice_no || null,
       customer_id || null, customer_name, customer_tax_id || null,
       invoice_date, gross_sale, discount, net_sale,
       vat_base, vat7, total, payment_method, req.body.note || null, created_by || 1]
    );
    const invoice_id = invRes.rows[0].id;

    // Insert items
    if (items && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];

        await client.query(
          `INSERT INTO invoice_items (invoice_id, product_code, product_name, weight, price_per_kg, tax_type, line_gross, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [invoice_id, it.code, it.name, it.weight, it.price, it.tax, it.weight * it.price, idx + 1]
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
  const { name, address, tax_id, tel, email, vat_rate,
          prefix_grn, prefix_adj, prefix_iss, prefix_tiv, prefix_inv, prefix_cn, prefix_dn } = req.body;
  try {
    await q(
      `UPDATE company_settings
       SET name=$1, address=$2, tax_id=$3, tel=$4, email=$5,
           vat_rate=COALESCE($6, vat_rate),
           prefix_grn=COALESCE(NULLIF($7,''), prefix_grn),
           prefix_adj=COALESCE(NULLIF($8,''), prefix_adj),
           prefix_iss=COALESCE(NULLIF($9,''), prefix_iss),
           prefix_tiv=COALESCE(NULLIF($10,''), prefix_tiv),
           prefix_inv=COALESCE(NULLIF($11,''), prefix_inv),
           prefix_cn =COALESCE(NULLIF($12,''), prefix_cn),
           prefix_dn =COALESCE(NULLIF($13,''), prefix_dn),
           updated_at=NOW()
       WHERE id=1`,
      [name, address, tax_id, tel, email||'', vat_rate||null,
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
      `SELECT id, name, username, role, is_active AS active, last_login_at AS last FROM users ORDER BY id`
    );
    res.json(rows);
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
      `INSERT INTO adj_headers (adj_no, adj_date, reason, created_by)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [adj_no, adj_date || now.toISOString().slice(0,10), `${adj_type}: ${reason}${note ? ' | '+note : ''}`, created_by || 1]
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
         `ปรับปรุงสต็อก (${reason})`, adj_type, adj_date || now.toISOString().slice(0,10)]
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
      `SELECT h.id, h.adj_no, h.adj_date, h.reason, h.created_at,
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
  const { code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO products (code, name, category, sell_price, cost_price, stock_qty, min_qty, tax_type)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [code, name, category, sell_price, cost_price, stock_qty || 0, min_qty, tax_type || 'vat7']
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('PRODUCT_CREATE', $1, $2)`,
      [code, `สร้างสินค้า ${name}`]);
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:code', async (req, res) => {
  const { code } = req.params;
  const { name, category, sell_price, cost_price, min_qty, tax_type, is_active } = req.body;
  try {
    await q(
      `UPDATE products SET name=$1, category=$2, sell_price=$3, cost_price=$4,
       min_qty=$5, tax_type=$6, is_active=$7, updated_at=NOW() WHERE code=$8`,
      [name, category, sell_price, cost_price, min_qty, tax_type, is_active !== false, code]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('PRODUCT_UPDATE', $1, $2)`,
      [code, `แก้ไขสินค้า ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  CUSTOMERS CRUD
// ══════════════════════════════════════════════════════════
app.post('/api/customers', async (req, res) => {
  const { code, name, type, tax_id, tel, address, discount } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO customers (code, name, type, tax_id, tel, address, discount)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [code, name, type || 'wholesale', tax_id || '', tel || '', address || '', discount || 0]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('CUSTOMER_CREATE', $1, $2)`,
      [code, `สร้างลูกค้า ${name}`]);
    res.json({ ok: true, id: rows[0].id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/customers/:code', async (req, res) => {
  const { code } = req.params;
  const { name, type, tax_id, tel, address, discount, is_active } = req.body;
  try {
    await q(
      `UPDATE customers SET name=$1, type=$2, tax_id=$3, tel=$4, address=$5,
       discount=$6, is_active=$7, updated_at=NOW() WHERE code=$8`,
      [name, type, tax_id || '', tel || '', address || '', discount || 0, is_active !== false, code]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('CUSTOMER_UPDATE', $1, $2)`,
      [code, `แก้ไขลูกค้า ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
//  USERS CRUD
// ══════════════════════════════════════════════════════════
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, role, is_active } = req.body;
  try {
    await q(
      `UPDATE users SET name=$1, role=$2, is_active=$3, updated_at=NOW() WHERE id=$4`,
      [name, role, is_active !== false, id]
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('USER_UPDATE', $1, $2)`,
      [String(id), `แก้ไขผู้ใช้ ${name}`]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/users', async (req, res) => {
  const { name, username, password_hash, role } = req.body;
  try {
    const { rows } = await q(
      `INSERT INTO users (name, username, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
      [name, username, password_hash || '$2b$12$placeholder', role || 'Staff']
    );
    await q(`INSERT INTO audit_log (action_type, doc_no, reason) VALUES ('USER_CREATE', $1, $2)`,
      [username, `สร้างผู้ใช้ ${name}`]);
    res.json({ ok: true, id: rows[0].id });
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
    const today    = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);
    const yd       = new Date(); yd.setDate(yd.getDate() - 1);
    const ydStr    = yd.toISOString().slice(0, 10);

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
      const dStr = dd.toISOString().slice(0, 10);
      days7v.push(dayMap[dStr] || 0);
      days7l.push(DAY_TH[dd.getDay()]);
    }
    // 1m
    const days30v = [], days30l = [];
    for (let i = 29; i >= 0; i--) {
      const dd = new Date(); dd.setDate(dd.getDate() - i);
      const dStr = dd.toISOString().slice(0, 10);
      days30v.push(dayMap[dStr] || 0);
      days30l.push(String(30 - i));
    }
    // 6m / 1y (by month)
    const last12months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(); d.setMonth(d.getMonth() - 11 + i);
      return d.toISOString().slice(0, 7);
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

// ── Start ─────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\u{1F680} StockPro API running at http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
