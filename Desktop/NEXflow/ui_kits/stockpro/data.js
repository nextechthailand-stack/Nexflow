/* StockPro UI Kit — shared mock data (updated: dateISO, pay, custId per row) */
window.SP_DATA = {
  company: {
    name: 'บริษัท ซีฟู้ด โปรวิชั่น จำกัด',
    addr: '123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110',
    tax: '0105566012345', tel: '02-xxx-xxxx', email: 'info@seafoodprovision.co.th',
    vat: 7, currency: 'THB',
    logoUrl: '',  /* Base64 data URL — set by Settings logo upload */
  },
  user: { name: 'Admin Kanya', role: 'Administrator', initials: 'AK' },
  products: [
    { id:1, code:'00001', name:'ปลาแซลมอนนอร์เวย์', cat:'ปลา', sell:380, cost:280, stock:124.5, min:20, tax:'vat7' },
    { id:2, code:'00002', name:'กุ้งขาวแวนนาไม',     cat:'กุ้ง', sell:220, cost:160, stock:89.0,  min:30, tax:'vat7' },
    { id:3, code:'00003', name:'ปลาทูน่าครีบเหลือง',  cat:'ปลา', sell:290, cost:210, stock:56.5,  min:15, tax:'vat7' },
    { id:4, code:'00004', name:'หอยเชลล์แช่แข็ง',     cat:'หอย', sell:480, cost:360, stock:8.5,   min:10, tax:'vat7' },
    { id:5, code:'00005', name:'ปลาดอลลี่ฟิลเล่',     cat:'ปลา', sell:95,  cost:65,  stock:0,     min:25, tax:'nonvat' },
    { id:6, code:'00006', name:'กุ้งมังกร',           cat:'กุ้ง', sell:1200,cost:900, stock:22.0,  min:5,  tax:'vat7' },
  ],
  demoBarcodes: [
    { code:'1200001239094', label:'ปลาแซลมอน 23.909 KG' },
    { code:'1200002089005', label:'กุ้งขาว 08.900 KG' },
    { code:'1200003056505', label:'ปลาทูน่า 05.650 KG' },
    { code:'1200004008505', label:'หอยเชลล์ 00.850 KG' },
  ],
  customers: [
    { id:0, code:'CUS000', name:'ลูกค้าทั่วไป', type:'general', tax:'', tel:'', addr:'', discount:0 },
    { id:1, code:'CUS001', name:'บ. ซีฟู้ด โปรวิชั่น จก.', type:'wholesale', tax:'0105566111111', tel:'02-xxx-1111', addr:'456 ถนนสีลม แขวงสีลม บางรัก กรุงเทพฯ 10500', discount:500 },
    { id:2, code:'CUS002', name:'ร้านอาหารโตเกียว',        type:'wholesale', tax:'',              tel:'081-234-5678', addr:'ย่านอโศก สุขุมวิท กรุงเทพฯ 10110', discount:0 },
    { id:3, code:'CUS003', name:'Shopee Store',            type:'online',    tax:'',              tel:'', addr:'', discount:0 },
    { id:4, code:'CUS004', name:'ครัวคุณนาย',              type:'wholesale', tax:'0335566009900', tel:'089-999-0001', addr:'ลาดพร้าว กรุงเทพฯ 10230', discount:0 },
    { id:5, code:'CUS005', name:'Lazada Official',         type:'online',    tax:'',              tel:'', addr:'', discount:0 },
  ],
  users: [
    { id:1, name:'Admin Kanya',   user:'admin',   role:'Administrator', status:'active',  last:'01/06/69 23:01' },
    { id:2, name:'สมชาย ใจดี',   user:'somchai', role:'Staff',          status:'active',  last:'01/06/69 18:30' },
    { id:3, name:'วิภา แสงทอง', user:'wipa',    role:'Staff',          status:'inactive',last:'10/04/69 09:00' },
  ],
  /* reportRows: grossSale = net excl.VAT, vat = grossSale×7%, total = grossSale×1.07 */
  /* reportRows: inv = primary number (INVyymmNNN for wholesale A4, TIVyymmNNN for abbreviated)
     thermalInv = abbreviated TIV number (always present for commercial sales)
     TIV sequence covers ALL commercial sales in order; INV sequence covers wholesale-only.
     Sales chronological: 10/05→TIV2504001/INV2504001, 11/05→TIV2504002/INV2504002,
     12/05→TIV2504003(online), 13/05→TIV2504004(online), 14/05→TIV2504005/INV2504003,
     15/05→TIV2505001(voided-no INV), 15/05→TIV2505002/INV2505001 */
  /* เริ่มต้นใหม่ — ไม่มีข้อมูลย้อนหลัง รายงาน/แดชบอร์ดจะรันสดจากยอดขายจริงที่เกิดขึ้นตั้งแต่วันนี้เป็นต้นไป */
  reportRows: [],
  /* invoices: ALL auto-generated = Thermal (TIV), no = 'TIV-YYYYMM-XXXX' (Buddhist year).
     Full A4 invoice (INV) is issued manually; when issued, TIV record gets fullInvNo + INV record is added.
     Mock data: TIV-256805-0002 already has a manually-issued INV-256805-0001 as demo.
                TIV-256906-0001 is a fresh wholesale TIV with no INV yet — demo for "+ INV" flow. */
  invoices: [
    /* Demo: TIV-256805-0002 — wholesale May 2025, has already been issued with INV */
    { id:3, no:'TIV-256805-0002', thermalNo:'TIV-256805-0002', type:'Thermal', channel:'wholesale',
      fullInvNo:'INV-256805-0001', printCount:1,
      custId:1, custName:'บ. ซีฟู้ด โปรวิชั่น จก.', custTax:'0105566111111',
      date:'2025-05-15', dateDisplay:'15/05/68',
      items:[{ code:'00001', name:'ปลาแซลมอนนอร์เวย์', weight:37.5, price:380, tax:'vat7' }],
      grossSale:14250, discount:500, netSale:13750, vatBase:11830, vat7:828.10, total:12658.10,
      pay:'transfer', status:'paid', voided:false },
    /* Demo: INV-256805-0001 — A4 full invoice referencing TIV-256805-0002 */
    { id:1, no:'INV-256805-0001', thermalNo:'TIV-256805-0002', type:'A4', channel:'wholesale',
      fullInvNo:null, printCount:1,
      custId:1, custName:'บ. ซีฟู้ด โปรวิชั่น จก.', custTax:'0105566111111',
      date:'2025-05-15', dateDisplay:'15/05/68',
      items:[{ code:'00001', name:'ปลาแซลมอนนอร์เวย์', weight:37.5, price:380, tax:'vat7' }],
      grossSale:14250, discount:500, netSale:13750, vatBase:11830, vat7:828.10, total:12658.10,
      pay:'transfer', status:'paid', voided:false },
    /* TIV-256805-0001 — wholesale May 2025, voided, no INV issued */
    { id:2, no:'TIV-256805-0001', thermalNo:'TIV-256805-0001', type:'Thermal', channel:'wholesale',
      fullInvNo:null, printCount:0,
      custId:2, custName:'ร้านอาหารโตเกียว', custTax:'',
      date:'2025-05-15', dateDisplay:'15/05/68',
      items:[{ code:'00002', name:'กุ้งขาวแวนนาไม', weight:8.0, price:220, tax:'vat7' }],
      grossSale:1760, discount:0, netSale:1760, vatBase:1760, vat7:115.14, total:1760,
      pay:'cash', status:'voided', voided:true,
      voidedAt:'01/06/69 15:34', voidedBy:'Admin Kanya', voidReason:'ลูกค้าต้องการอย่างย่อ', stockRestored:true },
    /* TIV-256906-0001 — wholesale Jun 2026, no INV yet (demo for "+ INV" button) */
    { id:4, no:'TIV-256906-0001', thermalNo:'TIV-256906-0001', type:'Thermal', channel:'wholesale',
      fullInvNo:null, printCount:0,
      custId:4, custName:'ครัวคุณนาย', custTax:'0335566009900',
      date:'2026-06-09', dateDisplay:'09/06/69',
      items:[
        { code:'00001', name:'ปลาแซลมอนนอร์เวย์', weight:12.5, price:380, tax:'vat7' },
        { code:'00003', name:'ปลาทูน่าครีบเหลือง',  weight:6.0,  price:290, tax:'vat7' },
      ],
      grossSale:6490, discount:0, netSale:6490, vatBase:5574.77, vat7:424.77, total:6490,
      pay:'transfer', status:'paid', voided:false },
  ],
  grnLogs: [
    { id:'GRN2606001', no:'GRN2606001', date:'2568-06-01', dateDisplay:'01/06/69', poNo:'PO-2606-001', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:1, totalWeight:8.9, totalValue:1424, items:[{ code:'00002', name:'กุ้งขาวแวนนาไม', packNo:'PKG-001', weight:8.9, cost:160, value:1424, tax:'vat7' }] },
    { id:'GRN2505002', no:'GRN2505002', date:'2568-05-14', dateDisplay:'14/05/68', poNo:'PO-2505-042', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:3, totalWeight:68.459, totalValue:20785, items:[
      { code:'00001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:32.5, cost:280, value:9100, tax:'vat7' },
      { code:'00003', name:'ปลาทูน่าครีบเหลือง',  packNo:'PKG-002', weight:22.959, cost:210, value:4821.39, tax:'vat7' },
      { code:'00006', name:'กุ้งมังกร',           packNo:'PKG-003', weight:13.0, cost:900, value:11700, tax:'vat7' },
    ]},
    { id:'GRN2505001', no:'GRN2505001', date:'2568-05-10', dateDisplay:'10/05/68', poNo:'PO-2505-039', receiver:'สมชาย ใจดี', note:'', totalPacks:2, totalWeight:32.0, totalValue:9240, items:[
      { code:'00001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:20.0, cost:280, value:5600, tax:'vat7' },
      { code:'00002', name:'กุ้งขาวแวนนาไม',     packNo:'PKG-002', weight:12.0, cost:160, value:1920, tax:'vat7' },
    ]},
  ],
  ledger: [
    { dateISO:'2569-06-01', date:'01/06/69', time:'23:01', type:'out', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:37.5, ref:'INV2505002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2569-06-01', date:'01/06/69', time:'18:00', type:'in',  code:'00002', prod:'กุ้งขาวแวนนาไม',    w:8.9,  ref:'GRN2606001', refType:'รับเข้า', channel:'—', bal:89.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'22:30', type:'out', code:'00002', prod:'กุ้งขาวแวนนาไม',    w:12.0, ref:'INV2505001', refType:'ขายออก', channel:'wholesale', bal:80.1 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00002', prod:'กุ้งขาวแวนนาไม',    w:30.009, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:101.0 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00006', prod:'กุ้งมังกร',          w:13.0, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:22.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'23:01', type:'out', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:25.5, ref:'INV2505002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:32.5, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:150.0 },
    { dateISO:'2568-05-13', date:'13/05/68', time:'10:00', type:'out', code:'00004', prod:'หอยเชลล์แช่แข็ง',   w:5.5,  ref:'ISS002', refType:'ตัดออก (Expired)', channel:'expired', bal:8.5 },
  ],
  recentIssues: [],  /* computed live in Dashboard from SP_STATE.invoices */
  /* เริ่มต้นใหม่ทั้งหมด — ไม่มียอดขายย้อนหลังจำลอง
     ค่าด้านล่างคือ baseline ว่างเปล่า; window.SP_API.rebuildDashboard() จะคำนวณยอดจริง
     จาก SP_STATE.invoices สดทุกครั้งที่เปิดหน้า Dashboard โดยเริ่มนับจากยอดขาย "วันนี้" เป็นต้นไป */
  revenue: {
    '7d':  { values:[0,0,0,0,0,0,0], labels:['อา','จ','อ','พ','พฤ','ศ','ส'], unit:'วัน' },
    '1m':  { values:Array(30).fill(0), labels:Array.from({length:30},(_,i)=>`${i+1}`), unit:'วัน' },
    '3m':  { values:Array(12).fill(0), labels:Array.from({length:12},(_,i)=>`ส.${i+1}`), unit:'สัปดาห์' },
    '6m':  { values:Array(6).fill(0),  labels:['','','','','',''], unit:'เดือน' },
    '1y':  { values:Array(12).fill(0), labels:Array.from({length:12},()=>''), unit:'เดือน' },
  },
  chart7d: [0,0,0,0,0,0,0],
  chartLabels: ['อา','จ','อ','พ','พฤ','ศ','ส'],
  revenue7d: [0,0,0,0,0,0,0],
  sales: { today:0, todayDelta:0, month:0, monthTarget:200000, bills:0, avgPerBill:0 },
  salesByChannel: [
    { id:'wholesale', label:'ค้าส่ง',   en:'Wholesale', value:0, tone:'ac' },
    { id:'online',    label:'ออนไลน์',  en:'Online',    value:0, tone:'pu' },
    { id:'other',     label:'หน้าร้าน', en:'Walk-in',   value:0, tone:'gn' },
  ],
  topSellers: [],
};

window.SP_STATE = {
  invoices: [...window.SP_DATA.invoices],
  grnLogs:  [...window.SP_DATA.grnLogs],
  products: window.SP_DATA.products.map(p=>({...p})),
  /* Separate running sequences — no gaps allowed in either series.
     TIV (ใบกำกับภาษีอย่างย่อ): ALL commercial sales.
     INV (ใบกำกับภาษีเต็มรูปแบบ): wholesale only, always references a TIV. */
  invCounterThermal: 2,   // next abbreviated: TIV-256906-0002 (TIV-256906-0001 already used as demo)
  invCounterA4:      1,   // next full A4:     INV-256906-0001 (manually issued from InvoiceList)
  invCounterCN:      1,   // ใบลดหนี้  CN-256906-0001
  invCounterDN:      1,   // ใบเพิ่มหนี้ DN-256906-0001
  invCounter: 3,          // non-commercial ISS-0003 (no YYMM)
  grnCounter: 3,
  adjCounter: 1,
  docMonths:  { invCounterThermal:'256906', invCounterA4:'256906', invCounterCN:'256906', invCounterDN:'256906', grnCounter:'256906', adjCounter:'256906' },
  adjLogs: [],
  auditLog: [],           // Immutable audit trail — all invoice actions
  adjLedger: [],          // movement ledger entries generated from ADJ documents
  /* Document number prefixes — editable in Settings */
  docPrefixes: { grn:'GRN', adj:'ADJ', iss:'ISS', tiv:'TIV', inv:'INV', cn:'CN', dn:'DN' },
};

window.parseBarcode = function(raw) {
  const s = String(raw).replace(/\D/g,'');
  if (s.length !== 13) return null;
  const code = s.slice(2,7);
  const weight = parseInt(s.slice(7,12),10) / 1000;
  const prod = window.SP_DATA.products.find(p => p.code === code);
  if (!prod) return null;
  return { code, weight, prod };
};
/* ── Document number generator — format: PREFIX-YYYYMM-XXXX (Buddhist year, dashes, 4-digit)
   hasYM=true  → PREFIX-BYYYYmm-XXXX  e.g. GRN-256906-0001  (Buddhist year 4-digit)
   hasYM=false → PREFIX-XXXX          e.g. ISS-0003
   Auto-resets counter to 1 when YYYYMM rolls over to a new month. */
window.nextDocNo = function(counterKey, prefix, hasYM) {
  const st = window.SP_STATE;
  if (!st.docMonths) st.docMonths = {};
  if (hasYM) {
    const d    = new Date();
    const yymm = String(d.getFullYear()+543).slice(-4) + String(d.getMonth()+1).padStart(2,'0');
    if (st.docMonths[counterKey] !== yymm) {
      st[counterKey]          = 1;
      st.docMonths[counterKey] = yymm;
    }
    const no = `${prefix}-${yymm}-${String(st[counterKey]).padStart(4,'0')}`;
    st[counterKey]++;
    return no;
  } else {
    const no = `${prefix}-${String(st[counterKey]).padStart(4,'0')}`;
    st[counterKey]++;
    return no;
  }
};

window.fmtMoney = n => '฿' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
window.fmtKg = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:3,maximumFractionDigits:3}) + ' KG';
window.fmtDate = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`; };

/* Thai baht-to-text (จำนวนเงินเป็นตัวอักษร) */
window.bahtText = function(amount) {
  const num = Math.abs(Number(amount) || 0);
  const baht = Math.floor(num);
  const satang = Math.round((num - baht) * 100);
  const TH = ['ศูนย์','หนึ่ง','สอง','สาม','สี่','ห้า','หก','เจ็ด','แปด','เก้า'];
  const POS = ['','สิบ','ร้อย','พัน','หมื่น','แสน','ล้าน'];
  const readGroup = (s) => {
    // read an integer string (any length) using ล้าน recursion
    let n = s.replace(/^0+/, '');
    if (n === '') return '';
    if (n.length > 6) {
      const head = n.slice(0, n.length - 6);
      const tail = n.slice(n.length - 6);
      return readGroup(head) + 'ล้าน' + (tail.replace(/0/g,'')===''?'':readGroup(tail));
    }
    let out = '';
    const len = n.length;
    for (let i = 0; i < len; i++) {
      const d = parseInt(n[i], 10);
      const pos = len - i - 1;
      if (d === 0) continue;
      if (pos === 0 && d === 1 && len > 1) out += 'เอ็ด';
      else if (pos === 1 && d === 1) out += 'สิบ';
      else if (pos === 1 && d === 2) out += 'ยี่สิบ';
      else out += TH[d] + POS[pos];
    }
    return out;
  };
  let txt = baht === 0 ? 'ศูนย์บาท' : readGroup(String(baht)) + 'บาท';
  if (satang === 0) txt += 'ถ้วน';
  else txt += readGroup(String(satang)) + 'สตางค์';
  return txt;
};

/* ── Audit Trail Logger ─────────────────────────────────────────
   logAudit(actionType, docNo, refDocNo?, reason?, details?)     */
window.logAudit = function(actionType, docNo, refDocNo, reason, details) {
  const st  = window.SP_STATE;
  const usr = window.SP_DATA?.user || { name:'System', role:'system' };
  if (!st.auditLog) st.auditLog = [];
  const now = new Date();
  st.auditLog.unshift({
    id:               Date.now() + Math.random(),
    actionType,
    docNo:            docNo  || '',
    refDocNo:         refDocNo || null,
    username:         usr.name,
    userRole:         usr.role,
    reason:           reason || '',
    timestamp:        now.toISOString(),
    timestampDisplay: now.toLocaleDateString('th-TH',{year:'numeric',month:'2-digit',day:'2-digit'}) +
                      ' ' + now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'}),
    details:          details || {},
  });
  if (st.auditLog.length > 1000) st.auditLog = st.auditLog.slice(0, 1000);
};

/* ── CSV Export utility ──────────────────────────────────────────
   exportCSV(filename, headers, dataRows)
   headers: string[]
   dataRows: (string|number|null)[][]   */
/* ── Merge invoice items ใช้ร่วมกันทุกเอกสาร ──────────────────
   mergeInvItems(items, totalDisc)
   items: [{code, name, weight, price|price_per_kg, tax, ...}]
   → [{...firstItem, indivWeight, scanCount, lineDisc}]
   หมายเหตุ: รวมเฉพาะสินค้ารหัสเดียวกัน "และ" น้ำหนักเท่ากันเท่านั้น —
   หากน้ำหนักต่างกันห้ามรวมบรรทัด (ราคาต้องคิดจาก น้ำหนัก × ราคาขาย ของแต่ละชิ้น) */
window.mergeInvItems = function(items, totalDisc) {
  const map = {};
  (items || []).forEach(it => {
    const w   = Number(it.weight||0);
    const key = `${it.code||it.name}__${w.toFixed(4)}`;
    if (!map[key]) {
      map[key] = { ...it, indivWeight: w, scanCount: 0, lineDisc: 0 };
    }
    map[key].scanCount += 1;
  });
  const all = Object.values(map);
  // Allocate invoice-level discount proportionally
  if (totalDisc > 0) {
    const gross = all.reduce((s,it) =>
      s + it.scanCount * it.indivWeight * Number(it.price||it.price_per_kg||0), 0);
    all.forEach(it => {
      const lineGross = it.scanCount * it.indivWeight * Number(it.price||it.price_per_kg||0);
      it.lineDisc = gross > 0 ? Math.round(totalDisc * (lineGross / gross) * 100) / 100 : 0;
    });
  }
  return all;
};

/* ── Print helper: iframe (ไม่ถูก popup blocker) ──────────────── */
window._printHtml = function(html) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:960px;height:720px;border:0;visibility:hidden;';
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument || iframe.contentWindow.document;
  doc.open(); doc.write(html); doc.close();
  setTimeout(() => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch(e) {}
    setTimeout(() => { try { document.body.removeChild(iframe); } catch(e) {} }, 3000);
  }, 600);
};

/* ── PDF Export utility ──────────────────────────────────────────
   exportPDF(title, headers, dataRows, subtitle?)                 */
window.exportPDF = function(title, headers, dataRows, subtitle) {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const now = new Date().toLocaleDateString('th-TH',
    { year:'numeric', month:'long', day:'numeric', weekday:'long' });
  const co = (window.SP_DATA && window.SP_DATA.company) || {};
  const n2 = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

  /* ── วิเคราะห์ค่าในเซลล์: ตัวเลข + หน่วย (฿ / KG / %) ── */
  const parseCell = (v) => {
    if (v == null) return null;
    const s = String(v).trim();
    if (s === '' || s === '—' || s === '-') return null;
    let suffix = '';
    if (/KG\s*$/i.test(s)) suffix = 'KG';
    else if (/%\s*$/.test(s)) suffix = '%';
    else if (/^฿/.test(s)) suffix = '฿';
    const cleaned = s.replace(/[฿,%]/g,'').replace(/\s*KG\s*$/i,'').trim();
    if (cleaned === '' || isNaN(cleaned)) return null;
    return { num: parseFloat(cleaned), suffix };
  };
  const fmtBySuffix = (num, suffix) => {
    const f = n2(num);
    if (suffix === '฿') return '฿' + f;
    if (suffix === 'KG') return f + ' KG';
    if (suffix === '%') return f + '%';
    return f;
  };

  /* ── คอลัมน์ตัวเลข → จัดทศนิยม 2 ตำแหน่งเสมอ + รวมยอด ── */
  const colIsNumeric = headers.map((h,ci) => {
    const cells = dataRows.map(r => r[ci]);
    const nonEmpty = cells.filter(c => c != null && String(c).trim() !== '' && String(c).trim() !== '—');
    if (nonEmpty.length === 0) return false;
    return nonEmpty.every(c => parseCell(c) !== null);
  });
  const colSums = headers.map((h,ci) => {
    if (!colIsNumeric[ci]) return null;
    let sum = 0, suffix = '';
    dataRows.forEach(r => { const p = parseCell(r[ci]); if (p) { sum += p.num; suffix = p.suffix || suffix; } });
    return { label: h, sum, suffix };
  });

  const fmtCell = (v, ci) => {
    if (!colIsNumeric[ci]) return esc(v);
    const p = parseCell(v);
    if (!p) return esc(v);
    return fmtBySuffix(p.num, p.suffix);
  };

  const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Sarabun',sans-serif;font-size:12px;color:#18171a;padding:24px 28px}
  .hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a1826;padding-bottom:14px;margin-bottom:16px}
  .co-name{font-size:15px;font-weight:800;color:#3b5bdb;margin-bottom:3px}
  .co-info{font-size:10.5px;color:#555;line-height:1.6}
  .doc-title{font-size:19px;font-weight:800;text-align:right}
  .sub{font-size:11px;color:#666;margin-bottom:14px}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{background:#1a1826;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;white-space:nowrap}
  td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11.5px;vertical-align:middle}
  td.num,th.num{text-align:right;font-family:monospace}
  tr:last-child td{border:none}
  tfoot td{background:#f5f4f0;font-weight:800;border-top:2px solid #1a1826;border-bottom:none;font-family:monospace}
  tfoot td.lbl{font-family:'Sarabun',sans-serif;text-align:left}
  .footer{margin-top:16px;font-size:10.5px;color:#999;border-top:1px solid #ddd;padding-top:8px}
  @media print{@page{margin:1.5cm}}
</style></head><body>
<div class="hdr">
  <div style="display:flex;align-items:center;gap:10px">
    <div style="width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,#5b7cff,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:13px">SP</div>
    <div><div class="co-name">${esc(co.name||'StockPro')}</div>
    <div class="co-info">${esc(co.addr||'')}${co.addr?'<br>':''}โทร: ${esc(co.tel||'—')} · เลขผู้เสียภาษี: ${esc(co.tax||'—')}</div></div>
  </div>
  <div><div class="doc-title">${esc(title)}</div>
  <div class="sub" style="margin:4px 0 0;text-align:right">${subtitle ? esc(subtitle)+'&ensp;·&ensp;' : ''}พิมพ์เมื่อ ${esc(now)}</div></div>
</div>
<table>
  <thead><tr>${headers.map((h,ci)=>`<th class="${colIsNumeric[ci]?'num':''}">${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${dataRows.map(r=>`<tr>${r.map((c,ci)=>`<td class="${colIsNumeric[ci]?'num':''}">${fmtCell(c,ci)}</td>`).join('')}</tr>`).join('')}</tbody>
  ${colSums.some(Boolean) ? `<tfoot><tr>${headers.map((h,ci)=>{
    const cs = colSums[ci];
    if (cs) return `<td class="num">${fmtBySuffix(cs.sum, cs.suffix)}</td>`;
    if (ci === 0) return `<td class="lbl">รวมทั้งหมด</td>`;
    return `<td></td>`;
  }).join('')}</tr></tfoot>` : ''}
</table>
<div class="footer">StockPro &mdash; รวม ${dataRows.length} รายการ</div>
</body></html>`;
  window._printHtml(html);
};

/* ── Document Print (GRN / TIV / INV) ──────────────────────────
   window.printDoc(type, data)
   type: 'grn' | 'tiv' | 'inv'                                   */
window.printDoc = function(type, data) {
  if (!data) return;
  const co  = window.SP_DATA.company;
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const $ = n => '&#3647;' + Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const nf = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const baseStyle = `<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Sarabun',sans-serif;font-size:12.5px;color:#18171a}
.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a1826;padding-bottom:14px;margin-bottom:14px}
.co-name{font-size:16px;font-weight:800;color:#3b5bdb;margin-bottom:3px}
.co-info{font-size:11px;color:#555;line-height:1.7}
.doc-title{font-size:22px;font-weight:800;letter-spacing:.5px;text-align:right}
.doc-no{font-size:13px;line-height:2;text-align:right}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;font-size:12.5px;margin-bottom:14px}
.meta-r{padding:10px 14px;background:#f5f4f0;border-radius:8px}
table{width:100%;border-collapse:collapse}
th{background:#1a1826;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700}
th.r{text-align:right} td{padding:8px 10px;border-bottom:1px solid #eee;font-size:12px}
td.r{text-align:right;font-weight:700} tfoot td{background:#f5f4f0;font-weight:700}
.total-row{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:#f5f4f0;border-radius:8px;margin-top:10px;font-size:15px;font-weight:800}
.sig{display:flex;justify-content:space-around;margin-top:40px;font-size:11.5px;color:#555}
.sig-line{text-align:center;flex:1} .sig-line div{border-top:1px solid #999;margin:0 20px 6px}
@media print{@page{size:A4;margin:1.2cm}}</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;

  let body = '';

  if (type === 'grn') {
    const items   = data.items || [];
    const totW    = Number(data.totalWeight || 0);
    const totV    = Number(data.totalValue  || 0);
    const vatBase = items.filter(i=>i.tax==='vat7').reduce((s,i)=>s+Number(i.value||0),0);
    const vatAmt  = vatBase * 7/107;

    /* Merge รายการสินค้าที่เหมือนกัน (same code) → แสดงบรรทัดเดียว */
    const mergeMap = {};
    items.forEach(it => {
      const key = it.code || it.name;
      if (!mergeMap[key]) mergeMap[key] = { ...it, packCount:0, totalWeight:0, totalValue:0 };
      mergeMap[key].packCount   += 1;
      mergeMap[key].totalWeight += Number(it.weight||0);
      mergeMap[key].totalValue  += Number(it.value||0);
    });
    const mergedItems = Object.values(mergeMap);

    body = `<div class="hdr">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#5b7cff,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px">SP</div>
        <div><div class="co-name">${esc(co.name)}</div>
        <div class="co-info">${esc(co.addr)}<br>โทร: ${esc(co.tel)} · เลขภาษี: ${esc(co.tax)}</div></div>
      </div>
      <div><div class="doc-title" style="color:#3b5bdb">GRN</div>
      <div style="font-size:11.5px;color:#666;text-align:right;margin-top:3px">เอกสารรับสินค้า</div></div></div>
    <div class="meta">
      <div><span style="color:#666">เลขที่ GRN:</span> <b style="font-family:monospace">${esc(data.id||data.grn_no||'')}</b></div>
      <div><span style="color:#666">วันที่รับ:</span> <b>${esc(data.dateDisplay||data.date||'')}</b></div>
      <div><span style="color:#666">เลขที่ PO อ้างอิง:</span> <b>${esc(data.poNo||'—')}</b></div>
      <div><span style="color:#666">ผู้รับสินค้า:</span> <b>${esc(data.receiver||'')}</b></div>
      ${data.note?`<div style="grid-column:1/-1"><span style="color:#666">หมายเหตุ:</span> <b>${esc(data.note)}</b></div>`:''}
    </div>
    <table><thead><tr><th>รายการที่</th><th>สินค้า</th><th>จำนวน</th><th class="r">น้ำหนัก</th><th class="r">ราคาทุน/KG</th><th style="text-align:center">ภาษี</th><th class="r">มูลค่า</th></tr></thead>
    <tbody>${mergedItems.map((it,i)=>`<tr>
      <td style="color:#999">${i+1}</td>
      <td><b>${esc(it.name)}</b><br><span style="font-size:10.5px;color:#888">${esc(it.code)}</span></td>
      <td style="font-family:monospace;text-align:center;font-weight:700">${it.packCount}</td>
      <td class="r">${it.totalWeight.toFixed(3)}</td>
      <td class="r">${$(it.cost||it.cost_price||0)}</td>
      <td style="text-align:center"><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;background:${it.tax==='vat7'?'#e8edff':'#f0efe9'};color:${it.tax==='vat7'?'#3b5bdb':'#888'}">${it.tax==='vat7'?'VAT 7%':'Non VAT'}</span></td>
      <td class="r" style="color:#0d9272">${$(it.totalValue)}</td>
    </tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="2">รวม ${mergedItems.length} รายการ</td>
    <td style="text-align:center">${data.totalPacks}</td>
    <td class="r">${totW.toFixed(3)} KG</td><td></td><td></td>
    <td class="r" style="color:#0d9272">${$(totV)}</td></tr></tfoot></table>
    <div style="display:flex;justify-content:flex-end;margin-top:10px">
      <div style="width:280px;font-size:12.5px">
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee"><span style="color:#666">จำนวนสินค้า</span><b>${mergedItems.length} รายการ</b></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee"><span style="color:#666">น้ำหนักรวม</span><b style="color:#3b5bdb">${totW.toFixed(3)} KG</b></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee"><span style="color:#666">ยอดก่อน VAT</span><b>${$(totV - vatAmt)}</b></div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #eee"><span style="color:#666">VAT 7%</span><b style="color:#6741d9">${$(vatAmt)}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:14px;font-weight:800"><span>มูลค่ารวม (สุทธิ)</span><b style="color:#0d9272">${$(totV)}</b></div>
      </div>
    </div>
    <div class="sig"><div class="sig-line"><div></div>ผู้ส่งสินค้า</div>
    <div class="sig-line"><div></div>ผู้รับสินค้า</div>
    <div class="sig-line"><div></div>ผู้มีอำนาจลงนาม</div></div>`;
  }

  if (type === 'tiv') {
    const items   = data.items || [];
    const totW    = items.reduce((s,it)=>s+Number(it.weight||0),0);
    const net     = Number(data.netSale||data.afterDisc||data.total||0);
    const disc    = Number(data.discount||0);
    const subtotal = Number(data.subtotal||data.grossSale||net+disc||0);
    const vat     = Number(data.vat7||data.vat||0);
    const preVat  = net - vat;
    const payLbl  = {cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต'}[data.pay]||'—';
    const usr     = (window.SP_DATA?.user?.name) || 'Admin Kanya';
    const dateStr = data.dateDisplay || data.date || '';
    const timeStr = data.time || '';

    /* Merge รายการสินค้าที่เหมือนกัน — รวมเฉพาะรหัสเดียวกัน "และ" น้ำหนักเท่ากัน
       (น้ำหนักต่างกันห้ามรวมบรรทัด — ราคาคิดจาก น้ำหนัก × ราคาขาย ของแต่ละชิ้น)
       - indivWeight = น้ำหนักต่อแพ็ค (ไม่รวม)
       - scanCount   = จำนวนแพ็ค                */
    const mergeMap = {};
    items.forEach(it => {
      const w   = Number(it.weight||0);
      const key = `${it.code||it.name}__${w.toFixed(4)}`;
      if (!mergeMap[key]) mergeMap[key] = { ...it, indivWeight: w, lineDisc: 0, scanCount: 0 };
      mergeMap[key].scanCount += 1;
      const gross = Number(it.weight||0) * Number(it.price||it.price_per_kg||0);
      const iDisc = it.discType==='percent' ? gross*(Number(it.discVal)||0)/100 : (Number(it.discVal)||0);
      mergeMap[key].lineDisc += iDisc;
    });
    const mergedItems = Object.values(mergeMap);

    const itemRows = mergedItems.map(it => {
      const w       = Number(it.indivWeight || it.weight || 0); // น้ำหนักต่อแพ็ค
      const p       = Number(it.price||it.price_per_kg||0);
      const qty     = it.scanCount || 1;
      const perPack = w * p;                   // หน่วยละ
      const disc    = Number(it.lineDisc||0);
      const total   = qty * perPack - disc;    // รวมเงิน
      return `<div style="display:grid;grid-template-columns:1fr 36px 75px 80px;gap:4px;font-size:11.5px;margin-bottom:8px;align-items:start">
        <div>
          <div style="font-weight:600;line-height:1.4">${esc(it.name)}</div>
          <div style="font-size:10px;color:#888">${w.toFixed(3)} KG · &#3647;${p}/KG</div>
          ${disc>0?`<div style="font-size:10px;color:#dd0000">ส่วนลด -${nf(disc)}</div>`:''}
        </div>
        <div style="text-align:right;font-family:monospace;font-weight:600">${qty}</div>
        <div style="text-align:right;font-family:monospace">${nf(perPack)}</div>
        <div style="text-align:right;font-family:monospace;font-weight:700">${nf(total)}</div>
      </div>`;
    }).join('');

    body = `<div style="max-width:380px;margin:0 auto;background:#fff;padding:20px;font-size:12px;color:#18171a">
      <div style="text-align:center;margin-bottom:12px">
        <div style="font-size:14px;font-weight:800;margin-bottom:3px">${esc(co.name)}</div>
        <div style="font-size:10.5px;color:#555;line-height:1.7">${esc(co.addr)}</div>
        <div style="font-size:10.5px;color:#555">เลขประจำตัวผู้เสียภาษี ${esc(co.tax)}</div>
        <div style="font-size:10.5px;color:#555">(สำนักงานใหญ่)</div>
      </div>
      <div style="border-top:1px dashed #bbb;border-bottom:1px dashed #bbb;padding:6px 0;margin-bottom:10px;text-align:center">
        <div style="font-size:12.5px;font-weight:800">ใบเสร็จรับเงิน/ใบกำกับภาษีแบบย่อ</div>
      </div>
      <div style="font-size:11.5px;margin-bottom:10px">
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:85px">เลขที่เอกสาร:</span><b style="font-family:monospace">${esc(data.no||data.thermalNo||data.invoice_no||'')}</b></div>
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:85px">วันที่ขาย:</span><b>${esc(dateStr+' '+timeStr)}</b></div>
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:85px">พนักงานขาย:</span><b>${esc(usr)}</b></div>
        ${data.custName&&data.custName!=='—'?`<div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:85px">ลูกค้า:</span><b>${esc(data.custName)}</b></div>`:''}
      </div>
      <div style="border-top:1px dashed #bbb;margin-bottom:6px"></div>
      <div style="display:grid;grid-template-columns:1fr 60px 60px 75px;gap:4px;font-size:10px;font-weight:700;color:#555;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:6px">
        <span>รายการ</span><span style="text-align:right">จำนวน</span><span style="text-align:right">หน่วยละ</span><span style="text-align:right">รวมเงิน</span>
      </div>
      ${itemRows}
      <div style="font-size:10.5px;color:#666;border-top:1px dashed #bbb;padding-top:5px;margin-bottom:8px">
        รายการ: ${mergedItems.length} &nbsp;·&nbsp; น้ำหนักรวม: ${totW.toFixed(3)} KG
      </div>
      <div style="border-top:1px dashed #bbb;margin-bottom:6px"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#555">รวมเป็นเงิน</span><span>${nf(subtotal)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px"><span style="color:#555">ส่วนลด</span><span style="color:${disc>0?'#dd0000':'inherit'};font-weight:${disc>0?700:400}">${disc>0?'-'+nf(disc):'0.00'}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:15px;font-weight:800;border-top:2px solid #18171a;border-bottom:2px solid #18171a;padding:4px 0;margin:4px 0 8px">
        <span>รวมทั้งสิ้น</span><span>${nf(net)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:11px"><span style="color:#555">รวมมูลค่าสินค้า</span><span>${nf(preVat)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:11px"><span style="color:#555">ภาษีมูลค่าเพิ่ม</span><span>${nf(vat)}</span></div>
      <div style="border-top:1px dashed #bbb;margin-bottom:6px"></div>
      <div style="font-size:11.5px;margin-bottom:8px;font-weight:600">${esc(payLbl)} ${nf(net)}</div>
      <div style="text-align:center;font-size:11px;color:#888;border-top:1px dashed #bbb;padding-top:10px">ขอบคุณที่ใช้บริการ</div>
    </div>`;
  }

  if (type === 'inv') {
    const items   = data.items || [];
    const net     = Number(data.netSale||data.total||0);
    const disc    = Number(data.discount||0);
    const vat     = Number(data.vat7||0);
    const preVat  = net - vat;
    const payLbl  = {cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต'}[data.pay]||'—';
    const cust    = window.SP_DATA.customers.find(c=>c.id===(data.custId||data.customer_id)) || {};
    body = `<div class="hdr">
      <div><div class="co-name">${esc(co.name)}</div>
      <div class="co-info">${esc(co.addr)}<br>โทร: ${esc(co.tel)} | อีเมล: ${esc(co.email)}<br>เลขประจำตัวผู้เสียภาษี: <b>${esc(co.tax)}</b></div></div>
      <div><div class="doc-title">ใบกำกับภาษี</div>
      <div style="font-size:11px;color:#999;text-align:right">(ราคารวม VAT)</div>
      <div class="doc-no">เลขที่: <b>${esc(data.no||data.invoice_no||'')}</b><br>วันที่: <b>${esc(data.dateDisplay||data.date||'')}</b></div></div></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;margin-bottom:20px">
      ${[['ผู้ขาย',co.name,co.addr,co.tax],['ผู้ซื้อ',cust.name||data.custName,cust.addr||data.custAddr||'',data.custTax||cust.tax||'']].map(([lbl,name,addr,tax])=>`
      <div style="border:1px solid #e2e0da;border-radius:10px;padding:14px 16px">
        <div style="font-size:11.5px;font-weight:700;color:#666;margin-bottom:8px">${lbl}</div>
        <div style="font-size:14px;font-weight:700;margin-bottom:5px">${esc(name||'—')}</div>
        <div style="font-size:12px;color:#555;line-height:1.8">${esc(addr||'—')}</div>
        <div style="font-size:12px;color:#555;margin-top:3px">เลขภาษี: ${esc(tax||'—')}</div>
      </div>`).join('')}
    </div>
    <table><thead><tr><th>#</th><th>รหัส</th><th>สินค้า</th><th class="r">KG</th><th class="r">ราคา/KG</th><th class="r">ส่วนลด</th><th class="r">จำนวนเงิน</th></tr></thead>
    <tbody>${items.map((it,i)=>`<tr>
      <td style="color:#999">${i+1}</td><td style="font-family:monospace;font-size:11px">${esc(it.code)}</td>
      <td><b>${esc(it.name)}</b></td>
      <td class="r">${Number(it.weight||0).toFixed(3)}</td>
      <td class="r">${$(it.price||it.price_per_kg||0)}</td>
      <td class="r" style="color:#c47b00">${it.discount>0?'-'+$(it.discount):'—'}</td>
      <td class="r" style="color:#0d9272">${$(Number(it.weight||0)*Number(it.price||it.price_per_kg||0))}</td>
    </tr>`).join('')}</tbody></table>
    <div style="display:flex;justify-content:flex-end;margin-top:8px">
      <div style="width:280px;font-size:13px">
        <div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #eee"><span style="color:#666">ยอดรวม (incl. VAT)</span><b>${$(net+disc)}</b></div>
        ${disc>0?`<div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #eee"><span style="color:#c47b00">ส่วนลด</span><b style="color:#c47b00">-${$(disc)}</b></div>`:''}
        <div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #eee"><span style="color:#666">ยอดก่อน VAT</span><b>${$(preVat)}</b></div>
        <div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid #eee"><span style="color:#6741d9">VAT 7%</span><b style="color:#6741d9">${$(vat)}</b></div>
        <div class="total-row"><span>จำนวนเงินรวมทั้งสิ้น</span><span style="font-size:18px;color:#0d9272">${$(net)}</span></div>
        <div style="font-size:12.5px;margin-top:10px">ช่องทางชำระเงิน: <b>${esc(payLbl)}</b></div>
      </div>
    </div>
    ${data.note ? `<div style="margin:18px 0 0;padding:10px 14px;background:#fffbe6;border:1px solid #ffe58f;border-radius:7px;font-size:12.5px;color:#7a5a00;line-height:1.7"><b>หมายเหตุ:</b> ${esc(data.note)}</div>` : ''}
    <div class="sig"><div class="sig-line"><div></div>ผู้รับสินค้า / ผู้ซื้อ</div>
    <div class="sig-line"><div></div>ผู้มีอำนาจลงนาม</div></div>`;
  }

  if (!body) return;
  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${baseStyle}</head><body style="padding:20px">${body}</body></html>`;
  window._printHtml(html);
};

/* ── Restore company logo from localStorage across page reloads ── */
(function() {
  try {
    const saved = localStorage.getItem('sp_company_logo');
    if (saved) window.SP_DATA.company.logoUrl = saved;
  } catch(e) {}
})();

/* ── CSV Export utility ──────────────────────────────────────────
   exportCSV(filename, headers, rows)
   headers: string[]
   dataRows: (string|number|null)[][]   */
window.exportCSV = function(filename, headers, dataRows) {
  const esc = v => {
    const s = String(v == null ? '' : v);
    return /[,"\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
  };
  const csv = [headers, ...dataRows].map(r => r.map(esc).join(',')).join('\r\n');
  const blob = new Blob(['\ufeff' + csv], { type:'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  Object.assign(document.createElement('a'), { href:url, download:filename, style:'display:none' }).click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
