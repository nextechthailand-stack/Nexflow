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

/* Thermal Receipt popup — white receipt matching printDoc('tiv') layout */
function ThermalReceipt({ data, onClose, onDone }) {
  if (!data) return null;
  const co  = window.SP_DATA.company;
  const usr = window.SP_DATA.user?.name || 'Admin Kanya';
  const isCommercial = data.type === 'Thermal';
  const $   = window.fmtMoney;
  const nf  = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

  /* Merge same product+weight so display matches printout */
  const merged = window.mergeInvItems
    ? window.mergeInvItems(data.items || [], Number(data.discount || 0))
    : (data.items || []).map(it => ({ ...it, indivWeight:Number(it.weight||0), scanCount:1, lineDisc:0 }));
  const totalW = merged.reduce((s,it) => s + (it.indivWeight||0) * (it.scanCount||1), 0);

  const net      = Number(data.afterDisc || data.netSale || 0);
  const disc     = Number(data.discount || 0);
  const subtotal = Number(data.subtotal || data.grossSale || net + disc || 0);
  const vat      = Number(data.vat7 || data.vat || 0);
  const preVat   = net - vat;
  const payLabel = { cash:'เงินสด', transfer:'เงินโอน', credit:'เครดิต' }[data.pay] || '—';

  const DL = { borderBottom:'1px dashed #ccc', margin:'8px 0' };

  const handlePrint = () => {
    /* Increment printCount on the matching saved invoice */
    const st  = window.SP_STATE;
    const inv = st.invoices.find(x => x.no === (data.thermalNo || data.no));
    if (inv) inv.printCount = (inv.printCount || 0) + 1;
    window.printDoc('tiv', { ...data, items: data.items });
  };

  return (
    <div className="ov" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="md" style={{ width:500 }}>
        <div className="md-h">
          <span className="md-t">ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ</span>
          <div style={{ display:'flex', gap:8 }}>
            {isCommercial && (
              <Button variant="bp" size="sm" icon="printer" onClick={handlePrint}>พิมพ์</Button>
            )}
            <div className="md-x" onClick={onClose}>✕</div>
          </div>
        </div>

        <div className="md-b" style={{ background:'#f5f4f0', padding:'16px' }}>
          <div style={{ background:'#fff', maxWidth:400, margin:'0 auto', padding:'20px 20px 16px', fontFamily:'var(--font-sans)', color:'#18171a', boxShadow:'0 2px 12px rgba(0,0,0,.1)', borderRadius:4 }}>

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:3 }}>{co.name}</div>
              <div style={{ fontSize:10.5, color:'#555', lineHeight:1.7 }}>{co.addr}</div>
              <div style={{ fontSize:10.5, color:'#555' }}>เลขประจำตัวผู้เสียภาษี {co.tax}</div>
              <div style={{ fontSize:10.5, color:'#555' }}>(สำนักงานใหญ่)</div>
            </div>

            <div style={{ ...DL }} />
            <div style={{ textAlign:'center', padding:'6px 0', marginBottom:8 }}>
              <div style={{ fontSize:12.5, fontWeight:800 }}>
                {isCommercial ? 'ใบเสร็จรับเงิน/ใบกำกับภาษีแบบย่อ' : 'เอกสารตัดสต็อก'}
              </div>
            </div>

            {/* Doc info */}
            <div style={{ fontSize:12, marginBottom:10 }}>
              {[
                ['เลขที่เอกสาร', data.thermalNo || data.no],
                ['วันที่ขาย',    (data.dateDisplay || '') + (data.time ? ' ' + data.time : '')],
                ['พนักงานขาย',   usr],
                ...(data.custName && data.custName !== '—' ? [['ลูกค้า', data.custName]] : []),
              ].map(([l, v]) => (
                <div key={l} style={{ display:'flex', gap:8, marginBottom:2 }}>
                  <span style={{ color:'#555', minWidth:90 }}>{l}:</span>
                  <span style={{ fontWeight:600, fontFamily:l==='เลขที่เอกสาร'?'var(--font-mono)':undefined }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ ...DL }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 36px 80px 85px', gap:4, fontSize:10.5, fontWeight:700, color:'#555', paddingBottom:5, borderBottom:'1px solid #ddd', marginBottom:6 }}>
              <span>รายการ</span><span style={{ textAlign:'right' }}>จำนวน</span>
              <span style={{ textAlign:'right' }}>หน่วยละ</span><span style={{ textAlign:'right' }}>รวมเงิน</span>
            </div>
            {merged.map((it, i) => {
              const w       = Number(it.indivWeight || it.weight || 0);
              const p       = Number(it.price || it.price_per_kg || 0);
              const qty     = it.scanCount || 1;
              const perPack = w * p;
              const iDisc   = Number(it.lineDisc || 0);
              const total   = qty * perPack - iDisc;
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 36px 80px 85px', gap:4, fontSize:12, marginBottom:8, alignItems:'start' }}>
                  <div>
                    <div style={{ fontWeight:600, lineHeight:1.4 }}>{it.name}</div>
                    <div style={{ fontSize:10.5, color:'#888' }}>{w.toFixed(3)} KG · ฿{p}/KG</div>
                    {iDisc > 0 && <div style={{ fontSize:10.5, color:'#e00' }}>ส่วนลด -{nf(iDisc)}</div>}
                  </div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{qty}</div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11.5 }}>{nf(perPack)}</div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11.5, fontWeight:700 }}>{nf(total)}</div>
                </div>
              );
            })}
            <div style={{ fontSize:11, color:'#666', borderTop:'1px dashed #ccc', paddingTop:6, marginBottom:6 }}>
              รายการ: {merged.length} &nbsp;·&nbsp; น้ำหนักรวม: {totalW.toFixed(3)} KG
            </div>

            {/* Totals */}
            <div style={{ ...DL }} />
            {[
              ['รวมเป็นเงิน', nf(subtotal), false],
              disc > 0 ? ['ส่วนลด', '-' + nf(disc), false] : null,
              ['รวมทั้งสิ้น', nf(net), true],
            ].filter(Boolean).map(([l, v, bold]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', fontSize: bold?13.5:12, fontWeight: bold?800:400, marginBottom:3 }}>
                <span style={{ color: bold?'#18171a':'#555' }}>{l}</span>
                <span style={{ fontFamily:'var(--font-mono)', color: bold?'#18171a':'#333' }}>{bold?'฿':''}{v}</span>
              </div>
            ))}
            <div style={{ ...DL }} />
            <div style={{ fontSize:11.5, color:'#555', marginBottom:3, display:'flex', justifyContent:'space-between' }}>
              <span>รวมมูลค่าสินค้า (ก่อน VAT)</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{nf(preVat)}</span>
            </div>
            <div style={{ fontSize:11.5, color:'#555', marginBottom:8, display:'flex', justifyContent:'space-between' }}>
              <span>ภาษีมูลค่าเพิ่ม 7%</span>
              <span style={{ fontFamily:'var(--font-mono)' }}>{nf(vat)}</span>
            </div>
            <div style={{ fontSize:12.5, fontWeight:700, display:'flex', justifyContent:'space-between', marginBottom:4 }}>
              <span>{payLabel}</span>
              <span style={{ fontFamily:'var(--font-mono)', color:'var(--gn)' }}>฿{nf(net)}</span>
            </div>

            <div style={{ ...DL }} />
            <div style={{ textAlign:'center', fontSize:11, color:'#888', paddingTop:2 }}>ขอบคุณที่ใช้บริการ</div>
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
function ConfirmSO({ data, onCancel, onConfirm, saving }) {
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
            {data.lineDiscount > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>ส่วนลดรายการ</span><span style={{ color:'var(--am)', fontWeight:700 }}>-{window.fmtMoney(data.lineDiscount)}</span>
            </div>}
            {data.billDiscount > 0 && <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:7 }}>
              <span style={{ color:'var(--t2)' }}>ส่วนลดทั้งบิล{data.billDiscType==='percent'?` (${data.billDiscNum?.toFixed(1)}%)`:''}
              </span><span style={{ color:'var(--am)', fontWeight:700 }}>-{window.fmtMoney(data.billDiscount)}</span>
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
          <button onClick={onConfirm} disabled={saving} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:typeInfo?.hasInv?'var(--ac)':'var(--gn)', color:'#fff', fontSize:14, fontWeight:700, cursor:saving?'wait':'pointer', border:'none', fontFamily:'inherit', opacity:saving?0.7:1 }}>
            {saving ? '⏳ กำลังบันทึก…' : <><Icon name="check" size={15} style={{ color:'#fff' }} /> ✓ ยืนยัน</>}
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
  const [isWalkIn, setIsWalkIn] = React.useState(false);
  const [pay, setPay] = React.useState('cash');
  const [discType, setDiscType] = React.useState('none');
  const [discVal, setDiscVal] = React.useState('');
  const [showDisc, setShowDisc] = React.useState(false);
  const [note, setNote] = React.useState('');
  const [approver, setApprover] = React.useState('');
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [receipt, setReceipt] = React.useState(null);
  const [custDrop, setCustDrop] = React.useState(false);
  const [billDiscType, setBillDiscType] = React.useState('amount'); // 'amount' | 'percent'
  const [billDiscVal, setBillDiscVal]   = React.useState('');
  const [saving, setSaving]             = React.useState(false);
  const [qty, setQty]                   = React.useState(1);
  const inputRef = React.useRef(null);
  const seqRef = React.useRef(0);

  const filteredCusts = D.customers.filter(c => custSearch === '' || c.name.toLowerCase().includes(custSearch.toLowerCase()));
  const selectedCust = D.customers.find(c => c.id === custId);
  const typeInfo = SALE_TYPES.find(t => t.id === saleType);

  const scan = (raw) => {
    const parsed = window.parseBarcode(raw);
    if (!parsed) { setStatus('err'); toast('err','บาร์โค้ดไม่ถูกต้อง'); return; }
    setStatus('ok');
    const n = Math.max(1, parseInt(qty) || 1);
    const add = Array.from({ length: n }, () => ({
      key: ++seqRef.current, code: parsed.code, name: parsed.prod.name,
      weight: parsed.weight, price: parsed.prod.sell, stock: parsed.prod.stock,
      tax: parsed.prod.tax, discType: 'amount', discVal: 0, isnew: true,
    }));
    setItems(prev => [...add, ...prev]);
    setBc('');
    setQty(1);
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
  const subtotal    = items.reduce((s,i) => s + i.weight * (Number(i.price)||0), 0);
  const lineDiscAmt = items.reduce((s,i) => s + lineMath(i).disc, 0);
  const afterLineDisc = items.reduce((s,i) => s + lineMath(i).net, 0);
  const totalW      = items.reduce((s,i) => s + i.weight, 0);

  /* Bill-level discount (applied after per-item discounts) */
  const billDiscNum = parseFloat(billDiscVal) || 0;
  const billDiscAmt = billDiscType === 'percent'
    ? afterLineDisc * billDiscNum / 100
    : billDiscNum;
  const afterDisc = Math.max(0, afterLineDisc - billDiscAmt); // final net (incl VAT)
  const discAmt   = lineDiscAmt + billDiscAmt;                // total all discounts

  /* Recompute VAT on final discounted total */
  const vatRatio = afterLineDisc > 0
    ? items.reduce((s,i) => s + (i.tax==='vat7'?lineMath(i).net:0), 0) / afterLineDisc
    : 0;
  const vat = afterDisc * vatRatio * 7 / 107;

  const doConfirm = () => {
    if (!items.length) { toast('err','ยังไม่มีรายการ'); return; }
    if (typeInfo.needsCust && !custId && !isWalkIn) { toast('err','กรุณาเลือกลูกค้า หรือเลือกลูกค้าทั่วไป'); return; }
    setShowConfirm(true);
  };

  const doSave = async () => {
    if (saving) return;
    setSaving(true);
    const st   = window.SP_STATE;
    const now  = new Date();
    const pfxs = window.SP_STATE.docPrefixes || window.SP_DATA.company?.docPrefixes || {};

    let invNo, thermalNo;

    try {
      if (window.SP_API) {
        /* ── DB mode: server สร้างเลขเอกสาร + ตัดสต็อก ── */
        const tivPfx = pfxs.tiv || 'TIV';
        const issPfx = pfxs.iss || 'ISS';
        const payload = {
          invoice_type:    typeInfo.hasInv ? 'TIV' : 'ISS',
          prefix:          typeInfo.hasInv ? tivPfx : issPfx,
          channel:         saleType,
          customer_id:     isWalkIn ? null : custId,
          customer_name:   isWalkIn ? 'ลูกค้าทั่วไป' : (selectedCust?.name || '—'),
          customer_tax_id: isWalkIn ? '' : (selectedCust?.tax || ''),
          invoice_date:    now.toISOString().slice(0, 10),
          gross_sale:      subtotal,
          discount:        discAmt,
          net_sale:        afterDisc,
          vat_base:        afterDisc - vat,
          vat7:            vat,
          total:           afterDisc,
          payment_method:  pay,
          items: items.map(it => ({
            code: it.code, name: it.name, weight: it.weight,
            price: it.price, tax: it.tax || 'vat7',
          })),
        };
        const result = await window.SP_API.createInvoice(payload);
        invNo     = result.invoice_no;
        thermalNo = typeInfo.hasInv ? invNo : null;

        await window.SP_API.reloadProducts();
        await window.SP_API.reloadInvoices();

      } else {
        /* ── Mock mode: generate เลขใน frontend ── */
        const ym   = String(now.getFullYear()+543).slice(-4) + String(now.getMonth()+1).padStart(2,'0');
        const pad4 = n => String(n).padStart(4,'0');

        if (typeInfo.hasInv) {
          const tivPfx = pfxs.tiv || 'TIV';
          thermalNo    = `${tivPfx}-${ym}-${pad4(st.invCounterThermal)}`;
          st.invCounterThermal++;
          invNo = thermalNo;
        } else {
          const issPfx = pfxs.iss || 'ISS';
          invNo    = `${issPfx}-${pad4(st.invCounter)}`;
          thermalNo = null;
          st.invCounter++;
        }
        if (typeInfo.hasInv) {
          st.invoices.unshift({
            id: Date.now(), no: invNo, thermalNo,
            type: 'Thermal', channel: saleType, fullInvNo: null, printCount: 0,
            custId: isWalkIn ? null : custId,
            custName: isWalkIn ? 'ลูกค้าทั่วไป' : (selectedCust?.name || '—'),
            custTax: isWalkIn ? '' : (selectedCust?.tax || ''),
            date: now.toISOString().slice(0,10), dateDisplay: window.fmtDate(),
            items: items.map(it => ({ code:it.code, name:it.name, weight:it.weight, price:it.price, tax:it.tax })),
            grossSale: subtotal, discount: discAmt, lineDiscount: lineDiscAmt, billDiscount: billDiscAmt,
            netSale: afterDisc, vatBase: afterDisc - vat, vat7: vat, total: afterDisc,
            pay, status:'paid', voided:false,
          });
        }
        /* mock mode: rebuild dashboard + reports */
        if (window.SP_API && typeof window.SP_API.rebuildDashboard === 'function') {
          window.SP_API.rebuildDashboard();
        }
      }
    } catch (err) {
      toast('err', `บันทึกไม่สำเร็จ: ${err.message}`);
      setSaving(false);
      return;
    }

    const receiptData = {
      no: invNo, thermalNo,
      type: typeInfo.hasInv ? 'Thermal' : 'ISS',
      channel: saleType,
      items, totalW, subtotal, discount: discAmt, afterDisc, vat, vat7: vat,
      grossSale: subtotal, netSale: afterDisc,
      custId: isWalkIn ? null : custId,
      custName: isWalkIn ? 'ลูกค้าทั่วไป' : (selectedCust?.name || '—'),
      custTax: isWalkIn ? '' : (selectedCust?.tax || ''),
      pay,
      date: now.toISOString().slice(0, 10),
      dateDisplay: window.fmtDate(),
      time: now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
    };
    setShowConfirm(false);
    setReceipt(receiptData);
    toast('ok', `บันทึก ${invNo} เรียบร้อย`);
    setItems([]); setCustSearch(''); setCustId(null); setIsWalkIn(false);
    setDiscVal(''); setShowDisc(false); setBillDiscVal('');
    setSaving(false);
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
                <input type="number" min="1" value={qty}
                  onChange={e => setQty(Math.max(1, parseInt(e.target.value)||1))}
                  onFocus={e => e.target.select()}
                  style={{ width:60, padding:'10px 6px', border:`1.5px solid ${qty>1?'var(--ac)':'var(--b2)'}`, borderRadius:'var(--rs)', fontSize:14, fontWeight:700, textAlign:'center', color:qty>1?'var(--ac)':'inherit', transition:'border-color .15s' }} />
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
                {isWalkIn ? (
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div className="fc" style={{ flex:1, background:'var(--s2)', color:'var(--t2)', display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ fontSize:15 }}>👤</span>
                      <span style={{ fontWeight:600 }}>ลูกค้าทั่วไป</span>
                    </div>
                    <button type="button" onClick={() => setIsWalkIn(false)}
                      style={{ padding:'6px 10px', borderRadius:'var(--rs)', border:'1px solid var(--bd)', background:'var(--sur)', color:'var(--t2)', cursor:'pointer', fontSize:12, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      เลือกลูกค้า
                    </button>
                  </div>
                ) : (
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
                )}
                {!isWalkIn && !custId && (
                  <button type="button" onClick={() => { setIsWalkIn(true); setCustSearch(''); setCustId(null); }}
                    style={{ marginTop:6, width:'100%', padding:'7px', borderRadius:'var(--rs)', border:'1px dashed var(--bd)', background:'transparent', color:'var(--t3)', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
                    + ลูกค้าทั่วไป (ไม่ระบุชื่อ)
                  </button>
                )}
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
            <div style={{ marginBottom:12 }}>
              {[['รายการ', items.length+' รายการ', null],
                ['น้ำหนักรวม', window.fmtKg(totalW), null],
                ['ราคารวม', window.fmtMoney(subtotal), null],
                ...(lineDiscAmt > 0 ? [['ส่วนลดรายการ', '-'+window.fmtMoney(lineDiscAmt), 'var(--am)']] : []),
              ].map(([l,v,c], i, arr) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--bd)', fontSize:12.5 }}>
                  <span style={{ color:'var(--t2)' }}>{l}</span>
                  <span style={{ color:c||'var(--tx)', fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>

            {/* ── Bill-level discount ── */}
            <div style={{ padding:'10px 0', borderBottom:'1px solid var(--bd)', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:12.5, fontWeight:700, color:'var(--tx)' }}>ส่วนลดทั้งบิล</span>
                <div style={{ display:'flex', borderRadius:6, overflow:'hidden', border:'1px solid var(--b2)' }}>
                  {[['amount','฿'],['percent','%']].map(([t,l])=>(
                    <button key={t} onClick={()=>{setBillDiscType(t);setBillDiscVal('');}}
                      style={{ padding:'4px 12px', fontSize:12.5, fontWeight:700, border:'none', cursor:'pointer', fontFamily:'inherit',
                        background:billDiscType===t?'var(--ac)':'var(--sur)', color:billDiscType===t?'#fff':'var(--t2)' }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="number" min="0" step={billDiscType==='percent'?'0.1':'1'}
                  value={billDiscVal} onChange={e=>setBillDiscVal(e.target.value)}
                  placeholder={billDiscType==='percent'?'0.0 %':'0 ฿'}
                  style={{ flex:1, padding:'7px 10px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:14, fontWeight:700, textAlign:'right', outline:'none', fontFamily:'inherit', color:billDiscAmt>0?'var(--am)':'var(--t2)' }}
                  onFocus={e=>{ e.target.style.borderColor='var(--ac)'; e.target.select(); }}
                  onBlur={e=>{ e.target.style.borderColor='var(--b2)'; }} />
                {billDiscAmt > 0 && (
                  <span style={{ fontSize:13, fontWeight:800, color:'var(--am)', whiteSpace:'nowrap' }}>-{window.fmtMoney(billDiscAmt)}</span>
                )}
              </div>
              {billDiscType==='percent' && billDiscAmt>0 && (
                <div style={{ fontSize:11.5, color:'var(--am)', marginTop:4 }}>ลด {billDiscNum.toFixed(1)}% = -{window.fmtMoney(billDiscAmt)}</div>
              )}
            </div>

            <div style={{ marginBottom:14 }}>
              {[
                ...(discAmt > 0 ? [['ส่วนลดรวม', '-'+window.fmtMoney(discAmt), 'var(--am)']] : []),
                ['VAT 7%', window.fmtMoney(vat), null],
                ['ยอดรวมสุทธิ', window.fmtMoney(afterDisc), 'var(--gn)']
              ].map(([l,v,c], i, arr) => (
                <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom: i < arr.length-1 ? '1px solid var(--bd)' : 'none', fontWeight: i===arr.length-1?800:400, fontSize: i===arr.length-1?16:13 }}>
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
        <ConfirmSO data={{ items, totalW, subtotal, discount:discAmt, lineDiscount:lineDiscAmt, billDiscount:billDiscAmt, billDiscType, billDiscNum, afterDisc, vat, type:saleType, custName:isWalkIn?'ลูกค้าทั่วไป':(selectedCust?.name||'—'), pay }}
          onCancel={() => setShowConfirm(false)} onConfirm={doSave} saving={saving} />
      )}

      {/* Receipt popup */}
      {receipt && <ThermalReceipt data={receipt} onClose={() => setReceipt(null)} onDone={() => setReceipt(null)} />}
    </div>
  );
}

window.StockOut = StockOut;
window.ThermalReceipt = ThermalReceipt;
