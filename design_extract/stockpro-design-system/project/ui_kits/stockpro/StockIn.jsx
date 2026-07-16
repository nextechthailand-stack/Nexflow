/* StockPro UI Kit — รับสินค้าเข้า (Stock In) — faithful to original */

/* ── GRN Document (printable modal) ── */
function GrnDoc({ grn, onClose }) {
  if (!grn) return null;
  const co = window.SP_DATA.company;
  const vatBase = grn.items.filter(i => i.tax === 'vat7').reduce((s,i) => s + i.value, 0);
  const vat = vatBase * 7 / 107;
  const nonVat = grn.items.filter(i => i.tax !== 'vat7').reduce((s,i) => s + i.value, 0);
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md" style={{ width:700, maxHeight:'90vh' }}>
        <div className="md-h">
          <span className="md-t">เอกสารรับสินค้า (GRN) · {grn.id}</span>
          <div style={{ display:'flex', gap:8 }}>
            <Button variant="bp" size="sm" icon="printer">พิมพ์ GRN</Button>
            <div className="md-x" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="md-b" style={{ background:'var(--s2)' }}>
          <div style={{ background:'#fff', padding:28, maxWidth:640, margin:'0 auto', border:'1px solid var(--bd)', fontFamily:'var(--font-sans)' }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'2px solid #1a1826', paddingBottom:14, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:38, height:38, borderRadius:11, background:'linear-gradient(135deg,#5b7cff,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:15 }}>SP</div>
                <div>
                  <div style={{ fontSize:15, fontWeight:800 }}>{co.name}</div>
                  <div style={{ fontSize:11, color:'var(--t2)', lineHeight:1.6 }}>{co.addr}</div>
                  <div style={{ fontSize:11, color:'var(--t2)' }}>โทร {co.tel} · เลขภาษี {co.tax}</div>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:22, fontWeight:800, color:'var(--ac)', letterSpacing:1 }}>GRN</div>
                <div style={{ fontSize:11.5, color:'var(--t2)', marginTop:3 }}>เอกสารรับสินค้า</div>
              </div>
            </div>
            {/* Meta */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px', fontSize:12.5, marginBottom:16 }}>
              <div><span style={{ color:'var(--t2)' }}>เลขที่ GRN:</span> <b style={{ fontFamily:'var(--font-mono)' }}>{grn.id}</b></div>
              <div><span style={{ color:'var(--t2)' }}>วันที่รับ:</span> <b>{grn.dateDisplay}</b></div>
              <div><span style={{ color:'var(--t2)' }}>เลขที่ PO อ้างอิง:</span> <b>{grn.poNo || '—'}</b></div>
              <div><span style={{ color:'var(--t2)' }}>ผู้รับสินค้า:</span> <b>{grn.receiver}</b></div>
              {grn.note && <div style={{ gridColumn:'1/-1' }}><span style={{ color:'var(--t2)' }}>หมายเหตุ:</span> <b>{grn.note}</b></div>}
            </div>
            {/* Items table */}
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5, marginBottom:16 }}>
              <thead>
                <tr style={{ background:'#1a1826', color:'#fff' }}>
                  <th style={{ padding:'8px 10px', textAlign:'left' }}>#</th>
                  <th style={{ padding:'8px 10px', textAlign:'left' }}>สินค้า</th>
                  <th style={{ padding:'8px 10px', textAlign:'center' }}>แพ็ค</th>
                  <th style={{ padding:'8px 10px', textAlign:'right' }}>น้ำหนัก</th>
                  <th style={{ padding:'8px 10px', textAlign:'right' }}>ราคาทุน/KG</th>
                  <th style={{ padding:'8px 10px', textAlign:'center' }}>ภาษี</th>
                  <th style={{ padding:'8px 10px', textAlign:'right' }}>มูลค่า</th>
                </tr>
              </thead>
              <tbody>
                {grn.items.map((it, i) => (
                  <tr key={i} style={{ borderBottom:'1px solid #eee' }}>
                    <td style={{ padding:'8px 10px', color:'var(--t3)', fontSize:11 }}>{i+1}</td>
                    <td style={{ padding:'8px 10px', fontWeight:600 }}>{it.name}<br/><span style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--t3)' }}>{it.code}</span></td>
                    <td style={{ padding:'8px 10px', textAlign:'center', fontFamily:'var(--font-mono)', fontSize:11 }}>{it.packNo}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700 }}>{Number(it.weight).toFixed(3)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'right' }}>{window.fmtMoney(it.cost)}</td>
                    <td style={{ padding:'8px 10px', textAlign:'center' }}><span className={'bx '+(it.tax==='vat7'?'xb':'xx')} style={{ fontSize:10.5 }}>{it.tax==='vat7'?'VAT 7%':'Non VAT'}</span></td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontWeight:700, color:'var(--gn)' }}>{window.fmtMoney(it.value)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background:'#f5f4f0', fontWeight:700 }}>
                  <td colSpan="2" style={{ padding:'8px 10px' }}>รวม {grn.items.length} รายการ · {grn.totalPacks} แพ็ค</td>
                  <td style={{ padding:'8px 10px', textAlign:'center' }}>{grn.totalPacks}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right' }}>{window.fmtKg(grn.totalWeight)}</td>
                  <td></td><td></td>
                  <td style={{ padding:'8px 10px', textAlign:'right', color:'var(--gn)' }}>{window.fmtMoney(grn.totalValue)}</td>
                </tr>
              </tfoot>
            </table>
            {/* Totals */}
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <div style={{ width:260, fontSize:12.5 }}>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--bd)' }}>
                  <span style={{ color:'var(--t2)' }}>จำนวนสินค้า</span><span>{grn.totalPacks} แพ็ค</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--bd)' }}>
                  <span style={{ color:'var(--t2)' }}>น้ำหนักรวม</span><span style={{ color:'var(--ac)', fontWeight:700 }}>{window.fmtKg(grn.totalWeight)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--bd)' }}>
                  <span style={{ color:'var(--t2)' }}>ยอด VAT Base</span><span>{window.fmtMoney(vatBase - vat)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'5px 0', borderBottom:'1px solid var(--bd)' }}>
                  <span style={{ color:'var(--t2)' }}>VAT 7% (รวมในราคา)</span><span style={{ color:'var(--pu)' }}>{window.fmtMoney(vat)}</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', fontSize:14, fontWeight:800 }}>
                  <span>มูลค่ารวม (สุทธิ)</span><span style={{ color:'var(--gn)' }}>{window.fmtMoney(grn.totalValue)}</span>
                </div>
              </div>
            </div>
            {/* Signatures */}
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, fontSize:11.5, color:'var(--t2)', borderTop:'1px solid var(--bd)', paddingTop:16 }}>
              <div style={{ textAlign:'center', flex:1 }}>____________________<br/>ผู้ส่งสินค้า</div>
              <div style={{ textAlign:'center', flex:1 }}>____________________<br/>ผู้รับสินค้า</div>
              <div style={{ textAlign:'center', flex:1 }}>____________________<br/>ผู้มีอำนาจลงนาม</div>
            </div>
            <div style={{ marginTop:12, fontSize:11, color:'var(--t3)', textAlign:'center' }}>
              พิมพ์เมื่อ {window.fmtDate()} · StockPro — {co.name}
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
  const [receiver, setReceiver] = React.useState('Admin Kanya');
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
    const add = Array.from({ length:n }, () => ({
      key: ++seqRef.current, code:parsed.code, name:parsed.prod.name,
      weight:parsed.weight, cost:parsed.prod.cost, tax:parsed.prod.tax, isnew:true,
    }));
    setItems(prev => [...add, ...prev]);
    setBc('');
    setTimeout(() => setItems(prev => prev.map(it => ({ ...it, isnew:false }))), 700);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };
  const onKey = e => { if (e.key === 'Enter' && bc.trim()) { scan(bc.trim()); } };
  const del = key => setItems(prev => prev.filter(it => it.key !== key));
  const updateCost = (key, val) => {
    const n = val === '' ? '' : Math.max(0, parseFloat(val) || 0);
    setItems(prev => prev.map(it => it.key === key ? { ...it, cost: n } : it));
  };

  const totalPacks = items.length;
  const totalW = items.reduce((s,i) => s + i.weight, 0);
  const totalC = items.reduce((s,i) => s + i.weight * i.cost, 0);

  const doSave = () => {
    const st = window.SP_STATE;
    const grnId = `GRN-${String(st.grnCounter).padStart(6,'0')}`;
    st.grnCounter++;
    const d = new Date(date);
    const beDateDisplay = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`;
    // Group items by code
    const grouped = {};
    items.forEach((it, idx) => {
      if (!grouped[it.code]) grouped[it.code] = { code:it.code, name:it.name, packNo:`PKG-${String(idx+1).padStart(3,'0')}`, weight:0, cost:it.cost, value:0, tax:it.tax };
      grouped[it.code].weight += it.weight;
      grouped[it.code].value += it.weight * it.cost;
    });
    const grnItems = Object.values(grouped).map((it, i) => ({ ...it, packNo:`PKG-${String(i+1).padStart(3,'0')}` }));
    const newGrn = {
      id: grnId, no: grnId, date: date, dateDisplay: beDateDisplay,
      poNo: poRef || '—', receiver, note,
      totalPacks, totalWeight: totalW, totalValue: totalC, items: grnItems,
    };
    st.grnLogs = [newGrn, ...st.grnLogs];
    setShowConfirm(false);
    setGrn(newGrn);
    toast('ok', `บันทึก GRN ${grnId} เรียบร้อย — ${totalPacks} แพ็ค · ${window.fmtKg(totalW)}`);
    setItems([]); setPoRef(''); setNote('');
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
                  <span style={{ fontSize:12, color:'var(--t3)', fontWeight:600 }}>แพ็ค</span>
                </div>
              </div>
            </div>
            {/* Demo bar */}
            <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap', marginTop:10, padding:'8px 12px', background:'var(--s2)', borderRadius:'var(--rs)', border:'1px solid var(--bd)' }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:'var(--t3)' }}>ทดลองสแกน:</span>
              {D.demoBarcodes.slice(0,3).map(b => (
                <button key={b.code} onClick={() => scan(b.code)}
                  style={{ padding:'4px 9px', borderRadius:'var(--r4)', background:'#fff', border:'1px solid var(--bd)', fontSize:11.5, cursor:'pointer', textAlign:'left', transition:'all .12s', lineHeight:1.4 }}>
                  <div style={{ fontFamily:'var(--font-mono)', color:'var(--tx)', fontSize:11.5 }}>{b.code}</div>
                  <div style={{ color:'var(--t3)', fontSize:10.5 }}>{b.label}</div>
                </button>
              ))}
              <button onClick={() => { scan(D.demoBarcodes[0].code); setTimeout(()=>scan(D.demoBarcodes[1].code),350); setTimeout(()=>scan(D.demoBarcodes[2].code),700); }}
                style={{ padding:'4px 9px', borderRadius:'var(--r4)', background:'#fff', border:'1px solid var(--bd)', fontSize:11.5, fontWeight:700, color:'var(--ac)', cursor:'pointer' }}>
                สแกนต่อเนื่อง ×3
              </button>
            </div>
          </div>
          {/* Meta: date / PO / receiver / note */}
          <div className="cb" style={{ paddingTop:14 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <label className="fl">วันที่รับ <span className="req">*</span></label>
                <input type="date" className="fc" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div>
                <label className="fl">เลขที่อ้างอิง (PO)</label>
                <input type="text" className="fc" value={poRef} onChange={e=>setPoRef(e.target.value)} placeholder="PO-2506-001" />
              </div>
              <div>
                <label className="fl">ผู้รับสินค้า</label>
                <select className="fc" value={receiver} onChange={e=>setReceiver(e.target.value)}>
                  <option>Admin Kanya</option><option>สมชาย ใจดี</option>
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
                <div></div><div>สินค้า / รหัส</div><div>น้ำหนัก (KG)</div><div>ราคาทุน/KG</div><div></div>
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
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)', marginTop:1 }}>{it.code}</div>
                    </div>
                    <div style={{ padding:'5px 10px', background:'var(--abg)', borderRadius:'var(--rs)', fontSize:13, fontWeight:700, color:'var(--at)', textAlign:'center' }}>{it.weight.toFixed(3)}</div>
                    <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
                      <span style={{ position:'absolute', left:8, fontSize:12, color:'var(--t3)', pointerEvents:'none' }}>฿</span>
                      <input type="number" min="0" step="0.01" value={it.cost}
                        onChange={e => updateCost(it.key, e.target.value)}
                        title="แก้ไขราคาทุน/KG"
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
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, fontWeight:600, color:'rgba(255,255,255,.8)' }}>
              <Icon name="cube" size={13} style={{ color:'rgba(255,255,255,.8)' }} /> {totalPacks} แพ็ค
            </div>
          </div>
          <div style={{ padding:16 }}>
            {[['จำนวนแพ็ค', totalPacks+' แพ็ค', null],['น้ำหนักรวม', window.fmtKg(totalW), 'var(--ac)']].map(([l,v,c]) => (
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
          <div style={{ padding:'8px 16px 4px' }}>
            {(showAllStock
              ? D.products.slice().sort((a,b)=>b.stock-a.stock)
              : D.products.slice().sort((a,b)=>b.stock-a.stock).slice(0,5)
            ).map(p => (
              <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--bd)' }}>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600 }}>{p.name}</div>
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:10.5, color:'var(--t3)' }}>{p.code}</div>
                </div>
                <StockPill stock={p.stock} min={p.min} />
              </div>
            ))}
          </div>
          {/* Expand bar */}
          {D.products.length > 5 && (
            <button onClick={() => setShowAllStock(v => !v)}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, width:'100%', padding:'11px', background:'var(--s2)', border:'none', borderTop:'1px solid var(--bd)', borderRadius:'0 0 var(--r) var(--r)', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'var(--ac)', fontFamily:'inherit', transition:'all .13s' }}>
              <span style={{ transform: showAllStock ? 'rotate(180deg)' : 'none', transition:'transform .18s', display:'inline-flex' }}><Icon name="chevron-down" size={14} style={{ color:'var(--ac)' }} /></span>
              {showAllStock ? 'แสดงน้อยลง' : `ดูสินค้าทั้งหมด (${D.products.length - 5} รายการ)`}
            </button>
          )}
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
                  <span style={{ color:'var(--t2)' }}>จำนวน</span><span style={{ fontWeight:700 }}>{totalPacks} แพ็ค</span>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, marginBottom:8 }}>
                  <span style={{ color:'var(--t2)' }}>น้ำหนักรวม</span><span style={{ fontWeight:700, color:'var(--ac)' }}>{window.fmtKg(totalW)}</span>
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
                <Icon name="check" size={15} style={{ color:'#fff' }} /> ✓ ยืนยัน
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
