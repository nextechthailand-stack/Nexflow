/* StockPro UI Kit — ตัดสต็อก / ขาย (Stock Out) — faithful to original */

/* Sale type icons as SVGs matching the original */
const SALE_ICONS = {
  wholesale: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
  online:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  sample:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>,
  expired:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="10" y1="14" x2="14" y2="18"/><line x1="14" y1="14" x2="10" y2="18"/></svg>,
  other:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="28" height="28"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
};

const SALE_TYPES = [
  { id:'wholesale', label:'Wholesale', desc:'ขายส่ง',         needsCust:true,  hasInv:true },
  { id:'online',    label:'Online',    desc:'ขายออนไลน์',     needsCust:true,  hasInv:true },
  { id:'sample',    label:'Sample',    desc:'แจกตัวอย่าง',    needsCust:false, hasInv:false },
  { id:'expired',   label:'Expired',   desc:'หมดอายุ',        needsCust:false, hasInv:false },
  { id:'other',     label:'Other',     desc:'อื่นๆ',          needsCust:false, hasInv:false },
];

/* Thermal Receipt popup */
function ThermalReceipt({ data, onClose, onDone }) {
  if (!data) return null;
  const co = window.SP_DATA.company;
  const typeInfo = SALE_TYPES.find(t => t.id === data.type) || SALE_TYPES[0];
  const isCommercial = typeInfo.hasInv;
  return (
    <div className="ov" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="md" style={{ width:520 }}>
        <div className="md-h">
          <span className="md-t">ใบกำกับ / ใบกำกับภาษีอย่างย่อ</span>
          <div style={{ display:'flex', gap:8 }}>
            {isCommercial && <Button variant="bp" size="sm" icon="printer">พิมพ์ Thermal</Button>}
            <div className="md-x" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="md-b">
          {/* Thermal receipt (dark style) */}
          <div style={{ background:'#1a1826', borderRadius:12, padding:'22px 22px 20px', maxWidth:380, margin:'0 auto', fontFamily:'var(--font-sans)', color:'#e8e7f0' }}>
            <div style={{ textAlign:'center', marginBottom:16 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#fff', marginBottom:2 }}>{co.name}</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.45)', lineHeight:1.6 }}>{co.addr}</div>
              <div style={{ fontSize:10.5, color:'rgba(255,255,255,.45)' }}>โทร {co.tel}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)', marginTop:2 }}>เลขภาษี {co.tax}</div>
            </div>
            <div style={{ textAlign:'center', borderTop:'1px dashed rgba(255,255,255,.2)', borderBottom:'1px dashed rgba(255,255,255,.2)', padding:'10px 0', marginBottom:14 }}>
              <div style={{ fontSize:13.5, fontWeight:800, color:'#fff' }}>
                {isCommercial ? 'ใบกำกับภาษี / ใบเสร็จรับเงิน' : 'เอกสารตัดสต็อก'}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.5)', marginTop:2 }}>Tax Invoice / Receipt</div>
            </div>
            <div style={{ fontSize:11.5, marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>เลขที่</span>
                <span style={{ fontFamily:'var(--font-mono)', color:'var(--ac)', fontWeight:700 }}>{data.no}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>ลูกค้า</span>
                <span style={{ fontWeight:600 }}>{data.custName || '—'}</span>
              </div>
              {data.custName && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>ชำระ</span>
                <span>{{cash:'เงินสด',transfer:'เงินโอน',credit:'เครดิต'}[data.pay]||'—'}</span>
              </div>}
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>ประเภท</span>
                <span><Badge kind={data.type} /></span>
              </div>
            </div>
            {/* Items */}
            <div style={{ borderTop:'1px dashed rgba(255,255,255,.2)', paddingTop:10, marginBottom:10 }}>
              {data.items.map((it, i) => (
                <div key={i} style={{ marginBottom:8 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}>
                    <span style={{ fontWeight:600 }}>{it.name}</span>
                    <span style={{ color:'rgba(255,255,255,.7)', fontFamily:'var(--font-mono)' }}>{it.weight.toFixed(3)} KG</span>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginTop:2 }}>
                    <span style={{ color:'rgba(255,255,255,.4)' }}>{it.weight.toFixed(3)} × ฿{it.price}</span>
                    <span style={{ color:'var(--gn)', fontWeight:700 }}>{window.fmtMoney(it.weight * it.price)}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div style={{ borderTop:'1px dashed rgba(255,255,255,.2)', paddingTop:10, fontSize:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>จำนวน {data.items.length} รายการ ({window.fmtKg(data.totalW)})</span>
                <span>{window.fmtMoney(data.subtotal)}</span>
              </div>
              {data.discount > 0 && <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>ส่วนลด</span>
                <span style={{ color:'var(--am)' }}>-{window.fmtMoney(data.discount)}</span>
              </div>}
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>ยอดก่อน VAT</span>
                <span>{window.fmtMoney(data.afterDisc)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ color:'rgba(255,255,255,.55)' }}>VAT 7% (รวมในราคา)</span>
                <span style={{ color:'rgba(139,92,246,.9)' }}>{window.fmtMoney(data.vat)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:16, fontWeight:800, borderTop:'1px solid rgba(255,255,255,.2)', paddingTop:8 }}>
                <span>ยอดรวม</span>
                <span style={{ color:'var(--gn)' }}>{window.fmtMoney(data.afterDisc)}</span>
              </div>
            </div>
            <div style={{ textAlign:'center', marginTop:14, fontSize:10.5, color:'rgba(255,255,255,.25)', borderTop:'1px dashed rgba(255,255,255,.1)', paddingTop:10 }}>
              ขอบคุณที่ใช้บริการ — StockPro v2.0
            </div>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
          <button onClick={onDone} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--ac)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
            <Icon name="check" size={15} style={{ color:'#fff' }} /> ✓ ดำเนินการเสร็จสิ้น
          </button>
        </div>
      </div>
    </div>
  );
}

/* StockOut Summary confirm popup */
function ConfirmSO({ data, onCancel, onConfirm }) {
  if (!data) return null;
  const typeInfo = SALE_TYPES.find(t => t.id === data.type);
  return (
    <div className="ov">
      <div className="md" style={{ width:400 }}>
        <div style={{ padding:'20px 22px 0' }}>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:typeInfo?.hasInv?'var(--abg)':'var(--gbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:typeInfo?.hasInv?'var(--ac)':'var(--gn)' }}><Icon name="check" size={22} /></div>
            <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>{typeInfo?.hasInv ? 'ยืนยันการชำระเงิน' : 'ยืนยันการตัดสต็อกสินค้า'}</div>
          </div>
          <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', marginBottom:4 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>ประเภท</span><Badge kind={data.type} />
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>จำนวน</span><span style={{ fontWeight:700 }}>{data.items.length} รายการ</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>น้ำหนัก</span><span style={{ fontWeight:700, color:'var(--ac)' }}>{window.fmtKg(data.totalW)}</span>
            </div>
            {data.discount > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>ส่วนลด</span><span style={{ color:'var(--am)', fontWeight:700 }}>-{window.fmtMoney(data.discount)}</span>
            </div>}
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>VAT 7%</span><span style={{ fontWeight:700 }}>{window.fmtMoney(data.vat)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, borderTop:'1px solid var(--bd)', paddingTop:8, fontWeight:800 }}>
              <span>{typeInfo?.hasInv ? 'ยอดชำระสุทธิ' : 'มูลค่ารวม'}</span><span style={{ color:'var(--gn)' }}>{window.fmtMoney(data.afterDisc)}</span>
            </div>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bg2" onClick={onCancel}>ยกเลิก</Button>
          <button onClick={onConfirm} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:typeInfo?.hasInv?'var(--ac)':'var(--gn)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
            <Icon name="check" size={15} style={{ color:'#fff' }} /> ✓ ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main StockOut ── */
function StockOut({ toast }) {
  const D = window.SP_DATA;
  const [items, setItems] = React.useState([]);
  const [bc, setBc] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [saleType, setSaleType] = React.useState('wholesale');
  const [custSearch, setCustSearch] = React.useState('');
  const [custId, setCustId] = React.useState(null);
  const [pay, setPay] = React.useState('cash');
  const [discType, setDiscType] = React.useState('none');
  const [discVal, setDiscVal] = React.useState('');
  const [showDisc, setShowDisc] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [approver, setApprover] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);
  const [custDrop, setCustDrop] = React.useState(false);
  const inputRef = React.useRef(null);
  const seqRef = React.useRef(0);

  const filteredCusts = D.customers.filter(c => custSearch === '' || c.name.toLowerCase().includes(custSearch.toLowerCase()));
  const selectedCust = D.customers.find(c => c.id === custId);
  const typeInfo = SALE_TYPES.find(t => t.id === saleType);

  const scan = (raw) => {
    const parsed = window.parseBarcode(raw);
    if (!parsed) { setStatus('err'); toast('err','บาร์โค้ดไม่ถูกต้อง'); return; }
    setStatus('ok');
    setItems(prev => [{ key:++seqRef.current, code:parsed.code, name:parsed.prod.name, weight:parsed.weight, price:parsed.prod.sell, stock:parsed.prod.stock, tax:parsed.prod.tax, discType:'amount', discVal:0, isnew:true }, ...prev]);
    setBc('');
    setTimeout(() => setItems(prev => prev.map(it => ({ ...it, isnew:false }))), 700);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };
  const onKey = e => { if (e.key === 'Enter' && bc.trim()) scan(bc.trim()); };
  const del = key => setItems(prev => prev.filter(it => it.key !== key));
  const patchItem = (key, patch) => setItems(prev => prev.map(it => it.key===key ? { ...it, ...patch } : it));
  const updatePrice = (key, val) => patchItem(key, { price: val==='' ? '' : Math.max(0, parseFloat(val)||0) });
  const updateItemDiscVal = (key, val) => patchItem(key, { discVal: val==='' ? 0 : Math.max(0, parseFloat(val)||0) });

  /* Per-item line math (VAT-inclusive pricing) */
  const lineMath = (it) => {
    const gross = (Number(it.weight)||0) * (Number(it.price)||0);
    const disc = it.discType==='percent' ? gross*(Number(it.discVal)||0)/100 : (Number(it.discVal)||0);
    const net = Math.max(0, gross - disc);          // รวม (incl VAT)
    const vat = it.tax==='vat7' ? net * 7/107 : 0;  // VAT in price
    const preVat = net - vat;                        // ก่อน VAT
    return { gross, disc, net, vat, preVat };
  };

  /* Totals */
  const subtotal = items.reduce((s,i) => s + i.weight * (Number(i.price)||0), 0);
  const discAmt  = items.reduce((s,i) => s + lineMath(i).disc, 0);
  const afterDisc = items.reduce((s,i) => s + lineMath(i).net, 0);
  const vat = items.reduce((s,i) => s + lineMath(i).vat, 0);
  const totalW = items.reduce((s,i) => s + i.weight, 0);

  const doConfirm = () => {
    if (!items.length) { toast('err','ยังไม่มีรายการ'); return; }
    if (typeInfo.needsCust && !custId) { toast('err','กรุณาเลือกลูกค้า'); return; }
    setShowConfirm(true);
  };

  const doSave = () => {
    const st = window.SP_STATE;
    const invNo = typeInfo.hasInv ? `INV-${String(new Date().getFullYear()+543).slice(-4)}${String(new Date().getMonth()+1).padStart(2,'0')}-${String(st.invCounter).padStart(4,'0')}` : `ISS-${String(st.invCounter).padStart(4,'0')}`;
    st.invCounter++;
    const receiptData = {
      no: invNo, type: saleType, items, totalW, subtotal, discount: discAmt, afterDisc, vat,
      custName: selectedCust?.name || '—', pay,
    };
    if (typeInfo.hasInv) {
      st.invoices.unshift({
        id: st.invCounter, no: invNo, type: saleType==='wholesale'?'A4':'Thermal', channel: saleType,
        custId, custName: selectedCust?.name||'—', custTax: selectedCust?.tax||'',
        date: new Date().toISOString().slice(0,10), dateDisplay: window.fmtDate(),
        items: items.map(it => ({ code:it.code, name:it.name, weight:it.weight, price:it.price, tax:it.tax })),
        grossSale: subtotal, discount: discAmt, netSale: afterDisc, vatBase: afterDisc - vat, vat7: vat, total: afterDisc,
        pay, status:'paid', voided:false,
      });
    }
    setShowConfirm(false);
    setReceipt(receiptData);
    toast('ok', `บันทึก ${invNo} เรียบร้อย`);
    setItems([]); setCustSearch(''); setCustId(null); setDiscVal(''); setShowDisc(false);
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:18 }}>
      {/* LEFT */}
      <div>
        <div className="card" style={{ marginBottom:14 }}>
          {/* Scan */}
          <div className="ch">
            <span className="ct-t">สแกนบาร์โค้ดสินค้า</span>
            <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, fontWeight:600, color:'var(--gn)' }}><span className="dot"></span>พร้อมรับสัญญาณ</div>
          </div>
          <div className="cb" style={{ paddingBottom:10 }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{ flex:1, position:'relative', border:'2px solid var(--ac)', borderRadius:'var(--rs)', overflow:'hidden' }}>
                <input ref={inputRef} value={bc} inputMode="numeric" autoFocus
                  style={{ width:'100%', padding:'12px 48px 12px 14px', border:'none', outline:'none', fontSize:17, fontFamily:'var(--font-mono)', letterSpacing:'.05em', background:'#fff' }}
                  onChange={e => { setBc(e.target.value); setStatus(''); }} onKeyDown={onKey}
                  placeholder="สแกนหรือพิมพ์บาร์โค้ด 13 หลัก…" />
                <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16, fontWeight:700, color:status==='ok'?'var(--gn)':status==='err'?'var(--rd)':'var(--t3)' }}>
                  {status==='ok'?'✓':status==='err'?'✕':''}
                </span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:5, flexShrink:0 }}>
                <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>จำนวน:</span>
                <input type="number" min="1" defaultValue="1"
                  style={{ width:60, padding:'10px 6px', border:'1.5px solid var(--b2)', borderRadius:'var(--rs)', fontSize:14, fontWeight:700, textAlign:'center' }} />
                <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>รายการ</span>
              </div>
            </div>
            <div style={{ fontSize:11.5, color:'var(--t3)', display:'flex', alignItems:'center', gap:5, marginTop:7 }}>
              <span className="dot"></span>ระบบอ่านรหัสสินค้าและน้ำหนักอัตโนมัติ
            </div>
            {/* Demo */}
            <div style={{ marginTop:10, padding:'8px 12px', background:'var(--s2)', borderRadius:'var(--rs)', border:'1px solid var(--bd)' }}>
              <div style={{ fontSize:11.5, fontWeight:700, color:'var(--t3)', marginBottom:6 }}>ทดลองสแกน:</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {D.demoBarcodes.slice(0,3).map(b => (
                  <button key={b.code} onClick={() => scan(b.code)}
                    style={{ padding:'4px 9px', borderRadius:'var(--r4)', background:'#fff', border:'1px solid var(--bd)', fontSize:11.5, cursor:'pointer', textAlign:'left' }}>
                    <span style={{ fontFamily:'var(--font-mono)', display:'block', fontSize:11.5 }}>{b.code}</span>
                    <span style={{ color:'var(--t3)', fontSize:10.5 }}>{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Items */}
          <div style={{ borderTop:'1px solid var(--bd)' }}></div>
          <div className="ch" style={{ padding:'10px 20px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className="ct-t">รายการสินค้า</span>
              {items.length > 0 && <span style={{ fontSize:12, fontWeight:600, color:'var(--t3)' }}>· {items.length} รายการ</span>}
            </div>
            <Button variant="bg2" size="sm" onClick={() => setItems([])}>ล้างทั้งหมด</Button>
          </div>
          <div className="cb" style={{ paddingTop:6 }}>
            {items.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'26px 1fr 80px 84px 84px 26px', gap:8, paddingBottom:7, fontSize:11, fontWeight:700, color:'var(--t3)' }}>
                <div></div><div>สินค้า / รหัส</div><div style={{ textAlign:'center' }}>สต็อกก่อนตัด</div><div style={{ textAlign:'center' }}>น้ำหนัก (KG)</div><div style={{ textAlign:'center' }}>ราคา/KG</div><div></div>
              </div>
            )}
            <div style={{ maxHeight:'calc(10 * 88px)', overflowY:'auto' }}>
              {items.length === 0
                ? <div className="nc nc-b">สแกนบาร์โค้ดด้านบนเพื่อเพิ่มสินค้า</div>
                : items.map((it, i) => {
                    const lm = lineMath(it);
                    return (
                      <div key={it.key} style={{ border:'1px solid var(--bd)', borderRadius:'var(--rs)', marginBottom:6 }}>
                        <div style={{ display:'grid', gridTemplateColumns:'26px 1fr 80px 84px 84px 26px', gap:8, alignItems:'center', padding:'10px 12px' }}>
                          <div style={{ width:24, height:24, borderRadius:5, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10.5, fontWeight:700, color:'var(--t2)' }}>{items.length-i}</div>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600 }}>{it.name}</div>
                            <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--t3)' }}>รหัส: {it.code} · <span className={'bx '+(it.tax==='vat7'?'xb':'xx')} style={{ fontSize:10, padding:'1px 5px' }}>{it.tax==='vat7'?'VAT Incl.':'Non VAT'}</span></div>
                          </div>
                          <div style={{ padding:'4px 6px', background:'var(--gbg)', borderRadius:'var(--rs)', fontSize:12, fontWeight:700, color:'var(--gt)', textAlign:'center' }}>{it.stock.toFixed(3)}</div>
                          {/* weight (read-only, from scan) */}
                          <div style={{ padding:'5px 8px', background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', fontSize:13, fontWeight:700, color:'var(--t2)', textAlign:'center' }}>{it.weight.toFixed(3)}</div>
                          {/* editable price */}
                          <input type="number" min="0" step="0.01" value={it.price}
                            onChange={e => updatePrice(it.key, e.target.value)} title="แก้ไขราคา/KG"
                            style={{ width:'100%', padding:'6px 8px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:13, fontWeight:600, color:'var(--tx)', background:'var(--sur)', textAlign:'center', outline:'none', fontFamily:'inherit' }}
                            onFocus={e=>{ e.target.style.borderColor='var(--ac)'; e.target.style.boxShadow='0 0 0 3px rgba(59,91,219,.12)'; e.target.select(); }}
                            onBlur={e=>{ e.target.style.borderColor='var(--b2)'; e.target.style.boxShadow='none'; }} />
                          <div onClick={() => del(it.key)} style={{ width:24, height:24, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', cursor:'pointer', fontSize:14 }}>✕</div>
                        </div>
                        {/* sub-line: per-item discount + line totals */}
                        <div style={{ background:'var(--s2)', borderTop:'1px solid var(--bd)', padding:'8px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, flexWrap:'wrap' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:11.5, fontWeight:600, color:'var(--t2)', whiteSpace:'nowrap' }}>ส่วนลดรายการ:</span>
                            <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--b2)' }}>
                              <button onClick={() => patchItem(it.key, { discType:'amount' })}
                                style={{ padding:'4px 9px', fontSize:12, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit', background:it.discType==='amount'?'var(--ac)':'var(--sur)', color:it.discType==='amount'?'#fff':'var(--t2)' }}>฿</button>
                              <button onClick={() => patchItem(it.key, { discType:'percent' })}
                                style={{ padding:'4px 9px', fontSize:12, fontWeight:700, border:'none', borderLeft:'1px solid var(--b2)', cursor:'pointer', fontFamily:'inherit', background:it.discType==='percent'?'var(--ac)':'var(--sur)', color:it.discType==='percent'?'#fff':'var(--t2)' }}>%</button>
                            </div>
                            <input type="number" min="0" step="0.01" value={it.discVal}
                              onChange={e => updateItemDiscVal(it.key, e.target.value)} placeholder="0.00"
                              style={{ width:90, padding:'5px 8px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:12.5, color:'var(--tx)', background:'var(--sur)', outline:'none', fontFamily:'inherit', textAlign:'right' }}
                              onFocus={e=>{ e.target.style.borderColor='var(--ac)'; e.target.select(); }}
                              onBlur={e=>{ e.target.style.borderColor='var(--b2)'; }} />
                          </div>
                          <div style={{ fontSize:11.5, color:'var(--t3)', display:'flex', gap:10, flexWrap:'wrap' }}>
                            {lm.disc > 0 && <span>ส่วนลด: <b style={{ color:'var(--am)' }}>-{window.fmtMoney(lm.disc)}</b></span>}
                            <span>ก่อน VAT: <b style={{ color:'var(--t2)' }}>{window.fmtMoney(lm.preVat)}</b></span>
                            {it.tax==='vat7' && <span>VAT: <b style={{ color:'var(--pu)' }}>{window.fmtMoney(lm.vat)}</b></span>}
                            <span>รวม: <b style={{ color:'var(--gn)' }}>{window.fmtMoney(lm.net)}</b></span>
                          </div>
                        </div>
                      </div>
                    );
                  })
              }
            </div>

            {/* Note */}
            <div className="fg" style={{ marginTop:12 }}>
              <label className="fl">หมายเหตุ</label>
              <input type="text" className="fc" value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุ…" />
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ position:'sticky', top:0, display:'flex', flexDirection:'column', gap:14 }}>
        {/* Sale type selector */}
        <div className="card">
          <div className="ch" style={{ padding:'12px 16px' }}>
            <span className="ct-t">ประเภทการตัดสต็อก <span className="req">*</span></span>
          </div>
          <div style={{ padding:'12px 14px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:7, marginBottom:8 }}>
              {SALE_TYPES.slice(0,4).map(t => (
                <div key={t.id} onClick={() => setSaleType(t.id)}
                  style={{ padding:'10px 8px', border:`2px solid ${saleType===t.id?'var(--ac)':'var(--bd)'}`, background:saleType===t.id?'var(--abg)':'var(--sur)', borderRadius:'var(--rs)', cursor:'pointer', textAlign:'center', transition:'all .13s' }}>
                  <div style={{ color:saleType===t.id?'var(--ac)':'var(--t2)', margin:'0 auto 5px', display:'flex', justifyContent:'center' }}>{SALE_ICONS[t.id]}</div>
                  <div style={{ fontSize:12, fontWeight:700, color:saleType===t.id?'var(--at)':'var(--tx)' }}>{t.label}</div>
                  <div style={{ fontSize:10.5, color:'var(--t3)' }}>{t.desc}</div>
                </div>
              ))}
            </div>
            {/* Other — full width */}
            <div onClick={() => setSaleType('other')}
              style={{ padding:'10px 8px', border:`2px solid ${saleType==='other'?'var(--am)':'var(--bd)'}`, background:saleType==='other'?'var(--ambg)':'var(--sur)', borderRadius:'var(--rs)', cursor:'pointer', textAlign:'center', transition:'all .13s' }}>
              <div style={{ color:saleType==='other'?'var(--am)':'var(--t2)', display:'flex', justifyContent:'center', marginBottom:4 }}>{SALE_ICONS.other}</div>
              <div style={{ fontSize:12, fontWeight:700, color:saleType==='other'?'var(--amt)':'var(--tx)' }}>Other</div>
              <div style={{ fontSize:10.5, color:'var(--t3)' }}>อื่นๆ</div>
            </div>
            {!typeInfo?.hasInv && (
              <div className="nc nc-a" style={{ marginTop:10, fontSize:12 }}>ประเภทนี้ไม่ออกใบกำกับ — ตัดสต็อกเท่านั้น</div>
            )}
          </div>
        </div>

        {/* Customer + payment (wholesale/online) */}
        {typeInfo?.needsCust && (
          <div className="card">
            <div className="ch" style={{ padding:'12px 16px' }}><span className="ct-t">ข้อมูลลูกค้าและการชำระเงิน</span></div>
            <div style={{ padding:'12px 14px' }}>
              <div className="fg">
                <label className="fl">ลูกค้า</label>
                <div style={{ position:'relative' }}>
                  <input type="text" className="fc" placeholder="พิมพ์ค้นหาชื่อลูกค้า…"
                    value={custId ? (selectedCust?.name||custSearch) : custSearch}
                    onChange={e => { setCustSearch(e.target.value); setCustId(null); setCustDrop(true); }}
                    onFocus={() => setCustDrop(true)}
                    onBlur={() => setTimeout(() => setCustDrop(false), 200)} />
                  {custDrop && filteredCusts.length > 0 && (
                    <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--sur)', border:'1px solid var(--b2)', borderRadius:'var(--rs)', boxShadow:'var(--sh2)', zIndex:50, marginTop:3, maxHeight:160, overflowY:'auto' }}>
                      {filteredCusts.map(c => (
                        <div key={c.id} onMouseDown={() => { setCustId(c.id); setCustSearch(c.name); setCustDrop(false); }}
                          style={{ padding:'9px 12px', cursor:'pointer', fontSize:13, borderBottom:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', alignItems:'center' }}
                          onMouseEnter={e=>e.currentTarget.style.background='var(--s2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                          <span style={{ fontWeight:600 }}>{c.name}</span><Badge kind={c.type} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="fg">
                <label className="fl">ช่องทางชำระเงิน</label>
                <select className="fc" value={pay} onChange={e=>setPay(e.target.value)}>
                  <option value="cash">เงินสด</option>
                  <option value="transfer">เงินโอน</option>
                  <option value="credit">เครดิต</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Note card (non-commercial) */}
        {!typeInfo?.needsCust && (
          <div className="card">
            <div className="ch" style={{ padding:'12px 16px' }}><span className="ct-t">หมายเหตุ / รายละเอียด</span></div>
            <div style={{ padding:'12px 14px' }}>
              <div className="fg" style={{ marginBottom:8 }}>
                <label className="fl">หมายเหตุ</label>
                <textarea className="fc" rows="3" value={note} onChange={e=>setNote(e.target.value)} placeholder="ระบุรายละเอียดเพิ่มเติม…" style={{ resize:'vertical', minHeight:68, lineHeight:1.6 }} />
              </div>
              <div className="fg" style={{ marginBottom:0 }}>
                <label className="fl">ผู้รับผิดชอบ / อนุมัติ</label>
                <input type="text" className="fc" value={approver} onChange={e=>setApprover(e.target.value)} placeholder="ชื่อผู้อนุมัติ…" />
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="card">
          <div className="ch" style={{ padding:'12px 16px' }}>
            <span className="ct-t">สรุปรายการ</span>
            <Badge kind={saleType} />
          </div>
          <div style={{ padding:'12px 14px' }}>
            <div style={{ marginBottom:14 }}>
              {[['รายการ', items.length+' รายการ', null],['น้ำหนักรวม', window.fmtKg(totalW), null],['ยอดก่อน VAT', window.fmtMoney(subtotal), null],
                ...(discAmt > 0 ? [['ส่วนลด', '-'+window.fmtMoney(discAmt), 'var(--am)']] : []),
                ['VAT 7%', window.fmtMoney(vat), null],
                ['ยอดรวมสุทธิ', window.fmtMoney(afterDisc), 'var(--gn)']
              ].map(([l,v,c], i, arr) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i < arr.length-1 ? '1px solid var(--bd)' : 'none', fontWeight: i===arr.length-1?800:400, fontSize: i===arr.length-1?15:13 }}>
                  <span style={{ color: i===arr.length-1 ? 'var(--tx)' : 'var(--t2)' }}>{l}</span>
                  <span style={{ color:c||'var(--tx)', fontWeight: i===arr.length-1?800:600 }}>{v}</span>
                </div>
              ))}
            </div>
            <button onClick={doConfirm}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'13px', borderRadius:'var(--rs)', background:typeInfo?.hasInv?'var(--ac)':'var(--gn)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', boxShadow:typeInfo?.hasInv?'0 4px 12px rgba(59,91,219,.3)':'0 4px 12px rgba(13,146,114,.3)', transition:'all .15s' }}>
              {typeInfo?.hasInv ? 'ชำระเงิน' : 'ตัดสต็อกสินค้า'}
            </button>
            <button onClick={() => setItems([])}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:'100%', padding:'9px', borderRadius:'var(--rs)', background:'var(--sur)', color:'var(--t2)', fontSize:13, cursor:'pointer', border:'1px solid var(--b2)', fontFamily:'inherit', marginTop:8, transition:'all .15s' }}>
              ล้างข้อมูล
            </button>
          </div>
        </div>
      </div>

      {/* Confirm popup */}
      {showConfirm && (
        <ConfirmSO data={{ items, totalW, subtotal, discount:discAmt, afterDisc, vat, type:saleType, custName:selectedCust?.name||'—', pay }}
          onCancel={() => setShowConfirm(false)} onConfirm={doSave} />
      )}

      {/* Receipt popup */}
      {receipt && <ThermalReceipt data={receipt} onClose={() => setReceipt(null)} onDone={() => setReceipt(null)} />}
    </div>
  );
}

window.StockOut = StockOut;
window.ThermalReceipt = ThermalReceipt;
