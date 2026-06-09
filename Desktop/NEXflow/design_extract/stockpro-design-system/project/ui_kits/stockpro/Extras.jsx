/* StockPro UI Kit — Extras: InvoiceList, StockManage (with grouped movement), Users, Settings, Products, Customers */

/* ═══ INVOICE LIST ═══ */
function InvoiceList({ toast }) {
  const [tab, setTab] = React.useState('list');
  const [search, setSearch] = React.useState('');
  const [dateF, setDateF] = React.useState('');
  const [selInv, setSelInv] = React.useState(null);
  const [voidNo, setVoidNo] = React.useState('');
  const [voidPreview, setVoidPreview] = React.useState(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [voidModal, setVoidModal] = React.useState(null);
  const [invs, setInvs] = React.useState(() => window.SP_STATE.invoices);
  const co = window.SP_DATA.company;

  const refresh = () => setInvs([...window.SP_STATE.invoices]);
  React.useEffect(refresh, [tab]);

  const filtered = invs.filter(iv =>
    (!dateF || iv.date === dateF) &&
    (!search || iv.no.includes(search) || (iv.custName||'').includes(search))
  );
  const active = invs.filter(iv => !iv.voided);

  const doVoid = () => {
    const iv = voidModal; if (!iv) return;
    window.SP_STATE.invoices = window.SP_STATE.invoices.map(x =>
      x.id===iv.id ? {...x, voided:true, status:'voided', voidedAt:window.fmtDate()+(new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})), voidedBy:'Admin Kanya', voidReason, stockRestored:true} : x
    );
    refresh(); setVoidModal(null); setVoidNo(''); setVoidPreview(null); setVoidReason('');
    toast('ok', `ยกเลิกใบกำกับ ${iv.no} เรียบร้อย — คืนสต็อกแล้ว`);
  };

  const $ = window.fmtMoney;
  const TH = { padding:'9px 14px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)', background:'var(--s2)', whiteSpace:'nowrap' };
  const TD = { padding:'11px 14px', borderBottom:'1px solid var(--bd)', verticalAlign:'middle' };

  const A4Content = ({ iv }) => {
    if (!iv) return <div className="nc nc-b">เลือกใบกำกับด้านบน</div>;
    const cust = window.SP_DATA.customers.find(c => c.id === iv.custId);
    const preVat = iv.netSale - iv.vat7;
    const payLabel = { cash:'เงินสด', transfer:'เงินโอน', credit:'เครดิต' }[iv.pay] || '—';
    const TH = { padding:'9px 10px', background:'#ececec', color:'#18171a', fontWeight:700, fontSize:11.5, textAlign:'left', verticalAlign:'bottom', lineHeight:1.3, borderBottom:'2px solid #cfcdc7' };
    return (
      <div style={{ width:'21cm', minHeight:'29.7cm', background:'#fff', padding:'1.4cm 1.5cm', margin:'0 auto', boxShadow:'0 4px 24px rgba(0,0,0,.12)', position:'relative', fontFamily:'var(--font-sans)', color:'#18171a', boxSizing:'border-box' }}>
        {/* ต้นฉบับ pill */}
        <div style={{ textAlign:'center', marginBottom:18 }}>
          <span style={{ display:'inline-block', padding:'5px 22px', background:'var(--gbg)', border:'1.5px solid var(--gn)', borderRadius:100, fontSize:14, fontWeight:700, color:'var(--gt)' }}>{iv.voided ? 'ยกเลิก' : 'ต้นฉบับ'}</span>
        </div>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
          <div style={{ maxWidth:'62%' }}>
            <div style={{ fontSize:21, fontWeight:800, color:'var(--ac)', marginBottom:6 }}>{co.name}</div>
            <div style={{ fontSize:12.5, color:'#444', lineHeight:1.9 }}>
              <div>{co.addr}</div>
              <div>โทร: {co.tel} | อีเมล: {co.email}</div>
              <div>เลขประจำตัวผู้เสียภาษี: <b>{co.tax}</b></div>
            </div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:26, fontWeight:800, letterSpacing:'.5px' }}>ใบกำกับภาษี</div>
            <div style={{ fontSize:12, color:'var(--t3)', marginBottom:10 }}>(ราคารวม VAT)</div>
            <div style={{ fontSize:13.5, lineHeight:1.9 }}>เลขที่: <b style={{ fontFamily:'var(--font-mono)' }}>{iv.no}</b></div>
            <div style={{ fontSize:13.5 }}>วันที่: <b>{iv.dateDisplay}</b></div>
          </div>
        </div>

        <div style={{ borderTop:'3px solid #18171a', marginBottom:20 }}></div>

        {/* Seller / Buyer boxes */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, marginBottom:24 }}>
          {[['ผู้ขาย', co.name, co.addr, co.tax],
            ['ผู้ซื้อ', cust?.name||iv.custName, cust?.addr||'', iv.custTax||cust?.tax||'']].map(([label,name,addr,tax],idx)=>(
            <div key={idx} style={{ border:'1px solid #e2e0da', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--t2)', marginBottom:8 }}>{label}</div>
              <div style={{ fontSize:14, fontWeight:700, marginBottom:5 }}>{name}</div>
              <div style={{ fontSize:12, color:'#555', lineHeight:1.8 }}>{addr||'—'}</div>
              <div style={{ fontSize:12, color:'#555', marginTop:3 }}>เลขภาษี: {tax||'—'}</div>
            </div>
          ))}
        </div>

        {/* Items table */}
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead>
            <tr style={{ background:'#ececec' }}>
              <th style={{ ...TH, width:34, textAlign:'center' }}>#</th>
              <th style={{ ...TH, width:64 }}>รหัส</th>
              <th style={TH}>รายการสินค้า</th>
              <th style={{ ...TH, width:74, textAlign:'center' }}>ภาษี</th>
              <th style={{ ...TH, width:60, textAlign:'right' }}>KG</th>
              <th style={{ ...TH, width:96, textAlign:'right' }}>ราคา/KG<br/><span style={{ fontSize:9.5, fontWeight:400, color:'#666' }}>(incl.VAT)</span></th>
              <th style={{ ...TH, width:78, textAlign:'right' }}>ส่วนลด</th>
              <th style={{ ...TH, width:104, textAlign:'right' }}>จำนวนเงิน<br/><span style={{ fontSize:9.5, fontWeight:400, color:'#666' }}>(incl.VAT)</span></th>
            </tr>
          </thead>
          <tbody>
            {(iv.items||[]).map((it,i)=>(
              <tr key={i} style={{ borderBottom:'1px solid #ececec' }}>
                <td style={{ padding:'12px 10px', textAlign:'center', color:'#999' }}>{i+1}</td>
                <td style={{ padding:'12px 10px', fontFamily:'var(--font-mono)' }}>{it.code}</td>
                <td style={{ padding:'12px 10px', fontWeight:600 }}>{it.name}</td>
                <td style={{ padding:'12px 10px', textAlign:'center' }}>
                  <span className={'bx '+(it.tax==='vat7'?'xb':'xx')} style={{ fontSize:10.5 }}>{it.tax==='vat7'?'VAT incl.':'Non VAT'}</span>
                </td>
                <td style={{ padding:'12px 10px', textAlign:'right' }}>{Number(it.weight).toFixed(3)}</td>
                <td style={{ padding:'12px 10px', textAlign:'right' }}>{$(it.price)}</td>
                <td style={{ padding:'12px 10px', textAlign:'right', color:'var(--am)' }}>{it.discount>0?'-'+$(it.discount):'—'}</td>
                <td style={{ padding:'12px 10px', textAlign:'right', fontWeight:700 }}>{$(it.weight*it.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ marginTop:4 }}>
          <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 10px', borderBottom:'1px solid #ececec' }}>
            <span style={{ fontSize:13, color:'var(--t2)', marginRight:40 }}>ยอดรวม (incl. VAT)</span>
            <span style={{ fontSize:14, fontWeight:700, minWidth:104, textAlign:'right' }}>{$(iv.netSale)}</span>
          </div>
          {iv.discount>0 && (
            <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 10px', borderBottom:'1px solid #ececec' }}>
              <span style={{ fontSize:13, color:'var(--am)', marginRight:40 }}>ส่วนลด</span>
              <span style={{ fontSize:14, fontWeight:700, color:'var(--am)', minWidth:104, textAlign:'right' }}>-{$(iv.discount)}</span>
            </div>
          )}
          <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 10px', borderBottom:'1px solid #ececec' }}>
            <span style={{ fontSize:13, color:'var(--t2)', marginRight:40 }}>ยอดก่อน VAT</span>
            <span style={{ fontSize:14, fontWeight:700, minWidth:104, textAlign:'right' }}>{$(preVat)}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', padding:'10px 10px', borderBottom:'1px solid #ececec' }}>
            <span style={{ fontSize:13, color:'var(--pu)', marginRight:40 }}>VAT 7%</span>
            <span style={{ fontSize:14, fontWeight:700, color:'var(--pu)', minWidth:104, textAlign:'right' }}>{$(iv.vat7)}</span>
          </div>
          {/* Grand total */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'#f5f4f0', borderRadius:8, padding:'14px 16px', marginTop:10 }}>
            <span style={{ fontSize:13.5, fontWeight:700, color:'#333' }}>({window.bahtText(iv.total)})</span>
            <div style={{ display:'flex', alignItems:'center', gap:40 }}>
              <span style={{ fontSize:14, fontWeight:800 }}>จำนวนเงินรวมทั้งสิ้น</span>
              <span style={{ fontSize:18, fontWeight:800, color:'var(--gn)', minWidth:104, textAlign:'right' }}>{$(iv.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div style={{ fontSize:13, marginTop:18 }}>ช่องทางชำระเงิน: <b>{payLabel}</b></div>

        {/* Signatures */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:64, fontSize:12.5, color:'var(--t2)' }}>
          <div style={{ textAlign:'center', flex:1, maxWidth:240, margin:'0 auto' }}>
            <div style={{ borderTop:'1px solid #999', margin:'0 20px 8px' }}></div>ผู้รับสินค้า / ผู้ซื้อ
          </div>
          <div style={{ textAlign:'center', flex:1, maxWidth:240, margin:'0 auto' }}>
            <div style={{ borderTop:'1px solid #999', margin:'0 20px 8px' }}></div>ผู้มีอำนาจลงนาม
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="tabs">
        <div className={'tab'+(tab==='list'?' on':'')} onClick={()=>setTab('list')}>รายการใบกำกับ</div>
        <div className={'tab'+(tab==='a4'?' on':'')} onClick={()=>setTab('a4')}>ใบกำกับ A4</div>
        <div className={'tab'+(tab==='thermal'?' on':'')} onClick={()=>setTab('thermal')}>ใบเสร็จ Thermal</div>
        <div className={'tab'+(tab==='void'?' on':'')} style={{ color:'var(--rd)' }} onClick={()=>setTab('void')}>
          <Icon name="x-circle" size={13} style={{ marginRight:4 }}/>ยกเลิกใบเสร็จ
        </div>
      </div>

      {tab==='list' && (
        <Card title="ใบกำกับภาษีทั้งหมด" actions={
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
            <input type="date" className="fc" style={{ width:155 }} value={dateF} onChange={e=>setDateF(e.target.value)} />
            {dateF && <button className="btn bg2 bsm" onClick={()=>setDateF('')}>ล้าง</button>}
            <input type="text" className="fc" placeholder="ค้นหา…" style={{ width:175 }} value={search} onChange={e=>setSearch(e.target.value)} />
            <Button variant="bg2" size="sm" icon="download">Export CSV</Button>
          </div>
        }>
          <div className="tw"><table>
            <thead><tr>
              <th style={TH}>เลขที่</th><th style={TH}>ประเภท</th><th style={TH}>ลูกค้า</th><th style={TH}>วันที่</th>
              <th style={{ ...TH, textAlign:'right' }}>ส่วนลด</th><th style={{ ...TH, textAlign:'right' }}>ยอดรวม</th>
              <th style={TH}>ชำระ</th><th style={TH}>สถานะ</th><th style={TH}>จัดการ</th>
            </tr></thead>
            <tbody>
              {filtered.length===0?<tr><td colSpan="9" style={{ padding:'28px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
              :filtered.map(iv=>(
                <tr key={iv.id} style={{ borderBottom:'1px solid var(--bd)', opacity:iv.voided?.7:1 }}>
                  <td style={TD}><button onClick={()=>{setSelInv(iv);setTab('a4');}} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ac)', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, padding:0 }}>{iv.no}</button></td>
                  <td style={TD}><Badge kind={iv.type==='A4'?'wholesale':'online'}>{iv.type}</Badge></td>
                  <td style={{ ...TD, fontWeight:600, fontSize:13 }}>{iv.custName}</td>
                  <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{iv.dateDisplay}</span></td>
                  <td style={{ ...TD, textAlign:'right', color:'var(--am)' }}>{iv.discount>0?'-'+$(iv.discount):'—'}</td>
                  <td style={{ ...TD, textAlign:'right', fontWeight:700, color:iv.voided?'var(--t3)':'var(--gn)' }}>{$(iv.total)}</td>
                  <td style={TD}><span style={{ fontSize:12.5 }}>{{cash:'เงินสด',transfer:'โอนเงิน',credit:'เครดิต'}[iv.pay]||'—'}</span></td>
                  <td style={TD}><span className={'bx '+(iv.voided?'xr':'xg')}>{iv.voided?'ยกเลิก':'ชำระแล้ว'}</span></td>
                  <td style={TD}>
                    <div style={{ display:'flex', gap:5 }}>
                      <button onClick={()=>{setSelInv(iv);setTab('a4');}} style={{ fontSize:11.5, padding:'3px 8px', border:'1px solid var(--bd)', borderRadius:5, cursor:'pointer', background:'var(--abg)', color:'var(--ac)' }}>A4</button>
                      <button onClick={()=>{setSelInv(iv);setTab('thermal');}} style={{ fontSize:11.5, padding:'3px 8px', border:'1px solid var(--bd)', borderRadius:5, cursor:'pointer', background:'var(--sur)', color:'var(--t2)' }}>Thermal</button>
                      {!iv.voided && <button onClick={()=>{setVoidNo(iv.no);setVoidPreview(iv);setTab('void');}} style={{ fontSize:11.5, padding:'3px 8px', border:'1px solid rgba(208,48,48,.3)', borderRadius:5, cursor:'pointer', background:'var(--rbg)', color:'var(--rd)' }}>ยกเลิก</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Card>
      )}

      {tab==='a4' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap', padding:'12px 16px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
            <label style={{ fontSize:13, fontWeight:600 }}>เลขที่:</label>
            <select className="fc" style={{ width:300 }} value={selInv?.id||''} onChange={e=>setSelInv(invs.find(x=>x.id===Number(e.target.value))||null)}>
              <option value="">— เลือกใบกำกับ —</option>
              {active.map(iv=><option key={iv.id} value={iv.id}>{iv.no} · {iv.custName} · {$(iv.total)}</option>)}
            </select>
            {selInv && <span style={{ fontSize:12.5, color:'var(--t2)' }}>{selInv.dateDisplay}</span>}
            <Button variant="bp" size="sm" icon="printer" onClick={()=>toast('info','กำลังพิมพ์ A4…')}>พิมพ์</Button>
          </div>
          <div style={{ background:'#e8e7e2', borderRadius:'var(--r)', padding:'24px 0', overflowX:'auto' }}>
            <A4Content iv={selInv} />
          </div>
        </div>
      )}

      {tab==='thermal' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center', padding:'12px 16px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
            <label style={{ fontSize:13, fontWeight:600 }}>เลขที่:</label>
            <select className="fc" style={{ width:280 }} value={selInv?.id||''} onChange={e=>setSelInv(invs.find(x=>x.id===Number(e.target.value))||null)}>
              <option value="">— เลือกใบกำกับ —</option>
              {active.map(iv=><option key={iv.id} value={iv.id}>{iv.no} · {iv.custName}</option>)}
            </select>
            <Button variant="bp" size="sm" icon="printer" onClick={()=>toast('info','กำลังพิมพ์ Thermal…')}>พิมพ์ Thermal</Button>
          </div>
          {selInv ? (
            <div style={{ background:'#1a1826', borderRadius:16, padding:24, maxWidth:340, margin:'0 auto', color:'#e8e7f0' }}>
              <div style={{ textAlign:'center', marginBottom:14 }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#fff' }}>{co.name}</div>
                <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)', lineHeight:1.7 }}>{co.addr}</div>
                <div style={{ fontSize:10.5, color:'rgba(255,255,255,.4)' }}>เลขภาษี {co.tax}</div>
              </div>
              <div style={{ textAlign:'center', borderTop:'1px dashed rgba(255,255,255,.2)', borderBottom:'1px dashed rgba(255,255,255,.2)', padding:'8px 0', marginBottom:12 }}>
                <div style={{ fontSize:13.5, fontWeight:800, color:'#fff' }}>ใบกำกับภาษี / ใบเสร็จรับเงิน</div>
              </div>
              <div style={{ fontSize:11.5, marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'rgba(255,255,255,.5)' }}>เลขที่</span><span style={{ fontFamily:'var(--font-mono)', color:'var(--ac)', fontWeight:700 }}>{selInv.no}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'rgba(255,255,255,.5)' }}>ลูกค้า</span><span>{selInv.custName}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'rgba(255,255,255,.5)' }}>วันที่</span><span>{selInv.dateDisplay}</span></div>
              </div>
              <div style={{ borderTop:'1px dashed rgba(255,255,255,.2)', paddingTop:10, marginBottom:10 }}>
                {(selInv.items||[]).map((it,i)=>(
                  <div key={i} style={{ marginBottom:7 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:12.5 }}><span style={{ fontWeight:600 }}>{it.name}</span><span style={{ fontFamily:'var(--font-mono)', color:'rgba(255,255,255,.6)' }}>{Number(it.weight).toFixed(3)} KG</span></div>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginTop:2 }}><span style={{ color:'rgba(255,255,255,.4)' }}>{Number(it.weight).toFixed(3)} × ฿{it.price}</span><span style={{ color:'var(--gn)', fontWeight:700 }}>{$(it.weight*it.price)}</span></div>
                  </div>
                ))}
              </div>
              <div style={{ borderTop:'1px dashed rgba(255,255,255,.2)', paddingTop:10, fontSize:12 }}>
                {selInv.discount>0&&<div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'rgba(255,255,255,.5)' }}>ส่วนลด</span><span style={{ color:'var(--am)' }}>-{$(selInv.discount)}</span></div>}
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}><span style={{ color:'rgba(255,255,255,.5)' }}>VAT 7%</span><span style={{ color:'rgba(139,92,246,.9)' }}>{$(selInv.vat7)}</span></div>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, borderTop:'1px solid rgba(255,255,255,.2)', paddingTop:8 }}><span>ยอดรวม</span><span style={{ color:'var(--gn)' }}>{$(selInv.total)}</span></div>
              </div>
            </div>
          ) : <div className="nc nc-b">เลือกใบกำกับด้านบน</div>}
        </div>
      )}

      {tab==='void' && (
        <div>
          <div className="card" style={{ marginBottom:14, border:'1.5px solid rgba(208,48,48,.2)' }}>
            <div className="ch" style={{ background:'var(--rbg)' }}>
              <div><span className="ct-t" style={{ color:'var(--rd)' }}>ยกเลิกใบเสร็จ (Void Invoice)</span><div style={{ fontSize:12, color:'var(--t3)', marginTop:2 }}>การยกเลิกจะคืนสต็อกอัตโนมัติ</div></div>
            </div>
            <div style={{ padding:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:10, alignItems:'flex-end', marginBottom:12 }}>
                <div className="fg" style={{ margin:0 }}>
                  <label className="fl">เลขที่ใบกำกับที่ต้องการยกเลิก</label>
                  <input type="text" className="fc" value={voidNo} onChange={e=>{setVoidNo(e.target.value);setVoidPreview(null);}} placeholder="เช่น INV-202505-0002" />
                </div>
                <button className="btn bg2" onClick={()=>{ const f=invs.find(iv=>iv.no===voidNo&&!iv.voided); setVoidPreview(f||null); if(!f)toast('err',`ไม่พบ ${voidNo}`); }}>ค้นหา</button>
              </div>
              {voidPreview && (
                <div style={{ padding:14, background:'var(--rbg)', border:'1px solid rgba(208,48,48,.2)', borderRadius:'var(--rs)', marginBottom:12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px 16px', fontSize:12.5, marginBottom:10 }}>
                    <div><span style={{ color:'var(--t2)' }}>เลขที่:</span> <b style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{voidPreview.no}</b></div>
                    <div><span style={{ color:'var(--t2)' }}>ลูกค้า:</span> <b>{voidPreview.custName}</b></div>
                    <div><span style={{ color:'var(--t2)' }}>ยอดรวม:</span> <b style={{ color:'var(--gn)' }}>{$(voidPreview.total)}</b></div>
                  </div>
                  <div className="fg" style={{ margin:0 }}>
                    <label className="fl">เหตุผลการยกเลิก <span className="req">*</span></label>
                    <select className="fc" value={voidReason} onChange={e=>setVoidReason(e.target.value)}>
                      <option value="">— เลือกเหตุผล —</option>
                      <option>ลูกค้าต้องการอย่างย่อ</option><option>ข้อมูลผิดพลาด</option><option>ยกเลิกคำสั่งซื้อ</option><option>อื่นๆ</option>
                    </select>
                  </div>
                </div>
              )}
              <button onClick={()=>{ if(!voidPreview){toast('err','กรุณาค้นหาก่อน');return;} if(!voidReason){toast('err','กรุณาเลือกเหตุผล');return;} setVoidModal(voidPreview); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:13, borderRadius:'var(--rs)', background:voidPreview?'var(--rd)':'var(--s2)', color:voidPreview?'#fff':'var(--t3)', fontSize:14, fontWeight:700, cursor:voidPreview?'pointer':'default', border:'none', fontFamily:'inherit', marginTop:12 }}>
                <Icon name="x-circle" size={16} style={{ color:voidPreview?'#fff':'var(--t3)' }}/> ยืนยันยกเลิกใบเสร็จ
              </button>
            </div>
          </div>
          <Card title="ประวัติการยกเลิก">
            <div className="tw"><table>
              <thead><tr><th>เลขที่ใบกำกับ</th><th>ลูกค้า</th><th>วันที่บิล</th><th style={{textAlign:'right'}}>ยอดรวม</th><th>ยกเลิกเมื่อ</th><th>ผู้ยกเลิก</th><th>เหตุผล</th><th>สถานะสต็อก</th></tr></thead>
              <tbody>
                {invs.filter(iv=>iv.voided).length===0?<tr><td colSpan="8" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>ยังไม่มีรายการที่ถูกยกเลิก</td></tr>
                :invs.filter(iv=>iv.voided).map(iv=>(
                  <tr key={iv.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--rd)', fontWeight:700 }}>{iv.no}</span></td>
                    <td style={{ ...TD, fontWeight:600, fontSize:13 }}>{iv.custName}</td>
                    <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{iv.dateDisplay}</span></td>
                    <td style={{ ...TD, textAlign:'right', fontWeight:700 }}>{$(iv.total)}</td>
                    <td style={{ ...TD, fontSize:12, color:'var(--t2)' }}>{iv.voidedAt||'—'}</td>
                    <td style={{ ...TD, fontSize:13 }}>{iv.voidedBy||'—'}</td>
                    <td style={{ ...TD, fontSize:12.5, color:'var(--t2)' }}>{iv.voidReason||'—'}</td>
                    <td style={TD}><span className={'bx '+(iv.stockRestored?'xg':'xa')}>{iv.stockRestored?'คืนสต็อกแล้ว':'ยังไม่คืน'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </Card>
        </div>
      )}

      {voidModal && (
        <div className="ov">
          <div className="md" style={{ width:400 }}>
            <div style={{ padding:'20px 22px 0', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="x-circle" size={24}/></div>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--rd)', marginBottom:4 }}>ยกเลิกใบเสร็จ</div>
              <div style={{ fontSize:13, color:'var(--t2)', marginBottom:16 }}>ระบบจะคืนสต็อกอัตโนมัติ</div>
              <div style={{ background:'var(--rbg)', borderRadius:'var(--rs)', padding:'14px 16px', fontSize:13, textAlign:'left', marginBottom:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ color:'var(--t2)' }}>เลขที่</span><b style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{voidModal.no}</b></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ color:'var(--t2)' }}>ลูกค้า</span><b>{voidModal.custName}</b></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--t2)' }}>ยอดรวม</span><b style={{ color:'var(--gn)' }}>{$(voidModal.total)}</b></div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setVoidModal(null)}>ไม่</Button>
              <button onClick={doVoid} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                <Icon name="x-circle" size={15} style={{ color:'#fff' }}/> ยืนยันยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ STOCK MANAGEMENT ═══ */
function StockManage({ toast }) {
  const D = window.SP_DATA;
  const [tab, setTab]       = React.useState('balance');
  const [mvSub, setMvSub]   = React.useState('flat'); /* inner sub of movement: flat | byproduct */
  const [mvSearch, setMvSearch] = React.useState('');
  const [mvType, setMvType]   = React.useState('all');
  const [mvFrom, setMvFrom]   = React.useState('');
  const [mvTo, setMvTo]       = React.useState('');
  const [adjCode, setAdjCode] = React.useState('');
  const [adjQty, setAdjQty]   = React.useState('');
  const [adjReason, setAdjReason] = React.useState('สต็อกออกเอง / สิ้นสุด');
  const [adjType, setAdjType] = React.useState('other');
  const [adjNote, setAdjNote] = React.useState('');
  const [adjConfirm, setAdjConfirm] = React.useState(false);
  const [grns, setGrns]       = React.useState(() => window.SP_STATE.grnLogs);
  const [docModal, setDocModal] = React.useState(null);

  React.useEffect(() => { if (tab==='grn') setGrns([...window.SP_STATE.grnLogs]); }, [tab]);

  const $ = window.fmtMoney;

  /* filter ledger */
  const ledger = D.ledger.filter(l => {
    if (mvType !== 'all' && l.type !== mvType) return false;
    if (mvFrom && l.dateISO < mvFrom) return false;
    if (mvTo   && l.dateISO > mvTo)   return false;
    if (mvSearch) {
      const s = mvSearch.toLowerCase();
      return l.prod?.toLowerCase().includes(s) || l.code?.includes(s) || l.ref?.toLowerCase().includes(s);
    }
    return true;
  });

  const totalIn  = ledger.filter(l=>l.type==='in').reduce((s,l)=>s+l.w, 0);
  const totalOut = ledger.filter(l=>l.type==='out').reduce((s,l)=>s+l.w, 0);

  /* Group by product for "แยกตามสินค้า" */
  const byProd = {};
  ledger.forEach(l => {
    if (!byProd[l.code]) byProd[l.code] = { code:l.code, prod:l.prod, txns:[], totalIn:0, totalOut:0, lastBal:l.bal };
    byProd[l.code].txns.push(l);
    if (l.type==='in')  byProd[l.code].totalIn  += l.w;
    if (l.type==='out') byProd[l.code].totalOut += l.w;
    byProd[l.code].lastBal = l.bal;
  });
  const prodGroups = Object.values(byProd);

  /* Document link click */
  const openDoc = (ref, type) => {
    const isGRN = ref.startsWith('GRN');
    const isINV = ref.startsWith('INV');
    if (isGRN) {
      const grn = window.SP_STATE.grnLogs.find(g=>g.id===ref||g.no===ref);
      if (grn) setDocModal({ type:'grn', data:grn });
      else toast('info', `เอกสาร ${ref}`);
    } else if (isINV) {
      const inv = window.SP_STATE.invoices.find(i=>i.no===ref);
      if (inv) setDocModal({ type:'inv', data:inv });
      else toast('info', `เอกสาร ${ref}`);
    } else {
      toast('info', `${ref} · ${type}`);
    }
  };

  /* Shared column header styles */
  const TH = { padding:'8px 12px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)', background:'var(--s2)', whiteSpace:'nowrap' };
  const THR = { ...TH, textAlign:'right' };
  const TD = { padding:'10px 12px', borderBottom:'1px solid var(--bd)', verticalAlign:'middle' };
  const TDR = { ...TD, textAlign:'right' };

  const adjProd = D.products.find(p=>p.code===adjCode);
  const adjQtyNum = parseFloat(adjQty)||0;
  const newBal = adjProd ? Math.max(0, adjProd.stock - adjQtyNum) : 0;

  const doAdj = () => {
    if (!adjProd||adjQtyNum<=0) { toast('err','กรุณาเลือกสินค้าและปริมาณ'); return; }
    adjProd.stock = newBal;
    toast('ok', `ปรับสต็อก ${adjProd.name}: -${adjQtyNum} KG → คงเหลือ ${newBal.toFixed(3)} KG`);
    setAdjConfirm(false); setAdjCode(''); setAdjQty(''); setAdjNote('');
  };

  /* Filter/search bar for movement tab */
  const MvFilterBar = () => (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16, padding:'10px 14px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
      <div style={{ position:'relative' }}>
        <input className="fc" placeholder="ค้นหาสินค้า / เลขที่…" style={{ paddingLeft:30, width:200 }} value={mvSearch} onChange={e=>setMvSearch(e.target.value)} />
        <Icon name="search" size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
      </div>
      <select className="fc" style={{ width:150 }} value={mvType} onChange={e=>setMvType(e.target.value)}>
        <option value="all">— ทุกประเภท —</option>
        <option value="in">รับเข้า</option>
        <option value="out">ตัดออก</option>
      </select>
      <span style={{ fontSize:12, color:'var(--t2)', fontWeight:600 }}>วันที่:</span>
      <input type="date" className="fc" style={{ width:140 }} value={mvFrom} onChange={e=>setMvFrom(e.target.value)} />
      <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
      <input type="date" className="fc" style={{ width:140 }} value={mvTo} onChange={e=>setMvTo(e.target.value)} />
      {(mvFrom||mvTo||mvSearch||mvType!=='all') && <button className="btn bg2 bsm" onClick={()=>{setMvFrom('');setMvTo('');setMvSearch('');setMvType('all');}}>ล้าง</button>}
      <Button variant="bg2" size="sm" icon="download">Export CSV</Button>
    </div>
  );

  /* Summary cards for movement */
  const MvSummary = () => (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:18 }}>
      <div className="card" style={{ padding:'16px 18px' }}>
        <div style={{ fontSize:12, color:'var(--t2)', marginBottom:6 }}>รายการทั้งหมด</div>
        <div style={{ fontSize:26, fontWeight:800, color:'var(--ac)' }}>{ledger.length} <span style={{ fontSize:13, fontWeight:600 }}>รายการ</span></div>
      </div>
      <div className="card" style={{ padding:'16px 18px' }}>
        <div style={{ fontSize:12, color:'var(--t2)', marginBottom:6 }}>รับเข้ารวม</div>
        <div style={{ fontSize:26, fontWeight:800, color:'var(--gn)' }}>{totalIn.toFixed(3)} <span style={{ fontSize:13 }}>KG</span></div>
        <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>incl. Void return</div>
      </div>
      <div className="card" style={{ padding:'16px 18px' }}>
        <div style={{ fontSize:12, color:'var(--t2)', marginBottom:6 }}>ตัดออกรวม</div>
        <div style={{ fontSize:26, fontWeight:800, color:'var(--rd)' }}>{totalOut.toFixed(3)} <span style={{ fontSize:13 }}>KG</span></div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="tabs">
        <div className={'tab'+(tab==='balance'?' on':'')} onClick={()=>setTab('balance')}>รายงานสินค้าคงเหลือ</div>
        <div className={'tab'+(tab==='movement'?' on':'')} onClick={()=>setTab('movement')}>รายงานความเคลื่อนไหวสต็อก</div>
        <div className={'tab'+(tab==='adjust'?' on':'')} onClick={()=>setTab('adjust')}>การปรับปรุงสต็อก</div>
        <div className={'tab'+(tab==='grn'?' on':'')} onClick={()=>setTab('grn')}>รายงานรับเข้าสินค้า (GRN)</div>
      </div>

      {/* ── Tab: ยอดคงเหลือ ── */}
      {tab==='balance' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
            <StatCard icon="package"  iconTone="ac" label="สินค้าทั้งหมด"    value={D.products.length+' รายการ'} />
            <StatCard icon="check"    iconTone="gn" label="มีสต็อก"           value={D.products.filter(p=>p.stock>0).length+' รายการ'} />
            <StatCard icon="warehouse" iconTone="am" label="ใกล้หมด/หมด"     value={D.products.filter(p=>p.stock<p.min).length+' รายการ'} valueTone="am" />
            <StatCard icon="coin"     iconTone="gn" label="มูลค่าสต็อก"       value={'฿'+Math.round(D.products.reduce((s,p)=>s+p.stock*p.cost,0)/1000)+'k'} valueTone="gn" />
          </div>
          <Card title="ยอดคงเหลือสต็อก" actions={<Button variant="bg2" size="sm" icon="download">Export CSV</Button>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>ชื่อสินค้า</th><th style={TH}>หมวด</th>
                <th style={THR}>ราคาขาย/KG</th><th style={THR}>ราคาทุน/KG</th>
                <th style={TH}>คงเหลือ</th><th style={TH}>ขั้นต่ำ</th><th style={TH}>สถานะ</th><th style={THR}>มูลค่าสต็อก</th>
              </tr></thead>
              <tbody>{D.products.map(p=>(
                <tr key={p.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={TD}><span className="mono">{p.code}</span></td>
                  <td style={{ ...TD, fontWeight:600 }}>{p.name}</td>
                  <td style={TD}>{p.cat}</td>
                  <td style={TDR}>{$(p.sell)}</td>
                  <td style={{ ...TDR, color:'var(--t2)' }}>{$(p.cost)}</td>
                  <td style={{ ...TD, fontWeight:700 }}>{window.fmtKg(p.stock)}</td>
                  <td style={{ ...TD, color:'var(--t3)' }}>{window.fmtKg(p.min)}</td>
                  <td style={TD}><StockPill stock={p.stock} min={p.min}/></td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(p.stock*p.cost)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        </div>
      )}

      {/* ── Tab: ความเคลื่อนไหว ── */}
      {tab==='movement' && (
        <div>
          {/* Inner sub-tabs — exactly 2 */}
          <div style={{ display:'flex', gap:4, marginBottom:16, background:'var(--s2)', borderRadius:'var(--rs)', padding:4, width:'fit-content', border:'1px solid var(--bd)' }}>
            {[['flat','รายการทั้งหมด'],['byproduct','แยกตามสินค้า']].map(([id,label])=>(
              <button key={id} onClick={()=>setMvSub(id)}
                style={{ padding:'6px 16px', borderRadius:6, fontSize:13, fontWeight:mvSub===id?700:500, cursor:'pointer', border:'none', transition:'all .15s', fontFamily:'inherit', background:mvSub===id?'var(--ac)':'transparent', color:mvSub===id?'#fff':'var(--t2)', boxShadow:mvSub===id?'0 2px 8px rgba(59,91,219,.3)':'none' }}>
                {label}
              </button>
            ))}
          </div>

          <MvFilterBar />
          <MvSummary />

          {/* ── Flat list ── */}
          {mvSub==='flat' && (
            <Card title={`รายการทั้งหมด · ${ledger.length} รายการ`}>
              <div className="tw"><table>
                <thead><tr>
                  <th style={TH}>วันที่</th><th style={TH}>เวลา</th><th style={TH}>เอกสาร</th>
                  <th style={TH}>สินค้า</th><th style={THR}>เพิ่ม (KG)</th>
                  <th style={THR}>ลด (KG)</th><th style={THR}>จำนวน (KG)</th><th style={THR}>คงเหลือ</th>
                </tr></thead>
                <tbody>
                  {ledger.map((l,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{l.date}</span></td>
                      <td style={TD}><span style={{ fontSize:12.5, color:'var(--t3)' }}>{l.time}</span></td>
                      <td style={TD}>
                        <button onClick={()=>openDoc(l.ref, l.refType)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ac)', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, padding:0, display:'block', textAlign:'left', textDecoration:'underline' }}>{l.ref}</button>
                        <div style={{ fontSize:10.5, fontWeight:700, color:l.type==='in'?'var(--gn)':'var(--rd)', marginTop:1 }}>{l.refType}</div>
                      </td>
                      <td style={{ ...TD, fontWeight:600 }}>{l.prod}<br/><span className="mono" style={{ fontSize:10.5, color:'var(--t3)' }}>{l.code}</span></td>
                      <td style={{ ...TDR, color:'var(--gn)', fontWeight:700 }}>{l.type==='in'?l.w.toFixed(4):'—'}</td>
                      <td style={{ ...TDR, color:'var(--rd)', fontWeight:700 }}>{l.type==='out'?l.w.toFixed(4):'—'}</td>
                      <td style={{ ...TDR, fontWeight:700 }}>{l.w.toFixed(4)}</td>
                      <td style={TDR}>
                        <span style={{ padding:'3px 9px', borderRadius:100, fontSize:12, fontWeight:700, background:l.bal < (D.products.find(p=>p.code===l.code)?.min||0) ? 'var(--ambg)':'var(--gbg)', color:l.bal < (D.products.find(p=>p.code===l.code)?.min||0)?'var(--amt)':'var(--gt)' }}>{l.bal.toFixed(4)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </Card>
          )}

          {/* ── Grouped by product ── */}
          {mvSub==='byproduct' && (
            <div className="card" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
                <thead>
                  <tr style={{ background:'var(--s2)' }}>
                    <th style={{ ...TH, width:110 }}>วันที่</th>
                    <th style={{ ...TH, width:80 }}>เวลา</th>
                    <th style={TH}>เอกสาร</th>
                    <th style={{ ...THR, width:100 }}>เพิ่ม (KG)</th>
                    <th style={{ ...THR, width:100 }}>ลด (KG)</th>
                    <th style={{ ...THR, width:110 }}>จำนวน (KG)</th>
                    <th style={{ ...THR, width:110 }}>คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {prodGroups.length === 0 && (
                    <tr><td colSpan="7" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                  )}
                  {prodGroups.map(pg => {
                    const prod = D.products.find(p=>p.code===pg.code);
                    const isLow = pg.lastBal < (prod?.min||0);
                    return (
                      <React.Fragment key={pg.code}>
                        {/* Product header row */}
                        <tr style={{ background:'var(--s2)', borderTop:'2px solid var(--bd)', borderBottom:'1px solid var(--bd)' }}>
                          <td colSpan="2" style={{ padding:'10px 12px' }}>
                            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)', fontWeight:700 }}>{pg.code}</div>
                            <div style={{ fontSize:13.5, fontWeight:800, color:'var(--tx)', marginTop:1 }}>{pg.prod}</div>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ fontSize:12, color:'var(--t3)' }}>{pg.txns.length} เอกสาร</span>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>รับเข้า</div>
                            <div style={{ fontWeight:700, color:'var(--gn)', fontSize:13 }}>{pg.totalIn.toFixed(3)}</div>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>ตัดออก</div>
                            <div style={{ fontWeight:700, color:'var(--rd)', fontSize:13 }}>{pg.totalOut.toFixed(3)}</div>
                          </td>
                          <td></td>
                          <td style={{ padding:'10px 14px', textAlign:'right' }}>
                            <span style={{ padding:'5px 12px', borderRadius:100, fontSize:13, fontWeight:800, background:isLow?'var(--ambg)':'var(--gbg)', color:isLow?'var(--amt)':'var(--gt)' }}>
                              {pg.lastBal.toFixed(3)} KG
                            </span>
                          </td>
                        </tr>
                        {/* Transaction rows */}
                        {pg.txns.map((l,i)=>(
                          <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                            <td style={{ padding:'9px 12px', fontSize:12.5, color:'var(--t2)' }}>{l.date}</td>
                            <td style={{ padding:'9px 12px', fontSize:12.5, color:'var(--t3)' }}>{l.time}</td>
                            <td style={{ padding:'9px 12px' }}>
                              <button onClick={()=>openDoc(l.ref, l.refType)}
                                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ac)', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, padding:0, display:'block', textAlign:'left', textDecoration:'underline' }}>{l.ref}</button>
                              <div style={{ fontSize:10.5, fontWeight:700, color:l.type==='in'?'var(--gn)':'var(--rd)', marginTop:1 }}>{l.refType}</div>
                            </td>
                            <td style={{ padding:'9px 12px', textAlign:'right', color:'var(--gn)', fontWeight:700 }}>{l.type==='in'?l.w.toFixed(4):'—'}</td>
                            <td style={{ padding:'9px 12px', textAlign:'right', color:'var(--rd)', fontWeight:700 }}>{l.type==='out'?l.w.toFixed(4):'—'}</td>
                            <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700 }}>{l.w.toFixed(4)}</td>
                            <td style={{ padding:'9px 14px', textAlign:'right' }}>
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:12.5, fontWeight:700, color:l.bal < (prod?.min||0)?'var(--am)':'var(--tx)' }}>{l.bal.toFixed(4)}</span>
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: ปรับปรุงสต็อก ── */}
      {tab==='adjust' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18 }}>
          <Card title="ปรับปรุงสต็อก">
            <div className="cb">
              <div className="nc nc-a" style={{ marginBottom:16 }}>การปรับสต็อกจะบันทึกใน log ความเคลื่อนไหว — ใช้เฉพาะกรณีที่มีความแตกต่างจากยอดจริง</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <Field label="สินค้าที่ต้องการปรับ" required>
                  <select className="fc" value={adjCode} onChange={e=>setAdjCode(e.target.value)}>
                    <option value="">— เลือกสินค้า —</option>
                    {D.products.map(p=><option key={p.code} value={p.code}>{p.name} ({p.stock.toFixed(3)} KG)</option>)}
                  </select>
                </Field>
                <Field label="ประเภทการปรับ" required>
                  <select className="fc" value={adjType} onChange={e=>setAdjType(e.target.value)}>
                    <option value="other">สต็อกออกเอง / สิ้นสุด</option>
                    <option value="expired">หมดอายุ</option>
                    <option value="damage">เสียหาย</option>
                    <option value="recount">นับสต็อกใหม่</option>
                  </select>
                </Field>
                <Field label="ปริมาณที่ปรับ (KG)" required>
                  <input type="number" className="fc" min="0" step="0.001" value={adjQty} onChange={e=>setAdjQty(e.target.value)} placeholder="0.000" />
                </Field>
                <Field label="เหตุผล" required>
                  <select className="fc" value={adjReason} onChange={e=>setAdjReason(e.target.value)}>
                    <option>สต็อกออกเอง / สิ้นสุด</option><option>หมดอายุ</option><option>เสียหาย</option><option>ผิดพลาดจากการนับ</option><option>อื่นๆ</option>
                  </select>
                </Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="หมายเหตุ"><input type="text" className="fc" value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="บันทึกเพิ่มเติม…" /></Field>
                </div>
              </div>
              <button onClick={()=>{ if(!adjProd||adjQtyNum<=0){toast('err','กรุณาเลือกสินค้าและปริมาณ');return;} setAdjConfirm(true); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:13, borderRadius:'var(--rs)', background:'var(--ac)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit', marginTop:8 }}>
                ✓ บันทึกการปรับสต็อก
              </button>
            </div>
          </Card>
          {adjProd && adjQtyNum>0 && (
            <Card title="ตัวอย่างผลลัพธ์">
              <div className="cb">
                <div style={{ fontSize:13.5, fontWeight:700, marginBottom:4 }}>{adjProd.name}</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)', marginBottom:14 }}>{adjProd.code}</div>
                {[['สต็อกปัจจุบัน', window.fmtKg(adjProd.stock), null],['ปรับลด', '-'+window.fmtKg(adjQtyNum), 'var(--rd)'],['ยอดหลังปรับ', window.fmtKg(newBal), newBal<(adjProd.min||0)?'var(--am)':'var(--gn)']].map(([l,v,c],i,arr)=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:i<arr.length-1?'1px solid var(--bd)':'none', fontWeight:i===arr.length-1?800:400, fontSize:i===arr.length-1?14:13 }}>
                    <span style={{ color:'var(--t2)' }}>{l}</span><span style={{ color:c||'var(--tx)', fontWeight:700 }}>{v}</span>
                  </div>
                ))}
                {newBal < (adjProd.min||0) && <div className="nc nc-a" style={{ marginTop:10, fontSize:12 }}>ต่ำกว่าขั้นต่ำ {window.fmtKg(adjProd.min)}</div>}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: GRN ── */}
      {tab==='grn' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            <StatCard icon="file-text" iconTone="ac" label="เอกสาร GRN" value={grns.length+' ฉบับ'} />
            <StatCard icon="package" iconTone="gn" label="แพ็คทั้งหมด" value={grns.reduce((s,g)=>s+g.totalPacks,0)+' แพ็ค'} />
            <StatCard icon="coin" iconTone="gn" label="มูลค่ารวม" value={$(grns.reduce((s,g)=>s+g.totalValue,0))} valueTone="gn" />
          </div>
          <Card title="สรุปรายเอกสาร GRN" style={{ marginBottom:14 }}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>เลขที่ GRN</th><th style={TH}>วันที่รับ</th><th style={TH}>เลขที่ PO</th>
                <th style={{ ...TH, textAlign:'center' }}>แพ็ค</th><th style={THR}>น้ำหนักรวม</th>
                <th style={THR}>มูลค่า</th><th style={TH}>ผู้รับ</th>
              </tr></thead>
              <tbody>{grns.map(g=>(
                <tr key={g.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={TD}><button onClick={()=>setDocModal({type:'grn',data:g})} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ac)', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, padding:0, textDecoration:'underline' }}>{g.id}</button></td>
                  <td style={{ ...TD, fontSize:12.5, color:'var(--t2)' }}>{g.dateDisplay}</td>
                  <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12 }}>{g.poNo||'—'}</td>
                  <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{g.totalPacks}</td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--ac)' }}>{window.fmtKg(g.totalWeight)}</td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(g.totalValue)}</td>
                  <td style={{ ...TD, fontSize:13 }}>{g.receiver}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
          <Card title="รายละเอียดสินค้าในเอกสาร GRN">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>เลขที่ GRN</th><th style={TH}>วันที่</th><th style={TH}>รหัส</th><th style={TH}>สินค้า</th>
                <th style={TH}>แพ็ค</th><th style={THR}>น้ำหนัก</th><th style={THR}>ราคาทุน/KG</th>
                <th style={TH}>ภาษี</th><th style={THR}>มูลค่า</th>
              </tr></thead>
              <tbody>{grns.flatMap(g=>g.items.map((it,i)=>({...it,grnId:g.id,date:g.dateDisplay,key:`${g.id}-${i}`}))).map(r=>(
                <tr key={r.key} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)', fontWeight:700 }}>{r.grnId}</span></td>
                  <td style={{ ...TD, fontSize:12, color:'var(--t2)' }}>{r.date}</td>
                  <td style={TD}><span className="mono">{r.code}</span></td>
                  <td style={{ ...TD, fontWeight:600 }}>{r.name}</td>
                  <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--t3)' }}>{r.packNo}</td>
                  <td style={{ ...TDR, fontWeight:700 }}>{Number(r.weight).toFixed(3)}</td>
                  <td style={{ ...TDR, color:'var(--t2)' }}>{$(r.cost)}</td>
                  <td style={TD}><span className={'bx '+(r.tax==='vat7'?'xb':'xx')} style={{ fontSize:10.5 }}>{r.tax==='vat7'?'VAT 7%':'Non VAT'}</span></td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(r.value)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        </div>
      )}

      {/* Adjust confirm */}
      {adjConfirm && (
        <div className="ov">
          <div className="md" style={{ width:360 }}>
            <div style={{ padding:'20px 22px 0', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--ambg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--am)' }}><Icon name="warehouse" size={24}/></div>
              <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>ยืนยันการปรับสต็อก</div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'12px 14px', fontSize:13, textAlign:'left', margin:'14px 0 4px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'var(--t2)' }}>สินค้า</span><b>{adjProd?.name}</b></div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}><span style={{ color:'var(--t2)' }}>ปรับลด</span><b style={{ color:'var(--rd)' }}>-{window.fmtKg(adjQtyNum)}</b></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--t2)' }}>คงเหลือ</span><b style={{ color:'var(--gn)' }}>{window.fmtKg(newBal)}</b></div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setAdjConfirm(false)}>ยกเลิก</Button>
              <button onClick={doAdj} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--ac)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>✓ ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Doc detail modal */}
      {docModal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setDocModal(null)}>
          <div className="md" style={{ width:600 }}>
            <div className="md-h">
              <span className="md-t">{docModal.type==='grn'?'เอกสารรับสินค้า (GRN)':'ใบกำกับภาษี'} · {docModal.data?.id||docModal.data?.no}</span>
              <div className="md-x" onClick={()=>setDocModal(null)}>✕</div>
            </div>
            <div className="md-b">
              {docModal.type==='grn' && docModal.data && (
                <div style={{ fontSize:13 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px', marginBottom:14 }}>
                    {[['เลขที่ GRN', docModal.data.id],['วันที่รับ', docModal.data.dateDisplay],['เลขที่ PO', docModal.data.poNo||'—'],['ผู้รับ', docModal.data.receiver],['จำนวนแพ็ค', docModal.data.totalPacks+' แพ็ค'],['น้ำหนักรวม', window.fmtKg(docModal.data.totalWeight)]].map(([l,v])=>(
                      <div key={l}><span style={{ color:'var(--t2)' }}>{l}: </span><b>{v}</b></div>
                    ))}
                  </div>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                    <thead><tr style={{ background:'var(--s2)' }}><th style={TH}>รหัส</th><th style={TH}>สินค้า</th><th style={THR}>น้ำหนัก</th><th style={THR}>ราคาทุน</th><th style={THR}>มูลค่า</th></tr></thead>
                    <tbody>{(docModal.data.items||[]).map((it,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                        <td style={TD}><span className="mono">{it.code}</span></td>
                        <td style={{ ...TD, fontWeight:600 }}>{it.name}</td>
                        <td style={TDR}>{Number(it.weight).toFixed(3)}</td>
                        <td style={TDR}>{$(it.cost)}</td>
                        <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(it.value)}</td>
                      </tr>
                    ))}</tbody>
                    <tfoot><tr style={{ background:'var(--s2)', fontWeight:700 }}>
                      <td colSpan="2" style={TH}>รวม</td>
                      <td style={THR}>{window.fmtKg(docModal.data.totalWeight)}</td>
                      <td></td>
                      <td style={{ ...THR, color:'var(--gn)' }}>{$(docModal.data.totalValue)}</td>
                    </tr></tfoot>
                  </table>
                </div>
              )}
              {docModal.type==='inv' && docModal.data && (
                <div style={{ fontSize:13 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px', marginBottom:14 }}>
                    {[['เลขที่', docModal.data.no],['วันที่', docModal.data.dateDisplay],['ลูกค้า', docModal.data.custName],['สถานะ', docModal.data.voided?'ยกเลิก':'ชำระแล้ว']].map(([l,v])=>(
                      <div key={l}><span style={{ color:'var(--t2)' }}>{l}: </span><b>{v}</b></div>
                    ))}
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'1px solid var(--bd)', fontWeight:800, fontSize:15 }}>
                    <span>ยอดรวม</span><span style={{ color:'var(--gn)' }}>{$(docModal.data.total)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="md-f"><Button variant="bg2" onClick={()=>setDocModal(null)}>ปิด</Button></div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ OTHER SCREENS ═══ */
function Users({ toast }) {
  const D = window.SP_DATA;
  const [users, setUsers] = React.useState(D.users);
  const [showModal, setShowModal] = React.useState(false);
  const [form, setForm] = React.useState({ name:'', user:'', role:'Staff' });
  const addUser = () => {
    if (!form.name||!form.user) { toast('err','กรุณากรอกชื่อและ Username'); return; }
    setUsers(p=>[...p,{ id:Date.now(),...form,status:'active',last:'—' }]);
    setShowModal(false); setForm({ name:'',user:'',role:'Staff' });
    toast('ok', `เพิ่มผู้ใช้ ${form.name} เรียบร้อย`);
  };
  const $ = window.fmtMoney;
  return (
    <div>
      <Card title="จัดการผู้ใช้งาน" actions={<Button variant="bp" size="sm" onClick={()=>setShowModal(true)}>+ เพิ่มผู้ใช้</Button>}>
        <div className="tw"><table>
          <thead><tr><th>ชื่อ</th><th>Username</th><th>สิทธิ์</th><th>สถานะ</th><th>เข้าใช้ล่าสุด</th><th></th></tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{ borderBottom:'1px solid var(--bd)' }}>
              <td style={{ padding:'11px 14px' }}><div style={{ display:'flex', alignItems:'center', gap:10 }}><div style={{ width:32, height:32, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0 }}>{u.name.slice(0,2)}</div><span style={{ fontWeight:600 }}>{u.name}</span></div></td>
              <td className="mono">{u.user}</td>
              <td><span className={'bx '+(u.role==='Administrator'?'xb':'xx')}>{u.role}</span></td>
              <td><span className={'bx '+(u.status==='active'?'xg':'xr')}>{u.status==='active'?'ใช้งาน':'ระงับ'}</span></td>
              <td style={{ fontSize:12, color:'var(--t3)' }}>{u.last}</td>
              <td style={{ padding:'11px 14px' }}><button onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,status:x.status==='active'?'inactive':'active'}:x))} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--bd)', borderRadius:6, cursor:'pointer', background:'var(--sur)', color:'var(--t2)', fontFamily:'inherit' }}>{u.status==='active'?'ระงับ':'เปิดใช้'}</button></td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>
      {showModal && <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}><div className="md" style={{ width:440 }}><div className="md-h"><span className="md-t">เพิ่มผู้ใช้งานใหม่</span><div className="md-x" onClick={()=>setShowModal(false)}>✕</div></div><div className="md-b"><div className="gr c2"><Field label="ชื่อ-นามสกุล" required><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></Field><Field label="Username" required><input className="fc" value={form.user} onChange={e=>setForm(f=>({...f,user:e.target.value}))} /></Field></div><Field label="สิทธิ์"><select className="fc" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}><option>Administrator</option><option>Staff</option></select></Field><div className="nc nc-b" style={{ fontSize:12.5 }}>รหัสผ่านเริ่มต้น: <b>1234</b></div></div><div className="md-f"><Button variant="bg2" onClick={()=>setShowModal(false)}>ยกเลิก</Button><Button variant="bp" icon="check" onClick={addUser}>บันทึก</Button></div></div></div>}
    </div>
  );
}

function Settings({ toast }) {
  const D = window.SP_DATA;
  const [co, setCo] = React.useState({...D.company});
  return (
    <div style={{ maxWidth:700 }}>
      <Card title="ข้อมูลบริษัท / หัวใบกำกับภาษี"><div className="cb"><div className="gr c2">
        <div style={{ gridColumn:'1/-1' }}><Field label="ชื่อบริษัท" required><input className="fc" value={co.name} onChange={e=>setCo(c=>({...c,name:e.target.value}))} /></Field></div>
        <div style={{ gridColumn:'1/-1' }}><Field label="ที่อยู่"><textarea className="fc" rows="2" value={co.addr} onChange={e=>setCo(c=>({...c,addr:e.target.value}))} style={{ resize:'vertical' }} /></Field></div>
        <Field label="เลขผู้เสียภาษี"><input className="fc" value={co.tax} onChange={e=>setCo(c=>({...c,tax:e.target.value}))} style={{ fontFamily:'var(--font-mono)' }} /></Field>
        <Field label="เบอร์โทร" optional><input className="fc" value={co.tel} onChange={e=>setCo(c=>({...c,tel:e.target.value}))} /></Field>
      </div></div></Card>
      <Card title="การตั้งค่าระบบ" style={{ marginTop:16 }}><div className="cb"><div className="gr c2">
        <Field label="อัตรา VAT (%)"><input className="fc" type="number" value={co.vat} onChange={e=>setCo(c=>({...c,vat:e.target.value}))} /></Field>
        <Field label="รูปแบบวันที่"><select className="fc"><option>พ.ศ. (Buddhist Era)</option><option>ค.ศ.</option></select></Field>
      </div></div></Card>
      <div style={{ marginTop:16, display:'flex', justifyContent:'flex-end', gap:10 }}>
        <Button variant="bg2">ยกเลิก</Button>
        <Button variant="bp" icon="check" onClick={()=>toast('ok','บันทึกการตั้งค่าเรียบร้อย')}>บันทึกการตั้งค่า</Button>
      </div>
    </div>
  );
}

function Products() {
  const D = window.SP_DATA;
  return (
    <Card title="รายการสินค้า" actions={<div style={{ display:'flex', gap:8 }}><Button variant="bg2" size="sm" icon="download">Import CSV</Button><Button variant="bp" size="sm">+ เพิ่มสินค้า</Button></div>}>
      <div className="tw"><table>
        <thead><tr><th>รหัส</th><th>ชื่อสินค้า</th><th>หมวด</th><th style={{textAlign:'right'}}>ราคาขาย/KG</th><th style={{textAlign:'right'}}>ราคาทุน/KG</th><th>คงเหลือ</th><th>ภาษี</th></tr></thead>
        <tbody>{D.products.map(p=>(
          <tr key={p.id} style={{ borderBottom:'1px solid var(--bd)' }}>
            <td className="mono">{p.code}</td><td style={{ fontWeight:600 }}>{p.name}</td><td>{p.cat}</td>
            <td style={{ textAlign:'right' }}>{window.fmtMoney(p.sell)}</td>
            <td style={{ textAlign:'right', color:'var(--t2)' }}>{window.fmtMoney(p.cost)}</td>
            <td><StockPill stock={p.stock} min={p.min}/></td>
            <td>{p.tax==='vat7'?<Badge kind="online">VAT 7%</Badge>:<Badge kind="sample">Non VAT</Badge>}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
}

function Customers() {
  const D = window.SP_DATA;
  return (
    <Card title="รายการลูกค้า" actions={<div style={{ display:'flex', gap:8 }}><Button variant="bg2" size="sm" icon="download">Import CSV</Button><Button variant="bp" size="sm">+ เพิ่มลูกค้า</Button></div>}>
      <div className="tw"><table>
        <thead><tr><th>รหัส</th><th>ชื่อลูกค้า</th><th>ประเภท</th><th>เลขผู้เสียภาษี</th><th>เบอร์โทร</th></tr></thead>
        <tbody>{D.customers.map(c=>(
          <tr key={c.id} style={{ borderBottom:'1px solid var(--bd)' }}>
            <td className="mono" style={{ color:'var(--t2)' }}>{c.code}</td>
            <td style={{ fontWeight:600 }}>{c.name}</td>
            <td><Badge kind={c.type}/></td>
            <td className="mono">{c.tax||'—'}</td>
            <td style={{ color:'var(--t2)', fontSize:13 }}>{c.tel||'—'}</td>
          </tr>
        ))}</tbody>
      </table></div>
    </Card>
  );
}

function Placeholder({ title }) {
  return (
    <Card><div style={{ padding:'56px 24px', textAlign:'center' }}>
      <div style={{ width:56, height:56, borderRadius:14, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', color:'var(--t3)' }}><Icon name="bar-chart" size={26}/></div>
      <div style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>{title}</div>
      <div style={{ fontSize:13, color:'var(--t3)', maxWidth:360, margin:'0 auto', lineHeight:1.7 }}>หน้านี้มีอยู่ในผลิตภัณฑ์จริง แต่ไม่ได้รวมไว้ใน UI kit ตัวอย่างนี้</div>
    </div></Card>
  );
}

Object.assign(window, { InvoiceList, StockManage, Users, Settings, Products, Customers, Placeholder });
