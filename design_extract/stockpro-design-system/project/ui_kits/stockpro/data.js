/* StockPro UI Kit — shared mock data (updated: dateISO, pay, custId per row) */
window.SP_DATA = {
  company: {
    name: 'บริษัท ซีฟู้ด โปรวิชั่น จำกัด',
    addr: '123/45 ถนนสุขุมวิท แขวงพระโขนง เขตคลองเตย กรุงเทพมหานคร 10110',
    tax: '0105566012345', tel: '02-xxx-xxxx', email: 'info@seafoodprovision.co.th',
    vat: 7, currency: 'THB',
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
  reportRows: [
    { dateISO:'2568-05-15', date:'15/05/68', inv:'INV-202505-0002', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', channel:'wholesale', custId:1, w:37.5, grossSale:12330, discount:500, netSale:11830, vat:828.10, total:12658.10, pay:'transfer' },
    { dateISO:'2568-05-15', date:'15/05/68', inv:'INV-202505-0001', code:'00002', prod:'กุ้งขาวแวนนาไม',    channel:'wholesale', custId:2, w:8.0,  grossSale:3040,  discount:0,   netSale:3040,  vat:212.80, total:3252.80,  pay:'cash' },
    { dateISO:'2568-05-14', date:'14/05/68', inv:'INV-202504-0009', code:'00003', prod:'ปลาทูน่าครีบเหลือง', channel:'wholesale', custId:1, w:18.5, grossSale:5365,  discount:0,   netSale:5365,  vat:375.55, total:5740.55,  pay:'transfer' },
    { dateISO:'2568-05-13', date:'13/05/68', inv:'INV-202504-0008', code:'00006', prod:'กุ้งมังกร',          channel:'online',    custId:3, w:8.0,  grossSale:9600,  discount:0,   netSale:9600,  vat:672.00, total:10272.00, pay:'transfer' },
    { dateISO:'2568-05-12', date:'12/05/68', inv:'INV-202504-0007', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', channel:'online',    custId:5, w:10.0, grossSale:3800,  discount:0,   netSale:3800,  vat:266.00, total:4066.00,  pay:'cash' },
    { dateISO:'2568-05-11', date:'11/05/68', inv:'INV-202504-0006', code:'00002', prod:'กุ้งขาวแวนนาไม',    channel:'wholesale', custId:2, w:22.0, grossSale:4840,  discount:0,   netSale:4840,  vat:338.80, total:5178.80,  pay:'cash' },
    { dateISO:'2568-05-10', date:'10/05/68', inv:'INV-202504-0005', code:'00006', prod:'กุ้งมังกร',          channel:'wholesale', custId:4, w:5.0,  grossSale:6000,  discount:300, netSale:5700,  vat:399.00, total:6099.00,  pay:'transfer' },
  ],
  invoices: [
    { id:1, no:'INV-202505-0002', type:'A4', channel:'wholesale', custId:1, custName:'บ. ซีฟู้ด โปรวิชั่น จก.', custTax:'0105566111111', date:'2568-05-15', dateDisplay:'15/05/68', items:[{ code:'00001', name:'ปลาแซลมอนนอร์เวย์', weight:37.5, price:380, tax:'vat7' }], grossSale:12330, discount:500, netSale:11830, vatBase:11830, vat7:828.10, total:12658.10, pay:'transfer', status:'paid', voided:false },
    { id:2, no:'INV-202505-0001', type:'Thermal', channel:'wholesale', custId:2, custName:'ร้านอาหารโตเกียว', custTax:'', date:'2568-05-15', dateDisplay:'15/05/68', items:[{ code:'00002', name:'กุ้งขาวแวนนาไม', weight:8.0, price:380, tax:'vat7' }], grossSale:3040, discount:0, netSale:3040, vatBase:3040, vat7:212.80, total:3252.80, pay:'cash', status:'voided', voided:true, voidedAt:'01/06/69 15:34', voidedBy:'Admin Kanya', voidReason:'ลูกค้าต้องการอย่างย่อ', stockRestored:true },
  ],
  grnLogs: [
    { id:'GRN-202506-0001', no:'GRN-0001', date:'2568-06-01', dateDisplay:'01/06/69', poNo:'PO-2506-001', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:1, totalWeight:8.9, totalValue:1424, items:[{ code:'00002', name:'กุ้งขาวแวนนาไม', packNo:'PKG-001', weight:8.9, cost:160, value:1424, tax:'vat7' }] },
    { id:'GRN-202505-0002', no:'GRN-0002', date:'2568-05-14', dateDisplay:'14/05/68', poNo:'PO-2505-042', receiver:'Admin Kanya', note:'รับสินค้าปกติ', totalPacks:3, totalWeight:68.459, totalValue:20785, items:[
      { code:'00001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:32.5, cost:280, value:9100, tax:'vat7' },
      { code:'00003', name:'ปลาทูน่าครีบเหลือง',  packNo:'PKG-002', weight:22.959, cost:210, value:4821.39, tax:'vat7' },
      { code:'00006', name:'กุ้งมังกร',           packNo:'PKG-003', weight:13.0, cost:900, value:11700, tax:'vat7' },
    ]},
    { id:'GRN-202505-0001', no:'GRN-0001b', date:'2568-05-10', dateDisplay:'10/05/68', poNo:'PO-2505-039', receiver:'สมชาย ใจดี', note:'', totalPacks:2, totalWeight:32.0, totalValue:9240, items:[
      { code:'00001', name:'ปลาแซลมอนนอร์เวย์', packNo:'PKG-001', weight:20.0, cost:280, value:5600, tax:'vat7' },
      { code:'00002', name:'กุ้งขาวแวนนาไม',     packNo:'PKG-002', weight:12.0, cost:160, value:1920, tax:'vat7' },
    ]},
  ],
  ledger: [
    { dateISO:'2569-06-01', date:'01/06/69', time:'23:01', type:'out', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:37.5, ref:'INV-202505-0002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2569-06-01', date:'01/06/69', time:'18:00', type:'in',  code:'00002', prod:'กุ้งขาวแวนนาไม',    w:8.9,  ref:'GRN-202506-0001', refType:'รับเข้า', channel:'—', bal:89.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'22:30', type:'out', code:'00002', prod:'กุ้งขาวแวนนาไม',    w:12.0, ref:'INV-202505-0001', refType:'ขายออก', channel:'wholesale', bal:80.1 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00002', prod:'กุ้งขาวแวนนาไม',    w:30.009, ref:'GRN-202505-0002', refType:'รับเข้า', channel:'—', bal:101.0 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00006', prod:'กุ้งมังกร',          w:13.0, ref:'GRN-202505-0002', refType:'รับเข้า', channel:'—', bal:22.0 },
    { dateISO:'2568-05-15', date:'15/05/68', time:'23:01', type:'out', code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:25.5, ref:'INV-202505-0002', refType:'ขายออก', channel:'wholesale', bal:124.5 },
    { dateISO:'2568-05-14', date:'14/05/68', time:'—',    type:'in',  code:'00001', prod:'ปลาแซลมอนนอร์เวย์', w:32.5, ref:'GRN-202505-0002', refType:'รับเข้า', channel:'—', bal:150.0 },
    { dateISO:'2568-05-13', date:'13/05/68', time:'10:00', type:'out', code:'00004', prod:'หอยเชลล์แช่แข็ง',   w:5.5,  ref:'ISS-0002', refType:'ตัดออก (Expired)', channel:'expired', bal:8.5 },
  ],
  recentIssues: [
    { id:'ISS-0004', date:'01/06/69 23:01', type:'wholesale', code:'00001', prod:'ปลาแซลมอน', w:37.5, val:12658.10, inv:'INV-202505-0002' },
    { id:'ISS-0003', date:'15/05/68 22:30', type:'online',    code:'00002', prod:'กุ้งขาว',   w:12.0, val:2640.00,  inv:'INV-202505-0001' },
    { id:'ISS-0002', date:'13/05/68 10:00', type:'expired',   code:'00004', prod:'หอยเชลล์',  w:5.5,  val:0,        inv:'—' },
    { id:'ISS-0001', date:'12/05/68 09:00', type:'sample',    code:'00005', prod:'ปลาดอลลี่', w:2.0,  val:0,        inv:'—' },
  ],
  revenue: {
    '7d':  { values:[14820,12640,19350,22180,16940,24560,18720], labels:['จ','อ','พ','พฤ','ศ','ส','อา'], unit:'วัน' },
    '1m':  { values:[82400,91200,78600,86100,93800,88500,95200,80300,97600,89400,102100,86800,91500,88200,94700,85300,99200,92600,87400,103500,88900,96300,82100,107800,91200,88600,94100,87300,98700,105400], labels:Array.from({length:30},(_,i)=>`${i+1}`), unit:'วัน' },
    '3m':  { values:[312400,286900,341200,298700,325600,364800,287300,342100,368900,319400,357200,388600], labels:['ส.1','ส.2','ส.3','ส.4','ม.1','ม.2','ม.3','ม.4','พ.1','พ.2','พ.3','พ.4'], unit:'สัปดาห์' },
    '6m':  { values:[924000,1082000,986000,1148000,1023000,1195000], labels:['ธ.ค.','ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.'], unit:'เดือน' },
    '1y':  { values:[743000,824000,756000,892000,810000,978000,924000,1082000,986000,1148000,1023000,1195000], labels:['มิ.','ก.','ส.','ก.ย.','ต.','พ.','ธ.','ม.','ก.','มี.','เม.','พ.ค.'], unit:'เดือน' },
  },
  chart7d: [42,38,55,61,48,68,52],
  chartLabels: ['จ','อ','พ','พฤ','ศ','ส','อา'],
  revenue7d: [14820,12640,19350,22180,16940,24560,18720],
  sales: { today:42180, todayDelta:12, month:486250, monthTarget:600000, bills:9, avgPerBill:4687 },
  salesByChannel: [
    { id:'wholesale', label:'ค้าส่ง',   en:'Wholesale', value:312400, tone:'ac' },
    { id:'online',    label:'ออนไลน์',  en:'Online',    value:128900, tone:'pu' },
    { id:'other',     label:'หน้าร้าน', en:'Walk-in',   value:44950,  tone:'gn' },
  ],
  topSellers: [
    { name:'ปลาแซลมอนนอร์เวย์', kg:142, revenue:53960 },
    { name:'กุ้งขาวแวนนาไม',    kg:98,  revenue:21560 },
    { name:'ปลาทูน่าครีบเหลือง', kg:76,  revenue:22040 },
    { name:'กุ้งมังกร',          kg:41,  revenue:49200 },
  ],
};

window.SP_STATE = {
  invoices: [...window.SP_DATA.invoices],
  grnLogs:  [...window.SP_DATA.grnLogs],
  products: window.SP_DATA.products.map(p=>({...p})),
  invCounter: 3, grnCounter: 3,
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
