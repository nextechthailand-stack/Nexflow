/**
 * api.js — StockPro API Client
 * โหลดข้อมูลจาก localhost:3001 เข้า SP_DATA / SP_STATE
 * และ expose window.SP_API สำหรับ save/update operations
 *
 * โหลดหลัง data.js: ถ้า API ไม่พร้อม จะใช้ mock data แทน (fallback)
 */

(function () {
  const BASE = 'http://localhost:3001';
  const get  = url => fetch(BASE + url).then(r => {
    if (!r.ok) throw new Error(`API ${url} failed: ${r.status}`);
    return r.json();
  });

  /* ── build reportRows จาก invoices จริง ────────────────── */
  function buildReportRows(invoices) {
    const rows = [];
    invoices.forEach(inv => {
      if (inv.voided || inv.is_voided || inv.status === 'voided') return;
      // Skip INV / A4 เพราะซ้ำกับ TIV (ใบเดียวกัน ออกสองรูปแบบ)
      const itype = inv.type || inv.invoice_type || '';
      if (itype === 'INV' || itype === 'A4') return;

      const rawDate = inv.date || inv.invoice_date || '';
      const dateISO = typeof rawDate === 'string'
        ? rawDate.slice(0,10)
        : (rawDate instanceof Date ? rawDate.toISOString().slice(0,10) : '');
      const d = new Date(dateISO + 'T00:00:00');
      const dateDisplay = dateISO
        ? `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`
        : '—';

      const items  = Array.isArray(inv.items) ? inv.items : [];
      const invNo  = inv.no || inv.invoice_no || '';
      const channel = inv.channel || 'wholesale';
      const custId  = inv.custId || inv.customer_id;
      const pay     = inv.pay || inv.payment_method || 'cash';
      const invGross = Number(inv.grossSale || inv.gross_sale || 0);
      const invDisc  = Number(inv.discount || 0);
      const invTotal = Number(inv.total || inv.net_sale || 0);
      const invVat   = Number(inv.vat7 || 0);

      if (items.length === 0) {
        rows.push({
          dateISO, date: dateDisplay, inv: invNo,
          thermalInv: inv.thermalNo || invNo,
          code: '—', prod: '—', channel, custId,
          w: 0, grossSale: invGross, discount: invDisc,
          netSale: invTotal, vat: invVat, total: invTotal, pay,
        });
        return;
      }

      const totalItemGross = items.reduce((s, it) =>
        s + Number(it.weight||0) * Number(it.price||it.price_per_kg||0), 0);

      items.forEach(it => {
        const w          = Number(it.weight || 0);
        const price      = Number(it.price || it.price_per_kg || 0);
        const lineGross  = w * price;
        // Allocate invoice-level discount proportionally
        const lineDisc   = totalItemGross > 0 ? invDisc * (lineGross / totalItemGross) : 0;
        const lineNet    = lineGross - lineDisc;
        const lineVat    = it.tax === 'vat7' ? lineNet * 7 / 107 : 0;
        rows.push({
          dateISO, date: dateDisplay, inv: invNo,
          thermalInv: inv.thermalNo || invNo,
          code: it.code || '—', prod: it.name || '—', channel, custId,
          w, grossSale: lineGross, discount: lineDisc,
          netSale: lineNet, vat: lineVat, total: lineNet, pay,
        });
      });
    });
    return rows.sort((a,b) => (b.dateISO||'').localeCompare(a.dateISO||''));
  }

  /* ── build Dashboard KPIs + charts ─────────────────────── */
  function buildDashboardData(reportRows) {
    const today     = new Date().toISOString().slice(0,10);
    const thisMonth = today.slice(0,7);
    const yd        = new Date(); yd.setDate(yd.getDate()-1);
    const ydStr     = yd.toISOString().slice(0,10);

    const todayRows = reportRows.filter(r => r.dateISO === today);
    const monthRows = reportRows.filter(r => (r.dateISO||'').startsWith(thisMonth));
    const ydRows    = reportRows.filter(r => r.dateISO === ydStr);

    const todayTotal = todayRows.reduce((s,r)=>s+r.total,0);
    const monthTotal = monthRows.reduce((s,r)=>s+r.total,0);
    const ydTotal    = ydRows.reduce((s,r)=>s+r.total,0);
    const todayBills = new Set(todayRows.map(r=>r.inv)).size;
    const todayDelta = ydTotal>0 ? Math.round((todayTotal-ydTotal)/ydTotal*100) : 0;

    /* salesByChannel */
    const chanMap = {};
    reportRows.forEach(r => {
      if (!chanMap[r.channel]) chanMap[r.channel] = 0;
      chanMap[r.channel] += r.total;
    });
    const CHAN_META = {
      wholesale: { label:'ค้าส่ง',  tone:'ac' },
      online:    { label:'ออนไลน์', tone:'pu' },
      other:     { label:'หน้าร้าน',tone:'gn' },
      sample:    { label:'Sample',  tone:'am' },
      expired:   { label:'Expired', tone:'rd' },
    };
    const salesByChannel = Object.entries(chanMap).map(([id, value]) => ({
      id, value,
      label: CHAN_META[id]?.label || id,
      tone:  CHAN_META[id]?.tone  || 'ac',
    })).sort((a,b)=>b.value-a.value);

    /* topSellers */
    const prodMap = {};
    reportRows.forEach(r => {
      if (!r.code || r.code==='—') return;
      if (!prodMap[r.code]) prodMap[r.code] = { name:r.prod, kg:0, revenue:0 };
      prodMap[r.code].kg      += r.w;
      prodMap[r.code].revenue += r.total;
    });
    const topSellers = Object.values(prodMap)
      .sort((a,b)=>b.revenue-a.revenue).slice(0,5)
      .map(p=>({ name:p.name, kg:Math.round(p.kg*10)/10, revenue:Math.round(p.revenue) }));

    /* revenue chart — 7d and 1m from real data */
    const DAY_TH = ['อา','จ','อ','พ','พฤ','ศ','ส'];
    const days7v=[], days7l=[];
    for (let i=6; i>=0; i--) {
      const dd=new Date(); dd.setDate(dd.getDate()-i);
      const dStr=dd.toISOString().slice(0,10);
      days7v.push(Math.round(reportRows.filter(r=>r.dateISO===dStr).reduce((s,r)=>s+r.total,0)));
      days7l.push(DAY_TH[dd.getDay()]);
    }
    const days30v=[], days30l=[];
    for (let i=29; i>=0; i--) {
      const dd=new Date(); dd.setDate(dd.getDate()-i);
      const dStr=dd.toISOString().slice(0,10);
      days30v.push(Math.round(reportRows.filter(r=>r.dateISO===dStr).reduce((s,r)=>s+r.total,0)));
      days30l.push(String(30-i));
    }
    /* 3m/6m/1y: group by week/month */
    const weekMap={}, monthMap={};
    reportRows.forEach(r=>{
      if(!r.dateISO) return;
      const d=new Date(r.dateISO+'T00:00:00');
      const mKey=r.dateISO.slice(0,7);
      if(!monthMap[mKey]) monthMap[mKey]=0; monthMap[mKey]+=r.total;
      // week: year+weekNum
      const jan1=new Date(d.getFullYear(),0,1);
      const wn=Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);
      const wKey=`${d.getFullYear()}-W${String(wn).padStart(2,'0')}`;
      if(!weekMap[wKey]) weekMap[wKey]=0; weekMap[wKey]+=r.total;
    });
    const last12months = Array.from({length:12},(_,i)=>{
      const d=new Date(); d.setMonth(d.getMonth()-11+i);
      return d.toISOString().slice(0,7);
    });
    const MONTH_TH=['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
    const rev1y = last12months.map(m=>Math.round(monthMap[m]||0));
    const lab1y = last12months.map(m=>MONTH_TH[parseInt(m.slice(5,7))-1]);
    const rev6m = rev1y.slice(6); const lab6m = lab1y.slice(6);

    return {
      sales: {
        today: Math.round(todayTotal),
        todayDelta,
        month: Math.round(monthTotal),
        monthTarget: 600000,
        bills: todayBills,
        avgPerBill: todayBills>0 ? Math.round(todayTotal/todayBills) : 0,
      },
      salesByChannel: salesByChannel.length ? salesByChannel : [
        { id:'wholesale', label:'ค้าส่ง', value:0, tone:'ac' },
      ],
      topSellers,
      revenue: {
        '7d': { values:days7v,  labels:days7l,  unit:'วัน' },
        '1m': { values:days30v, labels:days30l, unit:'วัน' },
        '3m': { values:Array(12).fill(0), labels:Array.from({length:12},(_,i)=>`ส.${i+1}`), unit:'สัปดาห์' },
        '6m': { values:rev6m, labels:lab6m, unit:'เดือน' },
        '1y': { values:rev1y, labels:lab1y, unit:'เดือน' },
      },
    };
  }

  /* ── SP_API: methods ที่ component ต่างๆ ใช้บันทึกข้อมูล ─── */
  window.SP_API = {

    /* ── INIT — เรียกครั้งเดียวตอน app เริ่ม ─────────────── */
    async init() {
      try {
        await fetch(BASE + '/api/health', { signal: AbortSignal.timeout(2000) });
      } catch {
        console.warn('[SP_API] API server ไม่พร้อม — ใช้ mock data แทน');
        return false;
      }

      try {
        const [company, products, customers, invoices, grn, ledger, users] = await Promise.all([
          get('/api/company'),
          get('/api/products'),
          get('/api/customers'),
          get('/api/invoices'),
          get('/api/grn'),
          get('/api/ledger'),
          get('/api/users'),
        ]);

        /* อัปเดต SP_DATA */
        Object.assign(window.SP_DATA.company, {
          name: company.name,
          addr: company.address,
          tax:  company.tax_id,
          tel:  company.tel,
          email: company.email,
          vat:  Number(company.vat_rate) || 7,
        });

        /* โหลด Prefixes จาก company_settings ลง SP_STATE.docPrefixes */
        if (!window.SP_STATE.docPrefixes) window.SP_STATE.docPrefixes = {};
        if (company.prefix_grn) window.SP_STATE.docPrefixes.grn = company.prefix_grn;
        if (company.prefix_adj) window.SP_STATE.docPrefixes.adj = company.prefix_adj;
        if (company.prefix_iss) window.SP_STATE.docPrefixes.iss = company.prefix_iss;
        if (company.prefix_tiv) window.SP_STATE.docPrefixes.tiv = company.prefix_tiv;
        if (company.prefix_inv) window.SP_STATE.docPrefixes.inv = company.prefix_inv;
        if (company.prefix_cn)  window.SP_STATE.docPrefixes.cn  = company.prefix_cn;
        if (company.prefix_dn)  window.SP_STATE.docPrefixes.dn  = company.prefix_dn;

        window.SP_DATA.products  = products.map(p => ({
          id: p.id, code: p.code, name: p.name, cat: p.cat,
          sell: Number(p.sell), cost: Number(p.cost),
          stock: Number(p.stock), min: Number(p.min),
          tax: p.tax,
        }));

        window.SP_DATA.customers = customers.map(c => ({
          id: c.id, code: c.code, name: c.name, type: c.type,
          tax: c.tax || '', tel: c.tel || '', addr: c.addr || '',
          discount: Number(c.discount) || 0,
        }));

        /* อัปเดต SP_STATE */
        const allInv = invoices.map(inv => ({
          ...inv,
          // Normalize type: DB stores TIV/INV, frontend expects Thermal/A4
          type: inv.type === 'TIV' ? 'Thermal' : inv.type === 'INV' ? 'A4' : inv.type,
          // thermalNo fallback: for TIV records, thermalNo = own invoice_no
          thermalNo: inv.thermalNo || (inv.type === 'TIV' || inv.type === 'Thermal' ? inv.no : null),
          // map DB snake_case → camelCase
          refInvNo: inv.refInvNo || inv.ref_invoice_no || null,
          items: Array.isArray(inv.items) ? inv.items : [],
        }));
        window.SP_STATE.invoices = allInv;

        /* ── Build reportRows + Dashboard data from live invoices ── */
        const rRows = buildReportRows(allInv);
        window.SP_DATA.reportRows = rRows;

        const dash = buildDashboardData(rRows);
        window.SP_DATA.sales         = dash.sales;
        window.SP_DATA.salesByChannel = dash.salesByChannel;
        window.SP_DATA.topSellers    = dash.topSellers;
        window.SP_DATA.revenue       = dash.revenue;
        window.SP_DATA.chart7d       = dash.revenue['7d'].values;
        window.SP_DATA.chartLabels   = dash.revenue['7d'].labels;
        window.SP_DATA.revenue7d     = dash.revenue['7d'].values;

        window.SP_STATE.grnLogs = grn.map(g => ({
          id: g.id_str || g.grn_no,
          date: g.date,
          dateDisplay: g.dateDisplay,
          poNo: g.poNo,
          receiver: g.receiver,
          note: g.note,
          totalPacks: g.totalPacks,
          totalWeight: Number(g.totalWeight),
          totalValue:  Number(g.totalValue),
          items: Array.isArray(g.items) ? g.items : [],
        }));

        window.SP_DATA.ledger = ledger.map(l => ({
          dateISO: l.dateISO,
          date: l.date,
          time: l.time ? String(l.time).slice(0,8) : '—',
          type: l.type,
          code: l.code,
          prod: l.prod,
          w:    Number(l.w),
          ref:  l.ref,
          refType: l.refType,
          channel: l.channel || '—',
          bal:  Number(l.bal),
        }));

        window.SP_DATA.users = users.map(u => ({
          id: u.id, name: u.name, user: u.username,
          role: u.role,
          status: u.active ? 'active' : 'inactive',
          last: u.last || '—',
        }));

        /* อัปเดต products ใน SP_STATE ด้วย */
        window.SP_STATE.products = window.SP_DATA.products.map(p => ({ ...p }));

        console.log('[SP_API] ✅ โหลดข้อมูลจาก DB สำเร็จ', {
          products: products.length,
          customers: customers.length,
          invoices: invoices.length,
          grn: grn.length,
        });
        return true;
      } catch (err) {
        console.error('[SP_API] โหลดข้อมูลไม่สำเร็จ:', err);
        return false;
      }
    },

    /* ── สร้างใบกำกับ (TIV / ISS) ────────────────────────── */
    async createInvoice(payload) {
      const r = await fetch(BASE + '/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── อัปเดต full_inv_no บน TIV หลังออก INV (หรือ null เมื่อยกเลิก) ── */
    async updateInvoiceFullInvNo(id, fullInvNo) {
      const r = await fetch(`${BASE}/api/invoices/${id}/full_inv_no`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_inv_no: fullInvNo }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Void invoice ─────────────────────────────────────── */
    async voidInvoice(id, { voided_by, void_reason, restore_stock }) {
      const r = await fetch(`${BASE}/api/invoices/${id}/void`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voided_by, void_reason, restore_stock }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── สร้าง GRN ────────────────────────────────────────── */
    async createGRN(payload) {
      const r = await fetch(BASE + '/api/grn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Reload products (หลัง GRN / ขาย) ────────────────── */
    async reloadProducts() {
      const products = await get('/api/products');
      window.SP_DATA.products = products.map(p => ({
        id: p.id, code: p.code, name: p.name, cat: p.cat,
        sell: Number(p.sell), cost: Number(p.cost),
        stock: Number(p.stock), min: Number(p.min),
        tax: p.tax,
      }));
      window.SP_STATE.products = window.SP_DATA.products.map(p => ({ ...p }));
      return window.SP_DATA.products;
    },

    /* ── Reload invoices + rebuild Dashboard/Reports ─────── */
    async reloadInvoices() {
      const invoices = await get('/api/invoices');
      const allInv = invoices.map(inv => ({
        ...inv,
        type: inv.type === 'TIV' ? 'Thermal' : inv.type === 'INV' ? 'A4' : inv.type,
        thermalNo: inv.thermalNo || (inv.type === 'TIV' || inv.type === 'Thermal' ? inv.no : null),
        refInvNo: inv.refInvNo || inv.ref_invoice_no || null,
        items: Array.isArray(inv.items) ? inv.items : [],
      }));
      window.SP_STATE.invoices = allInv;

      /* rebuild Dashboard + Reports ให้ตรงกับยอดขายล่าสุด */
      try {
        const rRows = buildReportRows(allInv);
        window.SP_DATA.reportRows = rRows;
        const dash = buildDashboardData(rRows);
        window.SP_DATA.sales          = dash.sales;
        window.SP_DATA.salesByChannel = dash.salesByChannel;
        window.SP_DATA.topSellers     = dash.topSellers;
        window.SP_DATA.revenue        = dash.revenue;
        window.SP_DATA.chart7d        = dash.revenue['7d'].values;
        window.SP_DATA.chartLabels    = dash.revenue['7d'].labels;
        window.SP_DATA.revenue7d      = dash.revenue['7d'].values;
        /* notify Dashboard / Reports ว่าข้อมูลเปลี่ยน */
        window.SP_DASH_VERSION = (window.SP_DASH_VERSION || 0) + 1;
        window.dispatchEvent(new CustomEvent('sp:data-updated'));
      } catch(e) { console.warn('[reloadInvoices] rebuild dash:', e); }

      return window.SP_STATE.invoices;
    },

    /* ── Rebuild dashboard + reports จาก invoices ปัจจุบัน ─ */
    rebuildDashboard() {
      try {
        const allInv = window.SP_STATE.invoices || [];
        const rRows = buildReportRows(allInv);
        window.SP_DATA.reportRows = rRows;
        const dash = buildDashboardData(rRows);
        window.SP_DATA.sales          = dash.sales;
        window.SP_DATA.salesByChannel = dash.salesByChannel;
        window.SP_DATA.topSellers     = dash.topSellers;
        window.SP_DATA.revenue        = dash.revenue;
        window.SP_DATA.chart7d        = dash.revenue['7d'].values;
        window.SP_DATA.chartLabels    = dash.revenue['7d'].labels;
        window.SP_DATA.revenue7d      = dash.revenue['7d'].values;
        window.SP_DASH_VERSION = (window.SP_DASH_VERSION || 0) + 1;
        window.dispatchEvent(new CustomEvent('sp:data-updated'));
      } catch(e) { console.warn('[rebuildDashboard]', e); }
    },

    /* ── บันทึก print log + อัปเดต print_count ──────────── */
    async logPrint(docType, docNo) {
      try {
        const r = await fetch(BASE + '/api/print-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ doc_type: docType, doc_no: docNo }),
        });
        if (!r.ok) throw new Error('logPrint failed');
        const data = await r.json();
        /* อัปเดต printCount ใน SP_STATE.invoices ให้ตรงกับ DB */
        const inv = (window.SP_STATE.invoices || []).find(x => x.no === docNo);
        if (inv) inv.printCount = data.copy_no;
        return data.copy_no;
      } catch (e) {
        console.warn('[SP_API] logPrint error:', e.message);
        return null;
      }
    },

    /* ── Reload ledger ────────────────────────────────────── */
    async reloadLedger() {
      const ledger = await get('/api/ledger');
      window.SP_DATA.ledger = ledger.map(l => ({
        dateISO: l.dateISO, date: l.date, time: l.time ? String(l.time).slice(0,8) : '—',
        type: l.type, code: l.code, prod: l.prod,
        w: Number(l.w), ref: l.ref, refType: l.refType,
        channel: l.channel || '—', bal: Number(l.bal),
      }));
      // Increment version counter → triggers StockManage re-render
      window.SP_LEDGER_VERSION = (window.SP_LEDGER_VERSION || 0) + 1;
      return window.SP_DATA.ledger;
    },

    /* ── สร้าง Stock Adjustment (ADJ) ────────────────────── */
    async createAdj(payload) {
      const r = await fetch(BASE + '/api/adj', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Products CRUD ────────────────────────────────────── */
    async saveProduct(code, data) {
      const r = await fetch(BASE + '/api/products/' + code, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    async createProduct(data) {
      const r = await fetch(BASE + '/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Customers CRUD ───────────────────────────────────── */
    async saveCustomer(code, data) {
      const r = await fetch(BASE + '/api/customers/' + code, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    async createCustomer(data) {
      const r = await fetch(BASE + '/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Users CRUD ───────────────────────────────────────── */
    async createUser(data) {
      const r = await fetch(BASE + '/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },
    async saveUser(id, data) {
      const r = await fetch(BASE + '/api/users/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── Company settings (รวม prefixes) ────────────────── */
    async saveCompany(data) {
      const r = await fetch(BASE + '/api/company', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      return r.json();
    },

    /* ── บันทึก Prefix เอกสารลง DB ───────────────────────── */
    async savePrefixes(prefixes) {
      // prefixes = { grn, adj, iss, tiv, inv, cn, dn }
      const pfxPayload = {};
      if (prefixes.grn) pfxPayload.prefix_grn = prefixes.grn;
      if (prefixes.adj) pfxPayload.prefix_adj = prefixes.adj;
      if (prefixes.iss) pfxPayload.prefix_iss = prefixes.iss;
      if (prefixes.tiv) pfxPayload.prefix_tiv = prefixes.tiv;
      if (prefixes.inv) pfxPayload.prefix_inv = prefixes.inv;
      if (prefixes.cn)  pfxPayload.prefix_cn  = prefixes.cn;
      if (prefixes.dn)  pfxPayload.prefix_dn  = prefixes.dn;
      // ส่งไปพร้อม PUT /api/company (ไม่ต้องการข้อมูลบริษัทเต็ม)
      const co = window.SP_DATA?.company || {};
      return this.saveCompany({
        name:    co.name || '',
        address: co.addr || '',
        tax_id:  co.tax  || '',
        tel:     co.tel  || '',
        email:   co.email|| '',
        vat_rate: co.vat || 7,
        ...pfxPayload,
      });
    },

    /* ── Audit log (บันทึกการกระทำ) ──────────────────────── */
    async logAudit(actionType, docNo, refDocNo, reason, details) {
      const usr = window.SP_DATA?.user || { name: 'Admin', role: 'Administrator' };
      try {
        await fetch(BASE + '/api/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action_type: actionType,
            doc_no:      docNo,
            ref_doc_no:  refDocNo || null,
            reason:      reason   || null,
            details:     details  || null,
            performed_by: usr.name,
            role:         usr.role,
          }),
        });
      } catch (e) {
        console.warn('logAudit failed:', e.message);
      }
    },

    /* ── Reload audit log ─────────────────────────────────── */
    async reloadAudit() {
      const logs = await get('/api/audit');
      window.SP_STATE.auditLog = logs;
      return logs;
    },

  }; // end SP_API

  window.SP_API = SP_API;
  SP_API.init();

})();
