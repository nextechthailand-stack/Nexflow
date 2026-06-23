/* NEXflow UI Kit — รับสินค้าเข้า (Stock In) — faithful to original */

/* ── GRN Document (printable modal) ── */
function GrnDoc({ grn, onClose }) {
  if (!grn) return null;
  const co = window.SP_DATA.company;
  const ACC       = '#b45309';
  const ACC_LIGHT = '#fef3c7';
  const fmtN = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});

  const vatInclBase = grn.items.filter(i => i.tax === 'vat7').reduce((s,i) => s + i.value, 0);
  const vatExclBase = grn.items.filter(i => i.tax === 'vat7_excl').reduce((s,i) => s + i.value, 0);
  const vat       = (vatInclBase * 7 / 107) + (vatExclBase * 7 / 100);
  const totalValue = Number(grn.totalValue || 0);
  const preVat    = totalValue - vat;

  const mergeMap = {};
  const orderedKeys = [];
  grn.items.forEach((it, idx) => {
    const isUnit = window.unitOf ? window.unitOf(it.code).unitType === 'unit' : false;
    /* KG products: show each scan as a separate row; unit products: group by code */
    const key = isUnit ? (it.code || it.name) : `__kg_${idx}`;
    if (!mergeMap[key]) { mergeMap[key] = { ...it, packCount:0, totalWeight:0, totalValue:0 }; orderedKeys.push(key); }
    /* scanCount บันทึกไว้ใน doSave — ถ้าไม่มี (GRN เก่า) ให้ fallback */
    if (it.scanCount != null) {
      mergeMap[key].packCount += Number(it.scanCount);
    } else if (isUnit) {
      mergeMap[key].packCount += Number(it.weight || 0);
    } else {
      mergeMap[key].packCount += 1;
    }
    mergeMap[key].totalWeight += Number(it.weight||0);
    mergeMap[key].totalValue  += Number(it.value||0);
  });
  const mergedItems = orderedKeys.map(k => mergeMap[k]);

  const thStyle = (extra={}) => ({
    padding:'8px 10px', background:ACC, color:'#fff', fontWeight:700,
    fontSize:11.5, borderBottom:'1px solid rgba(0,0,0,.15)', ...extra
  });
  const tdStyle = (extra={}) => ({
    padding:'8px 10px', fontSize:12, borderBottom:'1px solid #e8e8e8', ...extra
  });

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md" style={{ width:900, maxHeight:'92vh' }}>
        <div className="md-h">
          <span className="md-t">เอกสารรับสินค้า (GRN) · {grn.id}</span>
          <div style={{ display:'flex', gap:8 }}>
            <Button variant="bp" size="sm" icon="printer" onClick={()=>window.printDoc('grn', grn)}>พิมพ์ GRN</Button>
            <div className="md-x" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="md-b" style={{ background:'var(--s2)' }}>
          <div style={{ background:'#fff', width:794, minHeight:1123, maxWidth:'100%', margin:'0 auto', fontFamily:'var(--font-sans)', boxShadow:'0 2px 16px rgba(0,0,0,.08)', border:'1px solid var(--bd)', overflow:'hidden' }}>

            {/* HEADER */}
            <div style={{ background:'#fff', padding:'16px 24px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', gap:14, alignItems:'center', flex:1 }}>
                <CompanyLogo size={60} radius={6} />
                <div style={{ marginTop:4 }}>
                  <div style={{ fontSize:17, fontWeight:800, lineHeight:1.3, color:'#111' }}>{co.name}</div>
                  {co.nameEn && <div style={{ fontSize:12, fontWeight:600, color:'#444' }}>{co.nameEn}</div>}
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.8, marginTop:4 }}>
                    {co.addr && <div>{co.addr}</div>}
                    <div>โทร. {co.tel}{co.email ? ` | ${co.email}` : ''}</div>
                    <div>เลขประจำตัวผู้เสียภาษี <b style={{ color:'#111' }}>{co.tax}</b>&nbsp;&nbsp;สำนักงานใหญ่</div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', minWidth:210, flexShrink:0 }}>
                <div style={{ fontSize:30, fontWeight:900, color:ACC, lineHeight:1.2, letterSpacing:1 }}>ใบรับสินค้า</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#777', marginTop:4 }}>Goods Receipt Note</div>
              </div>
            </div>

            {/* BODY */}
            <div style={{ padding:'16px 24px 20px' }}>

              {/* META INFO PANEL */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', marginBottom:14, border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}>
                <div style={{ padding:'10px 14px', borderRight:'1px solid #ccc' }}>
                  <div style={{ fontSize:10.5, color:'#777', marginBottom:4 }}>ผู้รับสินค้า / Consignee</div>
                  <div style={{ fontSize:14, fontWeight:800, color:'#111' }}>{co.name}</div>
                  {co.nameEn && <div style={{ fontSize:11.5, fontWeight:600, color:'#555' }}>{co.nameEn}</div>}
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.7, marginTop:3 }}>
                    {co.addr && <div>{co.addr}</div>}
                    {(co.tel || co.email) && <div>{'โทร. '}{co.tel}{co.email ? ` | ${co.email}` : ''}</div>}
                    {co.tax && <div>เลขประจำตัวผู้เสียภาษี <b style={{ color:'#111' }}>{co.tax}</b></div>}
                  </div>
                </div>
                <div style={{ padding:'10px 14px', minWidth:240, background:ACC_LIGHT }}>
                  {[
                    ['เลขที่',       <b style={{ fontFamily:'var(--font-mono)', fontSize:13, color:ACC }}>{grn.id}</b>],
                    ['วันที่รับ',         <b>{grn.dateDisplay}</b>],
                    ...(grn.poNo ? [['เลขที่อ้างอิง', <b style={{ fontFamily:'var(--font-mono)' }}>{grn.poNo}</b>]] : []),
                    ['ผู้รับสินค้า',      <b>{grn.receiver}</b>],
                  ].map(([label, val], i, arr) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'4px 0', borderBottom: i < arr.length-1 ? '1px solid #d0d8e8' : 'none', fontSize:12 }}>
                      <span style={{ color:'#667', whiteSpace:'nowrap' }}>{label}</span>{val}
                    </div>
                  ))}
                </div>
              </div>

              {/* ITEMS TABLE + SUMMARY */}
              <div style={{ border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                  <thead>
                    <tr>
                      <th style={thStyle({ textAlign:'center', width:34, borderRight:'1px solid rgba(255,255,255,.2)' })}>ลำดับ<br/><span style={{ fontSize:'9.5px', fontWeight:400 }}>No.</span></th>
                      <th style={thStyle({ borderRight:'1px solid rgba(255,255,255,.2)', textAlign:'center' })}>รหัสสินค้าและรายละเอียด<br/><span style={{ fontSize:'9.5px', fontWeight:400 }}>Code / Description</span></th>
                      <th style={thStyle({ borderRight:'1px solid rgba(255,255,255,.2)', textAlign:'center', width:60 })}>จำนวน<br/><span style={{ fontSize:'9.5px', fontWeight:400 }}>Quantity</span></th>
                      <th style={thStyle({ borderRight:'1px solid rgba(255,255,255,.2)', textAlign:'center', width:90 })}>ราคาต้นทุน<br/><span style={{ fontSize:'9.5px', fontWeight:400 }}>Cost Price</span></th>
                      <th style={thStyle({ textAlign:'center', width:100 })}>มูลค่า<br/><span style={{ fontSize:'9.5px', fontWeight:400 }}>Amount</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mergedItems.map((it, i) => (
                      <tr key={i} style={{ background: i%2===0 ? '#fff' : '#fafafa' }}>
                        <td style={tdStyle({ textAlign:'center', color:'#888', borderRight:'1px solid #e8e8e8' })}>{i+1}</td>
                        <td style={tdStyle({ borderRight:'1px solid #e8e8e8' })}>
                          <div style={{ fontSize:10, color:'#888', fontFamily:'var(--font-mono)', marginBottom:2 }}>{it.code}</div>
                          <div style={{ fontWeight:600 }}>
                            {it.name}
                            {window.unitOf && window.unitOf(it.code).unitType === 'kg' && it.totalWeight > 0
                              ? <span style={{ fontWeight:400, color:'#555', marginLeft:4 }}>@ {(it.totalWeight / it.packCount).toFixed(3)} kg</span>
                              : null}
                          </div>
                        </td>
                        <td style={tdStyle({ borderRight:'1px solid #e8e8e8', textAlign:'center', fontWeight:600 })}>{it.packCount}</td>
                        <td style={tdStyle({ borderRight:'1px solid #e8e8e8', textAlign:'right' })}>{fmtN(it.cost)}</td>
                        <td style={tdStyle({ textAlign:'right', fontWeight:700, color:'#111' })}>{fmtN(it.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* SUMMARY ROW */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr auto', borderTop:'2px solid #ccc' }}>
                  <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:6, borderRight:'1px solid #ddd' }}>
                    {grn.note && (
                      <div>
                        <div style={{ fontSize:10.5, color:'#777', marginBottom:2 }}>หมายเหตุ</div>
                        <div style={{ fontSize:12, color:'#444' }}>{grn.note}</div>
                      </div>
                    )}
                    <div style={{ marginTop:'auto' }}>
                      <div style={{ fontSize:10.5, color:'#777', marginBottom:3 }}>จำนวนเงิน (ตัวอักษร)</div>
                      <div style={{ fontSize:12.5, fontWeight:600, color:'#111' }}>{window.bahtText ? window.bahtText(totalValue) : ''}</div>
                    </div>
                  </div>
                  <div style={{ width:250, flexShrink:0 }}>
                    <table style={{ width:'100%', borderCollapse:'collapse' }}>
                      <tbody>
                        <tr>
                          <td style={{ padding:'5px 12px', fontSize:12, color:'#333', borderBottom:'1px solid #eee' }}>ราคาก่อน VAT<span style={{ fontSize:10, color:'#888', display:'block' }}>Taxable Amount</span></td>
                          <td style={{ padding:'5px 12px', textAlign:'right', fontSize:12.5, fontWeight:600, color:'#333', borderBottom:'1px solid #eee' }}>{fmtN(preVat)}</td>
                        </tr>
                        <tr>
                          <td style={{ padding:'5px 12px', fontSize:12, color:'#333', borderBottom:'1px solid #eee' }}>ภาษีมูลค่าเพิ่ม 7%<span style={{ fontSize:10, color:'#888', display:'block' }}>VAT 7%</span></td>
                          <td style={{ padding:'5px 12px', textAlign:'right', fontSize:12.5, fontWeight:600, color:'#333', borderBottom:'1px solid #eee' }}>{fmtN(vat)}</td>
                        </tr>
                        <tr style={{ background:ACC }}>
                          <td style={{ padding:'8px 12px', fontSize:13, fontWeight:800, color:'#fff' }}>มูลค่ารวมทั้งสิ้น<span style={{ fontSize:10, fontWeight:400, display:'block', opacity:.8 }}>Total Amount</span></td>
                          <td style={{ padding:'8px 12px', textAlign:'right', fontSize:16, fontWeight:900, color:'#fff', minWidth:110 }}>{fmtN(totalValue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* SIGNATURES */}
              <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}>
                {[
                  'ผู้รับสินค้า / Receiver',
                  'ผู้มีอำนาจลงนาม / Authorized',
                ].map((label, i) => (
                  <div key={i} style={{ padding:'10px 14px', borderRight: i<1 ? '1px solid #ccc' : 'none' }}>
                    <div style={{ marginTop:48, borderTop:'1px solid #bbb', paddingTop:6, textAlign:'center', fontSize:11.5, color:'#555' }}>{label}</div>
                    <div style={{ marginTop:10, paddingTop:5, textAlign:'center', fontSize:10.5, color:'#888' }}>วันที่ ....... / ....... / .......</div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
          <Button variant="bs" icon="check" onClick={onClose}>✓ บันทึกเสร็จสิ้น</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Stock In Main ── */
function StockIn({ toast, setPage }) {
  const D = window.SP_DATA;
  const [items, setItems] = React.useState([]);
  const [bc, setBc] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().slice(0,10));
  const [poRef, setPoRef] = React.useState('');
  const [receiver, setReceiver] = React.useState(() => window.SP_DATA?.user?.name || 'Admin');
  const [note, setNote] = React.useState('');
  const [qty, setQty] = React.useState(1);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [showAllStock, setShowAllStock] = React.useState(false);
  const [grn, setGrn] = React.useState(null);
  const inputRef = React.useRef(null);
  const seqRef = React.useRef(0);

  const scan = (raw) => {
    const parsed = window.parseBarcode(raw);
    if (!parsed) { setStatus('err'); toast('err', 'บาร์โค้ดไม่ถูกต้อง — ต้องเป็น 13 หลัก'); return; }
    setStatus('ok');
    const n = Math.max(1, parseInt(qty)||1);
    const isUnit = window.unitOf(parsed.code).unitType === 'unit';
    if (isUnit) {
      /* สินค้านับจำนวน: ถ้ามีอยู่แล้วให้บวกจำนวน ไม่ขึ้น row ใหม่ */
      setItems(prev => {
        const idx = prev.findIndex(it => it.code === parsed.code);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], weight: next[idx].weight + n, isnew: true };
          setTimeout(() => setItems(p => p.map(it => ({ ...it, isnew:false }))), 700);
          return next;
        }
        return [{ key: ++seqRef.current, code:parsed.code, name:parsed.prod.name, weight:n, cost:parsed.prod.cost, tax:parsed.prod.tax, isnew:true }, ...prev];
      });
    } else {
      /* สินค้าชั่งน้ำหนัก: แต่ละ scan = row แยก */
      const add = Array.from({ length:n }, () => ({
        key: ++seqRef.current, code:parsed.code, name:parsed.prod.name,
        weight:parsed.weight, cost:parsed.prod.cost, tax:parsed.prod.tax, isnew:true,
      }));
      setItems(prev => [...add, ...prev]);
      setTimeout(() => setItems(prev => prev.map(it => ({ ...it, isnew:false }))), 700);
    }
    setBc('');
    setQty(1);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };
  const onKey = e => { if (e.key === 'Enter' && bc.trim()) { scan(bc.trim()); } };
  const del = key => setItems(prev => prev.filter(it => it.key !== key));
  const updateCost = (key, val) => {
    const n = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setItems(prev => prev.map(it => it.key === key ? { ...it, cost: n } : it));
  };
  const updateQty = (key, val) => {
    const n = val === '' ? '' : Math.max(0, parseInt(val) || 0);
    setItems(prev => prev.map(it => it.key === key ? { ...it, weight: n } : it));
  };

  const totalPacks = items.length;
  const totalItems = items.reduce((s, it) => s + (window.unitOf(it.code).unitType === 'unit' ? it.weight : 1), 0);
  const totalW = items.reduce((s,i) => s + i.weight, 0);
  const totalC = items.reduce((s,i) => s + i.weight * i.cost, 0);

  const [saving, setSaving] = React.useState(false);

  const doSave = async () => {
    if (saving) return;
    setSaving(true);
    setShowConfirm(false);
    const st = window.SP_STATE;

    /* KG products: keep each scan as individual row (different weights must stay separate)
       Unit products: group by code, accumulate count in scanCount */
    const unitGrouped = {};
    const grnItems = [];
    items.forEach(it => {
      const isUnitProd = window.unitOf ? window.unitOf(it.code).unitType === 'unit' : false;
      if (isUnitProd) {
        if (!unitGrouped[it.code]) unitGrouped[it.code] = { code:it.code, name:it.name,
          weight:0, cost:it.cost, value:0, tax:it.tax, scanCount:0 };
        unitGrouped[it.code].weight    += it.weight;
        unitGrouped[it.code].value     += it.weight * it.cost;
        unitGrouped[it.code].scanCount += Number(it.weight||0);
      } else {
        grnItems.push({ code:it.code, name:it.name, weight:it.weight,
          cost:it.cost, value:it.weight * it.cost, tax:it.tax, scanCount:1 });
      }
    });
    Object.values(unitGrouped).forEach(it => grnItems.push(it));
    grnItems.forEach((it, i) => { it.pack_no = `PKG-${String(i+1).padStart(3,'0')}`; });

    /* ── บันทึกลง DB ── */
    if (window.SP_API) {
      try {
        const grnPfxDB = (window.SP_STATE.docPrefixes?.grn) || 'GRN';
        const result = await window.SP_API.createGRN({
          grn_date:   date,
          prefix:     grnPfxDB,
          po_no:      poRef || '',
          receiver,
          note,
          items:      grnItems,
          created_by: 1,
        });

        const grnId = result.grn_no;
        const d = new Date(date);
        const beDateDisplay = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`;

        const newGrn = {
          id: grnId, no: grnId, date, dateDisplay: beDateDisplay,
          poNo: poRef || '—', receiver, note,
          totalPacks: totalItems, totalWeight: totalW, totalValue: totalC,
          items: grnItems.map(it => ({ ...it, packNo: it.pack_no })),
        };

        /* อัป SP_STATE ให้ StockManage เห็นทันที */
        st.grnLogs = [newGrn, ...st.grnLogs];

        /* Background: reload stock + ledger */
        window.SP_API.reloadProducts()
          .then(() => window.SP_API.reloadLedger())
          .catch(err => console.warn('[SP_API] reload after GRN:', err));

        setGrn(newGrn);
        toast('ok', `บันทึก ${grnId} ลง DB เรียบร้อย — ${totalItems} รายการ · ${window.fmtKg(totalW)}`);
        setItems([]); setPoRef(''); setNote('');

      } catch (err) {
        toast('err', `บันทึกไม่สำเร็จ: ${err.message}`);
      } finally {
        setSaving(false);
      }
      return;
    }

    /* ── fallback: mock data ── */
    const grnPfx = (st.docPrefixes?.grn) || 'GRN';
    const grnId  = window.nextDocNo('grnCounter', grnPfx, true);
    const d = new Date(date);
    const beDateDisplay = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`;
    const newGrn = {
      id: grnId, no: grnId, date, dateDisplay: beDateDisplay,
      poNo: poRef || '—', receiver, note,
      totalPacks, totalWeight: totalW, totalValue: totalC,
      items: grnItems.map(it => ({ ...it, packNo: it.pack_no })),
    };
    st.grnLogs = [newGrn, ...st.grnLogs];
    setGrn(newGrn);
    toast('ok', `บันทึก GRN ${grnId} เรียบร้อย (mock)`);
    setItems([]); setPoRef(''); setNote('');
    setSaving(false);
  };

  const lowStock = D.products.filter(p => p.stock < p.min);
  const beDate = date ? (() => { const d = new Date(date); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`; })() : '—';

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:18, alignItems:'start' }}>
      {/* LEFT */}
      <div>
        {/* Scan + Meta merged card */}
        <div className="card" style={{ marginBottom:14 }}>
          {/* Scan zone section */}
          <div className="cb" style={{ paddingBottom:14, borderBottom:'1px solid var(--bd)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:700 }}>สแกนบาร์โค้ดสินค้า</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--gn)' }}>
                <span className="dot"></span>พร้อมรับสัญญาณ — เพิ่มอัตโนมัติ
              </div>
            </div>
            <div className="si-scan-zone" style={{ background:'linear-gradient(135deg,#f0f4ff,#f8fbff)', border:'2px dashed var(--ac)', borderRadius:'var(--r)', padding:'16px 16px 12px' }}>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div style={{ position:'relative', flex:1 }}>
                  <input ref={inputRef} className="si-bc-main" value={bc} inputMode="numeric" autoFocus
                    style={{ width:'100%', padding:'13px 48px 13px 16px', border:'none', borderRadius:'var(--rs)', fontSize:18, fontFamily:'var(--font-mono)', letterSpacing:'.06em', color:'var(--tx)', background:'#fff', outline:'none', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}
                    onChange={e => { setBc(e.target.value); setStatus(''); }} onKeyDown={onKey}
                    placeholder="สแกนหรือพิมพ์บาร์โค้ด 13 หลัก แล้วกด Enter…" />
                  <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:17, fontWeight:700, color:status==='ok'?'var(--gn)':status==='err'?'var(--rd)':'var(--t3)' }}>
                    {status==='ok'?'✓':status==='err'?'✕':''}
                  </span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600, whiteSpace:'nowrap' }}>จำนวน:</span>
                  <input type="number" min="1" value={qty} onChange={e=>setQty(e.target.value)}
                    style={{ width:64, padding:'10px 8px', border:'1.5px solid var(--b2)', borderRadius:'var(--rs)', fontSize:14, fontWeight:700, textAlign:'center', background:'var(--sur)' }} />
                  <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>รายการ</span>
                </div>
              </div>
            </div>
          </div>
          {/* Meta: date / PO / receiver / note */}
          <div className="cb" style={{ paddingTop:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <label className="fl">วันที่รับ <span className="req">*</span></label>
                <DateField style={{ width:'100%' }} value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div>
                <label className="fl">เลขที่อ้างอิง (PO)</label>
                <input type="text" className="fc" value={poRef} onChange={e=>setPoRef(e.target.value)} placeholder="PO-2506-001" />
              </div>
              <div>
                <label className="fl">ผู้รับสินค้า</label>
                <select className="fc" value={receiver} onChange={e=>setReceiver(e.target.value)}>
                  <option>{window.SP_DATA?.user?.name || 'Admin'}</option><option>สมชาย ใจดี</option>
                </select>
              </div>
            </div>
            <div>
              <label className="fl">หมายเหตุ</label>
              <input type="text" className="fc" value={note} onChange={e=>setNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม…" />
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="card">
          <div className="ch">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span className="ct-t">รายการสินค้า</span>
              {items.length > 0 && <span style={{ fontSize:12, fontWeight:600, padding:'2px 9px', background:'var(--abg)', color:'var(--at)', borderRadius:100 }}>{items.length}</span>}
            </div>
            <Button variant="bg2" size="sm" onClick={() => setItems([])}>ล้างทั้งหมด</Button>
          </div>
          <div className="cb">
            {items.length > 0 && (
              <div style={{ display:'grid', gridTemplateColumns:'28px 1fr 100px 90px 28px', gap:8, paddingBottom:8, fontSize:10.5, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                <div></div><div>สินค้า / รหัส</div><div>จำนวน</div><div>ราคาทุน/หน่วย</div><div></div>
              </div>
            )}
            {items.length === 0 ? (
              <div style={{ padding:'32px 20px', textAlign:'center', border:'2px dashed var(--bd)', borderRadius:'var(--r)' }}>
                <div style={{ width:48, height:48, borderRadius:12, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color:'var(--t3)' }}><Icon name="warehouse" size={22} /></div>
                <div style={{ fontSize:14, fontWeight:600, color:'var(--t2)', marginBottom:4 }}>ยังไม่มีรายการ</div>
                <div style={{ fontSize:12.5, color:'var(--t3)' }}>สแกนบาร์โค้ดด้านบน — ระบบจะเพิ่มสินค้าให้อัตโนมัติ</div>
              </div>
            ) : (
              <div style={{ maxHeight:'calc(10 * 74px)', overflowY:'auto' }}>
                {items.map((it, i) => (
                  <div key={it.key}
                    style={{ display:'grid', gridTemplateColumns:'28px 1fr 100px 90px 28px', gap:8, alignItems:'center', padding:'10px 12px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', marginBottom:6, animation:it.isnew?'fadeUp .18s ease':'none' }}>
                    <div style={{ width:28, height:28, borderRadius:6, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--t2)' }}>{items.length - i}</div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600 }}>{it.name}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:1 }}>
                        <span style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)' }}>{it.code}</span>
                        <span className={'bx '+(it.tax==='nonvat'?'xx':'xb')} style={{ fontSize:9.5, padding:'1px 4px' }}>
                          {it.tax==='vat7'?'VAT incl.':it.tax==='vat7_excl'?'VAT excl.':'Non VAT'}
                        </span>
                      </div>
                    </div>
                    {window.unitOf(it.code).unitType === 'unit' ? (
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                        <input type="number" min="0" step="1" value={it.weight}
                          onChange={e => updateQty(it.key, e.target.value)}
                          style={{ width:'100%', padding:'5px 8px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:13, fontWeight:700, color:'var(--tx)', background:'var(--sur)', textAlign:'center', outline:'none', fontFamily:'inherit' }}
                          onFocus={e=>{ e.target.style.borderColor='var(--ac)'; e.target.style.boxShadow='0 0 0 3px rgba(59,91,219,.12)'; e.target.select(); }}
                          onBlur={e=>{ e.target.style.borderColor='var(--b2)'; e.target.style.boxShadow='none'; }} />
                        <span style={{ fontSize:10, color:'var(--t3)', fontWeight:600 }}>{window.unitOf(it.code).unitLabel}</span>
                      </div>
                    ) : (
                      <div style={{ padding:'5px 10px', background:'var(--abg)', borderRadius:'var(--rs)', fontSize:13, fontWeight:700, color:'var(--at)', textAlign:'center' }}>
                        {window.fmtItemQty(it.weight, it.code)}
                      </div>
                    )}
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <span style={{ position:'absolute', left:8, fontSize:12, color:'var(--t3)', pointerEvents:'none' }}>฿</span>
                      <input type="number" min="0" step="0.01" value={it.cost}
                        onChange={e => updateCost(it.key, e.target.value)}
                        title="แก้ไขราคาทุน"
                        style={{ width:'100%', padding:'6px 6px 6px 18px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:13, fontWeight:600, color:'var(--tx)', background:'var(--sur)', textAlign:'right', outline:'none', fontFamily:'inherit', transition:'border .13s, box-shadow .13s' }}
                        onFocus={e => { e.target.style.borderColor='var(--ac)'; e.target.style.boxShadow='0 0 0 3px rgba(59,91,219,.12)'; e.target.select(); }}
                        onBlur={e => { e.target.style.borderColor='var(--b2)'; e.target.style.boxShadow='none'; }} />
                    </div>
                    <div onClick={() => del(it.key)} style={{ width:28, height:28, borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', cursor:'pointer', fontSize:15, transition:'all .12s' }}
                      onMouseEnter={e=>e.currentTarget.style.cssText='width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all .12s;background:var(--rbg);color:var(--rd)'}
                      onMouseLeave={e=>e.currentTarget.style.cssText='width:28px;height:28px;border-radius:6px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:15px;transition:all .12s;color:var(--t3)'}>✕</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ position:'sticky', top:0, display:'flex', flexDirection:'column', gap:14 }}>
        {/* Summary card */}
        <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--sh)' }}>
          <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,var(--gn),#0a7a5c)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:13.5, fontWeight:700, color:'#fff' }}>สรุปการรับสินค้า</span>
          </div>
          <div style={{ padding:16 }}>
            {[['จำนวนรายการ', totalItems+' รายการ', null]].map(([l,v,c]) => (
              <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--bd)' }}>
                <span style={{ fontSize:13, color:'var(--t2)' }}>{l}</span>
                <span style={{ fontSize:13, fontWeight:700, color:c||'var(--tx)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--bd)', marginTop:4 }}>
              <span style={{ fontSize:14, fontWeight:700 }}>มูลค่ารวม</span>
              <span style={{ fontSize:20, fontWeight:800, color:'var(--gn)' }}>{window.fmtMoney(totalC)}</span>
            </div>
          </div>
          <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:8 }}>
            <button onClick={() => { if (!items.length) { toast('err','ยังไม่มีรายการ'); return; } setShowConfirm(true); }}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:'var(--rs)', background:'var(--gn)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', border:'none', boxShadow:'0 4px 12px rgba(13,146,114,.3)', transition:'all .15s', fontFamily:'inherit' }}>
              <Icon name="check" size={16} style={{ color:'#fff' }} /> บันทึกรับสินค้าเข้า
            </button>
            <Button variant="bg2" style={{ width:'100%', justifyContent:'center', fontSize:13 }} onClick={() => setItems([])}>ล้างข้อมูล</Button>
          </div>
        </div>

        {/* Stock levels */}
        <div className="card">
          <div className="ch" style={{ padding:'12px 16px' }}>
            <span style={{ fontSize:13, fontWeight:700 }}>สต็อกคงเหลือ</span>
            <button onClick={() => setPage && setPage('stock-manage')}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, color:'var(--ac)', background:'var(--abg)', border:'1px solid rgba(59,91,219,.15)', borderRadius:'var(--rs)', padding:'5px 11px', cursor:'pointer', fontFamily:'inherit', transition:'all .13s' }}>
              <Icon name="dashboard" size={13} style={{ color:'var(--ac)' }} /> ดูรายงานทั้งหมด
            </button>
          </div>
          <div style={{ overflowY:'auto', maxHeight:260, padding:'4px 16px 8px' }}>
            {D.products.slice().sort((a,b) => b.stock - a.stock).map(p => {
              const isKg = window.unitOf ? window.unitOf(p.code).unitType === 'kg' : true;
              const clr  = p.stock <= 0 ? 'var(--rd)' : p.stock <= (p.min || 0) ? 'var(--am)' : 'var(--gn)';
              const label = isKg ? `${p.stock.toFixed(3)} KG` : `${Math.round(p.stock)} ${p.unitLabel || 'pcs'}`;
              return (
                <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--bd)' }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:8, overflow:'hidden' }}>
                    <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-mono)', letterSpacing:'0.04em' }}>{p.code}</div>
                    <div style={{ fontSize:12, fontWeight:600, color:'var(--tx)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                  </div>
                  <span style={{ fontSize:11.5, fontWeight:700, color:clr, flexShrink:0 }}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Confirmation popup */}
      {showConfirm && (
        <div className="ov" onClick={e => e.target===e.currentTarget && setShowConfirm(false)}>
          <div className="md" style={{ width:420 }}>
            <div style={{ padding:'20px 22px 0' }}>
              <div style={{ textAlign:'center', marginBottom:16 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:'var(--gbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--gn)' }}><Icon name="check" size={24} /></div>
                <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>ยืนยันการรับสินค้า</div>
                <div style={{ fontSize:13, color:'var(--t2)' }}>ระบบจะสร้างเอกสาร GRN และอัปเดตสต็อกทันที</div>
              </div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--t2)' }}>วันที่รับ</span><span style={{ fontWeight:700 }}>{beDate}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--t2)' }}>เลขที่ PO</span><span style={{ fontFamily:'var(--font-mono)' }}>{poRef||'—'}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--t2)' }}>จำนวน</span><span style={{ fontWeight:700 }}>{totalItems} รายการ</span>
                </div>

                <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, borderTop:'1px solid var(--bd)', paddingTop:8, fontWeight:800 }}>
                  <span>มูลค่าสินค้า</span><span style={{ color:'var(--gn)' }}>{window.fmtMoney(totalC)}</span>
                </div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={() => setShowConfirm(false)}>ยกเลิก</Button>
              <button onClick={doSave}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--gn)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                <Icon name="check" size={15} style={{ color:'#fff' }} /> ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GRN document popup */}
      {grn && <GrnDoc grn={grn} onClose={() => setGrn(null)} />}
    </div>
  );
}
window.StockIn = StockIn;
window.GrnDoc = GrnDoc;
