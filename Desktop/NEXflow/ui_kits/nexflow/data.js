/* NEXflow UI Kit — shared mock data (updated: dateISO, pay, custId per row) */
window.SP_DATA = {
  company: {
    name: 'บริษัท ซีฟู้ด โปรวิชั่น จำกัด',
    addr: '123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110',
    tax: '0105566012345', tel: '02-xxx-xxxx', email: 'info@seafoodprovision.co.th',
    vat: 7, currency: 'THB',
    logoUrl: '',  /* Base64 data URL — set by Settings logo upload */
    showLogoOnReceipt: true,
    receiptPrinter: '',
    a4Printer: '',
    /* การตรวจ check digit ของบาร์โค้ด: 'none' (ค่าเริ่มต้น) | 'ean13'
       เปิด 'ean13' เฉพาะเมื่อฉลากออกตามมาตรฐาน EAN-13 เท่านั้น */
    barcodeCheckScheme: 'none',
  },
  user: { name: 'Admin', role: 'Administrator', initials: 'AD' },
  products: [
    { id:1, code:'000001', name:'ปลาแซลมอนนอร์เวย์', cat:'ปลา', sell:380, cost:280, stock:124.5, min:20, tax:'vat7', unitType:'kg', unitLabel:'KG' },
    { id:2, code:'000002', name:'กุ้งขาวแวนนาไม',     cat:'กุ้ง', sell:220, cost:160, stock:89.0,  min:30, tax:'vat7', unitType:'kg', unitLabel:'KG' },
    { id:3, code:'000003', name:'ปลาทูน่าครีบเหลือง',  cat:'ปลา', sell:290, cost:210, stock:56.5,  min:15, tax:'vat7', unitType:'kg', unitLabel:'KG' },
    { id:4, code:'000004', name:'หอยเชลล์แช่แข็ง',     cat:'หอย', sell:480, cost:360, stock:8.5,   min:10, tax:'vat7', unitType:'kg', unitLabel:'KG' },
    { id:5, code:'000005', name:'ปลาดอลลี่ฟิลเล่',     cat:'ปลา', sell:95,  cost:65,  stock:0,     min:25, tax:'nonvat', unitType:'kg', unitLabel:'KG' },
    { id:6, code:'000006', name:'กุ้งมังกร',           cat:'กุ้ง', sell:1200,cost:900, stock:22.0,  min:5,  tax:'vat7', unitType:'kg', unitLabel:'KG' },
  ],
  /* บาร์โค้ดทดลอง — code ต้องตรงกับ products ด้านบน (6 หลัก) เพื่อให้สแกนในโหมด mock เจอสินค้า
     รูปแบบ 13 หลัก: [1 prefix][6 code][5 weight×1000][1 check] */
  demoBarcodes: [
    { code:'1000001045000', label:'ปลาแซลมอนนอร์เวย์ · 4.500 KG' },
    { code:'1000002020000', label:'กุ้งขาวแวนนาไม · 2.000 KG' },
    { code:'1000003060000', label:'ปลาทูน่าครีบเหลือง · 6.000 KG' },
    { code:'1000006015000', label:'กุ้งมังกร · 1.500 KG' },
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
      items:[{ code:'000001', name:'ปลาแซลมอนนอร์เวย์', weight:37.5, price:380, tax:'vat7' }],
      grossSale:14250, discount:500, netSale:13750, vatBase:12850.47, vat7:899.53, total:13750,
      pay:'transfer', status:'paid', voided:false },
    /* Demo: INV-256805-0001 — A4 full invoice referencing TIV-256805-0002 */
    { id:1, no:'INV-256805-0001', thermalNo:'TIV-256805-0002', type:'A4', channel:'wholesale',
      fullInvNo:null, printCount:1,
      custId:1, custName:'บ. ซีฟู้ด โปรวิชั่น จก.', custTax:'0105566111111',
      date:'2025-05-15', dateDisplay:'15/05/68',
      items:[{ code:'000001', name:'ปลาแซลมอนนอร์เวย์', weight:37.5, price:380, tax:'vat7' }],
      grossSale:14250, discount:500, netSale:13750, vatBase:12850.47, vat7:899.53, total:13750,
      pay:'transfer', status:'paid', voided:false },
    /* TIV-256805-0001 — wholesale May 2025, voided, no INV issued */
    { id:2, no:'TIV-256805-0001', thermalNo:'TIV-256805-0001', type:'Thermal', channel:'wholesale',
      fullInvNo:null, printCount:0,
      custId:2, custName:'ร้านอาหารโตเกียว', custTax:'',
      date:'2025-05-15', dateDisplay:'15/05/68',
      items:[{ code:'000002', name:'กุ้งขาวแวนนาไม', weight:8.0, price:220, tax:'vat7' }],
      grossSale:1760, discount:0, netSale:1760, vatBase:1644.86, vat7:115.14, total:1760,
      pay:'cash', status:'voided', voided:true,
      voidedAt:'01/06/69 15:34', voidedBy:'Admin Kanya', voidReason:'ลูกค้าต้องการอย่างย่อ', stockRestored:true },
    /* TIV-256906-0001 — wholesale Jun 2026, no INV yet (demo for "+ INV" button) */
    { id:4, no:'TIV-256906-0001', thermalNo:'TIV-256906-0001', type:'Thermal', channel:'wholesale',
      fullInvNo:null, printCount:0,
      custId:4, custName:'ครัวคุณนาย', custTax:'0335566009900',
      date:'2026-06-09', dateDisplay:'09/06/69',
      items:[
        { code:'000001', name:'ปลาแซลมอนนอร์เวย์', weight:12.5, price:380, tax:'vat7' },
        { code:'000003', name:'ปลาทูน่าครีบเหลือง',  weight:6.0,  price:290, tax:'vat7' },
      ],
      grossSale:6490, discount:0, netSale:6490, vatBase:6065.23, vat7:424.77, total:6490,
      pay:'transfer', status:'paid', voided:false },
  ],
  grnLogs: [
    { id:'GRN2606001', no:'GRN2606001', date:'2568-06-01', dateDisplay:'01/06/69', poNo:'PO-2606-001', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:1, totalWeight:8.9, totalValue:1424, items:[{ code:'000002', name:'กุ้งขาวแวนนาไม', packNo:'PKG-001', weight:8.9, cost:160, value:1424, tax:'vat7' }] },
    { id:'GRN2505002', no:'GRN2505002', date:'2568-05-14', dateDisplay:'14/05/68', poNo:'PO-2505-042', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:3, totalWeight:68.459, totalValue:20785, items:[
      { code:'000001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:32.5, cost:280, value:9100, tax:'vat7' },
      { code:'000003', name:'ปลาทูน่าครีบเหลือง',  packNo:'PKG-002', weight:22.959, cost:210, value:4821.39, tax:'vat7' },
      { code:'000006', name:'กุ้งมังกร',           packNo:'PKG-003', weight:13.0, cost:900, value:11700, tax:'vat7' },
    ]},
    { id:'GRN2505001', no:'GRN2505001', date:'2568-05-10', dateDisplay:'10/05/68', poNo:'PO-2505-039', receiver:'สมชาย ใจดี', note:'', totalPacks:2, totalWeight:32.0, totalValue:9240, items:[
      { code:'000001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:20.0, cost:280, value:5600, tax:'vat7' },
      { code:'000002', name:'กุ้งขาวแวนนาไม',     packNo:'PKG-002', weight:12.0, cost:160, value:1920, tax:'vat7' },
    ]},
  ],
  ledger: [
    { dateISO:'2569-06-01', date:'01/06/69', time:'23:01', type:'out', code:'000001', prod:'ปลาแซลมอนนอร์เวย์', w:37.5, ref:'INV2505002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2569-06-01', date:'01/06/69', time:'18:00', type:'in',  code:'000002', prod:'กุ้งขาวแวนนาไม',    w:8.9,  ref:'GRN2606001', refType:'รับเข้า', channel:'—', bal:89.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'22:30', type:'out', code:'000002', prod:'กุ้งขาวแวนนาไม',    w:12.0, ref:'INV2505001', refType:'ขายออก', channel:'wholesale', bal:80.1 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'000002', prod:'กุ้งขาวแวนนาไม',    w:30.009, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:101.0 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'000006', prod:'กุ้งมังกร',          w:13.0, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:22.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'23:01', type:'out', code:'000001', prod:'ปลาแซลมอนนอร์เวย์', w:25.5, ref:'INV2505002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'000001', prod:'ปลาแซลมอนนอร์เวย์', w:32.5, ref:'GRN2505002', refType:'รับเข้า', channel:'—', bal:150.0 },
    { dateISO:'2568-05-13', date:'13/05/68', time:'10:00', type:'out', code:'000004', prod:'หอยเชลล์แช่แข็ง',   w:5.5,  ref:'ISS002', refType:'ตัดออก (Expired)', channel:'expired', bal:8.5 },
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
  invCounterA4:      1,   // next full A4:     INV-202606-0001 (manually issued from InvoiceList)
  invCounterCN:      1,   // ใบลดหนี้  CN-256906-0001
  invCounterDN:      1,   // ใบเพิ่มหนี้ DN-256906-0001
  invCounter: 3,          // non-commercial ISS-0003 (no YYMM)
  grnCounter: 3,
  adjCounter: 1,
  docMonths:  { invCounterThermal:'202606', invCounterA4:'202606', invCounterCN:'202606', invCounterDN:'202606', grnCounter:'202606', adjCounter:'202606' },
  adjLogs: [],
  auditLog: [],           // Immutable audit trail — all invoice actions
  adjLedger: [],          // movement ledger entries generated from ADJ documents
  /* Document number prefixes — editable in Settings */
  docPrefixes: { grn:'GRN', adj:'ADJ', iss:'ISS', tiv:'TIV', inv:'INV', cn:'CN', dn:'DN' },
};

/* ── ตรวจ check digit ของบาร์โค้ด 13 หลัก ───────────────────────────
   scheme:
     'none'  → ไม่ตรวจ (ค่าเริ่มต้น — ปลอดภัยสุด ไม่ทำให้ฉลากเดิมสแกนไม่ได้)
     'ean13' → ตรวจตามมาตรฐาน EAN-13 (mod-10 ถ่วงน้ำหนัก 1,3)
   ⚠️ เปิด 'ean13' เฉพาะเมื่อยืนยันแล้วว่าเครื่องชั่ง/เครื่องพิมพ์ฉลากออกบาร์โค้ดตามมาตรฐาน EAN-13
   มิฉะนั้นบาร์โค้ดจริงบนสินค้าจะสแกนไม่ผ่าน  ตั้งค่าได้ที่ SP_DATA.company.barcodeCheckScheme */
window.verifyCheckDigit = function(s, scheme) {
  if (!scheme || scheme === 'none') return true;
  if (!/^\d{13}$/.test(s)) return false;
  if (scheme === 'ean13') {
    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(s[i],10) * (i % 2 === 0 ? 1 : 3);
    const chk = (10 - (sum % 10)) % 10;
    return chk === parseInt(s[12],10);
  }
  return true; // scheme ไม่รู้จัก → ไม่บล็อก
};

window.parseBarcode = function(raw) {
  const s = String(raw).replace(/\D/g,'');
  if (s.length !== 13) return null;
  // ตรวจ check digit ตาม scheme ที่ตั้งไว้ (ค่าเริ่มต้น 'none' = ข้าม)
  const scheme = (window.SP_DATA?.company?.barcodeCheckScheme) || 'none';
  if (!window.verifyCheckDigit(s, scheme)) return null;
  const code = s.slice(1,7);          // ตัวที่ 2-7 — รหัสสินค้า 6 หลัก
  const prod = window.SP_DATA.products.find(p => p.code === code);
  if (!prod) return null;
  const unitType = prod.unitType || 'kg';
  const unitLabel = prod.unitLabel || 'KG';
  const weight = unitType === 'unit' ? 1 : parseInt(s.slice(7,12),10) / 1000; // ตัวที่ 8-12 ÷1000 → 3 ทศนิยม KG
  // กันสแกนเพี้ยน: สินค้าชั่งกิโลต้องมีน้ำหนัก > 0 (เลขน้ำหนักอ่านผิดเป็น 00000)
  if (unitType !== 'unit' && (!(weight > 0) || isNaN(weight))) return null;
  return { code, weight, prod, unitType, unitLabel };
};
/* ── Document number generator (client-side / โหมด mock + เลขชั่วคราวก่อนส่ง API)
   format: PREFIX-YYYYMM-XXXX  โดย YYYYMM ใช้ปี ค.ศ. 4 หลัก (เช่น 202606), dashes, นับ 4 หลัก
   hasYM=true  → PREFIX-YYYYMM-XXXX   e.g. GRN-202606-0001
   hasYM=false → PREFIX-XXXX          e.g. ISS-0003
   Auto-resets counter to 1 when YYYYMM rolls over to a new month.
   หมายเหตุ: เลขที่ "เป็นทางการ" สร้างจากฝั่ง API (document_counters) รูปแบบ PREFIX+YYMM+NNN
   เช่น IV2606059 — ฟังก์ชันนี้ใช้เป็น fallback/แสดงผลชั่วคราวเท่านั้น */
window.nextDocNo = function(counterKey, prefix, hasYM) {
  const st = window.SP_STATE;
  if (!st.docMonths) st.docMonths = {};
  if (hasYM) {
    const d    = new Date();
    const yymm = String(d.getFullYear()) + String(d.getMonth()+1).padStart(2,'0');
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
/* แสดงจำนวน/น้ำหนัก ตามหน่วยสินค้า — KG ทศนิยม 3 ตำแหน่ง, หน่วยอื่นเป็นจำนวนเต็ม */
window.fmtQty = (n, unitLabel, unitType) => {
  const u = unitLabel || 'KG';
  const dec = (unitType ? unitType === 'kg' : u === 'KG') ? 3 : 0;
  return Number(n).toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}) + ' ' + u;
};
window.fmtDate = () => { const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`; };
/* ดึงค่าวันที่ปัจจุบัน (หรือวันที่ระบุ) ในรูป YYYY-MM-DD ตามเวลาท้องถิ่นของเครื่อง
   ห้ามใช้ toISOString().slice(0,10) เพราะจะแปลงเป็น UTC ทำให้วันที่ล่าช้าเลื่อน
   (เช่น เที่ยงคืน-นี 6 เวลา จะกลายเป็นวันก่อนหน้าใน UTC) */
window.toLocalISODate = (d = new Date()) => {
  const dt = (d instanceof Date) ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
};
/* แปลง ISO (YYYY-MM-DD) → dd/mm/yyyy สำหรับแสดงผล */
window.isoToDMY = iso => iso ? iso.split('-').reverse().join('/') : '';
/* ดึงค่า { unitType, unitLabel } ของสินค้าตามรหัส — ใช้ default 'kg'/'KG' หากไม่มีสินค้า */
window.unitOf = (code) => {
  const p = window.SP_DATA.products.find(p => p.code === code);
  return { unitType: p?.unitType || 'kg', unitLabel: p?.unitLabel || 'KG' };
};
/* แสดงจำนวน/น้ำหนักของรายการ ตามหน่วยของสินค้านั้นๆ (ดึงจาก code) */
window.fmtItemQty = (n, code) => {
  const { unitType, unitLabel } = window.unitOf(code);
  return window.fmtQty(n, unitLabel, unitType);
};

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
    // ส่วนลดรายการ: คำนวณจาก discType/discVal ของแต่ละชิ้น (ไม่เฉลี่ย global discount)
    const gross = w * Number(it.price||it.price_per_kg||0);
    const iDisc = it.discType === 'percent'
      ? Math.round(gross * (Number(it.discVal)||0) / 100 * 100) / 100
      : Number(it.discVal||0);
    map[key].lineDisc += iDisc;
  });
  return Object.values(map);
};

/* ── Modal scroll-lock: ล็อก body scroll เมื่อมี .ov overlay อยู่ใน DOM ──
   ทำงานอัตโนมัติสำหรับทุก modal ที่ใช้ class "ov"                          */
(function() {
  let _locked = false;
  const _scrollY_store = { v: 0 };
  const _sync = () => {
    const open = !!document.querySelector('.ov');
    if (open && !_locked) {
      _scrollY_store.v = window.scrollY;
      document.body.style.overflow = 'hidden';
      _locked = true;
    } else if (!open && _locked) {
      document.body.style.overflow = '';
      _locked = false;
    }
  };
  const obs = new MutationObserver(_sync);
  const _start = () => obs.observe(document.body, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _start);
  else _start();
})();

/* ── Print helper ──────────────────────────────────────────────
   type: 'receipt' (TIV/ใบเสร็จ) | 'a4' (INV/รายงาน) | undefined → receipt
   - บน Electron: พิมพ์เงียบผ่าน IPC ไปยังเครื่องพิมพ์ที่ตั้งไว้ใน Settings (ไม่เปิด dialog)
   - บนเบราว์เซอร์ หรือ silent print ล้มเหลว: fallback เป็น iframe + dialog */
window._printHtml = function(html, type) {
  if (window.electronAPI && typeof window.electronAPI.printHTML === 'function') {
    const co = (window.SP_DATA && window.SP_DATA.company) || {};
    const printerName = type === 'a4' ? (co.a4Printer || '') : (co.receiptPrinter || '');
    const pageType = type === 'a4' ? 'a4' : 'receipt';
    window.electronAPI.printHTML(html, printerName, { pageType })
      .then(res => {
        if (!res || res.ok === false) {
          console.error('Silent print failed:', res && res.error);
          window._printHtmlBrowser(html);
        }
      })
      .catch(err => { console.error('Print IPC error:', err); window._printHtmlBrowser(html); });
    return;
  }
  window._printHtmlBrowser(html);
};

/* fallback: พิมพ์ผ่าน iframe ของเบราว์เซอร์ (ไม่ถูก popup blocker, เปิด print dialog) */
window._printHtmlBrowser = function(html) {
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
   exportPDF(title, headers, dataRows, subtitle?)
   - แบ่งหน้าใน JS (32 แถว/หน้า) เพื่อควบคุมว่า tfoot แสดงเฉพาะหน้าสุดท้าย
   - แสดงเลขหน้า X/Y ที่มุมขวาบนของ header ทุกหน้า
   - อ่านข้อมูลบริษัทจาก SP_DATA.company (อัปเดตจาก Settings+DB)     */
window.exportPDF = function(title, headers, dataRows, subtitle) {
  const esc = s => String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const now = new Date().toLocaleDateString('th-TH',
    { year:'numeric', month:'long', day:'numeric', weekday:'long' });

  /* อ่านข้อมูลบริษัท: SP_DATA.company อัปเดตจาก Settings ทุกครั้งที่บันทึก
     logo: ถ้า SP_DATA.company.logoUrl ว่างให้ fallback ไป localStorage      */
  const co = (window.SP_DATA && window.SP_DATA.company) || {};
  const logoUrl = co.logoUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('sp_company_logo') : '') || '';

  const n2 = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const CODE_HDRS = /^(รหัส|รหัสสินค้า|เลขที่|เลข|code|id)$/i;

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

  const colIsNumeric = headers.map((h,ci) => {
    if (CODE_HDRS.test(h.trim())) return false;
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

  /* ── แบ่งหน้า ── */
  const ROWS_PER_PAGE = 32;
  const totalPages = Math.max(1, Math.ceil(dataRows.length / ROWS_PER_PAGE));

  /* ── Logo หรือ initials ── */
  const coInitial = (co.name||'SP').replace(/[^A-Za-zก-๙]/g,'').slice(0,2).toUpperCase()||'SP';
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" style="width:36px;height:36px;border-radius:10px;object-fit:contain;background:#fff;flex-shrink:0">`
    : `<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#5b7cff,#8b5cf6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:14px;flex-shrink:0">${coInitial}</div>`;

  /* ── สร้าง header HTML สำหรับแต่ละหน้า (มีเลขหน้า X/Y) ── */
  const makePageHdr = (pageNum) => `
    <div class="page-hdr">
      <div style="display:flex;align-items:center;gap:10px">
        ${logoHtml}
        <div>
          <div class="co-name">${esc(co.name||'NEXflow')}</div>
          <div class="co-info">${esc(co.addr||'')}${co.addr&&(co.tel||co.tax)?'&ensp;·&ensp;':''}${co.tel?'โทร: '+esc(co.tel):''}${co.tel&&co.tax?' · ':''}${co.tax?'เลขผู้เสียภาษี: '+esc(co.tax):''}</div>
        </div>
      </div>
      <div style="text-align:right">
        <div class="doc-title">${esc(title)}</div>
        <div class="sub">${subtitle ? esc(subtitle)+'&ensp;·&ensp;' : ''}พิมพ์เมื่อ ${esc(now)}</div>
        <div class="pg-num">หน้า ${pageNum} / ${totalPages}</div>
      </div>
    </div>`;

  const theadHtml = `<thead><tr>${headers.map((h,ci)=>`<th class="${colIsNumeric[ci]?'num':''}">${esc(h)}</th>`).join('')}</tr></thead>`;

  const tfootHtml = colSums.some(Boolean) ? `<tfoot><tr>${headers.map((h,ci)=>{
    const cs = colSums[ci];
    if (cs) return `<td class="num">${fmtBySuffix(cs.sum, cs.suffix)}</td>`;
    if (ci === 0) return `<td class="lbl">รวมทั้งหมด</td>`;
    return `<td></td>`;
  }).join('')}</tr></tfoot>` : '';

  /* ── สร้างทุกหน้า ── */
  let pagesHtml = '';
  for (let p = 0; p < totalPages; p++) {
    const isLast = p === totalPages - 1;
    const chunk  = dataRows.slice(p * ROWS_PER_PAGE, (p + 1) * ROWS_PER_PAGE);
    const tbodyHtml = `<tbody>${chunk.map(r=>`<tr>${r.map((c,ci)=>`<td class="${colIsNumeric[ci]?'num':''}">${fmtCell(c,ci)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    pagesHtml += `
    <div class="pg${isLast ? ' last' : ''}">
      ${makePageHdr(p + 1)}
      <table>${theadHtml}${tbodyHtml}${isLast ? tfootHtml : ''}</table>
      ${isLast ? `<div class="footer">${esc(co.name||'NEXflow')} &mdash; รวม ${dataRows.length} รายการ</div>` : ''}
    </div>`;
  }

  const html = `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Sarabun',sans-serif;font-size:12px;color:#18171a}
  .pg{padding:18px 28px 20px}
  .page-hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1a1826;padding-bottom:14px;margin-bottom:16px}
  .co-name{font-size:15px;font-weight:800;color:#3b5bdb;margin-bottom:2px}
  .co-info{font-size:10.5px;color:#555;line-height:1.6}
  .doc-title{font-size:19px;font-weight:800}
  .sub{font-size:11px;color:#666;margin-top:2px}
  .pg-num{font-size:12px;font-weight:700;color:#3b5bdb;margin-top:6px}
  table{width:100%;border-collapse:collapse;margin-top:4px}
  th{background:#1a1826;color:#fff;padding:8px 10px;text-align:left;font-size:11px;font-weight:700;white-space:nowrap}
  td{padding:7px 10px;border-bottom:1px solid #eee;font-size:11.5px;vertical-align:middle}
  td.num,th.num{text-align:right;font-family:monospace}
  tfoot td{background:#f5f4f0;font-weight:800;border-top:2px solid #1a1826;border-bottom:none;font-family:monospace}
  tfoot td.lbl{font-family:'Sarabun',sans-serif;text-align:left}
  .footer{margin-top:14px;font-size:10.5px;color:#999;border-top:1px solid #ddd;padding-top:8px}
  @media print{
    @page{size:A4 portrait;margin:1.2cm 1.5cm}
    body{padding:0}
    .pg{padding:0 0 16px;page-break-after:always}
    .pg.last{page-break-after:avoid}
  }
</style></head><body>${pagesHtml}</body></html>`;
  window._printHtml(html, 'a4');
};

/* ── Document Print (GRN / TIV / INV) ──────────────────────────
   window.printDoc(type, data)
   type: 'grn' | 'tiv' | 'inv'                                   */
window.printDoc = function(type, data) {
  if (!data) return;
  const co  = window.SP_DATA.company;
  const printLogoUrl = co.logoUrl || (typeof localStorage !== 'undefined' ? localStorage.getItem('sp_company_logo') : '') || '';
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
@media print{@page{size:A4 portrait;margin:1cm}body{margin:0;padding:0}}</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;

  let body = '';

  if (type === 'grn') {
    const ACC       = '#b45309';
    const ACC_LIGHT = '#fef3c7';
    const items   = data.items || [];
    const totV    = Number(data.totalValue  || 0);

    const vatInclBase = items.filter(i=>i.tax==='vat7').reduce((s,i)=>s+Number(i.value||0),0);
    const vatExclBase = items.filter(i=>i.tax==='vat7_excl').reduce((s,i)=>s+Number(i.value||0),0);
    const vatAmt  = (vatInclBase * 7/107) + (vatExclBase * 7/100);
    const preVat  = totV - vatAmt;

    const mergeMap = {};
    items.forEach(it => {
      const key = it.code || it.name;
      if (!mergeMap[key]) mergeMap[key] = { ...it, packCount:0, totalWeight:0, totalValue:0 };
      mergeMap[key].packCount   += 1;
      mergeMap[key].totalWeight += Number(it.weight||0);
      mergeMap[key].totalValue  += Number(it.value||0);
    });
    const mergedItems = Object.values(mergeMap);
    const $n = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

    /* ── GRN: paginated print ── */
    const GRN_ROWS_FIRST = 12, GRN_ROWS_REST = 16;
    const grnPages = []; let grnRem = [...mergedItems];
    do { grnPages.push(grnRem.splice(0, grnPages.length===0 ? GRN_ROWS_FIRST : GRN_ROWS_REST)); } while (grnRem.length > 0);
    if (!grnPages.length) grnPages.push([]);
    const grnTotalPg = grnPages.length;

    const grnHdrHtml = `
    <div style="padding:14px 20px 10px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${ACC}">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${printLogoUrl ? `<img src="${esc(printLogoUrl)}" style="width:48px;height:48px;object-fit:contain;border-radius:6px;flex-shrink:0">` : ''}
        <div>
          <div style="font-size:16px;font-weight:800;color:#111">${esc(co.name)}</div>
          ${co.nameEn ? `<div style="font-size:11px;font-weight:600;color:#444">${esc(co.nameEn)}</div>` : ''}
          <div style="font-size:10.5px;color:#555;line-height:1.7;margin-top:2px">
            ${co.addr ? `<div>${esc(co.addr)}</div>` : ''}
            <div>โทร. ${esc(co.tel)}${co.email ? ` | ${esc(co.email)}` : ''}</div>
            <div>เลขประจำตัวผู้เสียภาษี <b style="color:#111">${esc(co.tax)}</b> สำนักงานใหญ่</div>
          </div>
        </div>
      </div>
      <div style="text-align:right;min-width:190px;flex-shrink:0">
        <div style="font-size:26px;font-weight:900;color:${ACC};line-height:1.2">ใบรับสินค้า</div>
        <div style="font-size:12px;font-weight:600;color:#777;margin-top:2px">Goods Receipt Note</div>
      </div>
    </div>`;

    const grnMetaHtml = `
    <div style="display:grid;grid-template-columns:1fr auto;margin-bottom:10px;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      <div style="padding:10px 14px;border-right:1px solid #ccc">
        <div style="font-size:10px;color:#777;margin-bottom:3px">ผู้รับสินค้า / Consignee</div>
        <div style="font-size:13px;font-weight:800;color:#111">${esc(co.name)}</div>
        ${co.nameEn ? `<div style="font-size:11px;font-weight:600;color:#555">${esc(co.nameEn)}</div>` : ''}
        <div style="font-size:10.5px;color:#555;line-height:1.7;margin-top:2px">
          ${co.addr ? `<div>${esc(co.addr)}</div>` : ''}
          ${(co.tel||co.email) ? `<div>โทร. ${esc(co.tel||'')}${co.email?` | ${esc(co.email)}`:''}</div>` : ''}
          ${co.tax ? `<div>เลขประจำตัวผู้เสียภาษี <b style="color:#111">${esc(co.tax)}</b></div>` : ''}
        </div>
      </div>
      <div style="padding:10px 14px;min-width:220px;background:${ACC_LIGHT}">
        ${[
          ['เลขที่', `<b style="font-family:monospace;font-size:13px;color:${ACC}">${esc(data.id||data.grn_no||'')}</b>`],
          ['วันที่รับ', `<b>${esc(data.dateDisplay||data.date||'')}</b>`],
          ...(data.poNo ? [['เลขที่อ้างอิง', `<b style="font-family:monospace">${esc(data.poNo)}</b>`]] : []),
          ['ผู้รับสินค้า', `<b>${esc(data.receiver||'')}</b>`],
        ].map(([l,v],i,a) =>
          `<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;${i<a.length-1?'border-bottom:1px solid #d0d8e8;':''}font-size:11.5px">
            <span style="color:#667;white-space:nowrap">${l}</span>${v}</div>`
        ).join('')}
      </div>
    </div>`;

    const grnThead = `<thead><tr>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:32px">ลำดับ<br><span style="font-size:9px;font-weight:400">No.</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center">รหัสสินค้าและรายละเอียด<br><span style="font-size:9px;font-weight:400">Code / Description</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:55px">จำนวน<br><span style="font-size:9px;font-weight:400">Qty</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:85px">ราคาต้นทุน<br><span style="font-size:9px;font-weight:400">Cost Price</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;text-align:center;width:90px">มูลค่า<br><span style="font-size:9px;font-weight:400">Amount</span></th>
    </tr></thead>`;

    const makeGrnRow = (it, rowIdx) => {
      const bg = rowIdx%2===0?'#fff':'#fafafa';
      const isKg = window.unitOf ? window.unitOf(it.code).unitType==='kg' : true;
      const wpp = it.packCount>0 ? (it.totalWeight/it.packCount).toFixed(3) : '0.000';
      const nameDisp = isKg&&it.totalWeight>0 ? `${esc(it.name)} <span style="font-weight:400;color:#555">@ ${wpp} kg</span>` : esc(it.name);
      return `<tr style="background:${bg}">
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:center;color:#888">${rowIdx+1}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8">
          <div style="font-size:9.5px;color:#888;font-family:monospace;margin-bottom:1px">${esc(it.code)}</div>
          <div style="font-weight:600">${nameDisp}</div>
        </td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:center;font-weight:600">${it.packCount}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:right">${$n(it.cost||it.cost_price||0)}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:700;color:#111">${$n(it.totalValue)}</td>
      </tr>`;
    };

    const grnSummary = `
    <div style="display:grid;grid-template-columns:1fr auto;border-top:2px solid #ccc">
      <div style="padding:10px 12px;display:flex;flex-direction:column;gap:4px;border-right:1px solid #ddd">
        ${data.note ? `<div><div style="font-size:10px;color:#777;margin-bottom:2px">หมายเหตุ</div><div style="font-size:11.5px;color:#444">${esc(data.note)}</div></div>` : ''}
        <div style="margin-top:auto">
          <div style="font-size:10px;color:#777;margin-bottom:2px">จำนวนเงิน (ตัวอักษร)</div>
          <div style="font-size:12px;font-weight:600;color:#111">${window.bahtText ? window.bahtText(totV) : ''}</div>
        </div>
      </div>
      <div style="min-width:240px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">ราคาก่อน VAT<span style="font-size:9px;color:#888;display:block">Taxable Amount</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${$n(preVat)}</td></tr>
          <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">ภาษีมูลค่าเพิ่ม 7%<span style="font-size:9px;color:#888;display:block">VAT 7%</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${$n(vatAmt)}</td></tr>
          <tr style="background:${ACC}"><td style="padding:7px 10px;font-size:12.5px;font-weight:800;color:#fff">มูลค่ารวมทั้งสิ้น<span style="font-size:9.5px;font-weight:400;display:block;opacity:.8">Total Amount</span></td><td style="padding:7px 10px;text-align:right;font-size:15px;font-weight:900;color:#fff;min-width:100px">${$n(totV)}</td></tr>
        </table>
      </div>
    </div>`;

    const grnSig = `
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      <div style="padding:10px 14px;border-right:1px solid #ccc">
        <div style="margin-top:44px;border-top:1px solid #bbb;padding-top:5px;text-align:center;font-size:11px;color:#555">ผู้รับสินค้า / Receiver</div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:#888">วันที่ ....... / ....... / .......</div>
      </div>
      <div style="padding:10px 14px">
        <div style="margin-top:44px;border-top:1px solid #bbb;padding-top:5px;text-align:center;font-size:11px;color:#555">ผู้มีอำนาจลงนาม / Authorized</div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:#888">วันที่ ....... / ....... / .......</div>
      </div>
    </div>`;

    let grnPagesHtml = '';
    grnPages.forEach((pageItems, pgIdx) => {
      const isLast = pgIdx === grnTotalPg - 1;
      const rowOffset = grnPages.slice(0,pgIdx).reduce((s,p)=>s+p.length,0);
      const rows = pageItems.map((it,i) => makeGrnRow(it, rowOffset+i)).join('');
      grnPagesHtml += `
      <div class="pg${isLast?' last':''}">
        <div style="position:relative">
          <div style="position:absolute;top:6px;right:0;font-size:10px;color:#bbb;font-family:monospace;z-index:1">${pgIdx+1}/${grnTotalPg}</div>
          ${grnHdrHtml}
        </div>
        <div style="padding:10px 16px 14px">
          ${grnMetaHtml}
          <div style="border:1px solid #ccc;border-radius:6px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;font-size:12px">${grnThead}<tbody>${rows}</tbody></table>
            ${isLast ? grnSummary : ''}
          </div>
          ${isLast ? grnSig : ''}
        </div>
      </div>`;
    });

    const grnStyle = `<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 portrait;margin:0}
body{font-family:'Sarabun',sans-serif;font-size:12px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{padding:14px 18px 16px}
@media print{.pg{page-break-after:always;padding:1cm 1.5cm}.pg.last{page-break-after:avoid}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${grnStyle}</head><body>${grnPagesHtml}</body></html>`;
    window._printHtml(html, 'a4');
    return;
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
    const usr     = (window.SP_DATA?.user?.name) || 'Admin';
    const dateStr = data.dateDisplay || data.date || '';
    const timeStr = data.time || '';

    /* Merge รายการสินค้าที่เหมือนกัน — ใช้ window.mergeInvItems ถ้ามี ไม่งั้น fallback */
    const mergedItems = window.mergeInvItems
      ? window.mergeInvItems(items, Number(data.discount || 0))
      : (() => {
          const mm = {};
          items.forEach(it => {
            const w = Number(it.weight||0);
            const key = `${it.code||it.name}__${w.toFixed(4)}`;
            if (!mm[key]) mm[key] = { ...it, indivWeight: w, lineDisc: 0, scanCount: 0 };
            mm[key].scanCount += 1;
            const gross = w * Number(it.price||it.price_per_kg||0);
            const iDisc = it.discType==='percent' ? gross*(Number(it.discVal)||0)/100 : (Number(it.discVal)||0);
            mm[key].lineDisc += iDisc;
          });
          return Object.values(mm);
        })();

    const itemRows = mergedItems.map(it => {
      const w         = Number(it.indivWeight || it.weight || 0);
      const p         = Number(it.price||it.price_per_kg||0);
      const uInfo     = window.unitOf ? window.unitOf(it.code) : { unitType:'kg', unitLabel:'KG' };
      const isUnit    = uInfo.unitType === 'unit';
      const scanCount = it.scanCount || 1;
      const qty       = isUnit ? w : scanCount;
      const unitPrice = isUnit ? p : w * p;
      const iDisc     = Number(it.lineDisc||0);
      const total     = (isUnit ? w * p : scanCount * (w * p)) - iDisc;
      const rawName   = (window.SP_DATA?.products?.find(pr=>pr.code===it.code)?.name) || it.name || '';
      const itName    = esc(rawName);
      const subInfo   = isUnit
        ? `${w} ${uInfo.unitLabel} · &#3647;${p}/${uInfo.unitLabel}`
        : `${w.toFixed(2)} KG · &#3647;${p}/KG`;
      /* min-width:0 บน grid item แก้ปัญหา 1fr ไม่ shrink เมื่อชื่อยาว */
      return `<div style="display:grid;grid-template-columns:1fr 22px 60px 62px;gap:3px;font-size:10.5px;margin-bottom:8px;align-items:start">
        <div style="min-width:0">
          <div style="font-size:9.5px;font-weight:600;line-height:1.35;word-break:break-word">${itName}</div>
          <div style="font-size:8.5px;color:#888">${subInfo}</div>
          ${iDisc>0?`<div style="font-size:8.5px;color:#e00">ส่วนลด -${nf(iDisc)}</div>`:''}
        </div>
        <div style="text-align:right;font-family:monospace;font-weight:600;font-size:10.5px">${qty}</div>
        <div style="text-align:right;font-family:monospace;font-size:10.5px">${nf(unitPrice)}</div>
        <div style="text-align:right;font-family:monospace;font-weight:700;font-size:10.5px">${nf(total)}</div>
      </div>`;
    }).join('');

    const billDisc = Number(data.billDiscount || 0);
    const discRows = billDisc > 0
      ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px"><span style="color:#555">ส่วนลดทั้งบิล${data.billDiscType==='percent'?` (${Number(data.billDiscNum||0).toFixed(1)}%)`:''}
</span><span style="color:#e00">-${nf(billDisc)}</span></div>
         <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px"><span style="color:#555">ส่วนลดรวม</span><span style="color:#e00">-${nf(disc)}</span></div>`
      : (disc > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px"><span style="color:#555">ส่วนลด</span><span style="color:#e00">-${nf(disc)}</span></div>` : '');

    const fmtVoidDate = v => {
      if (!v) return '—';
      if (typeof v === 'string' && (v.includes('T') || v.includes('Z'))) {
        const d = new Date(v);
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        const yy = d.getFullYear()+543;
        const hh = String(d.getHours()).padStart(2,'0');
        const mi = String(d.getMinutes()).padStart(2,'0');
        return `${dd}/${mm}/${yy} ${hh}:${mi}`;
      }
      return v;
    };

    body = `<div style="width:100%;background:#fff;font-size:12px;color:#18171a">
      ${data.voided ? `<div style="text-align:center;margin-bottom:10px;padding:6px 0">
        <span style="font-size:22px;font-weight:900;color:#c0392b;letter-spacing:6px">ยกเลิก</span>
      </div>` : ''}
      <div style="text-align:center;margin-bottom:12px">
        ${co.showLogoOnReceipt && printLogoUrl ? `<img src="${printLogoUrl}" style="max-width:100%;max-height:60px;margin:0 auto 6px;display:block">` : ''}
        <div style="font-size:14px;font-weight:800;margin-bottom:3px">${esc(co.name)}</div>
        <div style="font-size:10.5px;color:#555;line-height:1.7">${esc(co.addr)}</div>
        <div style="font-size:10.5px;color:#555">เลขประจำตัวผู้เสียภาษี ${esc(co.tax)}</div>
        <div style="font-size:10.5px;color:#555">(สำนักงานใหญ่)</div>
      </div>
      <div style="border-top:1px dashed #bbb;border-bottom:1px dashed #bbb;padding:6px 0;margin-bottom:10px;text-align:center">
        <div style="font-size:12.5px;font-weight:800">ใบเสร็จรับเงิน/ใบกำกับภาษีแบบย่อ${data.voided ? ' (ยกเลิก)' : ''}</div>
      </div>
      <div style="font-size:11.5px;margin-bottom:10px">
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:90px">เลขที่เอกสาร:</span><b style="font-family:monospace">${esc(data.no||data.thermalNo||data.invoice_no||'')}</b></div>
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:90px">วันที่ขาย:</span><b>${esc(dateStr+' '+timeStr)}</b></div>
        <div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:90px">พนักงานขาย:</span><b>${esc(usr)}</b></div>
        ${data.custName&&data.custName!=='—'&&data.custName!=='ไม่ระบุ'?`<div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:90px">ลูกค้า:</span><b>${esc(data.custName)}</b></div>`:''}
        ${data.replaces?`<div style="display:flex;gap:8px;margin-bottom:3px"><span style="color:#555;min-width:90px">ออกแทนใบ:</span><b style="font-family:monospace">${esc(data.replaces)}</b></div>`:''}
      </div>
      <div style="border-top:1px dashed #ccc;margin-bottom:6px"></div>
      <div style="display:grid;grid-template-columns:1fr 22px 60px 62px;gap:3px;font-size:10px;font-weight:700;color:#555;border-bottom:1px solid #ddd;padding-bottom:5px;margin-bottom:6px">
        <span>รายการ</span><span style="text-align:right">จำนวน</span><span style="text-align:right">หน่วยละ</span><span style="text-align:right">รวมเงิน</span>
      </div>
      ${itemRows}
      <div style="font-size:11px;color:#666;border-top:1px dashed #ccc;padding-top:6px;margin-bottom:6px">
        รายการ: ${mergedItems.reduce((s,it)=>{const isU=window.unitOf?window.unitOf(it.code).unitType==='unit':false;return s+(isU?Number(it.indivWeight||it.weight||0):it.scanCount||1);},0)}
      </div>
      <div style="border-top:1px dashed #ccc;margin-bottom:6px"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:12px"><span style="color:#555">รวมเป็นเงิน</span><span>${nf(subtotal)}</span></div>
      ${discRows}
      <div style="border-top:1px dashed #ccc;margin-bottom:6px;margin-top:4px"></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:11.5px"><span style="color:#555">รวมมูลค่าสินค้า (ก่อน VAT)</span><span>${nf(preVat)}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;font-size:11.5px"><span style="color:#555">ภาษีมูลค่าเพิ่ม 7%</span><span>${nf(vat)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;font-weight:800;margin-bottom:3px">
        <span>รวมทั้งสิ้น</span><span>&#3647;${nf(net)}</span>
      </div>
      <div style="border-top:1px dashed #ccc;margin-bottom:6px"></div>
      <div style="font-size:12px;margin-bottom:4px">
        <span style="color:#555">ประเภทการชำระเงิน: </span><b>${esc(payLbl)}</b>
      </div>
      ${data.voided ? `
      <div style="border-top:2px dashed #c0392b;margin-top:6px;padding-top:10px">
        <div style="text-align:center;font-size:12px;font-weight:800;color:#c0392b;margin-bottom:6px">— เอกสารฉบับนี้ถูกยกเลิกแล้ว —</div>
        <div style="font-size:11px;color:#666;display:grid;grid-template-columns:auto 1fr;gap:3px 10px">
          <span>วันที่ยกเลิก:</span><span style="font-weight:700">${fmtVoidDate(data.voidedAt)}</span>
          <span>ผู้ยกเลิก:</span><span>${esc(data.voidedBy||'—')}</span>
          <span>เหตุผล:</span><span>${esc(data.voidReason||'—')}</span>
        </div>
      </div>` : `
      <div style="border-top:1px dashed #ccc;margin-top:6px;padding-top:8px;text-align:center;font-size:11px;color:#888">ขอบคุณที่ใช้บริการ</div>`}
    </div>`;
  }

  if (type === 'inv') {
    const ACC       = '#1a4fa0';
    const ACC_LIGHT = '#e8eef8';
    const items     = data.items || [];
    const grossSale = Number(data.grossSale||data.netSale||data.total||0);
    const disc      = Number(data.discount||0);
    const afterDisc = grossSale - disc;
    const vat       = Number(data.vat7||0);
    const vatBase   = Number(data.vatBase||(afterDisc-vat)||0);
    const total     = Number(data.total||afterDisc);
    const payLbl    = {cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต'}[data.pay]||'—';
    const isPaid    = data.pay==='cash';
    const isTransfer= data.pay==='transfer'||data.pay==='credit';
    const copyLabel = (data.printCount||0)>0 ? 'สำเนา' : 'ต้นฉบับ';
    const cust      = window.SP_DATA.customers.find(c=>c.id===(data.custId||data.customer_id)) || {};
    const bahtWords = window.bahtText ? window.bahtText(total) : '';

    /* merge items */
    const merged = window.mergeInvItems
      ? window.mergeInvItems(items, disc)
      : items.map(it=>({ ...it, indivWeight:Number(it.weight||0), scanCount:1, lineDisc:0 }));

    const itemRows = merged.map((it,i)=>{
      const w      = Number(it.indivWeight||it.weight||0);
      const p      = Number(it.price||it.price_per_kg||0);
      const unit   = window.unitOf ? window.unitOf(it.code) : {unitType:'kg',unitLabel:'KG'};
      const isUnit = unit.unitType === 'unit';
      const qty    = isUnit ? w * (it.scanCount||1) : (it.scanCount||1);
      const qtyStr = `${qty}`;
      const lineTotal = isUnit ? qty*p - Number(it.lineDisc||0) : qty*w*p - Number(it.lineDisc||0);
      const bg = i%2===0?'#fff':'#fafafa';
      return `<tr style="background:${bg}">
        <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #e8e8e8;text-align:center;color:#888">${i+1}</td>
        <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8">
          <div style="font-size:10px;color:#888;font-family:monospace;margin-bottom:2px">${esc(it.code)}</div>
          <div style="font-weight:600">${esc(it.name)}${unit.unitType!=='unit'&&w>0?' @ '+w.toFixed(3)+' kg.':''}</div>
        </td>
        <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:center;font-weight:600">${qtyStr}</td>
        <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:right">${nf(p)}</td>
        <td style="padding:8px 10px;font-size:12px;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:700">${nf(lineTotal)}</td>
      </tr>`;
    }).join('');

    /* INV disc rows */
    const discRows = disc>0
      ? `<tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">หักส่วนลด<span style="font-size:9px;color:#888;display:block">Less Discount</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">-${nf(disc)}</td></tr>
         <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">ยอดหลังหักส่วนลด<span style="font-size:9px;color:#888;display:block">After Discount</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${nf(afterDisc)}</td></tr>`
      : '';

    /* ── INV: paginated print ── */
    const INV_ROWS_FIRST = 10, INV_ROWS_REST = 16;
    const invPages = []; let invRem = [...merged];
    do { invPages.push(invRem.splice(0, invPages.length===0 ? INV_ROWS_FIRST : INV_ROWS_REST)); } while (invRem.length > 0);
    if (!invPages.length) invPages.push([]);
    const invTotalPg = invPages.length;

    const invHdrHtml = `
    <div style="padding:14px 20px 10px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${ACC}">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${printLogoUrl ? `<img src="${esc(printLogoUrl)}" style="width:48px;height:48px;object-fit:contain;border-radius:6px;flex-shrink:0">` : ''}
        <div>
          <div style="font-size:16px;font-weight:800;color:#111">${esc(co.name)}</div>
          ${co.nameEn ? `<div style="font-size:11px;font-weight:600;color:#444">${esc(co.nameEn)}</div>` : ''}
          <div style="font-size:10.5px;color:#555;line-height:1.7;margin-top:2px">
            ${co.addr ? `<div>${esc(co.addr)}</div>` : ''}
            <div>โทร. ${esc(co.tel)}${co.email ? ` | ${esc(co.email)}` : ''}</div>
            <div>เลขประจำตัวผู้เสียภาษี <b style="color:#111">${esc(co.tax)}</b> สำนักงานใหญ่</div>
          </div>
        </div>
      </div>
      <div style="text-align:right;min-width:195px;flex-shrink:0">
        <div style="display:inline-block;padding:3px 14px;background:${ACC_LIGHT};color:${ACC};border-radius:4px;font-size:13px;font-weight:800;margin-bottom:5px">${copyLabel}</div>
        <div style="font-size:20px;font-weight:800;color:${ACC};line-height:1.3">ใบกำกับภาษี/ ใบเสร็จรับเงิน</div>
        <div style="font-size:11px;font-weight:600;color:#555;margin-top:2px">Tax Invoice / Receipt</div>
      </div>
    </div>`;

    const invCustHtml = `
    <div style="display:grid;grid-template-columns:1fr auto;margin-bottom:10px;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      <div style="padding:10px 14px;border-right:1px solid #ccc">
        <div style="font-size:10px;color:#777;margin-bottom:3px">ลูกค้า / Customer</div>
        <div style="font-size:13px;font-weight:700;margin-bottom:3px">${esc(cust.name||data.custName||'—')}</div>
        ${(cust.addr||data.custAddr) ? `<div style="font-size:11px;color:#444;line-height:1.7;margin-bottom:2px">${esc(cust.addr||data.custAddr)}</div>` : ''}
        <div style="font-size:11px;color:#444;margin-bottom:2px"><span style="color:#888">เลขประจำตัวผู้เสียภาษี </span><b style="font-family:monospace">${esc(data.custTax||cust.tax||'—')}</b>${(()=>{const b=data.custBranch||cust.branch||'head';return(!b||b==='head')?'<span style="margin-left:6px;color:#666">สำนักงานใหญ่</span>':`<span style="margin-left:6px;color:#666">สาขา ${esc(b)}</span>`;})()}</div>
        ${cust.phone ? `<div style="font-size:11px;color:#444">โทร. ${esc(cust.phone)}</div>` : ''}
      </div>
      <div style="padding:10px 14px;min-width:200px;background:${ACC_LIGHT}">
        ${(()=>{const PAY_LBL={cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต'};const pLbl=data.pay?(PAY_LBL[data.pay]||data.pay):null;
          return [['เลขที่ / No.',`<b style="font-family:monospace;font-size:13px;color:${ACC}">${esc(data.no||data.invoice_no||'')}</b>`],['วันที่ / Date',`<b>${esc(data.dateDisplay||data.date||'')}</b>`],
          data.thermalNo?['อ้างอิง',`<span style="font-family:monospace;font-size:11px;color:#555">${esc(data.thermalNo)}</span>`]:null,
          data.replaces?['ออกแทนใบ',`<span style="font-family:monospace;font-size:11px;color:#c0392b;font-weight:700">${esc(data.replaces)}</span>`]:null,
          pLbl?['ชำระเงิน',`<span style="font-weight:600">${esc(pLbl)}</span>`]:null,
          ].filter(Boolean).map(([l,v])=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:3px 0;border-bottom:1px solid #d0d8e8;font-size:11.5px"><span style="color:#667;white-space:nowrap">${l}</span>${v}</div>`).join('');})()}
      </div>
    </div>`;

    const invThead = `<thead><tr>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:32px">ลำดับ<br><span style="font-size:9px;font-weight:400">No.</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center">รหัสสินค้าและรายละเอียด<br><span style="font-size:9px;font-weight:400">Code / Description</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:70px">จำนวน<br><span style="font-size:9px;font-weight:400">Quantity</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:80px">หน่วยละ<br><span style="font-size:9px;font-weight:400">Unit Price</span></th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;text-align:center;width:90px">จำนวนเงิน<br><span style="font-size:9px;font-weight:400">Amount</span></th>
    </tr></thead>`;

    const makeInvRow = (it, rowIdx) => {
      const w=Number(it.indivWeight||it.weight||0), p=Number(it.price||it.price_per_kg||0);
      const unit=window.unitOf?window.unitOf(it.code):{unitType:'kg',unitLabel:'KG'};
      const isUnit=unit.unitType==='unit';
      const qty=isUnit?w*(it.scanCount||1):(it.scanCount||1);
      const lineTotal=isUnit?qty*p-Number(it.lineDisc||0):qty*w*p-Number(it.lineDisc||0);
      const bg=rowIdx%2===0?'#fff':'#fafafa';
      return `<tr style="background:${bg}">
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;text-align:center;color:#888">${rowIdx+1}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8">
          <div style="font-size:9.5px;color:#888;font-family:monospace;margin-bottom:1px">${esc(it.code)}</div>
          <div style="font-weight:600">${esc(it.name)}${unit.unitType!=='unit'&&w>0?' @ '+w.toFixed(3)+' kg.':''}</div>
        </td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:center;font-weight:600">${qty}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:right">${nf(p)}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;text-align:right;font-weight:700">${nf(lineTotal)}</td>
      </tr>`;
    };

    const invSummary = `
    <div style="display:grid;grid-template-columns:1fr auto;border-top:2px solid #ccc">
      <div style="padding:10px 12px;display:flex;flex-direction:column;justify-content:flex-end;border-right:1px solid #ddd">
        <div style="font-size:10px;color:#777;margin-bottom:2px">จำนวนเงิน (ตัวอักษร)</div>
        <div style="font-size:12px;font-weight:600">(${bahtWords})</div>
        ${data.replaces ? `<div style="margin-top:5px;font-size:11px;color:#555">ออกแทนฉบับเลขที่ <b style="font-family:monospace">${esc(data.replaces)}</b></div>` : ''}
      </div>
      <div style="min-width:250px">
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">รวมเป็นเงิน<span style="font-size:9px;color:#888;display:block">Gross Amount</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${nf(grossSale)}</td></tr>
          ${discRows}
          <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">ราคาสินค้า (ก่อน VAT)<span style="font-size:9px;color:#888;display:block">Taxable Amount</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${nf(vatBase)}</td></tr>
          <tr><td style="padding:5px 10px;font-size:11.5px;color:#333;border-bottom:1px solid #eee">ภาษีมูลค่าเพิ่ม 7%<span style="font-size:9px;color:#888;display:block">VAT 7%</span></td><td style="padding:5px 10px;text-align:right;font-size:12px;font-weight:600;color:#333;border-bottom:1px solid #eee">${nf(vat)}</td></tr>
          <tr style="background:${ACC}"><td style="padding:7px 10px;font-size:12.5px;font-weight:800;color:#fff">จำนวนเงินรวมทั้งสิ้น<span style="font-size:9.5px;font-weight:400;display:block;opacity:.8">Total Invoice</span></td><td style="padding:7px 10px;text-align:right;font-size:15px;font-weight:900;color:#fff;min-width:100px">${nf(total)}</td></tr>
        </table>
      </div>
    </div>`;

    const invSig = `
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      <div style="padding:10px 14px;border-right:1px solid #ccc">
        <div style="font-size:11.5px;font-weight:600;margin-bottom:6px">ได้รับสินค้าตามรายการถูกต้องแล้ว</div>
        <div style="margin-top:40px;border-top:1px solid #bbb;padding-top:5px;text-align:center;font-size:11px;color:#555">ผู้รับสินค้า / Goods Received by</div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:#888">วันที่ ....... / ....... / .......</div>
      </div>
      <div style="padding:10px 14px;display:flex;flex-direction:column;justify-content:space-between">
        <div style="font-size:11.5px;font-weight:600;text-align:center">${esc(co.name)}</div>
        <div>
          <div style="text-align:center;margin-top:32px;border-top:1px solid #bbb;padding-top:5px;font-size:11px;color:#555">ผู้รับมอบอำนาจ / Authorized Signature</div>
          <div style="margin-top:8px;text-align:center;font-size:10px;color:#888">วันที่ ....... / ....... / .......</div>
        </div>
      </div>
    </div>`;

    let invPagesHtml = '';
    invPages.forEach((pageItems, pgIdx) => {
      const isLast = pgIdx === invTotalPg - 1;
      const rowOffset = invPages.slice(0,pgIdx).reduce((s,p)=>s+p.length,0);
      const rows = pageItems.map((it,i) => makeInvRow(it, rowOffset+i)).join('');
      invPagesHtml += `
      <div class="pg${isLast?' last':''}">
        <div style="position:relative">
          <div style="position:absolute;top:6px;right:0;font-size:10px;color:#bbb;font-family:monospace;z-index:1">${pgIdx+1}/${invTotalPg}</div>
          ${invHdrHtml}
        </div>
        <div style="padding:10px 16px 14px">
          ${invCustHtml}
          <div style="border:1px solid #ccc;border-radius:6px;overflow:hidden">
            <table style="width:100%;border-collapse:collapse;font-size:12px">${invThead}<tbody>${rows}</tbody></table>
            ${isLast ? invSummary : ''}
          </div>
          ${isLast ? invSig : ''}
        </div>
      </div>`;
    });

    const invStyle = `<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 portrait;margin:0}
body{font-family:'Sarabun',sans-serif;font-size:12px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{padding:14px 18px 16px}
@media print{.pg{page-break-after:always;padding:1cm 1.5cm}.pg.last{page-break-after:avoid}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    const invHtml = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${invStyle}</head><body>${invPagesHtml}</body></html>`;
    window._printHtml(invHtml, 'a4');
    return;
  }

  if (type === 'adj') {
    const ACC       = '#0f766e';
    const ACC_LIGHT = '#f0fdfa';
    const items   = data.items || [];
    const nf3 = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:3,maximumFractionDigits:3});
    const adjTypeLabel = {expired:'หมดอายุ',damage:'เสียหาย',recount:'นับใหม่',other:'อื่นๆ'}[data.adjType]||data.adjType||'—';

    const ftMap = {};
    items.forEach(it => {
      const u = window.unitOf ? window.unitOf(it.code) : {unitType:'kg',unitLabel:'KG'};
      const lbl = u.unitType==='kg' ? 'KG' : (u.unitLabel||'หน่วย');
      if (!ftMap[lbl]) ftMap[lbl] = {before:0,adj:0,after:0,isKg:u.unitType==='kg'};
      ftMap[lbl].before += Number(it.before||0);
      ftMap[lbl].adj    += Number(it.adj||0);
      ftMap[lbl].after  += Number(it.after||0);
    });
    const ftEnt = Object.entries(ftMap);
    const fmtFt = (v,lbl,isKg) => isKg ? Math.abs(Number(v)).toFixed(3)+' '+lbl : Math.abs(Number(v)).toFixed(0)+' '+lbl;

    const adjFmtU = (val, code) => {
      const u = window.unitOf ? window.unitOf(code) : {unitType:'kg',unitLabel:'KG'};
      const n = Number(val);
      return u.unitType==='kg' ? Math.abs(n).toFixed(3)+' KG' : Math.abs(n)+' '+(u.unitLabel||'หน่วย');
    };

    const ADJ_ROWS_FIRST = 10, ADJ_ROWS_REST = 14;
    const adjPages = []; let adjRem = [...items];
    do { adjPages.push(adjRem.splice(0, adjPages.length===0 ? ADJ_ROWS_FIRST : ADJ_ROWS_REST)); } while (adjRem.length > 0);
    if (!adjPages.length) adjPages.push([]);
    const adjTotalPg = adjPages.length;

    const adjHdrHtml = `
    <div style="padding:14px 20px 10px;display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${ACC}">
      <div style="display:flex;gap:10px;align-items:flex-start">
        ${printLogoUrl ? `<img src="${esc(printLogoUrl)}" style="width:48px;height:48px;object-fit:contain;border-radius:6px;flex-shrink:0">` : ''}
        <div>
          <div style="font-size:16px;font-weight:800;color:#111">${esc(co.name)}</div>
          ${co.nameEn ? `<div style="font-size:11px;font-weight:600;color:#444">${esc(co.nameEn)}</div>` : ''}
          <div style="font-size:10.5px;color:#555;line-height:1.7;margin-top:2px">
            ${co.addr ? `<div>${esc(co.addr)}</div>` : ''}
            <div>โทร. ${esc(co.tel)}${co.email ? ` | ${esc(co.email)}` : ''}</div>
            <div>เลขประจำตัวผู้เสียภาษี <b style="color:#111">${esc(co.tax)}</b> สำนักงานใหญ่</div>
          </div>
        </div>
      </div>
      <div style="text-align:right;min-width:190px;flex-shrink:0">
        <div style="font-size:22px;font-weight:900;color:${ACC};line-height:1.2">เอกสารปรับปรุงสต็อก</div>
        <div style="font-size:11px;font-weight:600;color:#777;margin-top:2px">Stock Adjustment Document</div>
      </div>
    </div>`;

    const adjMetaHtml = `
    <div style="display:grid;grid-template-columns:1fr auto;margin-bottom:10px;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      <div style="padding:10px 14px">
        <div style="display:grid;grid-template-columns:auto 1fr;gap:3px 10px;font-size:11.5px">
          <span style="color:#888">ประเภท:</span><b>${esc(adjTypeLabel)}</b>
          <span style="color:#888">เหตุผล:</span><span>${esc(data.reason||'—')}</span>
          ${data.note ? `<span style="color:#888">หมายเหตุ:</span><span>${esc(data.note)}</span>` : ''}
          <span style="color:#888">ผู้อนุมัติ:</span><span>${esc(data.approver||'—')}</span>
        </div>
      </div>
      <div style="padding:10px 14px;background:${ACC_LIGHT};min-width:170px;border-left:1px solid #ccc">
        <div style="font-size:10px;color:#666;margin-bottom:2px">เลขที่เอกสาร</div>
        <div style="font-family:monospace;font-size:14px;font-weight:800;color:${ACC};margin-bottom:6px">${esc(data.id||'')}</div>
        <div style="font-size:10px;color:#666;margin-bottom:2px">วันที่</div>
        <div style="font-weight:700;font-size:12px">${esc(data.dateDisplay||data.date||'')}</div>
      </div>
    </div>`;

    const adjThead = `<thead><tr>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:32px">ลำดับ</th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center">รหัสสินค้า / รายละเอียดสินค้า</th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:110px">ก่อนปรับ</th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;border-right:1px solid rgba(255,255,255,.2);text-align:center;width:110px">ปรับ (+/-)</th>
      <th style="padding:7px 8px;background:${ACC};color:#fff;font-weight:700;font-size:11px;text-align:center;width:110px">หลังปรับ</th>
    </tr></thead>`;

    const makeAdjRow = (it, rowIdx) => {
      const bg = rowIdx%2===0?'#fff':'#fafafa';
      const adjNum = Number(it.adj);
      return `<tr style="background:${bg}">
        <td style="padding:7px 8px;font-size:11px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:center;color:#999">${rowIdx+1}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8">
          <div style="font-size:9.5px;color:#777;font-family:monospace;margin-bottom:1px">${esc(it.code)}</div>
          <div style="font-weight:600">${esc(it.name)}</div>
        </td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:right;font-family:monospace">${adjFmtU(it.before,it.code)}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;border-right:1px solid #e8e8e8;text-align:right;font-family:monospace;font-weight:700;color:${adjNum>=0?'#15803d':'#dc2626'}">${adjNum>=0?'+':'-'}${adjFmtU(it.adj,it.code)}</td>
        <td style="padding:7px 8px;font-size:11.5px;border-bottom:1px solid #e8e8e8;text-align:right;font-family:monospace;font-weight:700">${adjFmtU(it.after,it.code)}</td>
      </tr>`;
    };

    const adjSummary = `
    <tr style="background:${ACC_LIGHT}">
      <td colspan="2" style="padding:7px 8px;font-weight:700;font-size:11.5px;border-right:1px solid #ccc">รวม ${items.length} รายการ</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:700;border-right:1px solid #ccc">${ftEnt.length?ftEnt.map(([lbl,g])=>`<div>${fmtFt(g.before,lbl,g.isKg)}</div>`).join(''):nf3(data.totalBefore||0)}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:800;border-right:1px solid #ccc">${ftEnt.length?ftEnt.map(([lbl,g])=>`<div style="color:${g.adj>=0?'#15803d':'#dc2626'}">${(g.adj>=0?'+':'-')+fmtFt(g.adj,lbl,g.isKg)}</div>`).join(''):nf3(data.totalAdj||0)}</td>
      <td style="padding:7px 8px;text-align:right;font-family:monospace;font-weight:700">${ftEnt.length?ftEnt.map(([lbl,g])=>`<div>${fmtFt(g.after,lbl,g.isKg)}</div>`).join(''):nf3(data.totalAfter||0)}</td>
    </tr>`;

    const adjSig = `
    <div style="margin-top:12px;display:grid;grid-template-columns:1fr 1fr 1fr;border:1px solid #ccc;border-radius:6px;overflow:hidden">
      ${['ผู้จัดทำ / Prepared by','ผู้ตรวจสอบ / Checked by','ผู้อนุมัติ / Approved by'].map((lbl,i)=>`
      <div style="padding:10px 14px;${i<2?'border-right:1px solid #ccc':''}">
        <div style="margin-top:44px;border-top:1px solid #bbb;padding-top:5px;text-align:center;font-size:11px;color:#555">${lbl}</div>
        <div style="margin-top:8px;text-align:center;font-size:10px;color:#888">วันที่ ....... / ....... / .......</div>
      </div>`).join('')}
    </div>`;

    let adjPagesHtml = '';
    adjPages.forEach((pageItems, pgIdx) => {
      const isLast = pgIdx === adjTotalPg - 1;
      const rowOffset = adjPages.slice(0,pgIdx).reduce((s,p)=>s+p.length,0);
      const rows = pageItems.map((it,i) => makeAdjRow(it, rowOffset+i)).join('');
      adjPagesHtml += `
      <div class="pg${isLast?' last':''}">
        <div style="position:relative">
          <div style="position:absolute;top:6px;right:0;font-size:10px;color:#bbb;font-family:monospace;z-index:1">${pgIdx+1}/${adjTotalPg}</div>
          ${adjHdrHtml}
        </div>
        <div style="padding:10px 16px 14px">
          ${adjMetaHtml}
          <table style="width:100%;border-collapse:collapse;font-size:12px;border:1px solid #ccc;border-radius:6px;overflow:hidden">
            ${adjThead}<tbody>${rows}</tbody>
            ${isLast ? `<tfoot>${adjSummary}</tfoot>` : ''}
          </table>
          ${isLast ? adjSig : ''}
        </div>
      </div>`;
    });

    const adjStyle = `<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4 portrait;margin:0}
body{font-family:'Sarabun',sans-serif;font-size:12px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.pg{padding:14px 18px 16px}
@media print{.pg{page-break-after:always;padding:1cm 1.5cm}.pg.last{page-break-after:avoid}}
</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    const adjHtml = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${adjStyle}</head><body>${adjPagesHtml}</body></html>`;
    window._printHtml(adjHtml, 'a4');
    return;
  }

  if (!body) return;

  if (type === 'tiv') {
    /* ── ใบเสร็จความร้อน 76mm ── */
    const receiptStyle = `<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:76mm auto;margin:0}
html,body{width:76mm;margin:0;background:#fff}
body{padding:2mm 3mm 2mm 2mm;font-family:'Sarabun',sans-serif;font-size:12px;color:#18171a;-webkit-print-color-adjust:exact;print-color-adjust:exact}
img{max-width:100%}
</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${receiptStyle}</head><body>${body}</body></html>`;
    window._printHtml(html, 'receipt');
    return;
  }

  if (type === 'inv') {
    /* ── A4 INV — ใช้ style แยกต่างหาก ไม่ใช้ baseStyle เพื่อป้องกัน th/table conflict ── */
    const invStyle = `<style>
*{box-sizing:border-box;margin:0;padding:0}
@page{size:A4;margin:1cm}
body{font-family:'Sarabun',sans-serif;font-size:12.5px;color:#111;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
table{border-collapse:collapse;width:100%}
</style>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">`;
    const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${invStyle}</head><body style="padding:16px">${body}</body></html>`;
    window._printHtml(html, 'a4');
    return;
  }

  const html = `<!DOCTYPE html><html lang="th"><head><meta charset="UTF-8">${baseStyle}</head><body style="padding:20px">${body}</body></html>`;
  window._printHtml(html, 'a4');
};

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
