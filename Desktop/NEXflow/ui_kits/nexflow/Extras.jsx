/* NEXflow UI Kit — Extras: InvoiceList, StockManage (with grouped movement), Users, Settings, Products, Customers */

/* ── Shared pagination utilities (used by all list-heavy components) ── */
const PAGE_SIZE_OPTIONS = [25, 50, 100];

function usePagination(items, initialPageSize) {
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(initialPageSize || 20);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  // reset to page 1 whenever dataset or page size changes
  React.useEffect(() => { setPage(1); }, [total, pageSize]);
  const slice = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { slice, page: safePage, totalPages, setPage, total, pageSize, setPageSize };
}

function Paginator({ page, totalPages, setPage, total, pageSize, setPageSize, noun = 'รายการ', pageSizeOptions = PAGE_SIZE_OPTIONS }) {
  const [, t] = useLang();
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to   = Math.min(page * pageSize, total);
  const bs = (active, disabled) => ({
    padding: '3px 10px', minWidth: 32, borderRadius: 'var(--r4)',
    border: '1px solid ' + (active ? 'var(--ac)' : 'var(--b2)'),
    background: active ? 'var(--ac)' : disabled ? 'var(--s2)' : 'var(--sur)',
    color: active ? '#fff' : disabled ? 'var(--t3)' : 'var(--tx)',
    fontWeight: active ? 700 : 500, fontSize: 12, cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'inherit', transition: 'all .12s',
  });
  let pages = [];
  if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
  else {
    pages = [1];
    if (page > 3) pages.push('⬦');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('⬦');
    pages.push(totalPages);
  }
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 16px', background:'var(--s2)', borderTop:'1px solid var(--bd)', flexWrap:'wrap', gap:8 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:12, color:'var(--t2)' }}>{from}–{to} <span style={{ color:'var(--t3)' }}>จาก</span> {total} {noun}</span>
        {setPageSize && (
          <select value={pageSize} onChange={e=>setPageSize(Number(e.target.value))}
            style={{ fontSize:12, padding:'3px 8px', borderRadius:'var(--r4)', border:'1px solid var(--b2)', background:'var(--sur)', color:'var(--tx)', fontFamily:'inherit', cursor:'pointer' }}>
            {pageSizeOptions.map(n => <option key={n} value={n}>{n} / {t('page_per_page')||'หน้า'}</option>)}
          </select>
        )}
      </div>
      {totalPages > 1 && (
        <div style={{ display:'flex', gap:3, alignItems:'center' }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} style={bs(false, page===1)}>⬹</button>
          {pages.map((p, i) => typeof p === 'number'
            ? <button key={i} onClick={() => setPage(p)} style={bs(p===page, false)}>{p}</button>
            : <span key={i} style={{ padding:'0 3px', color:'var(--t3)', fontSize:11 }}>⬦</span>
          )}
          <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} style={bs(false, page===totalPages)}>⬺</button>
        </div>
      )}
    </div>
  );
}

/* ═══ INVOICE LIST ═══ */
function InvoiceList({ toast }) {
  const [tab, setTab] = React.useState('list');
  const [search, setSearch] = React.useState('');
  const [dateFrom, setDateFrom] = React.useState(() => window.toLocalISODate());
  const [dateTo,   setDateTo]   = React.useState(() => window.toLocalISODate());
  const [selInv, setSelInv] = React.useState(null);
  const [voidNo, setVoidNo] = React.useState('');
  const [voidPreview, setVoidPreview] = React.useState(null);
  const [voidReason, setVoidReason] = React.useState('');
  const [voidModal, setVoidModal] = React.useState(null);
  const [voidDetail, setVoidDetail] = React.useState(null);
  const [a4Modal, setA4Modal] = React.useState(null);       // A4 preview modal
  const [issueINVModal, setIssueINVModal] = React.useState(null); // Manual INV issuance
  const [amendModal, setAmendModal] = React.useState(null);       // Cancel/amend INV → CN/DN
  const [tivModal, setTivModal] = React.useState(null);           // TIV abbreviated invoice modal
  const [auditLog, setAuditLog] = React.useState(() => window.SP_STATE.auditLog || []);
  const [invs, setInvs] = React.useState(() => window.SP_STATE.invoices);
  const co = window.SP_DATA.company;
  /* ── pagination state for each tab ── */
  const INV_PAGE_SIZE = 25;
  const [tivPage,   setTivPage]   = React.useState(1);
  const [voidPage,  setVoidPage]  = React.useState(1);
  const [auditPage, setAuditPage] = React.useState(1);
  React.useEffect(() => { setTivPage(1); }, [search, dateFrom, dateTo]);
  React.useEffect(() => { setAuditPage(1); }, [tab]);

  const refresh = () => setInvs([...window.SP_STATE.invoices]);

  /* โหลด audit + invoices จาก DB เมื่อเปิด tab audit หรือ list */
  React.useEffect(() => {
    refresh();
    if (tab === 'audit' && window.SP_API) {
      window.SP_API.reloadAudit().then(logs => {
        window.SP_STATE.auditLog = logs;
        setAuditLog(logs);
      }).catch(() => setAuditLog(window.SP_STATE.auditLog || []));
    }
    if ((tab === 'list' || tab === 'daily' || tab === 'void') && window.SP_API) {
      window.SP_API.reloadInvoices().then(() => refresh()).catch(() => {});
    }
  }, [tab]);

  const filtered = invs.filter(iv =>
    (!dateFrom || iv.date >= dateFrom) &&
    (!dateTo   || iv.date <= dateTo) &&
    (!search || iv.no.includes(search) || (iv.custName||'').includes(search))
  );
  const active = invs.filter(iv => !iv.voided);

  const doVoid = async () => {
    const iv = voidModal; if (!iv) return;
    if (!voidReason) { toast('err', 'กรุณาเลือกเหตุผลการยกเลิก'); return; }
    const voidedAt = window.fmtDate() + ' ' + new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'});
    const st       = window.SP_STATE;
    const currentUser = window.SP_DATA?.user?.name || 'Admin';
    const isReplace  = voidReason === 'ออกใบทดแทน';
    const markVoided = (id, withStock = !isReplace) => st.invoices = st.invoices.map(x =>
      x.id===id ? { ...x, voided:true, status:'voided', voidedAt, voidedBy:currentUser, voidReason, stockRestored:withStock } : x
    );

    /* หา linked invoice (TIV ↔ INV) */
    const linkedTivNo = iv.type==='A4' ? iv.thermalNo : null;
    const linkedInvNo = iv.type!=='A4' ? iv.fullInvNo : null;
    const linkedTiv   = linkedTivNo ? st.invoices.find(x=>x.no===linkedTivNo&&!x.voided) : null;
    const linkedInv   = linkedInvNo ? st.invoices.find(x=>x.no===linkedInvNo&&!x.voided) : null;

    /* ── บันทึกลง DB ── */
    if (window.SP_API) {
      try {
        /* void หลัก (restore_stock เฉพาะ TIV ยกเว้นกรณีออกใบทดแทน) */
        await window.SP_API.voidInvoice(iv.id, {
          voided_by:     currentUser,
          void_reason:   voidReason,
          restore_stock: iv.type !== 'A4' && !isReplace,
        });
        await window.SP_API.logAudit('CANCEL_INVOICE', iv.no, null, voidReason);
        markVoided(iv.id);

        /* void linked ถ้ามี */
        if (linkedTiv) {
          await window.SP_API.voidInvoice(linkedTiv.id, { voided_by:currentUser, void_reason:voidReason, restore_stock:!isReplace });
          markVoided(linkedTiv.id);
        }
        if (linkedInv) {
          await window.SP_API.voidInvoice(linkedInv.id, { voided_by:currentUser, void_reason:voidReason, restore_stock:false });
          markVoided(linkedInv.id, false);
        }

        const logs = await window.SP_API.reloadAudit();
        st.auditLog = logs; setAuditLog(logs);
        await window.SP_API.reloadProducts();

        refresh(); setVoidModal(null); setVoidNo(''); setVoidPreview(null); setVoidReason('');
        const linked = linkedTiv||linkedInv;
        toast('ok', isReplace
          ? `ยกเลิก ${iv.no}${linked?' + '+linked.no:''} (ออกใบทดแทน) — บันทึกลง DB แล้ว`
          : `ยกเลิก ${iv.no}${linked?' + '+linked.no:''} บันทึกลง DB แล้ว — คืนสต็อกเรียบร้อย`);
        /* แสดงใบยกเลิกอัตโนมัติ (TIV ที่ไม่มี INV) */
        if (iv.type !== 'A4' && !linkedInv) {
          const voidedTiv = st.invoices.find(x => x.id === iv.id) || { ...iv, voided:true, voidedAt, voidedBy:currentUser, voidReason };
          setTivModal(voidedTiv);
        }
        return;
      } catch (err) {
        toast('err', `ยกเลิกไม่สำเร็จ: ${err.message}`);
        return;
      }
    }

    /* fallback mock */
    markVoided(iv.id);
    if (linkedTiv) markVoided(linkedTiv.id);
    if (linkedInv) markVoided(linkedInv.id);
    /* คืนสต็อก TIV ใน SP_DATA.products (mock) */
    const stockDoc = iv.type!=='A4' ? iv : linkedTiv;
    if (stockDoc?.items?.length) {
      stockDoc.items.forEach(it => {
        const prod = window.SP_DATA.products.find(p => p.code === it.code);
        if (prod) prod.stock = (Number(prod.stock)||0) + Number(it.weight||0);
      });
    }
    if (window.logAudit) window.logAudit('CANCEL_INVOICE', iv.no, null, voidReason);
    setAuditLog([...st.auditLog]);
    refresh(); setVoidModal(null); setVoidNo(''); setVoidPreview(null); setVoidReason('');
    const linked2 = linkedTiv||linkedInv;
    toast('ok', isReplace
      ? `ยกเลิก ${iv.no}${linked2?' + '+linked2.no:''} (ออกใบทดแทน) — ไม่คืนสต็อก`
      : `ยกเลิกใบกำกับ ${iv.no}${linked2?' + '+linked2.no:''} เรียบร้อย — คืนสต็อกแล้ว`);
    /* แสดงใบยกเลิกอัตโนมัติ (TIV ที่ไม่มี INV) */
    if (iv.type !== 'A4' && !linkedInv) {
      const voidedTiv = st.invoices.find(x => x.id === iv.id) || { ...iv, voided:true, voidedAt, voidedBy:currentUser, voidReason };
      setTivModal(voidedTiv);
    }
  };

  const $ = window.fmtMoney;
  const fmtVoidDate = v => {
    if (!v) return '—';
    if (String(v).includes('T') || String(v).includes('Z')) {
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
  const TH  = { padding:'9px 14px', textAlign:'left',  fontSize:11.5, fontWeight:800, color:'#0f172a', borderBottom:'2px solid #475569', background:'#f1f5f9', whiteSpace:'nowrap' };
  const THR = { ...TH, textAlign:'right' };
  const TD  = { padding:'11px 14px', borderBottom:'1px solid var(--bd)', verticalAlign:'middle' };
  const TDR = { ...TD, textAlign:'right' };

  const A4Content = ({ iv }) => {
    if (!iv) return <div className="nc nc-b">เลือกใบกำกับด้านบน</div>;
    const cust    = window.SP_DATA.customers.find(c => c.id === iv.custId);
    const isPrinted = (iv.printCount || 0) > 0;
    const copyLabel = iv.voided ? 'ยกเลิก' : isPrinted ? 'สำเนา' : 'ต้นฉบับ';
    const _branch = iv.custBranch || cust?.branch || 'head';
    const branchLabel = (!_branch || _branch === 'head') ? 'สำนักงานใหญ่' : _branch;
    const grossSale = Number(iv.grossSale || iv.netSale || iv.total || 0);
    const discount  = Number(iv.discount || 0);
    const afterDisc = grossSale - discount;
    const vatAmt    = Number(iv.vat7 || 0);
    const vatBase   = Number(iv.vatBase || (afterDisc - vatAmt) || 0);
    const total     = Number(iv.total || afterDisc);

    /* accent colors */
    const ACC = '#1a4fa0';
    const ACC_LIGHT = '#e8eef8';

    /* styles */
    const B = { border:'1px solid #ccc' };
    const TH = { padding:'8px 10px', background:ACC, color:'#fff', fontWeight:700, fontSize:11.5, borderBottom:'1px solid rgba(0,0,0,.15)', borderRight:'1px solid rgba(255,255,255,.2)', verticalAlign:'middle' };
    const TD = { padding:'8px 10px', fontSize:12.5, borderBottom:'1px solid #e8e8e8', borderRight:'1px solid #e8e8e8', verticalAlign:'top' };
    const SumRow = ({ label, sublabel, value }) => (
      <tr>
        <td style={{ padding:'5px 12px', fontSize:12, color:'#333', borderBottom:'1px solid #eee' }}>{label}{sublabel&&<span style={{ fontSize:10, color:'#888', display:'block' }}>{sublabel}</span>}</td>
        <td style={{ padding:'5px 12px', textAlign:'right', fontSize:12.5, fontWeight:600, color:'#333', minWidth:110, borderBottom:'1px solid #eee' }}>{value}</td>
      </tr>
    );

    const merged = window.mergeInvItems
      ? window.mergeInvItems(iv.items || [], discount)
      : (iv.items||[]).map(it=>({ ...it, indivWeight:Number(it.weight||0), scanCount:1, lineDisc:0 }));

    return (
      <div style={{ width:'100%', maxWidth:794, background:'#fff', margin:'0 auto', boxShadow:'0 2px 16px rgba(0,0,0,.12)', fontFamily:'var(--font-sans)', color:'#111', boxSizing:'border-box', fontSize:12.5, overflow:'hidden' }}>

        {/* ══ HEADER ══ */}
        <div style={{ background:'#fff', padding:'18px 24px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          {/* Company */}
          <div style={{ display:'flex', gap:12, alignItems:'flex-start', flex:1 }}>
            {co.logoUrl && <img src={co.logoUrl} alt="logo" style={{ width:56, height:56, objectFit:'contain', borderRadius:6, flexShrink:0 }} />}
            <div>
              <div style={{ fontSize:17, fontWeight:800, lineHeight:1.3, color:'#111' }}>{co.name}</div>
              {co.nameEn && <div style={{ fontSize:12, fontWeight:600, color:'#444' }}>{co.nameEn}</div>}
              <div style={{ fontSize:11, color:'#555', lineHeight:1.8, marginTop:3 }}>
                {co.addr && <div>{co.addr}</div>}
                <div>โทร. {co.tel}{co.email ? ` | ${co.email}` : ''}</div>
                <div>เลขประจำตัวผู้เสียภาษี <b style={{ color:'#111' }}>{co.tax}</b> &nbsp;สำนักงานใหญ่</div>
              </div>
            </div>
          </div>
          {/* Document type — text only, no border box */}
          <div style={{ textAlign:'right', minWidth:200, flexShrink:0 }}>
            <div style={{ display:'inline-block', padding:'5px 18px', background: iv.voided ? '#fee' : ACC_LIGHT, color: iv.voided ? '#c0392b' : ACC, borderRadius:4, fontSize:15, fontWeight:800, marginBottom:8, letterSpacing:.5 }}>{copyLabel}</div>
            <div style={{ fontSize:22, fontWeight:800, color:ACC, lineHeight:1.4 }}>ใบกำกับภาษี/ ใบเสร็จรับเงิน</div>
            <div style={{ fontSize:13, fontWeight:600, color:'#555', marginTop:3 }}>Tax Invoice / Receipt</div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div style={{ padding:'16px 24px 20px' }}>

        {/* ══ CUSTOMER + DOC INFO ══ */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:0, marginBottom:14, ...B, borderRadius:6, overflow:'hidden' }}>
          {/* Customer */}
          <div style={{ padding:'10px 14px', borderRight:'1px solid #ccc' }}>
            <div style={{ fontSize:11, color:'#777', marginBottom:6 }}>ลูกค้า / Customer</div>
            <div style={{ fontSize:13.5, fontWeight:700, marginBottom:4 }}>{cust?.name || iv.custName || '—'}</div>
            {(cust?.addr || iv.custAddr) && <div style={{ fontSize:11.5, color:'#444', lineHeight:1.7, marginBottom:3 }}>{cust?.addr || iv.custAddr}</div>}
            <div style={{ fontSize:11.5, color:'#444', marginBottom:2 }}>
              <span style={{ color:'#888' }}>เลขประจำตัวผู้เสียภาษี </span>
              <b style={{ fontFamily:'var(--font-mono)' }}>{iv.custTax || cust?.tax || '—'}</b>
              <span style={{ marginLeft:8, color:'#666' }}>{branchLabel}</span>
            </div>
            {cust?.phone && <div style={{ fontSize:11.5, color:'#444' }}>โทร. {cust.phone}</div>}
          </div>
          {/* Doc info */}
          <div style={{ padding:'10px 14px', minWidth:210, background:ACC_LIGHT }}>
            {(() => {
              const PAY_LBL = { cash:'เงินสด', transfer:'เงินโอน', credit:'เครดิต' };
              const payLabel = iv.pay ? PAY_LBL[iv.pay] || iv.pay : null;
              return [
                ['เลขที่ / No.', <b style={{ fontFamily:'var(--font-mono)', fontSize:13, color:ACC }}>{iv.no}</b>],
                ['วันที่ / Date', <b>{iv.dateDisplay}</b>],
                ['อ้างอิง', iv.thermalNo ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11.5, color:'#555' }}>{iv.thermalNo}</span> : null],
                ['ออกแทนใบ', iv.replaces ? <span style={{ fontFamily:'var(--font-mono)', fontSize:11.5, color:'#c0392b' }}>{iv.replaces}</span> : null],
                ['ชำระเงิน', payLabel ? <span style={{ fontWeight:600 }}>{payLabel}</span> : null],
              ].filter(r => r[1]).map(([l,v],i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:12, padding:'4px 0', borderBottom:'1px solid #d0d8e8', fontSize:12 }}>
                  <span style={{ color:'#667', whiteSpace:'nowrap' }}>{l}</span>{v}
                </div>
              ));
            })()}
          </div>
        </div>

        {/* ══ ITEMS TABLE + SUMMARY — wrapped in single border box ══ */}
        <div style={{ border:'1px solid #ccc', borderRadius:6, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
            <thead>
              <tr>
                <th style={{ ...TH, width:34, textAlign:'center' }}>ลำดับ<br/><span style={{ fontSize:9.5, fontWeight:400 }}>No.</span></th>
                <th style={{ ...TH, textAlign:'center' }}>รหัสสินค้าและรายละเอียด<br/><span style={{ fontSize:9.5, fontWeight:400 }}>Code / Descriptions</span></th>
                <th style={{ ...TH, width:90, textAlign:'center' }}>จำนวน<br/><span style={{ fontSize:9.5, fontWeight:400 }}>Quantity</span></th>
                <th style={{ ...TH, width:90, textAlign:'center' }}>หน่วยละ<br/><span style={{ fontSize:9.5, fontWeight:400 }}>Unit Price</span></th>
                <th style={{ ...TH, width:100, textAlign:'center', borderRight:'none' }}>จำนวนเงิน<br/><span style={{ fontSize:9.5, fontWeight:400 }}>Amount</span></th>
              </tr>
            </thead>
            <tbody>
              {merged.map((it, i) => {
                const w      = Number(it.indivWeight || it.weight || 0);
                const p      = Number(it.price || it.price_per_kg || 0);
                const unit   = window.unitOf(it.code);
                const isUnit = unit.unitType === 'unit';
                const qty    = isUnit ? w * (it.scanCount||1) : (it.scanCount || 1);
                const qtyStr = `${qty}`;
                const lineTotal = isUnit ? qty * p - Number(it.lineDisc||0) : qty * w * p - Number(it.lineDisc||0);
                return (
                  <tr key={i} style={{ background: i%2===0?'#fff':'#fafafa' }}>
                    <td style={{ ...TD, textAlign:'center', color:'#888' }}>{i+1}</td>
                    <td style={{ ...TD }}>
                      <div style={{ fontSize:11, color:'#888', fontFamily:'var(--font-mono)', marginBottom:2 }}>{it.code}</div>
                      <div style={{ fontWeight:600 }}>{it.name}{unit.unitType !== 'unit' && w > 0 ? ` @ ${w.toFixed(3)} kg.` : ''}</div>
                    </td>
                    <td style={{ ...TD, textAlign:'center', fontWeight:600 }}>{qtyStr}</td>
                    <td style={{ ...TD, textAlign:'right' }}>{p.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                    <td style={{ ...TD, textAlign:'right', fontWeight:700, borderRight:'none' }}>{lineTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  </tr>
                );
              })}
              {merged.length < 5 && Array.from({ length: 5 - merged.length }).map((_,i) => (
                <tr key={'e'+i} style={{ background: (merged.length+i)%2===0?'#fff':'#fafafa' }}>
                  <td style={{ ...TD, height:30 }}></td><td style={TD}></td><td style={TD}></td><td style={TD}></td><td style={{ ...TD, borderRight:'none' }}></td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ══ SUMMARY + AMOUNT WORDS ══ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto', borderTop:'2px solid #ccc' }}>
            {/* Amount in words */}
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', justifyContent:'flex-end', borderRight:'1px solid #ddd' }}>
              <div style={{ fontSize:10.5, color:'#777', marginBottom:3 }}>จำนวนเงิน (ตัวอักษร)</div>
              <div style={{ fontSize:12.5, fontWeight:600 }}>({window.bahtText ? window.bahtText(total) : ''})</div>
              {iv.note && <div style={{ marginTop:8, fontSize:11, color:'#666' }}><b>หมายเหตุ:</b> {iv.note}</div>}
              {iv.replaces && (
                <div style={{ marginTop:6, fontSize:11, color:'#555' }}>ออกแทนฉบับเลขที่ <b style={{ fontFamily:'var(--font-mono)' }}>{iv.replaces}</b></div>
              )}
            </div>
            {/* Summary rows */}
            <div style={{ minWidth:280 }}>
              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                <tbody>
                  <SumRow label="รวมเป็นเงิน" sublabel="Gross Amount" value={grossSale.toLocaleString('en-US',{minimumFractionDigits:2})} />
                  {discount > 0 && <SumRow label="หักส่วนลด" sublabel="Less Discount" value={`-${discount.toLocaleString('en-US',{minimumFractionDigits:2})}`} />}
                  {discount > 0 && <SumRow label="ยอดหลังหักส่วนลด" sublabel="After Discount" value={afterDisc.toLocaleString('en-US',{minimumFractionDigits:2})} />}
                  <SumRow label="ราคาสินค้า (ก่อน VAT)" sublabel="Taxable Amount" value={vatBase.toLocaleString('en-US',{minimumFractionDigits:2})} />
                  <SumRow label="ภาษีมูลค่าเพิ่ม 7%" sublabel="VAT 7%" value={vatAmt.toLocaleString('en-US',{minimumFractionDigits:2})} />
                  <tr style={{ background:ACC }}>
                    <td style={{ padding:'8px 12px', fontSize:13, fontWeight:800, color:'#fff' }}>จำนวนเงินรวมทั้งสิ้น<span style={{ fontSize:10, fontWeight:400, display:'block', opacity:.8 }}>Total Invoice</span></td>
                    <td style={{ padding:'8px 12px', textAlign:'right', fontSize:16, fontWeight:900, color:'#fff', minWidth:110 }}>{total.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>{/* end table+summary box */}

        {/* ══ BOTTOM: ได้รับสินค้า + ชำระเงิน + SIGNATURES ══ */}
        <div style={{ marginTop:14, display:'grid', gridTemplateColumns:'1fr 1fr', gap:0, ...B, borderRadius:6, overflow:'hidden' }}>
          {/* Left: received + payment */}
          <div style={{ padding:'10px 14px', borderRight:'1px solid #ccc' }}>
            <div style={{ fontSize:12, fontWeight:600, marginBottom:8 }}>ได้รับสินค้าตามรายการถูกต้องแล้ว</div>
            <div style={{ marginTop:48, borderTop:'1px solid #bbb', paddingTop:6, textAlign:'center', fontSize:11.5, color:'#555' }}>
              ผู้รับสินค้า / Goods Received by
            </div>
            <div style={{ marginTop:10, paddingTop:5, textAlign:'center', fontSize:10.5, color:'#888' }}>วันที่ ....... / ....... / .......</div>
          </div>
          {/* Right: authorized signature */}
          <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
            <div style={{ fontSize:12, fontWeight:600, textAlign:'center' }}>{co.name}</div>
            <div>
              <div style={{ textAlign:'center', marginTop:32, borderTop:'1px solid #bbb', paddingTop:6, fontSize:11.5, color:'#555' }}>
                ผู้รับมอบอำนาจ / Authorized Signature
              </div>
              <div style={{ marginTop:10, paddingTop:5, textAlign:'center', fontSize:10.5, color:'#888' }}>วันที่ ....... / ....... / .......</div>
            </div>
          </div>
        </div>

        </div>{/* end body padding */}
      </div>
    );
  };

  /* ── Daily summary helpers ── */
  const dailyGroups = React.useMemo(() => {
    const byDate = {};
    invs.filter(iv => !iv.voided).forEach(iv => {
      const d = iv.dateDisplay || iv.date;
      if (!byDate[d]) byDate[d] = { date:d, dateISO:iv.date, cnt:0, w:0, total:0, tivNos:[], invNos:[] };
      const g = byDate[d];
      g.cnt++;
      g.w += (iv.items||[]).reduce((s,it)=>s+Number(it.weight||0),0);
      g.total += iv.total||0;
      if (iv.thermalNo) g.tivNos.push(iv.thermalNo);
      if (iv.type==='A4') g.invNos.push(iv.no);
    });
    return Object.values(byDate).sort((a,b)=>b.dateISO?.localeCompare(a.dateISO));
  }, [invs]);

  const tivRange = (nos) => {
    if (!nos.length) return '—';
    const s = nos.slice().sort();
    return s.length > 1 ? `${s[0]} – ${s[s.length-1]}` : s[0];
  };

  return (
    <div>
      <div className="tabs">
        <button type="button" className={'tab'+(tab==='list'?' on':'')} onClick={()=>setTab('list')}>รายการใบกำกับภาษี</button>
        <button type="button" className={'tab'+(tab==='void'?' on':'')} style={{ color:'var(--rd)' }} onClick={()=>setTab('void')}>
          <Icon name="x-circle" size={13} style={{ marginRight:4 }}/>ยกเลิกใบเสร็จ
        </button>
        <button type="button" className={'tab'+(tab==='daily'?' on':'')} onClick={()=>setTab('daily')}>สรุปการออกใบกำกับภาษี</button>
        <button type="button" className={'tab'+(tab==='audit'?' on':'')} onClick={()=>{setTab('audit');setAuditLog([...window.SP_STATE.auditLog]);}}
          style={{ color: tab==='audit'?'var(--pu)':undefined }}>
          📋 Audit Trail
          {auditLog.length > 0 && <span style={{ marginLeft:5, background:'var(--pu)', color:'#fff', borderRadius:100, fontSize:10, fontWeight:800, padding:'1px 6px' }}>{auditLog.length}</span>}
        </button>
      </div>

      {/* ── Daily summary tab ── */}
      {tab==='daily' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
            <div className="card" style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:12, color:'var(--t2)', marginBottom:5 }}>ใบกำกับทั้งหมด (ไม่รวมยกเลิก)</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--ac)' }}>{invs.filter(iv=>!iv.voided).length} <span style={{ fontSize:13, fontWeight:600 }}>ใบ</span></div>
            </div>
            <div className="card" style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:12, color:'var(--t2)', marginBottom:5 }}>TIV (อย่างย่อ)</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--t2)' }}>{invs.filter(iv=>!iv.voided).length} <span style={{ fontSize:13, fontWeight:600 }}>ฉบับ</span></div>
            </div>
            <div className="card" style={{ padding:'14px 18px' }}>
              <div style={{ fontSize:12, color:'var(--t2)', marginBottom:5 }}>INV (เต็มรูปแบบ)</div>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--gn)' }}>{invs.filter(iv=>!iv.voided&&iv.type==='A4').length} <span style={{ fontSize:13, fontWeight:600 }}>ฉบับ</span></div>
            </div>
          </div>
          <Card title="สรุปยอดประจำวัน — ใบกำกับภาษี" actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('invoice_daily.csv',['วันที่','TIV range','INV range','จำนวนบิล','น้ำหนัก KG','ยอดรวม'],dailyGroups.map(d=>[d.date,tivRange(d.tivNos),tivRange(d.invNos),d.cnt,d.w.toFixed(2),$(d.total)]))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('สรุปยอดประจำวัน — ใบกำกับภาษี',['วันที่','TIV range','INV range','จำนวนบิล','น้ำหนัก KG','ยอดรวม'],dailyGroups.map(d=>[d.date,tivRange(d.tivNos),tivRange(d.invNos),d.cnt,d.w.toFixed(2),$(d.total)]))}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th>
                <th style={TH}>เลขที่ TIV (อย่างย่อ)</th>
                <th style={TH}>เลขที่ INV (เต็มรูปแบบ)</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                <th style={{ ...TH, textAlign:'right' }}>น้ำหนักรวม (KG)</th>
                <th style={{ ...TH, textAlign:'right' }}>ยอดรวม (฿)</th>
              </tr></thead>
              <tbody>
                {dailyGroups.length===0
                  ? <tr><td colSpan="6" style={{ padding:'28px', textAlign:'center', color:'var(--t3)' }}>ยังไม่มีรายการ</td></tr>
                  : dailyGroups.map((d,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={{ ...TD, fontWeight:700 }}>{d.date}</td>
                      <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{tivRange(d.tivNos)}</td>
                      <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{tivRange(d.invNos)}</td>
                      <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{d.cnt} บิล</td>
                      <td style={{ ...TD, textAlign:'right', fontWeight:700 }}>{d.w.toFixed(2)}</td>
                      <td style={{ ...TD, textAlign:'right', fontWeight:800, color:'var(--gn)' }}>{$(d.total)}</td>
                    </tr>
                  ))
                }
              </tbody>
              <tfoot><tr>
                <td style={{ padding:'9px 14px', fontWeight:700, background:'var(--s2)', borderTop:'2px solid var(--bd)' }}>รวมทั้งหมด</td>
                <td colSpan="2" style={{ padding:'9px 14px', background:'var(--s2)', borderTop:'2px solid var(--bd)', fontSize:12, color:'var(--t3)' }}>
                  {(()=>{
                    const d=new Date(); const yymm=String(d.getFullYear())+String(d.getMonth()+1).padStart(2,'0');
                    const st=window.SP_STATE;
                    const tPfx=(st.docPrefixes?.tiv)||'TIV'; const iPfx=(st.docPrefixes?.inv)||'INV';
                    return <>
                      TIV ต่อไป: <span style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>{tPfx}-{yymm}-{String(st.invCounterThermal).padStart(4,'0')}</span>
                      &nbsp;&nbsp; INV ต่อไป: <span style={{ fontFamily:'var(--font-mono)', color:'var(--ac)' }}>{iPfx}-{yymm}-{String(st.invCounterA4).padStart(4,'0')}</span>
                    </>;
                  })()}
                </td>
                <td style={{ padding:'9px 14px', textAlign:'center', fontWeight:700, background:'var(--s2)', borderTop:'2px solid var(--bd)' }}>{invs.filter(iv=>!iv.voided).length} บิล</td>
                <td style={{ padding:'9px 14px', textAlign:'right', fontWeight:700, background:'var(--s2)', borderTop:'2px solid var(--bd)' }}>{dailyGroups.reduce((s,d)=>s+d.w,0).toFixed(2)}</td>
                <td style={{ padding:'9px 14px', textAlign:'right', fontWeight:800, color:'var(--gn)', background:'var(--s2)', borderTop:'2px solid var(--bd)' }}>{$(dailyGroups.reduce((s,d)=>s+d.total,0))}</td>
              </tr></tfoot>
            </table></div>
          </Card>
        </div>
      )}

      {tab==='list' && (() => {
        /* TIV-centric list: each row = 1 sale (TIV primary, INV/CN/DN linked) */
        const tivList = invs
          .filter(iv => iv.type === 'Thermal')
          .map(tiv => ({
            tiv,
            inv: tiv.fullInvNo ? invs.find(x => x.no === tiv.fullInvNo && x.type !== 'Thermal') : null,
          }))
          .filter(({tiv}) => {
            if (dateFrom && tiv.date < dateFrom) return false;
            if (dateTo   && tiv.date > dateTo)   return false;
            if (search) {
              const s = search.toLowerCase();
              return tiv.no.toLowerCase().includes(s) ||
                     tiv.custName.toLowerCase().includes(s) ||
                     (tiv.fullInvNo||'').toLowerCase().includes(s);
            }
            return true;
          });
        /* pagination */
        const tivTotalPgs = Math.max(1, Math.ceil(tivList.length / INV_PAGE_SIZE));
        const tivSafePg   = Math.min(tivPage, tivTotalPgs);
        const tivSlice    = tivList.slice((tivSafePg-1)*INV_PAGE_SIZE, tivSafePg*INV_PAGE_SIZE);
        return (
          <Card title={`รายการใบกำกับภาษี · ${tivList.length} รายการ`} actions={
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <DateField style={{ width:140 }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
              <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
              <DateField style={{ width:140 }} value={dateTo} onChange={e=>setDateTo(e.target.value)} />
              {(dateFrom||dateTo) && <button className="btn bg2 bsm" onClick={()=>{setDateFrom('');setDateTo('');}}>ล้าง</button>}
              <input type="text" className="fc" placeholder="ค้นหา TIV / INV / ลูกค้า…" style={{ width:200 }} value={search} onChange={e=>setSearch(e.target.value)} />
              <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('invoices.csv',
                ['เลขที่ TIV','เลขที่ INV','วันที่','ลูกค้า','ส่วนลด','ยอดรวม','ยอดชำระ','สถานะ'],
                tivList.map(({tiv,inv})=>[tiv.no,inv?.no||'',tiv.dateDisplay,tiv.custName,tiv.discount||0,tiv.total,tiv.voided?0:tiv.total,tiv.voided?'ยกเลิก':(inv?.printCount||0)>0?'สำเนา':'ต้นฉบับ'])
              )}>CSV</Button>
              <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายการใบกำกับภาษี',
                ['เลขที่ TIV','เลขที่ INV','วันที่','ลูกค้า','ยอดรวม','ยอดชำระ','สถานะ'],
                tivList.map(({tiv,inv})=>[tiv.no,inv?.no||'—',tiv.dateDisplay,tiv.custName,tiv.total,tiv.voided?'—':tiv.total,tiv.voided?'ยกเลิก':(inv?.printCount||0)>0?'สำเนา':'ต้นฉบับ'])
              )}>PDF</Button>
            </div>
          }>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>เลขที่ TIV</th>
                <th style={TH}>เลขที่ INV</th>
                <th style={TH}>วันที่</th>
                <th style={TH}>ลูกค้า</th>
                <th style={{ ...TH, textAlign:'right' }}>ส่วนลด</th>
                <th style={{ ...TH, textAlign:'right' }}>ยอดรวม</th>
                <th style={{ ...TH, textAlign:'right' }}>ยอดชำระ</th>
                <th style={{ ...TH, textAlign:'center' }}>สถานะ</th>
                <th style={TH}>จัดการ</th>
              </tr></thead>
              <tbody>
                {tivList.length === 0 ? (
                  <tr><td colSpan="9" style={{ padding:'28px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                ) : tivSlice.map(({tiv, inv}) => {
                  /* ต้นฉบับ → สำเนา เมื่อออก INV แล้วพิมพ์เท่านั้น
                     tiv.printCount ไม่นับ — พิมพ์ thermal ไม่เปลี่ยนสถานะ */
                  const printDone  = (inv?.printCount||0) > 0;
                  const invVoided  = inv?.voided;
                  const invColor   = 'var(--ac)';
                  return (
                    <tr key={tiv.id} style={{ borderBottom:'1px solid var(--bd)', opacity:tiv.voided?.6:1 }}>
                      {/* TIV */}
                      <td style={TD}>
                        <button onClick={()=>setTivModal(tiv)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--t2)',fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,padding:0 }}>
                          {tiv.no}
                        </button>
                        {tiv.voided && <span className="bx xr" style={{ marginLeft:5,fontSize:10 }}>ยกเลิก</span>}
                        {tiv.replaces && !tiv.voided && (
                          <div style={{ fontSize:10, color:'var(--ac)', marginTop:2 }}>
                            ออกแทน <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{tiv.replaces}</span>
                          </div>
                        )}
                      </td>
                      {/* INV / CN / DN */}
                      <td style={TD}>
                        {inv ? (
                          <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                            <button onClick={()=>setA4Modal(inv)} style={{ background:'none',border:'none',cursor:'pointer',fontFamily:'var(--font-mono)',fontSize:12,fontWeight:700,padding:0,color:invColor }}>
                              {inv.no}
                            </button>
                            {invVoided && <span className="bx xr" style={{ fontSize:10 }}>ยกเลิก</span>}
                          </div>
                        ) : <span style={{ color:'var(--t3)',fontSize:12 }}>—</span>}
                      </td>
                      <td style={{ ...TD, fontSize:12.5, color:'var(--t2)' }}>{tiv.dateDisplay}</td>
                      <td style={{ ...TD, fontWeight:600, fontSize:13 }}>{tiv.custName}</td>
                      <td style={{ ...TD, textAlign:'right', color:'var(--am)' }}>{tiv.discount>0?'-'+$(tiv.discount):'—'}</td>
                      <td style={{ ...TD, textAlign:'right', fontWeight:700 }}>{$(tiv.total)}</td>
                      <td style={{ ...TD, textAlign:'right', fontWeight:800, color:tiv.voided?'var(--t3)':'var(--gn)' }}>
                        {tiv.voided ? '—' : $(tiv.total)}
                      </td>
                      <td style={{ ...TD, textAlign:'center' }}>
                        {tiv.voided ? (
                          <span className="bx xr">ยกเลิก</span>
                        ) : (
                          <span className={'bx '+(printDone?'xa':'xg')}>{printDone?'สำเนา':'ต้นฉบับ'}</span>
                        )}
                      </td>
                      <td style={TD}>
                        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                          {/* ใบเสร็จ / ดูใบยกเลิก */}
                          <button onClick={()=>setTivModal(tiv)} title={tiv.voided?'ดูใบเสร็จที่ยกเลิกแล้ว':'แสดงใบกำกับภาษีอย่างย่อ (TIV)'}
                            style={{ fontSize:11,padding:'3px 7px',border:`1px solid ${tiv.voided?'rgba(208,48,48,.3)':'var(--ac)'}`,borderRadius:4,cursor:'pointer',background:tiv.voided?'var(--rbg)':'var(--abg)',color:tiv.voided?'var(--rd)':'var(--ac)',fontFamily:'inherit',fontWeight:700 }}>
                            {tiv.voided ? '📄 ใบยกเลิก' : '🖨 ดูใบเสร็จ'}
                          </button>
                          {/* ใบกำกับ = INV full A4 */}
                          {inv && !invVoided && (
                            <button onClick={()=>setA4Modal(inv)} title="พิมพ์ใบกำกับภาษีเต็มรูปแบบ (INV)"
                              style={{ fontSize:11,padding:'3px 7px',border:'1px solid var(--ac)',borderRadius:4,cursor:'pointer',background:'var(--abg)',color:'var(--ac)',fontFamily:'inherit',fontWeight:700 }}>
                              🖨 ดู INV
                            </button>
                          )}
                          {/* + INV ออกใบกำกับเต็มรูป */}
                          {!tiv.voided && !tiv.fullInvNo && (
                            <button onClick={()=>setIssueINVModal(tiv)}
                              style={{ fontSize:11,padding:'3px 7px',border:'1px solid var(--gn)',borderRadius:4,cursor:'pointer',background:'var(--gbg)',color:'var(--gt)',fontFamily:'inherit',fontWeight:700 }}>
                              + INV
                            </button>
                          )}
                          {/* ยกเลิกทั้งหมด */}
                          {!tiv.voided && (() => {
                            const invPrinted = !inv || (inv.printCount||0) > 0;
                            return invPrinted ? (
                              <button onClick={()=>{setVoidReason('');setVoidModal(tiv);}}
                                style={{ fontSize:11,padding:'3px 7px',border:'1px solid rgba(208,48,48,.3)',borderRadius:4,cursor:'pointer',background:'var(--rbg)',color:'var(--rd)',fontFamily:'inherit' }}>
                                ยกเลิกทั้งหมด
                              </button>
                            ) : (
                              <span title="ต้องพิมพ์ใบกำกับภาษีเต็มรูป (ต้นฉบับ) ก่อนจึงจะยกเลิกได้"
                                style={{ fontSize:11,padding:'3px 7px',borderRadius:4,background:'var(--s2)',color:'var(--t3)',cursor:'not-allowed',userSelect:'none' }}>
                                ยกเลิกทั้งหมด
                              </span>
                            );
                          })()}
                          {/* แก้ไข INV — enabled หลัง print ต้นฉบับแล้วเท่านั้น */}
                          {inv && !invVoided && (inv.printCount||0) > 0 && (
                            <button onClick={()=>setAmendModal(inv)}
                              style={{ fontSize:11,padding:'3px 7px',border:'1px solid var(--am)',borderRadius:4,cursor:'pointer',background:'var(--ambg)',color:'var(--am)',fontFamily:'inherit',fontWeight:700 }}>
                              แก้ไข INV
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Paginator page={tivSafePg} totalPages={tivTotalPgs} setPage={setTivPage} total={tivList.length} pageSize={INV_PAGE_SIZE} noun="ใบกำกับ" />
            </div>
          </Card>
        );
      })()}

      {a4Modal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setA4Modal(null)}>
          <div className="md" style={{ width:'min(860px,96vw)' }}>
            <div className="md-h">
              <span className="md-t">
                ใบกำกับภาษี · <span style={{ fontFamily:'var(--font-mono)' }}>{a4Modal.no}</span>
                {(a4Modal.printCount||0)>0 && <span className="bx xa" style={{ marginLeft:8, fontSize:11 }}>สำเนาครั้งที่ {a4Modal.printCount}</span>}
              </span>
              <div style={{ display:'flex', gap:8 }}>
                <Button variant="bp" size="sm" icon="printer" onClick={()=>{
                  window.printDoc('inv', a4Modal);
                  /* อัปเดต printCount ใน memory ทันที */
                  const st = window.SP_STATE;
                  const invRec = st.invoices.find(x=>x.id===a4Modal.id);
                  const newCount = (a4Modal.printCount||0) + 1;
                  if (invRec) invRec.printCount = newCount;
                  refresh();
                  setA4Modal({...a4Modal, printCount: newCount});
                  /* บันทึก print log ใน DB แบบ async (ไม่ block UI) */
                  if (window.SP_API && typeof window.SP_API.logPrint === 'function') {
                    window.SP_API.logPrint('INV', a4Modal.no).then(()=>refresh()).catch(()=>{});
                  }
                }}>พิมพ์{(a4Modal.printCount||0)>0?' (สำเนา)':' (ต้นฉบับ)'}</Button>
                <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setA4Modal(null)}>✕</button>
              </div>
            </div>
            <div className="md-b" style={{ background:'#e8e7e2', padding:'16px', overflowX:'auto' }}>
              <A4Content iv={a4Modal} />
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setA4Modal(null)}>ปิด</Button>
              {!a4Modal.voided && (a4Modal.printCount||0) > 0 && (
                <button onClick={()=>{setA4Modal(null);setVoidReason('');setVoidModal(a4Modal);}}
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'var(--rs)', background:'var(--rbg)', color:'var(--rd)', fontSize:13, fontWeight:700, cursor:'pointer', border:'1px solid rgba(208,48,48,.3)', fontFamily:'inherit' }}>
                  <Icon name="x-circle" size={14} style={{ color:'var(--rd)' }}/> ยกเลิกใบนี้
                </button>
              )}
              {!a4Modal.voided && (a4Modal.printCount||0) === 0 && (
                <span title="ต้องพิมพ์ต้นฉบับก่อนจึงจะยกเลิกได้"
                  style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'var(--rs)', background:'var(--s2)', color:'var(--t3)', fontSize:13, fontWeight:700, cursor:'not-allowed', userSelect:'none' }}>
                  <Icon name="x-circle" size={14} style={{ color:'var(--t3)' }}/> ยกเลิกใบนี้
                </span>
              )}
            </div>
          </div>
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
                  <label className="fl">เลขที่ใบกำกับที่ต้องการยกเลิก (INV หรือ TIV)</label>
                  <input type="text" className="fc" value={voidNo} onChange={e=>{setVoidNo(e.target.value);setVoidPreview(null);}} placeholder="เช่น INV-256906-0001 หรือ TIV-256906-0001" />
                </div>
                <button className="btn bg2" onClick={()=>{
                  const f = invs.find(iv => (iv.no===voidNo || iv.thermalNo===voidNo) && !iv.voided);
                  setVoidPreview(f||null);
                  if (!f) toast('err',`ไม่พบ ${voidNo}`);
                }}>ค้นหา</button>
              </div>
              {voidPreview && (
                <div style={{ padding:14, background:'var(--rbg)', border:'1px solid rgba(208,48,48,.2)', borderRadius:'var(--rs)', marginBottom:12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'4px 16px', fontSize:12.5, marginBottom:10 }}>
                    <div>
                      <span style={{ color:'var(--t2)' }}>เลขที่:</span> <b style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{voidPreview.no}</b>
                      {voidPreview.type==='A4' && voidPreview.thermalNo && <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>TIV: {voidPreview.thermalNo}</div>}
                    </div>
                    <div><span style={{ color:'var(--t2)' }}>ลูกค้า:</span> <b>{voidPreview.custName}</b></div>
                    <div><span style={{ color:'var(--t2)' }}>ยอดรวม:</span> <b style={{ color:'var(--gn)' }}>{$(voidPreview.total)}</b></div>
                  </div>
                  <div className="fg" style={{ margin:0 }}>
                    <label className="fl">เหตุผลการยกเลิก <span className="req">*</span></label>
                    <select className="fc" value={voidReason} onChange={e=>setVoidReason(e.target.value)}>
                      <option value="">— เลือกเหตุผล —</option>
                      <option>ลูกค้าต้องการอย่างย่อ</option><option>ข้อมูลผิดพลาด</option><option>ยกเลิกคำสั่งซื้อ</option><option>อื่นๆ</option>
                      <option value="ออกใบทดแทน">ออกใบทดแทน (ไม่คืนสต็อก)</option>
                    </select>
                    {voidReason === 'ออกใบทดแทน' && (
                      <div style={{ marginTop:8, padding:'8px 12px', background:'var(--abg)', border:'1px solid rgba(59,91,219,.2)', borderRadius:'var(--rs)', fontSize:12, color:'var(--ac)', lineHeight:1.6 }}>
                        สต็อกจะ<b>ไม่ถูกคืน</b> — กรุณาออกใบกำกับใหม่ในหน้า "ตัดสต็อก/ขาย" แล้วกรอก "ออกแทนใบ" ด้วยเลขที่ใบนี้
                      </div>
                    )}
                  </div>
                </div>
              )}
              <button onClick={()=>{ if(!voidPreview){toast('err','กรุณาค้นหาก่อน');return;} if(!voidReason){toast('err','กรุณาเลือกเหตุผล');return;} setVoidModal(voidPreview); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:13, borderRadius:'var(--rs)', background:voidPreview?'var(--rd)':'var(--s2)', color:voidPreview?'#fff':'var(--t3)', fontSize:14, fontWeight:700, cursor:voidPreview?'pointer':'default', border:'none', fontFamily:'inherit', marginTop:12 }}>
                <Icon name="x-circle" size={16} style={{ color:voidPreview?'#fff':'var(--t3)' }}/> ยืนยันยกเลิกใบเสร็จ
              </button>
            </div>
          </div>
          <Card title="ประวัติการยกเลิก" actions={
            <div style={{ display:'flex', gap:6 }}>
              <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('void_history.csv',
                ['เลขที่','TIV','ลูกค้า','วันที่บิล','ยอดรวม','ยกเลิกเมื่อ','ผู้ยกเลิก','เหตุผล','สถานะสต็อก'],
                invs.filter(iv=>iv.voided).map(iv=>[iv.no,iv.thermalNo||'',iv.custName,iv.dateDisplay,iv.total,fmtVoidDate(iv.voidedAt),iv.voidedBy||'',iv.voidReason||'',iv.stockRestored?'คืนสต็อกแล้ว':'ยังไม่คืน'])
              )}>CSV</Button>
              <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('ประวัติการยกเลิกใบเสร็จ',
                ['เลขที่','TIV','ลูกค้า','วันที่บิล','ยอดรวม','ยกเลิกเมื่อ','ผู้ยกเลิก','เหตุผล','สถานะ'],
                invs.filter(iv=>iv.voided).map(iv=>[iv.no,iv.thermalNo||'—',iv.custName,iv.dateDisplay,iv.total,fmtVoidDate(iv.voidedAt),iv.voidedBy||'—',iv.voidReason||'—',iv.stockRestored?'คืนสต็อกแล้ว':'ยังไม่คืน'])
              )}>PDF</Button>
            </div>
          }>
            <div className="tw"><table>
              <thead><tr><th>เลขที่ใบกำกับ</th><th>TIV อ้างอิง</th><th>ลูกค้า</th><th>วันที่บิล</th><th style={{textAlign:'right'}}>ยอดรวม</th><th>ยกเลิกเมื่อ</th><th>ผู้ยกเลิก</th><th>เหตุผล</th><th>สถานะสต็อก</th><th></th></tr></thead>
              <tbody>
                {(() => {
                  const voidList = invs.filter(iv=>iv.voided);
                  const voidTotalPgs = Math.max(1, Math.ceil(voidList.length / INV_PAGE_SIZE));
                  const voidSafePg   = Math.min(voidPage, voidTotalPgs);
                  const voidSlice    = voidList.slice((voidSafePg-1)*INV_PAGE_SIZE, voidSafePg*INV_PAGE_SIZE);
                  return voidList.length===0
                    ? <tr><td colSpan="10" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>ยังไม่มีรายการที่ถูกยกเลิก</td></tr>
                    : voidSlice.map(iv => {
                    const pairedVoid = !iv.stockRestored && (
                      (iv.thermalNo && invs.some(x => x.no===iv.thermalNo && x.voided)) ||
                      (iv.fullInvNo && invs.some(x => x.no===iv.fullInvNo && x.voided))
                    );
                    return (
                  <tr key={iv.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--rd)', fontWeight:700 }}>{iv.no}</span></td>
                    <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--t3)' }}>{iv.thermalNo||'—'}</td>
                    <td style={{ ...TD, fontWeight:600, fontSize:13 }}>{iv.custName}</td>
                    <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{iv.dateDisplay}</span></td>
                    <td style={{ ...TD, textAlign:'right', fontWeight:700 }}>{$(iv.total)}</td>
                    <td style={{ ...TD, fontSize:12, color:'var(--t2)' }}>{fmtVoidDate(iv.voidedAt)}</td>
                    <td style={{ ...TD, fontSize:13 }}>{iv.voidedBy||'—'}</td>
                    <td style={{ ...TD, fontSize:12.5, color:'var(--t2)' }}>{iv.voidReason||'—'}</td>
                    <td style={TD}>{iv.stockRestored
                      ? <span className="bx xg">คืนสต็อกแล้ว</span>
                      : iv.voidReason === 'ออกใบทดแทน'
                        ? <span className="bx xb">ออกใบทดแทน</span>
                        : pairedVoid
                          ? <span style={{ color:'var(--t3)', fontSize:13 }}>—</span>
                          : <span className="bx xa">ยังไม่คืน</span>
                    }</td>
                    <td style={TD}>
                      <button onClick={()=>setVoidDetail(iv)}
                        style={{ fontSize:11.5, padding:'3px 9px', border:'1px solid var(--ac)', borderRadius:5, cursor:'pointer', background:'var(--abg)', color:'var(--ac)', fontFamily:'inherit', fontWeight:700 }}>
                        รายละเอียด
                      </button>
                    </td>
                  </tr>
                  );
                  });
                })()}
              </tbody>
            </table></div>
            {(() => {
              const voidList = invs.filter(iv=>iv.voided);
              const voidTotalPgs = Math.max(1, Math.ceil(voidList.length / INV_PAGE_SIZE));
              const voidSafePg   = Math.min(voidPage, voidTotalPgs);
              return <Paginator page={voidSafePg} totalPages={voidTotalPgs} setPage={setVoidPage} total={voidList.length} pageSize={INV_PAGE_SIZE} noun="รายการ" />;
            })()}
          </Card>
        </div>
      )}

      {/* ── Audit Trail Tab ── */}
      {tab==='audit' && (() => {
        const ACTION_LABELS = {
          CREATE_INVOICE:     { label:'สร้างใบกำกับ (TIV)',      color:'var(--ac)',  bg:'var(--abg)' },
          ISSUE_INVOICE:      { label:'ออกใบกำกับเต็มรูป (INV)',  color:'var(--gn)',  bg:'var(--gbg)' },
          DELIVER_INVOICE:    { label:'ส่งมอบเอกสาร',             color:'var(--gn)',  bg:'var(--gbg)' },
          CANCEL_INVOICE:     { label:'ยกเลิกใบกำกับ',            color:'var(--rd)',  bg:'var(--rbg)' },
          REISSUE_INVOICE:    { label:'ออกใหม่แทนฉบับเดิม',       color:'var(--ac)',  bg:'var(--abg)' },
          CREATE_CREDIT_NOTE: { label:'ออกใบลดหนี้ (CN)',          color:'var(--am)',  bg:'var(--ambg)' },
          CREATE_DEBIT_NOTE:  { label:'ออกใบเพิ่มหนี้ (DN)',       color:'var(--rd)',  bg:'var(--rbg)' },
          PRINT_INVOICE:      { label:'พิมพ์เอกสาร',               color:'var(--t2)', bg:'var(--s2)' },
        };
        return (
          <div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:18 }}>
              <StatCard icon="file-text" iconTone="ac" label="รายการทั้งหมด" value={auditLog.length+' รายการ'} />
              <StatCard icon="check"    iconTone="gn" label="ออก INV"       value={auditLog.filter(l=>l.actionType==='ISSUE_INVOICE').length+' ครั้ง'} />
              <StatCard icon="x-circle" iconTone="rd" label="ยกเลิก"        value={auditLog.filter(l=>l.actionType==='CANCEL_INVOICE').length+' ครั้ง'} valueTone="rd"/>
              <StatCard icon="coin"     iconTone="am" label="CN/DN"          value={auditLog.filter(l=>l.actionType.includes('NOTE')).length+' ฉบับ'} valueTone="am"/>
            </div>
            <Card title="Audit Trail — บันทึกการดำเนินการทั้งหมด" actions={
              <div style={{ display:'flex', gap:6 }}>
                <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('audit_trail.csv',
                  ['วันเวลา','ประเภท','เลขที่เอกสาร','อ้างอิง','ผู้ดำเนินการ','สิทธิ์','เหตุผล'],
                  auditLog.map(l=>[l.timestampDisplay,l.actionType,l.docNo,l.refDocNo||'',l.username,l.userRole,l.reason])
                )}>CSV</Button>
                <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('Audit Trail — บันทึกการดำเนินการ',
                  ['วันเวลา','ประเภท','เลขที่เอกสาร','อ้างอิง','ผู้ดำเนินการ','เหตุผล'],
                  auditLog.map(l=>[l.timestampDisplay,ACTION_LABELS[l.actionType]?.label||l.actionType,l.docNo,l.refDocNo||'—',l.username,l.reason||'—']),
                  `รวม ${auditLog.length} รายการ`
                )}>PDF</Button>
              </div>
            }>
              <div className="tw"><table>
                <thead><tr>
                  <th style={TH}>วันเวลา</th>
                  <th style={TH}>ประเภทการดำเนินการ</th>
                  <th style={TH}>เลขที่เอกสาร</th>
                  <th style={TH}>อ้างอิง</th>
                  <th style={TH}>ผู้ดำเนินการ</th>
                  <th style={TH}>สิทธิ์</th>
                  <th style={TH}>เหตุผล</th>
                </tr></thead>
                <tbody>
                  {auditLog.length===0 ? (
                    <tr><td colSpan="7" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>
                      ยังไม่มีรายการ — ระบบจะบันทึกทุก action อัตโนมัติ
                    </td></tr>
                  ) : (() => {
                    const auditTotalPgs = Math.max(1, Math.ceil(auditLog.length / INV_PAGE_SIZE));
                    const auditSafePg   = Math.min(auditPage, auditTotalPgs);
                    const auditSlice    = auditLog.slice((auditSafePg-1)*INV_PAGE_SIZE, auditSafePg*INV_PAGE_SIZE);
                    return auditSlice.map((log, i) => {
                    const meta = ACTION_LABELS[log.actionType] || { label:log.actionType, color:'var(--t2)', bg:'var(--s2)' };
                    return (
                      <tr key={log.id || i} style={{ borderBottom:'1px solid var(--bd)' }}>
                        <td style={{ ...TD, fontSize:11.5, color:'var(--t2)', whiteSpace:'nowrap' }}>{log.timestampDisplay}</td>
                        <td style={TD}>
                          <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 9px', borderRadius:100, fontSize:11.5, fontWeight:700, background:meta.bg, color:meta.color }}>
                            {meta.label}
                          </span>
                        </td>
                        <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--ac)' }}>{log.docNo||'—'}</td>
                        <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--t3)' }}>{log.refDocNo||'—'}</td>
                        <td style={{ ...TD, fontWeight:600 }}>{log.username}</td>
                        <td style={TD}><span className={'bx '+(log.userRole==='admin'?'xb':log.userRole==='manager'?'xg':'xx')}>{log.userRole}</span></td>
                        <td style={{ ...TD, fontSize:12, color:'var(--t2)', maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{log.reason||'—'}</td>
                      </tr>
                    );
                  });
                  })()}
                </tbody>
              </table></div>
              {(() => {
                const auditTotalPgs = Math.max(1, Math.ceil(auditLog.length / INV_PAGE_SIZE));
                const auditSafePg   = Math.min(auditPage, auditTotalPgs);
                return <Paginator page={auditSafePg} totalPages={auditTotalPgs} setPage={setAuditPage} total={auditLog.length} pageSize={INV_PAGE_SIZE} noun="รายการ" />;
              })()}
            </Card>
          </div>
        );
      })()}

      {/* ── TIV Abbreviated Invoice Modal ── */}
      {tivModal && <TIVDocModal tiv={tivModal} onClose={()=>setTivModal(null)} toast={toast}
        onVoid={()=>{setTivModal(null);setVoidReason('');setVoidModal(tivModal);}} />}

      {/* ── Amend/Cancel INV → CN/DN/Correction ── */}
      {amendModal && (
        <AmendINVModal
          inv={amendModal}
          onConfirm={(newDoc) => { refresh(); setAmendModal(null); setA4Modal(newDoc); }}
          onClose={() => setAmendModal(null)}
          toast={toast}
        />
      )}

      {/* ── Issue Full INV from TIV ── */}
      {issueINVModal && (
        <IssueINVModal
          tiv={issueINVModal}
          onConfirm={(newInv) => { refresh(); setIssueINVModal(null); setA4Modal(newInv); }}
          onClose={() => setIssueINVModal(null)}
          toast={toast}
        />
      )}

      {/* ── Void Invoice Detail Modal ── */}
      {voidDetail && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setVoidDetail(null)}>
          <div className="md" style={{ width:640 }}>
            <div className="md-h">
              <span className="md-t">รายละเอียดใบกำกับที่ยกเลิก · <span style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{voidDetail.no}</span></span>
              <div style={{ display:'flex', gap:8 }}>
                <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF(
                  `ใบกำกับยกเลิก ${voidDetail.no}`,
                  ['#','รหัส','สินค้า','น้ำหนัก KG','ราคา/KG','รวม'],
                  (voidDetail.items||[]).map((it,i)=>[i+1,it.code,it.name,Number(it.weight).toFixed(2),it.price,window.fmtMoney(it.weight*it.price)]),
                  `ลูกค้า: ${voidDetail.custName} · วันที่: ${voidDetail.dateDisplay}`
                )}>PDF</Button>
                <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setVoidDetail(null)}>✕</button>
              </div>
            </div>
            <div className="md-b">
              {/* Void info */}
              <div style={{ marginBottom:14, padding:'12px 14px', background:'var(--rbg)', borderRadius:'var(--rs)', border:'1px solid rgba(208,48,48,.15)' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'var(--rd)', marginBottom:10 }}>ข้อมูลการยกเลิก</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 20px', fontSize:12.5 }}>
                  {[['เลขที่ INV/TIV', voidDetail.no],['TIV อ้างอิง', voidDetail.thermalNo||'—'],
                    ['ลูกค้า', voidDetail.custName],['วันที่บิล', voidDetail.dateDisplay],
                    ['ยกเลิกเมื่อ', fmtVoidDate(voidDetail.voidedAt)],['ผู้ยกเลิก', voidDetail.voidedBy||'—'],
                    ['เหตุผล', voidDetail.voidReason||'—'],
                    ['สถานะสต็อก', voidDetail.stockRestored ? '✓ คืนสต็อกแล้ว' : voidDetail.voidReason === 'ออกใบทดแทน' ? '— ไม่คืนสต็อก (ออกใบทดแทน)' : 'ยังไม่คืน'],
                  ].map(([l,v])=>(
                    <div key={l}><span style={{ color:'var(--t2)' }}>{l}: </span><b style={{ color:l==='สถานะสต็อก'&&voidDetail.stockRestored?'var(--gn)':undefined }}>{v}</b></div>
                  ))}
                </div>
              </div>
              {/* Items table */}
              <div style={{ fontSize:13, fontWeight:700, marginBottom:8 }}>รายการสินค้า ({(voidDetail.items||[]).length} รายการ)</div>
              <div className="tw">
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
                  <thead><tr style={{ background:'var(--s2)' }}>
                    {['#','รหัส','สินค้า','น้ำหนัก (KG)','ราคา/KG','รวม'].map(h=>(
                      <th key={h} style={{ padding:'7px 10px', textAlign:['น้ำหนัก (KG)','ราคา/KG','รวม'].includes(h)?'right':'left', fontSize:11, fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)', background:'var(--s2)', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {(voidDetail.items||[]).map((it,i)=>(
                      <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                        <td style={{ padding:'7px 10px', color:'var(--t3)', fontSize:11 }}>{i+1}</td>
                        <td style={{ padding:'7px 10px', fontFamily:'var(--font-mono)', fontSize:11 }}>{it.code}</td>
                        <td style={{ padding:'7px 10px', fontWeight:600 }}>{it.name}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right' }}>{window.fmtItemQty(Number(it.weight), it.code)}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', color:'var(--t2)' }}>฿{it.price}</td>
                        <td style={{ padding:'7px 10px', textAlign:'right', fontWeight:700 }}>{window.fmtMoney(it.weight*it.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr style={{ background:'var(--s2)', fontWeight:700 }}>
                    <td colSpan="5" style={{ padding:'8px 10px', textAlign:'right', fontSize:13 }}>ยอดรวม</td>
                    <td style={{ padding:'8px 10px', textAlign:'right', fontSize:14, color:'var(--gn)' }}>{$(voidDetail.total)}</td>
                  </tr></tfoot>
                </table>
              </div>
              <div style={{ marginTop:12, display:'flex', justifyContent:'space-between', fontSize:12.5, color:'var(--t2)' }}>
                <span>VAT 7%: <b style={{ color:'var(--pu)' }}>{$(voidDetail.vat7||0)}</b></span>
                <span>ชำระ: <b>{{cash:'เงินสด',transfer:'โอนเงิน',credit:'เครดิต'}[voidDetail.pay]||'—'}</b></span>
                <span className={'bx xr'} style={{ fontSize:12 }}>ยกเลิกแล้ว</span>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setVoidDetail(null)}>ปิด</Button>
              <Button variant="bp" icon="file-text" onClick={()=>{
                setVoidDetail(null);
                if (voidDetail.type==='Thermal' || voidDetail.type==='TIV' || !voidDetail.type) {
                  setTivModal(voidDetail);
                } else {
                  setA4Modal(voidDetail);
                }
              }}>ดูเอกสาร</Button>
            </div>
          </div>
        </div>
      )}

      {voidModal && (
        <div className="ov">
          <div className="md" style={{ width:420 }}>
            <div style={{ padding:'20px 22px 0', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="x-circle" size={24}/></div>
              <div style={{ fontSize:17, fontWeight:800, color:'var(--rd)', marginBottom:4 }}>ยกเลิกใบกำกับภาษี</div>
              <div style={{ fontSize:13, color:'var(--t2)', marginBottom:16 }}>ระบบจะคืนสต็อกอัตโนมัติ</div>
              <div style={{ background:'var(--rbg)', borderRadius:'var(--rs)', padding:'14px 16px', fontSize:13, textAlign:'left', marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                  <span style={{ color:'var(--t2)' }}>เลขที่</span>
                  <div style={{ textAlign:'right' }}>
                    <b style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{voidModal.no}</b>
                    {voidModal.type!=='A4' && voidModal.fullInvNo && <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>+ INV: {voidModal.fullInvNo}</div>}
                    {voidModal.type==='A4' && voidModal.thermalNo && <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>+ TIV: {voidModal.thermalNo}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}><span style={{ color:'var(--t2)' }}>ลูกค้า</span><b>{voidModal.custName}</b></div>
                <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--t2)' }}>ยอดรวม</span><b style={{ color:'var(--gn)' }}>{$(voidModal.total)}</b></div>
              </div>
              <div style={{ textAlign:'left', marginBottom:4 }}>
                <label className="fl">เหตุผลการยกเลิก <span className="req">*</span></label>
                <select className="fc" value={voidReason} onChange={e=>setVoidReason(e.target.value)}>
                  <option value="">-- เลือกเหตุผล --</option>
                  <option>ลูกค้าต้องการยกเลิก</option>
                  <option>ข้อมูลผิดพลาด</option>
                  <option>ยกเลิกคำสั่งซื้อ</option>
                  <option>อื่นๆ</option>
                </select>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>{setVoidModal(null);setVoidReason('');}}>ยกเลิก</Button>
              <button onClick={doVoid} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                <Icon name="x-circle" size={15} style={{ color:'#fff' }}/> ยืนยันยกเลิกทั้งใบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Adjustment type config ── */
const ADJ_TYPES = [
  { id:'recount',  label:'นับสต็อก',    iconName:'search',    desc:'เปรียบเทียบสต็อกจริงกับระบบ (ผลต่าง +/-)' },
  { id:'increase', label:'เพิ่มสต็อก+', icon:'▲',             desc:'พบสต็อกเพิ่ม / รับคืน / แก้ไข' },
  { id:'decrease', label:'ลดสต็อก−',   icon:'▼',             desc:'หมดอายุ / เสียหาย / สูญหาย' },
];
const REASON_BY_TYPE = {
  recount:  ['นับสต็อกใหม่','ตรวจนับประจำงวด','ตรวจนับประจำปี','อื่นๆ'],
  increase: ['พบสต็อกเพิ่ม','รับคืนสินค้า','แก้ไขข้อผิดพลาด','อื่นๆ'],
  decrease: ['หมดอายุ','เสียหาย / ชำรุด','สูญหาย','สต็อกออกเอง','อื่นๆ'],
};

/* ═══ STOCK MANAGEMENT ═══ */
function StockManage({ toast }) {
  const D = window.SP_DATA;
  const [tab, setTab]       = React.useState('balance');
  /* ── Balance tab ── */
  const [balSearch,      setBalSearch]      = React.useState('');
  const [balPage,        setBalPage]        = React.useState(1);
  const [balCat,         setBalCat]         = React.useState('all');
  const [balStockFilter, setBalStockFilter] = React.useState('all');
  const BAL_PAGE_SIZE = 20;
  /* ── GRN tab ── */
  const [grnSearch, setGrnSearch] = React.useState('');
  const [grnFrom,   setGrnFrom]   = React.useState(() => window.toLocalISODate());
  const [grnTo,     setGrnTo]     = React.useState(() => window.toLocalISODate());
  /* ── Movement tab ── */
  const [mvSub, setMvSub]   = React.useState('flat');
  const [mvSearch, setMvSearch] = React.useState('');
  const [mvType, setMvType]   = React.useState('all');
  const [mvFrom, setMvFrom]   = React.useState(() => window.toLocalISODate());
  const [mvTo, setMvTo]       = React.useState(() => window.toLocalISODate());
  /* ── Multi-item stock adjustment ── */
  const [adjMode, setAdjMode]         = React.useState('scan');  // 'scan' | 'search'
  const [adjItems, setAdjItems]       = React.useState([]);      // [{key,code,name,before,adj}]
  const [adjBc, setAdjBc]             = React.useState('');
  const [adjBcStatus, setAdjBcStatus] = React.useState('');
  const [adjSearchCode, setAdjSearchCode] = React.useState('');
  const [adjSearchQty, setAdjSearchQty]   = React.useState('');
  const [adjSearchText, setAdjSearchText] = React.useState('');   // คำค้นในช่องค้นหาสินค้า
  const [adjSearchOpen, setAdjSearchOpen] = React.useState(false); // แสดง/ซ่อน dropdown ผลค้นหา
  /* ── ตัวกรองรายงานการปรับปรุงสต็อก ── */
  const [adjLogSearch, setAdjLogSearch] = React.useState('');   // ค้นหาเลขที่เอกสาร
  const [adjLogType, setAdjLogType]     = React.useState('all'); // ประเภท
  const [adjLogReason, setAdjLogReason] = React.useState('all'); // เหตุผล
  const [adjLogFrom, setAdjLogFrom]     = React.useState(() => window.toLocalISODate());
  const [adjLogTo, setAdjLogTo]         = React.useState(() => window.toLocalISODate());
  const [adjType, setAdjType]     = React.useState('recount');
  const [adjReason, setAdjReason] = React.useState('นับสต็อกใหม่');
  const [adjNote, setAdjNote]     = React.useState('');
  const [adjApprover, setAdjApprover] = React.useState(() => window.SP_DATA?.user?.name || 'Admin');
  const [adjConfirm, setAdjConfirm]   = React.useState(false);
  const [adjDoc, setAdjDoc]           = React.useState(null);
  const [adjLogsState, setAdjLogsState] = React.useState(() => window.SP_STATE.adjLogs || []);
  const adjBcRef = React.useRef(null);
  const [grns, setGrns]       = React.useState(() => window.SP_STATE.grnLogs);
  const [docModal, setDocModal] = React.useState(null);
  const [grnViewDoc, setGrnViewDoc] = React.useState(null);
  /* Ledger version — increments when reloadLedger() is called */
  const [ledgerVer, setLedgerVer] = React.useState(() => window.SP_LEDGER_VERSION || 0);

  /* Reload GRN list from DB when switching to grn tab */
  React.useEffect(() => {
    if (tab !== 'grn') return;
    if (window.SP_API) {
      window.SP_API.reloadGRN()
        .then(data => setGrns([...data]))
        .catch(() => setGrns([...window.SP_STATE.grnLogs]));
    } else {
      setGrns([...window.SP_STATE.grnLogs]);
    }
  }, [tab]);

  /* Reload ledger from DB when switching to movement tab */
  React.useEffect(() => {
    if (tab === 'movement' && window.SP_API) {
      window.SP_API.reloadLedger()
        .then(() => setLedgerVer(v => v + 1))
        .catch(() => setLedgerVer(v => v + 1)); // trigger re-render even on error
    }
  }, [tab]);

  /* Poll SP_LEDGER_VERSION every 1s so new GRN/sale entries show without switching tab */
  React.useEffect(() => {
    const id = setInterval(() => {
      const cur = window.SP_LEDGER_VERSION || 0;
      setLedgerVer(prev => prev !== cur ? cur : prev);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* Sync adj signs when type changes */
  React.useEffect(() => {
    if (!adjItems.length) return;
    setAdjItems(prev => prev.map(it => {
      if (adjType === 'increase') return { ...it, adj:  Math.abs(it.adj || 0) };
      if (adjType === 'decrease') return { ...it, adj: -Math.abs(it.adj || 0) };
      return it; // recount: keep signed as-is
    }));
    /* Reset reason when type changes */
    setAdjReason(REASON_BY_TYPE[adjType]?.[0] || '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjType]);

  const $ = window.fmtMoney;

  /* Combined ledger: DB ledger + live ADJ entries — sorted by date DESC
     Re-computes when adjLogsState OR ledgerVer changes */
  const allLedgerData = React.useMemo(() => {
    const adj = (window.SP_STATE.adjLedger || []);
    return [...(D.ledger || []), ...adj].sort((a,b) =>
      (b.dateISO||'').localeCompare(a.dateISO||'') || (b.time||'').localeCompare(a.time||'')
    );
  }, [adjLogsState, ledgerVer]);

  /* filter ledger */
  const ledger = allLedgerData.filter(l => {
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
    // เก็บ "คงเหลือ" จากรายการล่าสุด (ตัวแรกที่เจอ เพราะ ledger เรียงใหม่→เก่า) ไม่ใช่รายการสุดท้ายที่ loop ผ่าน
  });
  const prodGroups = Object.values(byProd);

  /* Document link click — opens preview modal */
  const openDoc = (ref, refType) => {
    if (!ref || ref === '—') return;
    const pfx = window.SP_STATE.docPrefixes || {};
    const isGRN = ref.startsWith(pfx.grn||'GRN');
    const isADJ = ref.startsWith(pfx.adj||'ADJ');
    // TIV, INV, ISS all show invoice preview
    const isInvoice = ref.startsWith(pfx.tiv||'TIV') || ref.startsWith(pfx.inv||'INV') || ref.startsWith(pfx.iss||'ISS');

    if (isADJ) {
      const doc = (window.SP_STATE.adjLogs||[]).find(d=>d.id===ref);
      if (doc) { setAdjDoc(doc); return; }
    }
    if (isGRN) {
      const grn = (window.SP_STATE.grnLogs||[]).find(g=>g.id===ref||g.grn_no===ref);
      if (grn) { setGrnViewDoc(grn); return; }
      // ไม่พบใน memory → ลอง fetch จาก API
      if (window.SP_API) {
        window.SP_API.reloadGRN().then(() => {
          const g2 = (window.SP_STATE.grnLogs||[]).find(x=>x.id===ref||x.grn_no===ref);
          if (g2) setGrnViewDoc(g2);
          else toast('info', `GRN ${ref} — โหลดข้อมูลไม่ได้`);
        }).catch(()=>toast('info', `GRN ${ref}`));
      } else toast('info', `GRN ${ref}`);
      return;
    }
    if (isInvoice) {
      const inv = (window.SP_STATE.invoices||[]).find(i=>i.no===ref);
      if (inv) { setDocModal({ type:'inv', data:inv }); return; }
      // ไม่พบ → reload
      if (window.SP_API) {
        window.SP_API.reloadInvoices().then(() => {
          const i2 = (window.SP_STATE.invoices||[]).find(x=>x.no===ref);
          if (i2) setDocModal({ type:'inv', data:i2 });
          else toast('info', `${ref} — โหลดข้อมูลไม่ได้`);
        }).catch(()=>toast('info', ref));
      } else toast('info', ref);
      return;
    }
    toast('info', `${ref}${refType?' · '+refType:''}`);
  };

  /* Shared column header styles */
  const TH = { padding:'8px 12px', textAlign:'left', fontSize:11.5, fontWeight:800, color:'#0f172a', borderBottom:'2px solid #475569', background:'#f1f5f9', whiteSpace:'nowrap' };
  const THR = { ...TH, textAlign:'right' };
  const TD = { padding:'10px 12px', borderBottom:'1px solid var(--bd)', verticalAlign:'middle' };
  const TDR = { ...TD, textAlign:'right' };

  /* ── Scan barcode for adjustment — accumulates on same product ── */
  const scanAdj = (raw) => {
    const parsed = window.parseBarcode(raw);
    if (!parsed) { setAdjBcStatus('err'); toast('err','บาร์โค้ดไม่ถูกต้อง'); return; }
    setAdjBcStatus('ok');
    const prod = parsed.prod;
    setAdjItems(prev => {
      const existing = prev.find(it => it.code === parsed.code);
      const newScanned = existing ? +(existing.scannedTotal + parsed.weight).toFixed(4) : parsed.weight;
      let adj;
      if (adjType === 'increase') {
        adj = newScanned;                                    // + always
      } else if (adjType === 'decrease') {
        adj = -newScanned;                                   // − always
      } else {
        /* recount: kg = ห้าม merge (แต่ละชิ้นแยกแถว), non-kg = merge สะสม, before=0 */
        const isKg = window.unitOf ? window.unitOf(parsed.code).unitType === 'kg' : true;
        if (isKg) {
          adj = +parsed.weight.toFixed(4);
          return [...prev, { key: Date.now() + Math.random(), code: parsed.code, name: prod.name,
                             before: 0, scannedTotal: parsed.weight, adj, mode:'scan' }];
        }
        adj = +newScanned.toFixed(4);
      }
      if (existing && window.unitOf(parsed.code).unitType !== 'kg') {
        return prev.map(it => it.code === parsed.code ? { ...it, scannedTotal: newScanned, adj } : it);
      }
      return [...prev, { key: Date.now(), code: parsed.code, name: prod.name,
                         before: 0, scannedTotal: newScanned, adj, mode:'scan' }];
    });
    setAdjBc('');
    setTimeout(() => adjBcRef.current && adjBcRef.current.focus(), 0);
  };

  /* ── Add item via product search — enforce sign based on adjType ── */
  const addSearchItem = () => {
    const prod = D.products.find(p => p.code === adjSearchCode);
    let qty = parseFloat(adjSearchQty);
    if (!prod || isNaN(qty)) { toast('err','กรุณาเลือกสินค้าและใส่ปริมาณ'); return; }

    if (adjType === 'recount') {
      const newCount = Math.max(0, qty);
      if (newCount <= 0) { toast('err','กรุณาใส่จำนวนที่นับได้'); return; }
      const adj = +newCount.toFixed(4);
      setAdjItems(prev => {
        const existing = prev.find(it => it.code === prod.code);
        if (existing) {
          return prev.map(it => it.code === prod.code
            ? { ...it, newCount, adj: +newCount.toFixed(4) }
            : it);
        }
        return [...prev, { key: Date.now(), code: prod.code, name: prod.name,
                           before: 0, scannedTotal: null, newCount, adj, mode:'search' }];
      });
    } else {
      if (qty === 0) { toast('err','กรุณาเลือกสินค้าและใส่ปริมาณ'); return; }
      if (adjType === 'increase') qty =  Math.abs(qty);
      if (adjType === 'decrease') qty = -Math.abs(qty);
      setAdjItems(prev => {
        const existing = prev.find(it => it.code === prod.code);
        if (existing) {
          return prev.map(it => it.code === prod.code
            ? { ...it, adj: +(it.adj + qty).toFixed(4) }
            : it);
        }
        return [...prev, { key: Date.now(), code: prod.code, name: prod.name,
                           before: prod.stock, scannedTotal: null, adj: qty, mode:'search' }];
      });
    }
    setAdjSearchQty('');
    setAdjSearchText('');
    setAdjSearchCode('');
    setAdjSearchOpen(false);
  };

  /* ── ผลค้นหาสินค้า (autocomplete) สำหรับโหมดค้นหารายการ ── */
  const filteredAdjProducts = (() => {
    const q = adjSearchText.trim().toLowerCase();
    if (!q) return D.products.slice(0, 8);
    return D.products.filter(p => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)).slice(0, 12);
  })();
  const adjPickedProd = D.products.find(p => p.code === adjSearchCode);

  const [adjSaving, setAdjSaving] = React.useState(false);

  /* ── Confirm adjustment — apply (before + adj), create ADJ doc, push to ledger ── */
  const doAdj = async () => {
    if (adjSaving) return;
    setAdjSaving(true);
    setAdjConfirm(false);
    const st  = window.SP_STATE;
    const now = new Date();

    /* For recount: aggregate kg rows by code (each barcode scan = separate row) */
    let itemsToResolve = adjItems;
    if (adjType === 'recount') {
      const kgIdx = {};
      const agg = [];
      adjItems.forEach(it => {
        const isKg = window.unitOf ? window.unitOf(it.code).unitType === 'kg' : true;
        if (isKg && kgIdx[it.code] !== undefined) {
          const prev = agg[kgIdx[it.code]];
          const totalScanned = +((prev.scannedTotal || 0) + (it.scannedTotal || 0)).toFixed(4);
          const prod = D.products.find(p => p.code === it.code);
          const stock = prod ? prod.stock : it.before;
          agg[kgIdx[it.code]] = { ...prev, scannedTotal: totalScanned, adj: +(totalScanned - stock).toFixed(4) };
        } else {
          if (isKg) kgIdx[it.code] = agg.length;
          agg.push({ ...it });
        }
      });
      itemsToResolve = agg;
    }

    /* Resolve before/after */
    const resolvedItems = itemsToResolve.map(it => {
      const prod   = D.products.find(p => p.code === it.code);
      const before = prod ? prod.stock : (it.before || 0);
      /* recount: adj = scannedTotal (absolute count from 0), so after = scannedTotal */
      const after  = adjType === 'recount'
        ? Math.max(0, it.scannedTotal != null ? it.scannedTotal : Math.abs(it.adj))
        : Math.max(0, before + it.adj);
      const adj    = +(after - before).toFixed(4);
      return { ...it, before, after, adj };
    });

    /* ── บันทึกลง DB (ถ้าไม่สำเร็จ จะ fall through ไปบันทึกแบบ local แทน ไม่ทิ้งข้อมูล) ── */
    if (window.SP_API && typeof window.SP_API.createAdj === 'function') {
      try {
        const adjPfxDB = (window.SP_STATE.docPrefixes?.adj) || 'ADJ';
        const result = await window.SP_API.createAdj({
          adj_date:   now.toISOString().slice(0,10),
          prefix:     adjPfxDB,
          adj_type:   adjType,
          reason:     adjReason,
          note:       adjNote,
          approver:   adjApprover,
          items:      resolvedItems,
          created_by: 1,
        });

        const docId = result.adj_no;

        /* อัป local stock ให้ UI เห็นทันที */
        resolvedItems.forEach(it => {
          const prod = D.products.find(p => p.code === it.code);
          if (prod) prod.stock = it.after;
          const sp = (window.SP_STATE.products||[]).find(p => p.code === it.code);
          if (sp) sp.stock = it.after;
        });

        /* Push to local ledger */
        const timeStr = now.toLocaleTimeString('th-TH', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
        const ledgerEntries = resolvedItems.map(it => ({
          dateISO: now.toISOString().slice(0,10), date: window.fmtDate(), time: timeStr,
          type: it.adj >= 0 ? 'in' : 'out', code: it.code, prod: it.name,
          w: Math.abs(it.adj), ref: docId,
          refType: `ปรับปรุงสต็อก (${adjReason})`, channel: adjType, bal: it.after,
        }));
        if (!st.adjLedger) st.adjLedger = [];
        st.adjLedger = [...ledgerEntries, ...st.adjLedger];

        const doc = {
          id: docId, date: now.toISOString().slice(0,10), dateDisplay: window.fmtDate(),
          adjType, reason: adjReason, note: adjNote, approver: adjApprover,
          items: resolvedItems, totalItems: resolvedItems.length,
          totalAdj: resolvedItems.reduce((s,it)=>s+it.adj,0),
          totalBefore: resolvedItems.reduce((s,it)=>s+it.before,0),
          totalAfter:  resolvedItems.reduce((s,it)=>s+it.after,0),
        };
        if (!st.adjLogs) st.adjLogs = [];
        st.adjLogs = [doc, ...st.adjLogs];
        setAdjLogsState([...st.adjLogs]);
        setAdjDoc(doc);
        setAdjItems([]);
        setAdjNote('');
        toast('ok', `ปรับปรุงสต็อก ${docId} ลง DB เรียบร้อย — ${resolvedItems.length} รายการ`);
        setAdjSaving(false);
        return;

      } catch (err) {
        console.warn('[StockManage] createAdj ไม่สำเร็จ (บันทึกในเครื่องแทน):', err.message);
        /* ไม่ return — ตกไปบันทึกแบบ local ด้านล่าง เพื่อไม่ให้ข้อมูลหาย */
      }
    }

    /* ── fallback: บันทึกในเครื่อง (DB ใช้ไม่ได้ หรือไม่มี API) ── */
    if (!st.adjCounter) st.adjCounter = 1;
    if (!st.adjLogs)    st.adjLogs    = [];
    if (!st.adjLedger)  st.adjLedger  = [];
    const pfx   = (st.docPrefixes?.adj) || 'ADJ';
    const docId = window.nextDocNo('adjCounter', pfx, true);
    resolvedItems.forEach(it => { const p = D.products.find(x=>x.code===it.code); if(p) p.stock=it.after; });
    const timeStr = now.toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
    st.adjLedger = [...resolvedItems.map(it=>({
      dateISO:now.toISOString().slice(0,10),date:window.fmtDate(),time:timeStr,
      type:it.adj>=0?'in':'out',code:it.code,prod:it.name,w:Math.abs(it.adj),
      ref:docId,refType:`ปรับปรุงสต็อก (${adjReason})`,channel:adjType,bal:it.after,
    })), ...st.adjLedger];
    const doc = {
      id:docId,date:now.toISOString().slice(0,10),dateDisplay:window.fmtDate(),
      adjType,reason:adjReason,note:adjNote,approver:adjApprover,items:resolvedItems,
      totalItems:resolvedItems.length,totalAdj:resolvedItems.reduce((s,it)=>s+it.adj,0),
      totalBefore:resolvedItems.reduce((s,it)=>s+it.before,0),totalAfter:resolvedItems.reduce((s,it)=>s+it.after,0),
    };
    st.adjLogs=[doc,...st.adjLogs];
    setAdjLogsState([...st.adjLogs]);
    setAdjDoc(doc); setAdjItems([]); setAdjNote('');
    toast('ok',`ปรับปรุงสต็อก ${docId} เรียบร้อย (บันทึกในเครื่อง) — ${resolvedItems.length} รายการ`);
    setAdjSaving(false);
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
      <DateField style={{ width:140 }} value={mvFrom} onChange={e=>setMvFrom(e.target.value)} />
      <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
      <DateField style={{ width:140 }} value={mvTo} onChange={e=>setMvTo(e.target.value)} />
      {(mvFrom||mvTo||mvSearch||mvType!=='all') && <button className="btn bg2 bsm" onClick={()=>{setMvFrom(window.toLocalISODate());setMvTo(window.toLocalISODate());setMvSearch('');setMvType('all');}}>รีเซ็ต</button>}
      <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('movement.csv',['วันที่','เวลา','เอกสาร','ประเภทรายการ','สินค้า','รหัส','เพิ่ม KG','ลด KG','คงเหลือ'],ledger.map(l=>[l.date,l.time||'',l.ref,l.refType||'',l.prod,l.code,l.type==='in'?l.w.toFixed(4):'',l.type!=='in'?l.w.toFixed(4):'',l.bal.toFixed(4)]))}>CSV</Button>
      <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายงานความเคลื่อนไหวสต็อก',['วันที่','เวลา','เอกสาร','ประเภทรายการ','สินค้า','รหัส','เพิ่ม KG','ลด KG','คงเหลือ'],ledger.map(l=>[l.date,l.time||'',l.ref,l.refType||'',l.prod,l.code,l.type==='in'?l.w.toFixed(4):'',l.type!=='in'?l.w.toFixed(4):'',l.bal.toFixed(4)]))}>PDF</Button>
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
        <div style={{ fontSize:26, fontWeight:800, color:'var(--gn)' }}>{totalIn.toFixed(2)} <span style={{ fontSize:13 }}>KG</span></div>
        <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>incl. Void return</div>
      </div>
      <div className="card" style={{ padding:'16px 18px' }}>
        <div style={{ fontSize:12, color:'var(--t2)', marginBottom:6 }}>ตัดออกรวม</div>
        <div style={{ fontSize:26, fontWeight:800, color:'var(--rd)' }}>{totalOut.toFixed(2)} <span style={{ fontSize:13 }}>KG</span></div>
      </div>
    </div>
  );

  /* ── ตัวกรองรายงานการปรับปรุงสต็อก: ค้นหาเลขที่/ช่วงวันที่/ประเภท/เหตุผล ── */
  const adjLogReasons = ['all', ...Array.from(new Set(adjLogsState.map(d=>d.reason).filter(Boolean)))];
  const filteredAdjLogs = adjLogsState.filter(doc => {
    if (adjLogType !== 'all' && doc.adjType !== adjLogType) return false;
    if (adjLogReason !== 'all' && doc.reason !== adjLogReason) return false;
    if (adjLogFrom && doc.date < adjLogFrom) return false;
    if (adjLogTo   && doc.date > adjLogTo)   return false;
    if (adjLogSearch && !doc.id.toLowerCase().includes(adjLogSearch.trim().toLowerCase())) return false;
    return true;
  });
  const adjLogFilterActive = adjLogSearch || adjLogType!=='all' || adjLogReason!=='all' || adjLogFrom || adjLogTo;
  const clearAdjLogFilters = () => { setAdjLogSearch(''); setAdjLogType('all'); setAdjLogReason('all'); setAdjLogFrom(''); setAdjLogTo(''); };

  /* ── Pagination (component-level hooks) ── */
  const SM_PAGE = 30;
  const ledgerPag = usePagination(ledger,          SM_PAGE);
  const adjLogPag = usePagination(filteredAdjLogs, SM_PAGE);

  return (
    <div>
      <div className="tabs">
        <button type="button" className={'tab'+(tab==='balance'?' on':'')} onClick={()=>setTab('balance')}>รายงานสินค้าคงเหลือ</button>
        <button type="button" className={'tab'+(tab==='movement'?' on':'')} onClick={()=>setTab('movement')}>รายงานความเคลื่อนไหวสต็อก</button>
        <button type="button" className={'tab'+(tab==='adjust'?' on':'')} onClick={()=>setTab('adjust')}>ปรับปรุงสต็อก</button>
        <button type="button" className={'tab'+(tab==='adjlog'?' on':'')} onClick={()=>setTab('adjlog')}>รายงานการปรับปรุง</button>
        <button type="button" className={'tab'+(tab==='grn'?' on':'')} onClick={()=>setTab('grn')}>รายงานรับเข้าสินค้า (GRN)</button>
      </div>

      {/* ── Tab: ยอดคงเหลือ ── */}
      {tab==='balance' && (() => {
        const balCats = ['all', ...Array.from(new Set(D.products.map(p=>p.cat).filter(Boolean))).sort()];
        const BAL_STOCK_OPTS = [
          { value:'all',  label:'ทั้งหมด' },
          { value:'ok',   label:'ปกติ (มีสต็อก)' },
          { value:'low',  label:'ต่ำกว่าขั้นต่ำ' },
          { value:'zero', label:'หมดสต็อก (= 0)' },
          { value:'pos',  label:'มีสต็อก (> 0)' },
        ];
        const balFiltered = D.products.filter(p => {
          if (balCat !== 'all' && p.cat !== balCat) return false;
          if (balStockFilter === 'zero' && p.stock > 0) return false;
          if (balStockFilter === 'pos'  && p.stock <= 0) return false;
          if (balStockFilter === 'low'  && p.stock >= p.min) return false;
          if (balStockFilter === 'ok'   && (p.stock <= 0 || p.stock < p.min)) return false;
          if (balSearch) {
            const s = balSearch.toLowerCase();
            if (!p.code.toLowerCase().includes(s) && !p.name.toLowerCase().includes(s)) return false;
          }
          return true;
        });
        const balFilterActive = balSearch || balCat !== 'all' || balStockFilter !== 'all';
        const balTotalPages = Math.max(1, Math.ceil(balFiltered.length / BAL_PAGE_SIZE));
        const balSafePage   = Math.min(balPage, balTotalPages);
        const balSlice      = balFiltered.slice((balSafePage-1)*BAL_PAGE_SIZE, balSafePage*BAL_PAGE_SIZE);
        return (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
            <StatCard icon="package"   iconTone="ac" label="สินค้าทั้งหมด"  value={D.products.length+' รายการ'} />
            <StatCard icon="check"     iconTone="gn" label="มีสต็อก"         value={D.products.filter(p=>p.stock>0).length+' รายการ'} />
            <StatCard icon="warehouse" iconTone="am" label="ใกล้หมด/หมด"    value={D.products.filter(p=>p.stock<p.min).length+' รายการ'} valueTone="am" />
            <StatCard icon="coin"      iconTone="gn" label="มูลค่าสต็อก"     value={'฿'+Math.round(D.products.reduce((s,p)=>s+p.stock*p.cost,0)/1000)+'k'} valueTone="gn" />
          </div>
          {/* Filter bar */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:'10px 14px', flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <input className="fc" placeholder="รหัส / ชื่อสินค้า…" style={{ paddingLeft:30, width:190 }} value={balSearch} onChange={e=>{ setBalSearch(e.target.value); setBalPage(1); }} />
              <Icon name="search" size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
            </div>
            <select className="fc" style={{ width:150 }} value={balCat} onChange={e=>{ setBalCat(e.target.value); setBalPage(1); }}>
              {balCats.map(c=><option key={c} value={c}>{c==='all'?'ทุกหมวด':c}</option>)}
            </select>
            <select className="fc" style={{ width:170 }} value={balStockFilter} onChange={e=>{ setBalStockFilter(e.target.value); setBalPage(1); }}>
              {BAL_STOCK_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            {balFilterActive && (
              <button className="btn bg2 bsm" onClick={()=>{ setBalSearch(''); setBalCat('all'); setBalStockFilter('all'); setBalPage(1); }}>ล้างตัวกรอง</button>
            )}
            <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
              <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('stock_balance.csv',['รหัส','ชื่อสินค้า','หมวด','ราคาขาย/หน่วย','ราคาทุน/หน่วย','คงเหลือ','ขั้นต่ำ','สถานะ','มูลค่าสต็อก'],balFiltered.map(p=>{const ul=p.unitLabel||'KG';return[p.code,p.name,p.cat,p.sell,p.cost,window.fmtQty(p.stock,ul),window.fmtQty(p.min,ul),p.stock<=0?'หมดสต็อก':p.stock<p.min?'ต่ำกว่าขั้นต่ำ':'ปกติ',(p.stock*p.cost).toFixed(2)]}))}>CSV</Button>
              <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('ยอดคงเหลือสต็อก',['รหัส','ชื่อสินค้า','หมวด','ราคาขาย/หน่วย','ราคาทุน/หน่วย','คงเหลือ','ขั้นต่ำ','สถานะ','มูลค่าสต็อก'],balFiltered.map(p=>{const ul=p.unitLabel||'KG';return[p.code,p.name,p.cat,p.sell,p.cost,window.fmtQty(p.stock,ul),window.fmtQty(p.min,ul),p.stock<=0?'หมดสต็อก':p.stock<p.min?'ต่ำกว่าขั้นต่ำ':'ปกติ',(p.stock*p.cost).toFixed(2)]}))}>PDF</Button>
            </div>
          </div>
          <Card title={`ยอดคงเหลือสต็อก · ${balFiltered.length} รายการ`}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>ชื่อสินค้า</th><th style={TH}>หมวด</th>
                <th style={THR}>ราคาขาย/หน่วย</th><th style={THR}>ราคาทุน/หน่วย</th>
                <th style={TH}>คงเหลือ</th><th style={TH}>ขั้นต่ำ</th><th style={TH}>สถานะ</th><th style={THR}>มูลค่าสต็อก</th>
              </tr></thead>
              <tbody>{balSlice.map(p=>{ const uLabel = p.unitLabel || 'KG'; return (
                <tr key={p.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={TD}><span className="mono">{p.code}</span></td>
                  <td style={{ ...TD, fontWeight:600 }}>{p.name}</td>
                  <td style={TD}>{p.cat}</td>
                  <td style={TDR}>{$(p.sell)}<span style={{ fontSize:11, color:'var(--t3)' }}>/{uLabel}</span></td>
                  <td style={{ ...TDR, color:'var(--t2)' }}>{$(p.cost)}<span style={{ fontSize:11, color:'var(--t3)' }}>/{uLabel}</span></td>
                  <td style={{ ...TD, fontWeight:700 }}>{window.fmtQty(p.stock, uLabel)}</td>
                  <td style={{ ...TD, color:'var(--t3)' }}>{window.fmtQty(p.min, uLabel)}</td>
                  <td style={TD}><StockPill stock={p.stock} min={p.min} unitLabel={uLabel}/></td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(p.stock*p.cost)}</td>
                </tr>
              )})}
              </tbody>
            </table></div>
            {balTotalPages > 1 && (
              <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:6, marginTop:12, paddingTop:10, borderTop:'1px solid var(--bd)' }}>
                <button className="btn bg2 bsm" onClick={()=>setBalPage(p=>Math.max(1,p-1))} disabled={balSafePage===1}>‹ ก่อนหน้า</button>
                {Array.from({length:balTotalPages},(_,i)=>i+1).map(pg=>(
                  <button key={pg} className={'btn bsm '+(pg===balSafePage?'bp':'bg2')} onClick={()=>setBalPage(pg)}>{pg}</button>
                ))}
                <button className="btn bg2 bsm" onClick={()=>setBalPage(p=>Math.min(balTotalPages,p+1))} disabled={balSafePage===balTotalPages}>ถัดไป ›</button>
                <span style={{ fontSize:12, color:'var(--t3)', marginLeft:4 }}>{balSafePage}/{balTotalPages} หน้า</span>
              </div>
            )}
          </Card>
        </div>
        );
      })()}

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
                  {ledger.length===0
                    ? <tr><td colSpan="8" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                    : ledgerPag.slice.map((l,i)=>(
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
              <Paginator page={ledgerPag.page} totalPages={ledgerPag.totalPages} setPage={ledgerPag.setPage} total={ledgerPag.total} pageSize={SM_PAGE} noun="รายการ" />
            </Card>
          )}

          {/* ── Grouped by product ── */}
          {mvSub==='byproduct' && (
            <div className="card" style={{ overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
                <thead>
                  <tr style={{ background:'var(--s2)' }}>
                    <th style={{ ...TH, width:92 }}>วันที่</th>
                    <th style={{ ...TH, width:72 }}>เวลา</th>
                    <th style={TH}>เลขที่เอกสาร</th>
                    <th style={TH}>ประเภทรายการ</th>
                    <th style={{ ...TH, textAlign:'center', width:88 }}>รายการ</th>
                    <th style={{ ...THR, width:118 }}>รับเข้า (KG)</th>
                    <th style={{ ...THR, width:118 }}>ตัดออก (KG)</th>
                    <th style={{ ...THR, width:128 }}>คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {prodGroups.length === 0 && (
                    <tr><td colSpan="8" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                  )}
                  {prodGroups.map(pg => {
                    const prod = D.products.find(p=>p.code===pg.code);
                    /* "ยอดคงเหลือล่าสุด" = สต็อกจริงปัจจุบันของสินค้า (ค่าที่เชื่อถือได้ที่สุด) */
                    const currentBal = prod ? prod.stock : pg.lastBal;
                    const isLow = currentBal < (prod?.min||0);

                    /* Group txns by ref_no — merge duplicates of same document */
                    const docMap = {};
                    pg.txns.forEach(l => {
                      const key = l.ref || '—';
                      if (!docMap[key]) {
                        docMap[key] = {
                          ref: l.ref, refType: l.refType,
                          date: l.date, dateISO: l.dateISO,
                          type: l.type, totalW: 0,
                          lastBal: l.bal, lastTime: l.time, entryCount: 0,
                        };
                      }
                      docMap[key].totalW    += l.w;
                      docMap[key].lastBal    = l.bal;
                      docMap[key].lastTime   = l.time || docMap[key].lastTime;
                      docMap[key].entryCount += 1;
                    });
                    const docList = Object.values(docMap).sort(
                      (a,b) => (b.dateISO||'').localeCompare(a.dateISO||'')
                    );
                    /* ── คำนวณ "คงเหลือ" ของแต่ละแถวใหม่ ให้สอดคล้องกับ Transaction จริง ──
                       ยึดยอดล่าสุด (currentBal = สต็อกจริงปัจจุบัน) เป็นหลัก แล้วไล่ "ย้อนกลับ"
                       ทีละเอกสาร โดยใช้ผลต่างที่บันทึกไว้จริงใน DB ระหว่างเอกสารที่ติดกัน
                       (เพิ่มขึ้น/ลดลงเท่าไหร่ + คงเหลือเดิม) เพื่อไม่ให้ยอดเพี้ยนจากข้อมูลเก่า */
                    const offset = docList.length ? (currentBal - docList[0].lastBal) : 0;
                    const docListCalc = docList.map(d => ({ ...d, dispBal: +(d.lastBal + offset).toFixed(2) }));

                    return (
                      <React.Fragment key={pg.code}>
                        {/* Product header row */}
                        <tr style={{ background:'var(--s2)', borderTop:'2px solid var(--bd)', borderBottom:'1px solid var(--bd)' }}>
                          <td colSpan="3" style={{ padding:'10px 12px' }}>
                            <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)', fontWeight:700 }}>{pg.code}</div>
                            <div style={{ fontSize:13.5, fontWeight:800, color:'var(--tx)', marginTop:1 }}>{pg.prod}</div>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ fontSize:12, color:'var(--t3)' }}>{docList.length} เอกสาร</span>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'center' }}>
                            <span style={{ fontSize:11, color:'var(--t3)' }}>{pg.txns.length} รายการ</span>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>รับเข้ารวม</div>
                            <div style={{ fontWeight:700, color:'var(--gn)', fontSize:13 }}>{pg.totalIn.toFixed(2)}</div>
                          </td>
                          <td style={{ padding:'10px 12px', textAlign:'right' }}>
                            <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>ตัดออกรวม</div>
                            <div style={{ fontWeight:700, color:'var(--rd)', fontSize:13 }}>{pg.totalOut.toFixed(2)}</div>
                          </td>
                          <td style={{ padding:'10px 14px', textAlign:'right' }}>
                            <span style={{ padding:'5px 12px', borderRadius:100, fontSize:13, fontWeight:800, background:isLow?'var(--ambg)':'var(--gbg)', color:isLow?'var(--amt)':'var(--gt)' }}>
                              {currentBal.toFixed(2)} KG
                            </span>
                          </td>
                        </tr>
                        {/* One row per unique document — คงเหลือคำนวณย้อนกลับจากยอดล่าสุด ตามผลต่าง +/- ของแต่ละเอกสาร */}
                        {docListCalc.map((doc, i) => (
                          <tr key={doc.ref+i} style={{ borderBottom:'1px solid var(--bd)', cursor:'pointer' }}
                            onClick={()=>openDoc(doc.ref, doc.refType)}
                            onMouseEnter={e=>e.currentTarget.style.background='var(--abg)'}
                            onMouseLeave={e=>e.currentTarget.style.background=''}>
                            <td style={{ padding:'9px 12px', fontSize:12.5, color:'var(--t2)' }}>{doc.date}</td>
                            <td style={{ padding:'9px 12px', fontSize:12, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>{doc.lastTime && doc.lastTime !== '—' ? doc.lastTime : '—'}</td>
                            <td style={{ padding:'9px 12px' }}>
                              <span style={{ color:'var(--ac)', fontFamily:'var(--font-mono)', fontSize:12.5, fontWeight:700, textDecoration:'underline' }}>
                                {doc.ref}
                              </span>
                            </td>
                            <td style={{ padding:'9px 12px' }}>
                              <span style={{ fontSize:11.5, fontWeight:700, color:doc.type==='in'?'var(--gn)':doc.type==='adj'?'var(--pu)':'var(--rd)' }}>
                                {doc.refType}
                              </span>
                            </td>
                            <td style={{ padding:'9px 12px', textAlign:'center' }}>
                              {doc.entryCount > 1
                                ? <span style={{ fontSize:11.5, fontWeight:700, color:'var(--ac)', background:'var(--abg)', padding:'2px 7px', borderRadius:100 }}>{doc.entryCount} รายการ</span>
                                : <span style={{ fontSize:11.5, color:'var(--t3)' }}>1 รายการ</span>
                              }
                            </td>
                            <td style={{ padding:'9px 14px', textAlign:'right', color:'var(--gn)', fontWeight:700, whiteSpace:'nowrap' }}>
                              {doc.type==='in'||doc.type==='adj'?doc.totalW.toFixed(2):'—'}
                            </td>
                            <td style={{ padding:'9px 14px', textAlign:'right', color:'var(--rd)', fontWeight:700, whiteSpace:'nowrap' }}>
                              {doc.type==='out'?doc.totalW.toFixed(2):'—'}
                            </td>
                            <td style={{ padding:'9px 16px', textAlign:'right', whiteSpace:'nowrap' }}>
                              <span style={{ fontFamily:'var(--font-mono)', fontSize:12.5, fontWeight:700, color:doc.dispBal<(prod?.min||0)?'var(--am)':'var(--tx)' }}>
                                {doc.dispBal.toFixed(2)}
                              </span>
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

      {/* ── Tab: ปรับปรุงสต็อก (multi-item, scan+search) ── */}
      {tab==='adjust' && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:18, alignItems:'start' }}>

          {/* LEFT: Input + Items list */}
          <div>
            {/* Mode toggle + input */}
            <div className="card" style={{ marginBottom:14 }}>
              <div className="ch">
                <span className="ct-t">เพิ่มรายการปรับสต็อก</span>
                <div style={{ display:'flex', gap:0, background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', overflow:'hidden', padding:2 }}>
                  {[['scan','สแกน Barcode'],['search','ค้นหารายการ']].map(([m,l]) => (
                    <button key={m} onClick={() => { setAdjMode(m); setAdjBcStatus(''); }}
                      style={{ padding:'5px 14px', border:'none', borderRadius:6, cursor:'pointer', fontSize:12.5, fontWeight:700, fontFamily:'inherit', transition:'all .13s', background:adjMode===m?'var(--ac)':'transparent', color:adjMode===m?'#fff':'var(--t2)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              <div className="cb">
                {adjMode === 'scan' ? (
                  <div>
                    <div style={{ background:'linear-gradient(135deg,#fff0f0,#fff8f8)', border:'2px dashed var(--rd)', borderRadius:'var(--r)', padding:'14px 16px', marginBottom:10 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                        <span className="dot" style={{ background:adjType==='increase'?'var(--gn)':adjType==='decrease'?'var(--rd)':'var(--ac)' }}></span>
                        <span style={{ fontSize:12, fontWeight:600, color:adjType==='increase'?'var(--gn)':adjType==='decrease'?'var(--rd)':'var(--ac)' }}>
                          {adjType==='recount'?'สแกนนับสต็อก — สะสมน้ำหนักที่นับได้จริง':adjType==='increase'?'สแกนเพิ่มสต็อก — น้ำหนักสะสม +':'สแกนลดสต็อก — น้ำหนักสะสม −'}
                        </span>
                      </div>
                      <div style={{ position:'relative' }}>
                        <input ref={adjBcRef} value={adjBc} inputMode="numeric" autoFocus
                          style={{ width:'100%', padding:'12px 48px 12px 14px', border:'none', borderRadius:'var(--rs)', fontSize:17, fontFamily:'var(--font-mono)', letterSpacing:'.06em', background:'#fff', outline:'none', boxShadow:'0 2px 8px rgba(0,0,0,.08)' }}
                          onChange={e => { setAdjBc(e.target.value); setAdjBcStatus(''); }}
                          onKeyDown={e => e.key==='Enter' && adjBc.trim() && scanAdj(adjBc.trim())}
                          placeholder="สแกนหรือพิมพ์บาร์โค้ด 13 หลัก แล้วกด Enter…" />
                        <span style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', fontSize:16, fontWeight:700, color:adjBcStatus==='ok'?'var(--gn)':adjBcStatus==='err'?'var(--rd)':'var(--t3)' }}>
                          {adjBcStatus==='ok'?'✓':adjBcStatus==='err'?'✕':''}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Search mode (redesigned): autocomplete ค้นหาสินค้า + รายละเอียดเดิม/ใหม่/ผลต่าง ── */
                  <div>
                    <div style={{ position:'relative', marginBottom: (adjSearchOpen && !adjPickedProd && filteredAdjProducts.length > 0) ? 246 : 12 }}>
                      <label className="fl" style={{ display:'block', marginBottom:6 }}>ค้นหาสินค้า <span className="req">*</span></label>
                      <div style={{ position:'relative' }}>
                        <Icon name="search" size={14} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
                        <input type="text" className="fc" style={{ paddingLeft:34 }}
                          value={adjPickedProd ? `${adjPickedProd.name} · ${adjPickedProd.code}` : adjSearchText}
                          placeholder="พิมพ์ชื่อหรือรหัสสินค้าเพื่อค้นหา…"
                          onChange={e => { setAdjSearchText(e.target.value); setAdjSearchCode(''); setAdjSearchOpen(true); }}
                          onFocus={() => setAdjSearchOpen(true)}
                          onBlur={() => setTimeout(()=>setAdjSearchOpen(false), 180)} />
                        {adjPickedProd && (
                          <div onMouseDown={()=>{ setAdjSearchCode(''); setAdjSearchText(''); setAdjSearchQty(''); }}
                            style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s2)', color:'var(--t3)', fontSize:12, cursor:'pointer' }}>✕</div>
                        )}
                      </div>
                      {adjSearchOpen && !adjPickedProd && (
                        <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'var(--sur)', border:'1px solid var(--b2)', borderRadius:'var(--rs)', boxShadow:'var(--sh2)', zIndex:60, marginTop:3, maxHeight:230, overflowY:'auto' }}>
                          {filteredAdjProducts.length === 0 ? (
                            <div style={{ padding:'14px 12px', textAlign:'center', fontSize:12.5, color:'var(--t3)' }}>ไม่พบสินค้าที่ตรงกับ "{adjSearchText}"</div>
                          ) : filteredAdjProducts.map(p => {
                            const low = p.stock < p.min;
                            return (
                              <div key={p.code} onMouseDown={() => { setAdjSearchCode(p.code); setAdjSearchText(''); setAdjSearchOpen(false); setAdjSearchQty(''); }}
                                style={{ padding:'9px 12px', cursor:'pointer', fontSize:13, borderBottom:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}
                                onMouseEnter={e=>e.currentTarget.style.background='var(--s2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                                <div>
                                  <div style={{ fontWeight:600 }}>{p.name}</div>
                                  <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)' }}>{p.code} · {p.cat}</div>
                                </div>
                                <span style={{ fontSize:11.5, fontWeight:700, padding:'3px 8px', borderRadius:100, background: low?'var(--ambg)':'var(--gbg)', color: low?'var(--amt)':'var(--gt)', whiteSpace:'nowrap' }}>
                                  คงเหลือ {window.fmtItemQty(p.stock, p.code)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {adjPickedProd ? (() => {
                      const before = adjPickedProd.stock;
                      const qtyNum = parseFloat(adjSearchQty) || 0;
                      let after, diff, qtyLabel, qtyPlaceholder, tone;
                      if (adjType === 'recount') {
                        after = qtyNum; diff = qtyNum - before;
                        qtyLabel = 'สต็อกใหม่ที่นับได้ (KG)'; qtyPlaceholder = 'ระบุจำนวนที่นับได้จริง';
                        tone = diff > 0 ? 'gn' : diff < 0 ? 'rd' : 't3';
                      } else if (adjType === 'increase') {
                        after = before + Math.abs(qtyNum); diff = Math.abs(qtyNum);
                        qtyLabel = 'จำนวนที่เพิ่ม (KG) ▲'; qtyPlaceholder = 'เช่น 5.000'; tone = 'gn';
                      } else {
                        after = Math.max(0, before - Math.abs(qtyNum)); diff = -Math.abs(qtyNum);
                        qtyLabel = 'จำนวนที่ลด (KG) ▼'; qtyPlaceholder = 'เช่น 5.000'; tone = 'rd';
                      }
                      const toneColor = tone==='gn' ? 'var(--gn)' : tone==='rd' ? 'var(--rd)' : 'var(--t3)';
                      const toneBg    = tone==='gn' ? 'var(--gbg)' : tone==='rd' ? 'var(--rbg)' : 'var(--s2)';
                      return (
                        <div style={{ background:'var(--s2)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:14 }}>
                          <Field label={qtyLabel} required>
                            <input type="number" className="fc" min="0" step="0.001" autoFocus value={adjSearchQty}
                              onChange={e => setAdjSearchQty(e.target.value)}
                              onKeyDown={e => e.key==='Enter' && addSearchItem()}
                              placeholder={qtyPlaceholder}
                              style={{ color: toneColor, fontWeight:700, fontSize:15 }} />
                          </Field>
                          {/* เดิม / ใหม่ / ผลต่าง — แสดงครบทุกโหมด */}
                          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:4, marginBottom:14 }}>
                            <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', padding:'8px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:10.5, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.04em' }}>ของเดิม</div>
                              <div style={{ fontSize:15, fontWeight:800, color:'var(--t2)', marginTop:2 }}>{before.toFixed(2)}</div>
                            </div>
                            <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', padding:'8px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:10.5, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.04em' }}>หลังปรับ</div>
                              <div style={{ fontSize:15, fontWeight:800, color:'var(--ac)', marginTop:2 }}>{Math.max(0,after).toFixed(2)}</div>
                            </div>
                            <div style={{ background:toneBg, border:`1px solid ${toneColor}33`, borderRadius:'var(--rs)', padding:'8px 10px', textAlign:'center' }}>
                              <div style={{ fontSize:10.5, fontWeight:700, color:toneColor, textTransform:'uppercase', letterSpacing:'.04em' }}>ผลต่าง</div>
                              <div style={{ fontSize:15, fontWeight:800, color:toneColor, marginTop:2 }}>{diff>0?'+':''}{diff.toFixed(2)}</div>
                            </div>
                          </div>
                          <Button variant="bp" onClick={addSearchItem} icon="check" style={{ width:'100%', justifyContent:'center' }}>เพิ่มรายการนี้</Button>
                        </div>
                      );
                    })() : (
                      <div style={{ padding:'18px 14px', textAlign:'center', border:'2px dashed var(--bd)', borderRadius:'var(--r)', fontSize:12.5, color:'var(--t3)' }}>
                        ค้นหาและเลือกสินค้าด้านบนเพื่อระบุจำนวนที่ต้องการปรับ
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Items list */}
            <div className="card">
              <div className="ch">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span className="ct-t">รายการปรับปรุง</span>
                  {adjItems.length > 0 && <span style={{ fontSize:12, fontWeight:600, padding:'2px 9px', background:'var(--rbg)', color:'var(--rd)', borderRadius:100 }}>{adjItems.length} รายการ</span>}
                </div>
                {adjItems.length > 0 && <Button variant="bg2" size="sm" onClick={() => setAdjItems([])}>ล้างทั้งหมด</Button>}
              </div>
              <div className="cb">
                {adjItems.length === 0 ? (
                  <div style={{ padding:'28px 20px', textAlign:'center', border:'2px dashed var(--bd)', borderRadius:'var(--r)' }}>
                    <div style={{ width:48, height:48, borderRadius:12, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', color:'var(--t3)' }}><Icon name="warehouse" size={22}/></div>
                    <div style={{ fontSize:14, fontWeight:600, color:'var(--t2)', marginBottom:4 }}>ยังไม่มีรายการ</div>
                    <div style={{ fontSize:12.5, color:'var(--t3)' }}>สแกนบาร์โค้ดหรือค้นหาสินค้าด้านบน</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display:'grid', gridTemplateColumns:'26px 1fr 96px 80px 28px', gap:8, paddingBottom:8, fontSize:11, fontWeight:700, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                      <div></div><div>สินค้า / รหัส</div>
                      <div style={{textAlign:'center'}}>{adjType==='recount'?'นับได้ใหม่':'ปรับ ▲/▼'} (KG)</div>
                      <div style={{textAlign:'center'}}>{adjType==='recount'?'ผลต่าง':'หลังปรับ'}</div>
                      <div></div>
                    </div>
                    <div style={{ maxHeight:'calc(8 * 72px)', overflowY:'auto' }}>
                      {adjItems.map((it, i) => {
                        const after      = Math.max(0, it.before + it.adj);
                        const minQ       = D.products.find(p=>p.code===it.code)?.min || 0;
                        const isInc      = it.adj > 0;
                        const isDec      = it.adj < 0;
                        const isLow      = after < minQ;
                        const adjDisplay = it.adj >= 0 ? `+${it.adj.toFixed(2)}` : it.adj.toFixed(2);
                        const isKgScan   = it.mode === 'scan' && (window.unitOf ? window.unitOf(it.code).unitType === 'kg' : true);
                        const displayVal = it.newCount != null ? it.newCount : +(it.before + it.adj).toFixed(3);
                        return (
                          <div key={it.key} style={{ display:'grid', gridTemplateColumns:'26px 1fr 96px 80px 28px', gap:8, alignItems:'center', padding:'9px 12px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--rs)', marginBottom:6 }}>
                            <div style={{ width:24, height:24, borderRadius:5, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'var(--t2)' }}>{i+1}</div>
                            <div>
                              <div style={{ fontSize:13, fontWeight:600 }}>{it.name}</div>
                              <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)', marginTop:1 }}>{it.code}
                                {it.mode==='scan' && it.scannedTotal!=null && <span style={{ marginLeft:6, fontSize:10, background:'var(--abg)', color:'var(--ac)', padding:'1px 5px', borderRadius:4 }}>นับได้ {it.scannedTotal.toFixed(3)} KG</span>}
                              </div>
                            </div>
                            {/* Editable field: newCount (recount) or adj delta (inc/dec) */}
                            {adjType === 'recount' ? (
                              <div style={{ position:'relative' }}>
                                <input type="number" min="0" step="0.001"
                                  value={displayVal}
                                  readOnly={isKgScan}
                                  onChange={isKgScan ? undefined : e => {
                                    const nc = parseFloat(e.target.value) || 0;
                                    const adj = +(nc - it.before).toFixed(4);
                                    setAdjItems(prev => prev.map(x => x.key===it.key ? {...x, newCount:nc, adj} : x));
                                  }}
                                  title={isKgScan ? 'น้ำหนักจากบาร์โค้ด — ไม่สามารถแก้ไขได้' : 'ระบุจำนวนสต็อกที่นับได้จริง'}
                                  style={{ width:'100%', padding:'5px 8px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:13, fontWeight:800, color:'var(--tx)', background: isKgScan ? 'var(--s3)' : 'var(--s2)', textAlign:'center', outline:'none', fontFamily:'inherit', cursor: isKgScan ? 'default' : 'text' }}
                                  onFocus={isKgScan ? undefined : e=>{ e.target.style.borderColor='var(--ac)'; e.target.select(); }}
                                  onBlur={isKgScan ? undefined : e=>{ e.target.style.borderColor='var(--b2)'; }} />
                              </div>
                            ) : (
                              <div style={{ position:'relative' }}>
                                <input type="number" step="0.001" value={adjType==='decrease'?Math.abs(it.adj):it.adj}
                                  onChange={e => {
                                    let v = parseFloat(e.target.value) || 0;
                                    if (adjType === 'increase') v =  Math.abs(v);
                                    if (adjType === 'decrease') v = -Math.abs(v);
                                    setAdjItems(prev => prev.map(x => x.key===it.key ? {...x, adj:v} : x));
                                  }}
                                  style={{ width:'100%', padding:'5px 8px', border:'1px solid var(--b2)', borderRadius:'var(--rs)', fontSize:13, fontWeight:800, color: isInc?'var(--gn)':isDec?'var(--rd)':'var(--t2)', background: isInc?'var(--gbg)':isDec?'var(--rbg)':'var(--s2)', textAlign:'center', outline:'none', fontFamily:'inherit' }}
                                  onFocus={e=>{ e.target.style.borderColor=isInc?'var(--gn)':'var(--rd)'; e.target.select(); }}
                                  onBlur={e=>{ e.target.style.borderColor='var(--b2)'; }} />
                                <span style={{ position:'absolute', left:6, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:800, color: isInc?'var(--gn)':isDec?'var(--rd)':'var(--t3)', pointerEvents:'none' }}>
                                  {isInc?'▲':isDec?'▼':''}
                                </span>
                              </div>
                            )}
                            {/* Last column: for recount = ผลต่าง colored; for +/- = สต็อกหลัง */}
                            {adjType === 'recount' ? (
                              <div style={{ padding:'4px 6px', background:isInc?'var(--gbg)':isDec?'var(--rbg)':'var(--s2)', borderRadius:'var(--rs)', fontSize:12.5, fontWeight:800, color:isInc?'var(--gn)':isDec?'var(--rd)':'var(--t3)', textAlign:'center', letterSpacing:'.02em' }}>
                                {it.adj>0?'+':''}{it.adj!==0?it.adj.toFixed(3):'±0.000'}
                              </div>
                            ) : (
                              <div style={{ padding:'4px 6px', background:isLow?'var(--ambg)':'var(--gbg)', borderRadius:'var(--rs)', fontSize:12.5, fontWeight:700, color:isLow?'var(--amt)':'var(--gt)', textAlign:'center' }}>{after.toFixed(2)}</div>
                            )}
                            <div onClick={() => setAdjItems(prev => prev.filter(x => x.key !== it.key))}
                              style={{ width:24, height:24, borderRadius:5, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--t3)', cursor:'pointer', fontSize:14, transition:'all .12s' }}
                              onMouseEnter={e=>Object.assign(e.currentTarget.style,{background:'var(--rbg)',color:'var(--rd)'})}
                              onMouseLeave={e=>Object.assign(e.currentTarget.style,{background:'',color:'var(--t3)'})}>✕</div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Running summary bar — signed net change */}
                    {(() => {
                      const netChange = adjItems.reduce((s,it)=>s+it.adj,0);
                      const isPos = netChange > 0;
                      return (
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10, padding:'10px 12px', background:isPos?'var(--gbg)':'var(--rbg)', borderRadius:'var(--rs)', border:`1px solid ${isPos?'rgba(13,146,114,.2)':'rgba(208,48,48,.15)'}` }}>
                          <span style={{ fontSize:12.5, color:'var(--t2)' }}>{adjItems.length} รายการ · สินค้า {new Set(adjItems.map(it=>it.code)).size} ชนิด</span>
                          <span style={{ fontSize:15, fontWeight:800, color:isPos?'var(--gn)':'var(--rd)' }}>
                            ผลต่างสุทธิ: {isPos?'+':''}{window.fmtKg(netChange)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT: Details + Summary */}
          <div style={{ position:'sticky', top:0, display:'flex', flexDirection:'column', gap:14 }}>
            {/* Adjustment details */}
            <div className="card">
              <div className="ch" style={{ padding:'12px 16px' }}><span className="ct-t">รายละเอียดการปรับ</span></div>
              <div style={{ padding:'12px 14px' }}>
                <div className="fg">
                  <label className="fl">ประเภทการปรับ <span className="req">*</span></label>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {ADJ_TYPES.map(t => (
                      <div key={t.id} onClick={() => setAdjType(t.id)}
                        style={{ padding:'8px 12px', border:`2px solid ${adjType===t.id?(t.id==='increase'?'var(--gn)':t.id==='decrease'?'var(--rd)':'var(--ac)'):'var(--bd)'}`, borderRadius:'var(--rs)', cursor:'pointer', background:adjType===t.id?(t.id==='increase'?'var(--gbg)':t.id==='decrease'?'var(--rbg)':'var(--abg)'):'var(--sur)', transition:'all .13s', display:'flex', alignItems:'center', gap:10 }}>
                        {t.iconName ? <Icon name={t.iconName} size={16} /> : <span style={{ fontSize:16 }}>{t.icon}</span>}
                        <div>
                          <div style={{ fontSize:13, fontWeight:700, color:adjType===t.id?(t.id==='increase'?'var(--gn)':t.id==='decrease'?'var(--rd)':'var(--ac)'):'var(--tx)' }}>{t.label}</div>
                          <div style={{ fontSize:11, color:'var(--t3)' }}>{t.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Field label="เหตุผล" required>
                  <select className="fc" value={adjReason} onChange={e=>setAdjReason(e.target.value)}>
                    {(REASON_BY_TYPE[adjType]||['อื่นๆ']).map(r=><option key={r}>{r}</option>)}
                  </select>
                </Field>
                <Field label="ผู้รับผิดชอบ">
                  <select className="fc" value={adjApprover} onChange={e=>setAdjApprover(e.target.value)}>
                    <option>{window.SP_DATA?.user?.name || 'Admin'}</option><option>สมชาย ใจดี</option>
                  </select>
                </Field>
                <Field label="หมายเหตุ">
                  <input type="text" className="fc" value={adjNote} onChange={e=>setAdjNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม…" />
                </Field>
              </div>
            </div>

            {/* Summary + confirm */}
            <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', overflow:'hidden', boxShadow:'var(--sh)' }}>
              <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,#d03030,#a51c1c)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:13.5, fontWeight:700, color:'#fff' }}>สรุปการปรับปรุงสต็อก</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.8)' }}>{adjItems.length} รายการ</span>
              </div>
              <div style={{ padding:16 }}>
                {(()=>{
                  const net = adjItems.reduce((s,it)=>s+it.adj,0);
                  const rows = [
                    ['จำนวนรายการ', `${adjItems.length} รายการ`, null],
                    ['ชนิดสินค้า', `${new Set(adjItems.map(it=>it.code)).size} ชนิด`, null],
                    ['ผลต่างสุทธิ', (net>=0?'+':'')+window.fmtKg(net), net>=0?'var(--gn)':'var(--rd)'],
                  ];
                  return rows;
                })().map(([l,v,c]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--bd)' }}>
                    <span style={{ fontSize:13, color:'var(--t2)' }}>{l}</span>
                    <span style={{ fontSize:13, fontWeight:700, color:c||'var(--tx)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ padding:'8px 0 0', fontSize:11.5, color:'var(--am)', lineHeight:1.6 }}>
                  ⚠️ การปรับจะสร้างเอกสาร ADJ และบันทึกใน log
                </div>
              </div>
              <div style={{ padding:'0 16px 16px', display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={() => { if(!adjItems.length){toast('err','ยังไม่มีรายการ');return;} setAdjConfirm(true); }}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'13px', borderRadius:'var(--rs)', background:adjItems.length?'var(--rd)':'var(--s2)', color:adjItems.length?'#fff':'var(--t3)', fontSize:15, fontWeight:700, cursor:adjItems.length?'pointer':'default', border:'none', fontFamily:'inherit', boxShadow:adjItems.length?'0 4px 12px rgba(208,48,48,.3)':'none', transition:'all .15s' }}>
                  <Icon name="check" size={16} style={{ color:adjItems.length?'#fff':'var(--t3)' }}/> ยืนยันการปรับปรุงสต็อก
                </button>
                <Button variant="bg2" style={{ width:'100%', justifyContent:'center' }} onClick={() => setAdjItems([])}>ล้างข้อมูล</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab: รายงานการปรับปรุงสต็อก ── */}
      {tab==='adjlog' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            <StatCard icon="file-text" iconTone="rd" label="เอกสาร ADJ ทั้งหมด" value={filteredAdjLogs.length+' ฉบับ'} />
            <StatCard icon="package"  iconTone="am" label="รายการรวม" value={filteredAdjLogs.reduce((s,d)=>s+d.totalItems,0)+' รายการ'} />
            <StatCard icon="warehouse" iconTone="rd" label="ปรับลดรวม (KG)" value={filteredAdjLogs.reduce((s,d)=>s+d.totalAdj,0).toFixed(2)+' KG'} valueTone="rd" />
          </div>

          {/* ── Filter bar: เลขที่ / ช่วงวันที่ / ประเภท / เหตุผล ── */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16, padding:'10px 14px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
            <div style={{ position:'relative' }}>
              <input className="fc" placeholder="ค้นหาเลขที่เอกสาร ADJ…" style={{ paddingLeft:30, width:190 }} value={adjLogSearch} onChange={e=>setAdjLogSearch(e.target.value)} />
              <Icon name="search" size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
            </div>
            <select className="fc" style={{ width:150 }} value={adjLogType} onChange={e=>setAdjLogType(e.target.value)}>
              <option value="all">ทุกประเภท</option>
              {ADJ_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <select className="fc" style={{ width:170 }} value={adjLogReason} onChange={e=>setAdjLogReason(e.target.value)}>
              <option value="all">ทุกเหตุผล</option>
              {adjLogReasons.filter(r=>r!=='all').map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <span style={{ fontSize:12, color:'var(--t3)' }}>ช่วงวันที่:</span>
            <DateField style={{ width:140 }} value={adjLogFrom} onChange={e=>setAdjLogFrom(e.target.value)} />
            <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
            <DateField style={{ width:140 }} value={adjLogTo} onChange={e=>setAdjLogTo(e.target.value)} />
            {adjLogFilterActive && <button className="btn bg2 bsm" onClick={clearAdjLogFilters}>ล้างตัวกรอง</button>}
            <span style={{ marginLeft:'auto', fontSize:12, color:'var(--t3)' }}>พบ {filteredAdjLogs.length} จาก {adjLogsState.length} ฉบับ</span>
          </div>

          <Card title="ประวัติเอกสารปรับปรุงสต็อก" actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('adj_logs.csv',['เลขที่','วันที่','ประเภท','เหตุผล','รายการ','ก่อนปรับ KG','หลังปรับ KG','ผลต่าง KG','ผู้รับผิดชอบ'],filteredAdjLogs.map(doc=>{const b=doc.totalBefore??doc.items.reduce((s,it)=>s+it.before,0);const a=doc.totalAfter??doc.items.reduce((s,it)=>s+it.after,0);return[doc.id,doc.dateDisplay,doc.adjType,doc.reason,doc.totalItems,b.toFixed(2),a.toFixed(2),(doc.totalAdj>=0?'+':'')+doc.totalAdj.toFixed(2),doc.approver||'']}))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายงานการปรับปรุงสต็อก',['เลขที่','วันที่','ประเภท','เหตุผล','รายการ','ก่อนปรับ KG','หลังปรับ KG','ผลต่าง KG','ผู้รับผิดชอบ'],filteredAdjLogs.map(doc=>{const b=doc.totalBefore??doc.items.reduce((s,it)=>s+it.before,0);const a=doc.totalAfter??doc.items.reduce((s,it)=>s+it.after,0);return[doc.id,doc.dateDisplay,doc.adjType,doc.reason,doc.totalItems,b.toFixed(2),a.toFixed(2),(doc.totalAdj>=0?'+':'')+doc.totalAdj.toFixed(2),doc.approver||'']}))}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>เลขที่ ADJ</th>
                <th style={TH}>วันที่</th>
                <th style={TH}>ประเภท</th>
                <th style={TH}>เหตุผล</th>
                <th style={{...TH,textAlign:'center'}}>รายการ</th>
                <th style={THR}>ก่อนปรับ (KG)</th>
                <th style={THR}>หลังปรับ (KG)</th>
                <th style={THR}>ผลต่าง (KG)</th>
                <th style={TH}>ผู้รับผิดชอบ</th>
                <th style={TH}>เอกสาร</th>
              </tr></thead>
              <tbody>
                {filteredAdjLogs.length===0
                  ? <tr><td colSpan="10" style={{padding:'32px',textAlign:'center',color:'var(--t3)'}}>{adjLogsState.length===0 ? 'ยังไม่มีรายการปรับปรุงสต็อก — ไปที่แท็บ "ปรับปรุงสต็อก" เพื่อเริ่มต้น' : 'ไม่พบรายการที่ตรงกับตัวกรอง'}</td></tr>
                  : adjLogPag.slice.map(doc => {
                    const netPos = doc.totalAdj >= 0;
                    const totBefore = doc.totalBefore ?? doc.items.reduce((s,it)=>s+it.before,0);
                    const totAfter  = doc.totalAfter  ?? doc.items.reduce((s,it)=>s+it.after,0);
                    return (
                      <tr key={doc.id} style={{borderBottom:'1px solid var(--bd)'}}>
                        <td style={TD}><span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'var(--rd)',fontWeight:700}}>{doc.id}</span></td>
                        <td style={{...TD,fontSize:12.5,color:'var(--t2)'}}>{doc.dateDisplay}</td>
                        <td style={TD}><span className={'bx '+(doc.adjType==='expired'?'xr':doc.adjType==='damage'?'xa':'xx')}>
                          {{expired:'หมดอายุ',damage:'เสียหาย',recount:'นับใหม่',other:'อื่นๆ'}[doc.adjType]||doc.adjType}
                        </span></td>
                        <td style={{...TD,fontSize:13,color:'var(--t2)'}}>{doc.reason}</td>
                        <td style={{...TD,textAlign:'center',fontWeight:700}}>{doc.totalItems}</td>
                        <td style={{...TDR,color:'var(--t2)'}}>{window.fmtKg(totBefore)}</td>
                        <td style={{...TDR,fontWeight:800,color:'var(--ac)'}}>{window.fmtKg(totAfter)}</td>
                        <td style={{...TDR,fontWeight:800,color:netPos?'var(--gn)':'var(--rd)'}}>
                          {netPos?'+':''}{window.fmtKg(doc.totalAdj)}
                        </td>
                        <td style={{...TD,fontSize:13}}>{doc.approver||'—'}</td>
                        <td style={TD}>
                          <button onClick={()=>setAdjDoc(doc)} style={{fontSize:11.5,padding:'3px 10px',border:'1px solid var(--rd)',borderRadius:5,cursor:'pointer',background:'var(--rbg)',color:'var(--rd)',fontFamily:'inherit',fontWeight:700}}>เอกสาร A4</button>
                        </td>
                      </tr>
                    );
                  })
                }
              </tbody>
            </table></div>
            <Paginator page={adjLogPag.page} totalPages={adjLogPag.totalPages} setPage={adjLogPag.setPage} total={adjLogPag.total} pageSize={SM_PAGE} noun="เอกสาร ADJ" />
          </Card>
        </div>
      )}

      {/* ── Tab: GRN ── */}
      {tab==='grn' && (() => {
        const grnFiltered = grns.filter(g => {
          const iso = g.date || (g.dateDisplay ? g.dateDisplay.split('/').reverse().join('-') : '');
          if (grnFrom && iso < grnFrom) return false;
          if (grnTo   && iso > grnTo)   return false;
          if (grnSearch) {
            const s = grnSearch.toLowerCase();
            const nameMatch = g.items && g.items.some(it => (it.name||'').toLowerCase().includes(s) || (it.code||'').toLowerCase().includes(s));
            if (!g.id.toLowerCase().includes(s) && !(g.poNo||'').toLowerCase().includes(s) && !nameMatch) return false;
          }
          return true;
        });
        return (
        <div>
          {/* Filter bar */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16, background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', padding:'10px 14px', flexWrap:'wrap' }}>
            <span style={{ fontSize:12.5, color:'var(--t2)', fontWeight:600, marginRight:2 }}>ช่วงเวลา:</span>
            <DateField style={{ width:148 }} value={grnFrom} onChange={e=>setGrnFrom(e.target.value)} />
            <span style={{ color:'var(--t3)', fontSize:13 }}>ถึง</span>
            <DateField style={{ width:148 }} value={grnTo} onChange={e=>setGrnTo(e.target.value)} />
            <div style={{ position:'relative', marginLeft:4 }}>
              <input className="fc" placeholder="ค้นหาเลข GRN / PO / สินค้า…" style={{ paddingLeft:30, width:220 }} value={grnSearch} onChange={e=>setGrnSearch(e.target.value)} />
              <Icon name="search" size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
            </div>
            {(grnSearch || grnFrom !== window.toLocalISODate() || grnTo !== window.toLocalISODate()) && (
              <button className="btn bg2 bsm" onClick={()=>{ setGrnSearch(''); setGrnFrom(window.toLocalISODate()); setGrnTo(window.toLocalISODate()); }}>ล้าง</button>
            )}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
            <StatCard icon="file-text" iconTone="ac" label="เอกสาร GRN" value={grnFiltered.length+' ฉบับ'} />
            <StatCard icon="package" iconTone="gn" label="แพ็คทั้งหมด" value={grnFiltered.reduce((s,g)=>s+g.totalPacks,0)+' แพ็ค'} />
            <StatCard icon="coin" iconTone="gn" label="มูลค่ารวม" value={$(grnFiltered.reduce((s,g)=>s+g.totalValue,0))} valueTone="gn" />
          </div>
          <Card title={`สรุปรายเอกสาร GRN · ${grnFiltered.length} ฉบับ`} style={{ marginBottom:14 }}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>เลขที่ GRN</th><th style={TH}>วันที่รับ</th><th style={TH}>เลขที่ PO</th>
                <th style={{ ...TH, textAlign:'center' }}>แพ็ค</th><th style={THR}>น้ำหนักรวม</th>
                <th style={THR}>มูลค่า</th><th style={TH}>ผู้รับ</th><th style={TH}></th>
              </tr></thead>
              <tbody>{grnFiltered.map(g=>(
                <tr key={g.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, color:'var(--tx)' }}>{g.id}</td>
                  <td style={{ ...TD, fontSize:12.5, color:'var(--t2)' }}>{g.dateDisplay}</td>
                  <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12 }}>{g.poNo||'—'}</td>
                  <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{g.totalPacks}</td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--ac)' }}>{window.fmtKg(g.totalWeight)}</td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(g.totalValue)}</td>
                  <td style={{ ...TD, fontSize:13 }}>{g.receiver}</td>
                  <td style={TD}>
                    <button onClick={()=>setGrnViewDoc(g)}
                      style={{ fontSize:12, fontWeight:700, padding:'4px 10px', border:'1px solid var(--ac)', borderRadius:6, cursor:'pointer', background:'var(--abg)', color:'var(--ac)', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                      รายละเอียด
                    </button>
                  </td>
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
              <tbody>{grnFiltered.flatMap(g=>g.items.map((it,i)=>({...it,grnId:g.id,date:g.dateDisplay,key:`${g.id}-${i}`}))).map(r=>(
                <tr key={r.key} style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)', fontWeight:700 }}>{r.grnId}</span></td>
                  <td style={{ ...TD, fontSize:12, color:'var(--t2)' }}>{r.date}</td>
                  <td style={TD}><span className="mono">{r.code}</span></td>
                  <td style={{ ...TD, fontWeight:600 }}>{r.name}</td>
                  <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--t3)' }}>{r.packNo}</td>
                  <td style={{ ...TDR, fontWeight:700 }}>{window.fmtKg(r.weight)}</td>
                  <td style={{ ...TDR, color:'var(--t2)' }}>{$(r.cost)}</td>
                  <td style={TD}><span className={'bx '+(r.tax==='vat7'?'xb':'xx')} style={{ fontSize:10.5 }}>{r.tax==='vat7'?'VAT 7%':'Non VAT'}</span></td>
                  <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(r.value)}</td>
                </tr>
              ))}</tbody>
            </table></div>
          </Card>
        </div>
        );
      })()}

      {/* ── Adjust confirm popup ── */}
      {adjConfirm && (
        <div className="ov">
          <div className="md" style={{ width:420 }}>
            <div style={{ padding:'20px 22px 0', textAlign:'center' }}>
              <div style={{ width:52, height:52, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="warehouse" size={24}/></div>
              <div style={{ fontSize:17, fontWeight:800, marginBottom:4 }}>ยืนยันการปรับปรุงสต็อก</div>
              <div style={{ fontSize:13, color:'var(--t2)', marginBottom:12 }}>ระบบจะสร้างเอกสาร ADJ และลดสต็อกทันที</div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'12px 14px', fontSize:13, textAlign:'left', margin:'0 0 4px' }}>
                {[['ประเภท', {expired:'หมดอายุ',damage:'เสียหาย',recount:'นับสต็อกใหม่',other:'อื่นๆ'}[adjType]||adjType],
                  ['เหตุผล', adjReason],
                  ['จำนวนรายการ', adjItems.length+' รายการ / '+new Set(adjItems.map(it=>it.code)).size+' ชนิด'],
                  ['รวมปรับลด', '-'+window.fmtKg(adjItems.reduce((s,it)=>s+it.adj,0))],
                  ['ผู้รับผิดชอบ', adjApprover],
                ].map(([l,v]) => (
                  <div key={l} style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <span style={{ color:'var(--t2)' }}>{l}</span><b>{v}</b>
                  </div>
                ))}
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setAdjConfirm(false)}>ยกเลิก</Button>
              <button onClick={doAdj} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>
                <Icon name="check" size={15} style={{ color:'#fff' }}/> ✓ ยืนยันปรับปรุงสต็อก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── A4 ADJ Document modal ── */}
      {adjDoc && <AdjDocument doc={adjDoc} onClose={()=>setAdjDoc(null)} toast={toast} />}

      {/* ── GRN Document modal (full preview) ── */}
      {grnViewDoc && window.GrnDoc && React.createElement(window.GrnDoc, { grn: grnViewDoc, onClose: ()=>setGrnViewDoc(null) })}

      {/* Doc detail modal (inv type only) */}
      {docModal && docModal.type==='inv' && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setDocModal(null)}>
          <div className="md" style={{ width:600 }}>
            <div className="md-h">
              <span className="md-t">ใบกำกับภาษี · {docModal.data?.no}</span>
              <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setDocModal(null)}>✕</button>
            </div>
            <div className="md-b">
              {docModal.type==='inv' && docModal.data && (() => {
                const iv = docModal.data;
                const payLabel = { cash:'เงินสด', transfer:'เงินโอน', credit:'เครดิต' }[iv.pay] || '—';
                return (
                  <div style={{ fontSize:13 }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 24px', marginBottom:14 }}>
                      {[['เลขที่', iv.no], ['TIV อ้างอิง', iv.thermalNo||'—'],
                        ['วันที่', iv.dateDisplay], ['ลูกค้า', iv.custName||'—'],
                        ['ชำระ', payLabel], ['สถานะ', iv.voided?'ยกเลิกแล้ว':'ชำระแล้ว']
                      ].map(([l,v])=>(
                        <div key={l}><span style={{ color:'var(--t2)' }}>{l}: </span>
                          <b style={{ color: l==='สถานะ'&&iv.voided?'var(--rd)':undefined }}>{v}</b>
                        </div>
                      ))}
                    </div>
                    {/* Items table */}
                    {(iv.items||[]).length > 0 && (
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5, marginBottom:12 }}>
                        <thead><tr style={{ background:'var(--s2)' }}>
                          <th style={TH}>รหัส</th>
                          <th style={TH}>สินค้า</th>
                          <th style={{ ...THR, width:80 }}>KG</th>
                          <th style={{ ...THR, width:90 }}>ราคา/KG</th>
                          <th style={{ ...THR, width:100 }}>รวม</th>
                        </tr></thead>
                        <tbody>{(iv.items||[]).map((it,i)=>(
                          <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                            <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11 }}>{it.code}</td>
                            <td style={{ ...TD, fontWeight:600 }}>{it.name}</td>
                            <td style={{ ...TDR }}>{Number(it.weight||0).toFixed(2)}</td>
                            <td style={{ ...TDR, color:'var(--t2)' }}>฿{it.price||it.price_per_kg||0}</td>
                            <td style={{ ...TDR, fontWeight:700, color:'var(--gn)' }}>{$(Number(it.weight||0)*Number(it.price||it.price_per_kg||0))}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    )}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderTop:'2px solid var(--bd)', fontWeight:800, fontSize:15 }}>
                      <span>ยอดรวม</span>
                      <div style={{ textAlign:'right' }}>
                        {iv.discount > 0 && <div style={{ fontSize:12, color:'var(--am)', fontWeight:600 }}>ส่วนลด -{$(iv.discount)}</div>}
                        <span style={{ color:'var(--gn)' }}>{$(iv.total)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setDocModal(null)}>ปิด</Button>
              <Button variant="bp" icon="printer" onClick={()=>window.printDoc(
                (docModal.data.type==='A4'||docModal.data.invoiceType==='INV')?'inv':'tiv', docModal.data
              )}>พิมพ์</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ OTHER SCREENS ═══ */
function Users({ toast }) {
  const D = window.SP_DATA;
  const [users, setUsers] = React.useState(() => D.users.filter(u => u.status !== 'inactive'));
  const [showModal,    setShowModal]    = React.useState(false);
  const [editModal,    setEditModal]    = React.useState(null);   // user obj to edit
  const [deleteConfirm,setDeleteConfirm]= React.useState(null);  // user obj to delete
  const [form, setForm] = React.useState({ name:'', user:'', email:'', role:'Staff', password:'', confirmPw:'' });
  const [editForm, setEditForm] = React.useState({ name:'', email:'', role:'Staff', password:'', confirmPw:'' });
  const [showPw, setShowPw] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const refreshUsers = () => setUsers(D.users.filter(u => u.status !== 'inactive'));
  const resetForm    = () => setForm({ name:'', user:'', email:'', role:'Staff', password:'', confirmPw:'' });

  const addUser = async () => {
    if (!form.name||!form.user) { toast('err','กรุณากรอกชื่อและ Username'); return; }
    if (D.users.find(u=>u.user===form.user)) { toast('err',`Username ${form.user} มีอยู่แล้ว`); return; }
    if (!form.password) { toast('err','กรุณากรอกรหัสผ่าน'); return; }
    if (form.password.length < 4) { toast('err','รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
    if (form.password !== form.confirmPw) { toast('err','รหัสผ่านยืนยันไม่ตรงกัน'); return; }
    const pw = form.password;

    const finishAdd = (id, okMsg) => {
      const u = { id, name:form.name, user:form.user, email:form.email, role:form.role, password:pw, status:'active', last:'—' };
      D.users.push(u); refreshUsers(); setShowModal(false); resetForm(); toast('ok', okMsg);
    };
    if (window.SP_API && typeof window.SP_API.createUser === 'function') {
      setSaving(true);
      try {
        const result = await window.SP_API.createUser({ name:form.name, username:form.user, email:form.email||null, role:form.role, password:pw, active:true });
        finishAdd(result.id || Date.now(), `เพิ่มผู้ใช้ ${form.name} ลง DB เรียบร้อย`);
      } catch (err) {
        finishAdd(Date.now(), `เพิ่มผู้ใช้ ${form.name} เรียบร้อย (บันทึกในเครื่อง)`);
      } finally { setSaving(false); }
      return;
    }
    finishAdd(Date.now(), `เพิ่มผู้ใช้ ${form.name} เรียบร้อย`);
  };

  const openEdit = (u) => {
    setEditForm({ name:u.name, email:u.email||'', role:u.role, password:'', confirmPw:'' });
    setEditModal(u);
    setShowPw(false);
  };

  const saveEdit = async () => {
    if (!editForm.name) { toast('err','กรุณากรอกชื่อ'); return; }
    if (editForm.password && editForm.password.length < 4) { toast('err','รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร'); return; }
    if (editForm.password && editForm.password !== editForm.confirmPw) { toast('err','รหัสผ่านยืนยันไม่ตรงกัน'); return; }
    setSaving(true);
    try {
      const payload = { name:editForm.name, email:editForm.email||null, role:editForm.role, is_active:true, updated_by:'Admin' };
      if (editForm.password) payload.password = editForm.password;
      if (window.SP_API && typeof window.SP_API.saveUser === 'function') {
        await window.SP_API.saveUser(editModal.id, payload);
      }
      const idx = D.users.findIndex(u => u.id === editModal.id);
      if (idx >= 0) Object.assign(D.users[idx], { name:editForm.name, email:editForm.email, role:editForm.role });
      refreshUsers(); setEditModal(null);
      toast('ok', `แก้ไขข้อมูล ${editForm.name} เรียบร้อย`);
    } catch (err) {
      toast('err', 'แก้ไขไม่สำเร็จ: ' + err.message);
    } finally { setSaving(false); }
  };

  const doDelete = async () => {
    const u = deleteConfirm; if (!u) return;
    try {
      if (window.SP_API && typeof window.SP_API.deleteUser === 'function') {
        await window.SP_API.deleteUser(u.id);
      }
      const idx = D.users.findIndex(x => x.id === u.id);
      if (idx >= 0) D.users[idx].status = 'inactive';
      refreshUsers(); setDeleteConfirm(null);
      toast('ok', `ลบผู้ใช้ ${u.name} เรียบร้อย`);
    } catch (err) {
      toast('err', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const BTN = { fontSize:12, padding:'4px 10px', border:'1px solid var(--bd)', borderRadius:6, cursor:'pointer', background:'var(--sur)', color:'var(--t2)', fontFamily:'inherit' };
  return (
    <div>
      <Card title="จัดการผู้ใช้งาน" actions={<Button variant="bp" size="sm" onClick={()=>setShowModal(true)}>+ เพิ่มผู้ใช้</Button>}>
        <div className="tw"><table>
          <thead><tr><th>ชื่อ</th><th>Username</th><th>อีเมล</th><th>สิทธิ์</th><th>สถานะ</th><th>เข้าใช้ล่าสุด</th><th></th></tr></thead>
          <tbody>{users.map(u=>(
            <tr key={u.id} style={{ borderBottom:'1px solid var(--bd)' }}>
              <td style={{ padding:'11px 14px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:12, flexShrink:0 }}>{u.name.slice(0,2)}</div>
                  <span style={{ fontWeight:600 }}>{u.name}</span>
                </div>
              </td>
              <td className="mono" style={{ padding:'11px 14px' }}>{u.user}</td>
              <td style={{ padding:'11px 14px', fontSize:12.5, color: u.email ? 'var(--t2)' : 'var(--t3)' }}>{u.email || '—'}</td>
              <td style={{ padding:'11px 14px' }}><span className={'bx '+(u.role==='Administrator'?'xb':'xx')}>{u.role}</span></td>
              <td style={{ padding:'11px 14px' }}><span className={'bx '+(u.status==='active'?'xg':'xr')}>{u.status==='active'?'ใช้งาน':'ระงับ'}</span></td>
              <td style={{ fontSize:12, color:'var(--t3)', padding:'11px 14px' }}>{u.last}</td>
              <td style={{ padding:'11px 14px' }}>
                <div style={{ display:'flex', gap:5 }}>
                  <button style={BTN} onClick={()=>setUsers(p=>p.map(x=>x.id===u.id?{...x,status:x.status==='active'?'inactive':'active'}:x))}>{u.status==='active'?'ระงับ':'เปิดใช้'}</button>
                  <button style={{ ...BTN, borderColor:'var(--ac)', color:'var(--ac)', background:'var(--abg)' }} onClick={()=>openEdit(u)}>แก้ไข</button>
                  <button style={{ ...BTN, borderColor:'rgba(208,48,48,.35)', color:'var(--rd)', background:'var(--rbg)' }} onClick={()=>setDeleteConfirm(u)}>ลบ</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      </Card>

      {/* ── Add modal ── */}
      {showModal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="md" style={{ width:500 }}>
            <div className="md-h"><span className="md-t">เพิ่มผู้ใช้งานใหม่</span><button type="button" className="md-x" aria-label="ปิด" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="md-b" style={{ display:'flex', flexDirection:'column', gap:0 }}>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', marginBottom:14, border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:10, letterSpacing:.4, textTransform:'uppercase' }}>ข้อมูลบัญชี</div>
                <div className="gr c2">
                  <Field label="ชื่อ-นามสกุล" required><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ชื่อผู้ใช้งาน" /></Field>
                  <Field label="Username" required><input className="fc" value={form.user} onChange={e=>setForm(f=>({...f,user:e.target.value}))} placeholder="login username" style={{ fontFamily:'var(--font-mono)' }} /></Field>
                  <div style={{ gridColumn:'1/-1' }}>
                    <Field label="อีเมล" optional><input className="fc" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com (สำหรับรีเซ็ตรหัสผ่าน)" /></Field>
                  </div>
                  <Field label="สิทธิ์" required>
                    <select className="fc" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                      <option value="Administrator">Administrator</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </Field>
                </div>
              </div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:10, letterSpacing:.4, textTransform:'uppercase' }}>รหัสผ่าน</div>
                <div className="gr c2">
                  <Field label="รหัสผ่าน" optional>
                    <div style={{ position:'relative' }}>
                      <input className="fc" type={showPw?'text':'password'} value={form.password} placeholder="ค่าเริ่มต้น 1234" onChange={e=>setForm(f=>({...f,password:e.target.value}))} style={{ paddingRight:40 }} />
                      <span onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'var(--t3)', fontSize:11.5, userSelect:'none' }}>{showPw?'ซ่อน':'แสดง'}</span>
                    </div>
                  </Field>
                  <Field label="ยืนยันรหัสผ่าน" optional><input className="fc" type={showPw?'text':'password'} value={form.confirmPw} placeholder="พิมพ์รหัสผ่านอีกครั้ง" onChange={e=>setForm(f=>({...f,confirmPw:e.target.value}))} /></Field>
                </div>
                <div style={{ fontSize:12, color:'var(--t3)', marginTop:8 }}>หากไม่กำหนดรหัสผ่าน ระบบจะตั้งค่าเริ่มต้นเป็น <b style={{ color:'var(--t2)' }}>1234</b> อัตโนมัติ</div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>{ setShowModal(false); resetForm(); }} disabled={saving}>ยกเลิก</Button>
              <Button variant="bp" icon="check" onClick={addUser} disabled={saving}>{saving?'กำลังบันทึก...':'บันทึก'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editModal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setEditModal(null)}>
          <div className="md" style={{ width:500 }}>
            <div className="md-h">
              <span className="md-t">แก้ไขผู้ใช้งาน</span>
              <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setEditModal(null)}>✕</button>
            </div>
            <div className="md-b" style={{ display:'flex', flexDirection:'column', gap:0 }}>
              {/* ── info bar ── */}
              <div style={{ display:'flex', alignItems:'center', gap:12, background:'var(--abg)', borderRadius:'var(--rs)', padding:'12px 14px', marginBottom:14, border:'1px solid rgba(91,124,255,.2)' }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13, flexShrink:0 }}>{editModal.name.slice(0,2)}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14 }}>{editModal.name}</div>
                  <div style={{ fontSize:12, color:'var(--t2)', fontFamily:'var(--font-mono)' }}>@{editModal.user} · {editModal.role}</div>
                  {editModal.email && <div style={{ fontSize:11.5, color:'var(--t3)' }}>{editModal.email}</div>}
                </div>
              </div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', marginBottom:14, border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:10, letterSpacing:.4, textTransform:'uppercase' }}>ข้อมูลทั่วไป</div>
                <div className="gr c2">
                  <Field label="ชื่อ-นามสกุล" required><input className="fc" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></Field>
                  <Field label="สิทธิ์">
                    <select className="fc" value={editForm.role} onChange={e=>setEditForm(f=>({...f,role:e.target.value}))}>
                      <option value="Administrator">Administrator</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </Field>
                  <div style={{ gridColumn:'1/-1' }}>
                    <Field label="อีเมล (สำหรับรีเซ็ตรหัสผ่าน)" optional>
                      <input className="fc" type="email" value={editForm.email} onChange={e=>setEditForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" />
                    </Field>
                  </div>
                </div>
              </div>
              <div style={{ background:'var(--s2)', borderRadius:'var(--rs)', padding:'14px 16px', border:'1px solid var(--bd)' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--t3)', marginBottom:10, letterSpacing:.4, textTransform:'uppercase' }}>เปลี่ยนรหัสผ่าน <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>(ไม่บังคับ — เว้นว่างเพื่อคงเดิม)</span></div>
                <div className="gr c2">
                  <Field label="รหัสผ่านใหม่" optional>
                    <div style={{ position:'relative' }}>
                      <input className="fc" type={showPw?'text':'password'} value={editForm.password} placeholder="เว้นว่างเพื่อคงเดิม" onChange={e=>setEditForm(f=>({...f,password:e.target.value}))} style={{ paddingRight:40 }} />
                      <span onClick={()=>setShowPw(s=>!s)} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'var(--t3)', fontSize:11.5, userSelect:'none' }}>{showPw?'ซ่อน':'แสดง'}</span>
                    </div>
                  </Field>
                  <Field label="ยืนยันรหัสผ่านใหม่" optional><input className="fc" type={showPw?'text':'password'} value={editForm.confirmPw} placeholder="พิมพ์อีกครั้ง" onChange={e=>setEditForm(f=>({...f,confirmPw:e.target.value}))} /></Field>
                </div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setEditModal(null)} disabled={saving}>ยกเลิก</Button>
              <Button variant="bp" icon="check" onClick={saveEdit} disabled={saving}>{saving?'กำลังบันทึก...':'บันทึก'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ── */}
      {deleteConfirm && <div className="ov"><div className="md" style={{ width:380 }}>
        <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="x-circle" size={22}/></div>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>ลบผู้ใช้งาน?</div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>ต้องการลบ <b>{deleteConfirm.name}</b> ({deleteConfirm.user}) ออกจากระบบ?</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>ข้อมูลจะถูกซ่อนจากระบบ (ไม่สามารถเข้าใช้งานได้)</div>
        </div>
        <div className="md-f" style={{ marginTop:20 }}>
          <Button variant="bg2" onClick={()=>setDeleteConfirm(null)}>ยกเลิก</Button>
          <button onClick={doDelete} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>ยืนยันลบ</button>
        </div>
      </div></div>}
    </div>
  );
}

const SETTINGS_CSS = `
@keyframes stgFadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@keyframes stgShimmer{0%{background-position:-300px 0}100%{background-position:300px 0}}
@keyframes stgPulseRing{0%{box-shadow:0 0 0 0 rgba(91,124,255,.45)}70%{box-shadow:0 0 0 12px rgba(91,124,255,0)}100%{box-shadow:0 0 0 0 rgba(91,124,255,0)}}
@keyframes stgPop{0%{transform:scale(.9);opacity:0}60%{transform:scale(1.04)}100%{transform:scale(1);opacity:1}}
@keyframes stgSpin{to{transform:rotate(360deg)}}
.stg-wrap{animation:stgFadeUp .35s ease both}
.stg-hero{position:relative;border-radius:var(--r);padding:18px 24px;margin-bottom:18px;background:#fff;border:0.5px solid #e5e7eb;border-top:3px solid #0EA5E9;display:flex;align-items:center;gap:16px;box-shadow:0 1px 3px rgba(0,0,0,.04)}
.stg-hero::after{display:none}
.stg-hero-ic{width:40px;height:40px;border-radius:11px;background:#f0f9ff;color:#0EA5E9;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid #bae6fd}
.stg-hero h2{margin:0;font-size:16px;font-weight:800;color:#0f172a;letter-spacing:.1px}
.stg-hero p{margin:3px 0 0;font-size:12px;color:#64748b;opacity:1}
.stg-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}
.stg-tab{padding:9px 18px;border-radius:100px;font-size:13px;font-weight:600;cursor:pointer;border:1px solid var(--b2);background:var(--sur);color:var(--t2);transition:all .16s ease;display:flex;align-items:center;gap:7px}
.stg-tab:hover{border-color:var(--ac);color:var(--ac);transform:translateY(-1px)}
.stg-tab.on{background:var(--ac);color:#fff;border-color:transparent;box-shadow:0 4px 14px rgba(14,165,233,.35)}
.stg-pane{animation:stgFadeUp .3s ease both}
.stg-card{transition:transform .18s ease, box-shadow .18s ease;animation:stgFadeUp .35s ease both}
.stg-card:hover{transform:translateY(-2px);box-shadow:var(--sh2)}
.stg-prev{border-radius:var(--rs);border:1px dashed var(--b2);padding:16px;background:var(--s2);position:relative;overflow:hidden}
.stg-prev-badge{position:absolute;top:10px;right:10px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ac);background:var(--abg);padding:3px 9px;border-radius:100px}
.stg-save{position:relative;overflow:visible}
.stg-save.ok{animation:stgPulseRing 1s ease}
.stg-spin{display:inline-block;width:13px;height:13px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:stgSpin .65s linear infinite;margin-right:6px;vertical-align:-2px}
.stg-pfx-row{padding:12px 14px;background:var(--s2);border-radius:var(--rs);border:1px solid var(--b2);transition:all .15s ease}
.stg-pfx-row:hover{border-color:var(--ac);background:var(--sur);box-shadow:0 2px 10px rgba(0,0,0,.04)}
.stg-chip{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;padding:2px 8px;border-radius:100px;background:var(--gbg);color:var(--gt)}
.stg-glow-dot{width:7px;height:7px;border-radius:50%;background:var(--gn);box-shadow:0 0 0 0 rgba(13,146,114,.5);animation:stgPulseRing 2s ease infinite}
`;

function Settings({ toast }) {
  const D = window.SP_DATA;
  const [tab, setTab] = React.useState('company');
  const [saving, setSaving] = React.useState(false);
  const [justSaved, setJustSaved] = React.useState(false);
  const [co, setCo] = React.useState({...D.company});
  const [logoUrl, setLogoUrl] = React.useState(D.company.logoUrl || '');
  const [apiBase, setApiBase] = React.useState(() => localStorage.getItem('nexflow_api_base') || 'http://localhost:3001');
  const [connStatus, setConnStatus] = React.useState(null); // null | 'ok' | 'err' | 'testing'

  const testConnection = async () => {
    setConnStatus('testing');
    try {
      const url = apiBase.replace(/\/+$/, '');
      const r = await fetch(url + '/api/health', { signal: AbortSignal.timeout(4000) });
      if (r.ok) { setConnStatus('ok'); toast('ok', 'เชื่อมต่อ Server สำเร็จ'); }
      else       { setConnStatus('err'); toast('err', 'Server ตอบกลับ HTTP ' + r.status); }
    } catch (e) {
      setConnStatus('err');
      toast('err', 'ไม่สามารถเชื่อมต่อ: ' + e.message);
    }
  };

  const saveApiBase = () => {
    const url = apiBase.replace(/\/+$/, '');
    window.SP_CONFIG && window.SP_CONFIG.setApiBase && window.SP_CONFIG.setApiBase(url);
    toast('ok', 'บันทึก Server URL แล้ว — รีโหลดแอปเพื่อให้มีผล');
  };
  const logoInputRef = React.useRef(null);

  const handleLogoFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!['image/jpeg','image/png'].includes(file.type)) {
      toast('err', 'รองรับเฉพาะไฟล์ .jpg / .jpeg / .png เท่านั้น'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast('err', 'ไฟล์ต้องมีขนาดไม่เกิน 2 MB'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => { setLogoUrl(ev.target.result); };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoUrl('');
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  React.useEffect(() => {
    const id = 'stg-inject';
    if (document.getElementById(id)) return;
    const el = document.createElement('style'); el.id = id; el.textContent = SETTINGS_CSS;
    document.head.appendChild(el);
  }, []);

  const [docPfx, setDocPfx] = React.useState(() => ({
    grn: window.SP_STATE.docPrefixes?.grn || 'GRN',
    adj: window.SP_STATE.docPrefixes?.adj || 'ADJ',
    iss: window.SP_STATE.docPrefixes?.iss || 'ISS',
    tiv: window.SP_STATE.docPrefixes?.tiv || 'TIV',
    inv: window.SP_STATE.docPrefixes?.inv || 'INV',
    cn:  window.SP_STATE.docPrefixes?.cn  || 'CN',
    dn:  window.SP_STATE.docPrefixes?.dn  || 'DN',
  }));

  const PFX_DOCS = [
    { key:'grn', label:'GRN', desc:'เอกสารรับสินค้า',                    counterKey:'grnCounter',     ym:true  },
    { key:'adj', label:'ADJ', desc:'เอกสารปรับปรุงสต็อก',                counterKey:'adjCounter',     ym:true  },
    { key:'iss', label:'ISS', desc:'เอกสารตัดสต็อก (Non-commercial)',     counterKey:'invCounter',     ym:false },
    { key:'tiv', label:'TIV', desc:'ใบกำกับภาษีอย่างย่อ',                 counterKey:'invCounterThermal', ym:true },
    { key:'inv', label:'INV', desc:'ใบกำกับภาษีเต็มรูปแบบ (A4)',          counterKey:'invCounterA4',   ym:true  },
    { key:'cn',  label:'CN',  desc:'ใบลดหนี้ (Credit Note)',              counterKey:'invCounterCN',   ym:true  },
    { key:'dn',  label:'DN',  desc:'ใบเพิ่มหนี้ (Debit Note)',            counterKey:'invCounterDN',   ym:true  },
  ];

  const [docNum, setDocNum] = React.useState(() => {
    const o = {};
    PFX_DOCS.forEach(({key,counterKey}) => { o[key] = window.SP_STATE[counterKey] || 1; });
    return o;
  });

  const ymNow = (() => {
    const d = new Date();
    return String(d.getFullYear()).slice(-2) + String(d.getMonth()+1).padStart(2,'0');
  })();
  const previewNo = ({key,ym}) => {
    const p = docPfx[key] || key.toUpperCase();
    const n = String(parseInt(docNum[key],10) || 1).padStart(3,'0');
    return ym ? `${p}${ymNow}${n}` : `${p}${n}`;
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      /* ── อัปเดตข้อมูลบริษัทให้ทุกฟังก์ชันเห็นทันที (SP_DATA เป็น object เดียวกันทั้งระบบ) ── */
      Object.assign(window.SP_DATA.company, {
        ...co,
        vat: parseFloat(co.vat) || 0,
        logoUrl,
      });

      /* ── บันทึก/ลบโลโก้ใน localStorage ── */
      try {
        if (logoUrl) localStorage.setItem('sp_company_logo', logoUrl);
        else localStorage.removeItem('sp_company_logo');
      } catch(e) {}

      /* ── หมายเลขเอกสาร / Prefix / เลขรัน ── */
      window.SP_STATE.docPrefixes = { ...docPfx };
      PFX_DOCS.forEach(({key,counterKey}) => {
        const n = parseInt(docNum[key],10);
        if (n > 0) window.SP_STATE[counterKey] = n;
      });

      /* ── บันทึกข้อมูลบริษัท + Prefixes ลง DB ถ้ามี backend ── */
      if (window.SP_API && typeof window.SP_API.saveCompany === 'function') {
        try {
          await window.SP_API.saveCompany({
            name: co.name, address: co.addr, tax_id: co.tax,
            tel: co.tel, email: co.email || '', vat_rate: parseFloat(co.vat) || 0,
            prefix_grn: docPfx.grn, prefix_adj: docPfx.adj, prefix_iss: docPfx.iss,
            prefix_tiv: docPfx.tiv, prefix_inv: docPfx.inv,
            prefix_cn:  docPfx.cn,  prefix_dn:  docPfx.dn,
          });
        } catch (err) {
          console.warn('[Settings] saveCompany ไม่สำเร็จ (ใช้ค่าในเครื่องต่อไป):', err.message);
        }
      }

      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 1000);
      toast('ok', 'บันทึกการตั้งค่าเรียบร้อย — ข้อมูลพร้อมใช้งานทันทีในทุกฟังก์ชัน');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key:'company', label:'ข้อมูลบริษัท', icon:'file-text' },
    { key:'docs',    label:'หมายเลขเอกสาร', icon:'bar-chart' },
    { key:'general', label:'ทั่วไป', icon:'settings' },
  ];

  return (
    <div style={{ maxWidth:1180 }} className="stg-wrap">
      <div className="stg-hero">
        <div className="stg-hero-ic"><Icon name="settings" size={20} /></div>
        <div>
          <h2>ตั้งค่าระบบ</h2>
          <p>กำหนดข้อมูลบริษัท รูปแบบเอกสาร และค่าพื้นฐานของระบบ — การเปลี่ยนแปลงมีผลทันทีกับทุกฟังก์ชัน</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6, fontSize:11.5, background:'#ecfdf5', border:'1px solid #a7f3d0', padding:'5px 12px', borderRadius:100, fontWeight:700, color:'#059669', flexShrink:0 }}>
          <span className="stg-glow-dot"></span> เชื่อมต่อระบบอยู่
        </div>
      </div>

      <div className="stg-tabs">
        {TABS.map(t => (
          <button type="button" key={t.key} className={'stg-tab'+(tab===t.key?' on':'')} onClick={()=>setTab(t.key)}>
            <Icon name={t.icon} size={14} />{t.label}
          </button>
        ))}
        <div style={{ marginLeft:'auto' }}>
          <Button variant="bp" icon={saving?undefined:'check'} className={'stg-save'+(justSaved?' ok':'')} onClick={saveSettings} disabled={saving}
            style={{ padding:'10px 22px', fontSize:14, fontWeight:700, boxShadow:'0 3px 8px rgba(26,79,160,.35)', letterSpacing:.3 }}>
            {saving ? <><span className="stg-spin"></span>กำลังบันทึก...</> : 'บันทึกการตั้งค่า'}
          </Button>
        </div>
      </div>

      {tab === 'company' && (
        <div className="stg-pane" style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 420px', minWidth:0 }}>
            <Card title="ข้อมูลบริษัท / หัวใบกำกับภาษี" className="stg-card"><div className="cb"><div className="gr c2">
              <div style={{ gridColumn:'1/-1' }}><Field label="ชื่อบริษัท" required><input className="fc" value={co.name} onChange={e=>setCo(c=>({...c,name:e.target.value}))} /></Field></div>
              <div style={{ gridColumn:'1/-1' }}><Field label="ที่อยู่"><textarea className="fc" rows="2" value={co.addr} onChange={e=>setCo(c=>({...c,addr:e.target.value}))} style={{ resize:'vertical' }} /></Field></div>
              <Field label="เลขผู้เสียภาษี"><input className="fc" value={co.tax} onChange={e=>setCo(c=>({...c,tax:e.target.value}))} style={{ fontFamily:'var(--font-mono)' }} /></Field>
              <Field label="เบอร์โทร" optional><input className="fc" value={co.tel} onChange={e=>setCo(c=>({...c,tel:e.target.value}))} /></Field>
              <Field label="อีเมล" optional><input className="fc" value={co.email||''} onChange={e=>setCo(c=>({...c,email:e.target.value}))} /></Field>
              <Field label="อัตรา VAT (%)"><input className="fc" type="number" value={co.vat} onChange={e=>setCo(c=>({...c,vat:e.target.value}))} /></Field>
            </div></div></Card>
          </div>

          <div style={{ flex:'0 0 320px', minWidth:280, display:'flex', flexDirection:'column', gap:12 }}>
            <Card title="โลโก้บริษัท" className="stg-card">
              <div className="cb">
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  {/* Preview box */}
                  <div style={{ width:96, height:96, borderRadius:16, border:'2px dashed var(--bd)', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', background:'var(--s2)', flexShrink:0, position:'relative' }}>
                    {logoUrl
                      ? <img src={logoUrl} alt="logo preview" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                      : <span style={{ fontSize:11, color:'var(--t3)', textAlign:'center', lineHeight:1.5 }}>ยังไม่มี<br/>โลโก้</span>
                    }
                  </div>
                  {/* Info */}
                  <div style={{ fontSize:11, color:'var(--t3)', textAlign:'center', lineHeight:1.5 }}>
                    รองรับ .jpg / .jpeg / .png · ไม่เกิน 2 MB
                  </div>
                  {/* Buttons */}
                  <div style={{ display:'flex', gap:6, justifyContent:'center', width:'100%' }}>
                    <button style={{ cursor:'pointer', fontSize:12, padding:'6px 16px', fontWeight:600, background:'var(--ac)', color:'#fff', border:'none', borderRadius:'var(--r)', fontFamily:'inherit' }}
                      onClick={() => logoInputRef.current && logoInputRef.current.click()}>
                      เลือกไฟล์
                    </button>
                    {logoUrl && (
                      <button style={{ cursor:'pointer', fontSize:12, padding:'6px 14px', fontWeight:600, background:'var(--sur)', color:'var(--rd)', border:'1px solid var(--bd)', borderRadius:'var(--r)', fontFamily:'inherit' }}
                        onClick={removeLogo}>
                        ลบโลโก้
                      </button>
                    )}
                  </div>
                  <input ref={logoInputRef} type="file" accept=".jpg,.jpeg,.png" style={{ display:'none' }} onChange={handleLogoFile} />
                </div>
              </div>
            </Card>

            <Card title="ตัวอย่างหัวใบกำกับภาษี" className="stg-card">
              <div className="cb">
                <div className="stg-prev">
                  <span className="stg-prev-badge">Live Preview</span>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                    <div style={{ width:36, height:36, borderRadius:9, border:'1px solid var(--bd)', overflow:'hidden', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', background:'var(--s2)' }}>
                      {logoUrl
                        ? <img src={logoUrl} alt="logo" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                        : <div style={{ width:36, height:36, borderRadius:9, background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:13 }}>SP</div>
                      }
                    </div>
                    <div style={{ fontWeight:800, fontSize:13.5, color:'var(--tx)' }}>{co.name || 'ชื่อบริษัทของคุณ'}</div>
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--t2)', lineHeight:1.5, whiteSpace:'pre-wrap' }}>{co.addr || 'ที่อยู่บริษัท'}</div>
                  <div style={{ fontSize:11, color:'var(--t3)', marginTop:8, display:'flex', flexDirection:'column', gap:2, fontFamily:'var(--font-mono)' }}>
                    <span>เลขผู้เสียภาษี: {co.tax || '—'}</span>
                    <span>โทร: {co.tel || '—'}{co.email ? ` · ${co.email}` : ''}</span>
                    <span>อัตรา VAT: {parseFloat(co.vat)||0}%</span>
                  </div>
                </div>
                <div className="nc nc-b" style={{ marginTop:12, fontSize:12 }}>
                  ข้อมูลนี้จะแสดงบนใบกำกับภาษี (TIV/INV), ใบรับสินค้า (GRN) และทุกเอกสารที่พิมพ์ออกจากระบบ
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'docs' && (
        <div className="stg-pane" style={{ display:'flex', gap:16, alignItems:'flex-start', flexWrap:'wrap' }}>
          <div style={{ flex:'1 1 100%', minWidth:0 }}>
            <Card title="หมายเลขเอกสาร — กำหนด Prefix และเลขรันเอง" className="stg-card">
              <div className="cb">
                <div className="nc nc-b" style={{ marginBottom:14, fontSize:12 }}>
                  กำหนด Prefix และเลขที่เริ่มต้นได้เองทั้งหมด — บันทึกแล้วระบบจะรันเลขถัดไปต่อเนื่องจากค่านี้โดยอัตโนมัติทุกเอกสาร
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px,1fr))', gap:12 }}>
                  {PFX_DOCS.map((d,i) => (
                    <div key={d.key} className="stg-pfx-row" style={{ animationDelay:`${i*0.04}s` }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <div style={{ fontSize:11.5, fontWeight:700, color:'var(--t2)' }}>
                          {d.label} <span style={{ fontWeight:400, color:'var(--t3)' }}>· {d.desc}</span>
                        </div>
                        <span className="stg-chip"><Icon name="check" size={10} />{d.ym?'YYYYMM':'ต่อเนื่อง'}</span>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <div>
                          <label className="fl" style={{ fontSize:10.5 }}>Prefix</label>
                          <input className="fc" value={docPfx[d.key]} maxLength={8}
                            onChange={e => setDocPfx(p=>({...p,[d.key]:e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'')}))}
                            style={{ fontFamily:'var(--font-mono)', fontWeight:700, letterSpacing:'.05em', textTransform:'uppercase' }} />
                        </div>
                        <div>
                          <label className="fl" style={{ fontSize:10.5 }}>เลขที่ถัดไป</label>
                          <input className="fc" type="number" min="1" value={docNum[d.key]}
                            onChange={e => setDocNum(p=>({...p,[d.key]: e.target.value.replace(/[^0-9]/g,'')}))}
                            style={{ fontFamily:'var(--font-mono)', fontWeight:700 }} />
                        </div>
                      </div>
                      <div style={{ fontSize:10.5, color:'var(--ac)', marginTop:8, fontFamily:'var(--font-mono)', fontWeight:600 }}>
                        ▸ ตัวอย่าง: {previewNo(d)}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:18, display:'flex', justifyContent:'flex-end', gap:10 }}>
                  <Button variant="bg2" size="sm" onClick={() => {
                    setDocPfx({ grn:'GRN', adj:'ADJ', iss:'ISS', tiv:'TIV', inv:'INV', cn:'CN', dn:'DN' });
                    const o = {}; PFX_DOCS.forEach(({key,counterKey}) => { o[key] = window.SP_STATE[counterKey] || 1; }); setDocNum(o);
                  }}>รีเซ็ตค่าเริ่มต้น</Button>
                  <Button variant="bp" size="sm" icon="check" onClick={saveSettings} disabled={saving}>บันทึกการตั้งค่า</Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'general' && (
        <div className="stg-pane">
          <Card title="การตั้งค่าทั่วไป" className="stg-card">
            <div className="cb"><div className="gr c2">
              <Field label="รูปแบบวันที่"><select className="fc"><option>พ.ศ. (Buddhist Era)</option><option>ค.ศ.</option></select></Field>
              <Field label="ธีมสี / Tweaks"><div className="nc nc-b" style={{ fontSize:12 }}>เปิดได้จากปุ่ม Tweaks Panel มุมขวาล่างของหน้าจอ — ปรับธีม สี ความหนาแน่น และสไตล์ KPI ได้แบบเรียลไทม์</div></Field>
            </div></div>
          </Card>
          <Card title="เครื่องพิมพ์" className="stg-card">
            <div className="cb"><div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <label style={{ fontSize:11.5, fontWeight:700, color:'var(--t3)' }}>เครื่องพิมพ์ใบเสร็จ (TM-T82)</label>
              <input className="fc" value={co.receiptPrinter||''} onChange={e=>setCo(c=>({...c,receiptPrinter:e.target.value}))} placeholder="ชื่อเครื่องพิมพ์ หรือว่างเว้น" />
              <label style={{ fontSize:11.5, fontWeight:700, color:'var(--t3)' }}>เครื่องพิมพ์ A4 (สำหรับใบกำกับภาษี/GRN/PDF)</label>
              <input className="fc" value={co.a4Printer||''} onChange={e=>setCo(c=>({...c,a4Printer:e.target.value}))} placeholder="ชื่อเครื่องพิมพ์ A4 หรือว่างเว้น" />
            </div></div>
          </Card>
          <Card title="เซิร์ฟเวอร์ API" className="stg-card">
            <div className="cb">
              <div style={{ fontSize:12.5, color:'var(--t2)', marginBottom:12, lineHeight:1.7 }}>
                กำหนด URL ของ API Server — ใช้ <b>localhost:3001</b> ถ้ารันบนเครื่องเดียว<br/>
                หรือใส่ IP ของเครื่อง Server กลางหากใช้งานหลายเครื่องใน LAN เช่น <code style={{ background:'var(--s2)', padding:'1px 6px', borderRadius:4 }}>http://192.168.33.253:3001</code>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10 }}>
                <input className="fc" value={apiBase} onChange={e=>{setApiBase(e.target.value);setConnStatus(null);}}
                  placeholder="http://192.168.33.253:3001" style={{ flex:1, fontFamily:'var(--font-mono)', fontSize:13 }} />
                <Button variant="bg2" size="sm" onClick={testConnection} disabled={connStatus==='testing'}>
                  {connStatus==='testing' ? 'กำลังทดสอบ…' : 'ทดสอบ'}
                </Button>
              </div>
              {connStatus === 'ok'  && <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--gn)', marginBottom:10 }}><Icon name="check" size={14}/>เชื่อมต่อสำเร็จ</div>}
              {connStatus === 'err' && <div style={{ fontSize:12.5, color:'var(--rd)', marginBottom:10 }}>✕ เชื่อมต่อไม่ได้ — ตรวจสอบ IP / port และให้แน่ใจว่า API server รันอยู่</div>}
              <div style={{ display:'flex', gap:8 }}>
                <Button variant="bp" size="sm" icon="check" onClick={saveApiBase}>บันทึก URL</Button>
                <Button variant="bg2" size="sm" onClick={()=>{ window.location.href = '/ui_kits/nexflow/index.html'; }}>รีโหลดแอป</Button>
              </div>
              <div style={{ fontSize:11.5, color:'var(--t3)', marginTop:8 }}>* บันทึกแล้วกด "รีโหลดแอป" เพื่อให้มีผล</div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function Products({ toast }) {
  const D = window.SP_DATA;
  const [products, setProducts]   = React.useState(D.products);
  const [importResult, setImportResult] = React.useState(null);
  const [showAdd, setShowAdd]     = React.useState(false);
  const [form, setForm]           = React.useState({ code:'', name:'', cat:'ปลา', sell:'', cost:'', stock:'0', min:'10', tax:'vat7', unitType:'kg', unitLabel:'KG' });
  const [editProd, setEditProd]   = React.useState(null);
  const [editForm, setEditForm]   = React.useState({});
  const [deleteConfirm,     setDeleteConfirm]     = React.useState(null);
  const [deactivateConfirm, setDeactivateConfirm] = React.useState(null);
  const [prodSearch, setProdSearch] = React.useState('');
  const csvRef = React.useRef(null);
  const filteredProds = prodSearch.trim()
    ? products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.code.includes(prodSearch) || (p.cat||'').toLowerCase().includes(prodSearch.toLowerCase()))
    : products;
  const { slice: prodSlice, page: prodPage, totalPages: prodTotalPages, setPage: setProdPage, total: prodTotal } = usePagination(filteredProds, 20);

  /* ── Download CSV template ── */
  const downloadTemplate = () => {
    window.exportCSV('products_template.csv',
      ['code','name','cat','sell','cost','stock','min','tax'],
      [['000007','สินค้าใหม่','ปลา','150','100','0.000','10','vat7'],
       ['00008','สินค้าตัวอย่าง','กุ้ง','200','140','0.000','5','nonvat']]
    );
  };

  /* ── Import CSV ── */
  const importCSV = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines   = ev.target.result.replace(/\r/g,'').split('\n').filter(l=>l.trim());
        const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/"/g,''));
        const need    = ['code','name','cat','sell','cost','tax'];
        const missing = need.filter(k=>!headers.includes(k));
        if (missing.length) { if(toast)toast('err',`ขาดคอลัมน์: ${missing.join(', ')}`); return; }

        let added=0, updated=0; const rows=[];
        lines.slice(1).forEach(line => {
          if (!line.trim()) return;
          const vals = line.split(',').map(v=>v.trim().replace(/"/g,''));
          const row  = {};
          headers.forEach((h,i) => row[h] = vals[i]||'');
          if (!row.code) return;
          const existing = D.products.find(p=>p.code===row.code);
          const prod = {
            id:    existing?.id || Date.now()+Math.random(),
            code:  row.code,
            name:  row.name,
            cat:   row.cat,
            sell:  parseFloat(row.sell)||0,
            cost:  parseFloat(row.cost)||0,
            stock: parseFloat(row.stock)||0,
            min:   parseFloat(row.min)||0,
            tax:   row.tax==='nonvat'?'nonvat':'vat7',
          };
          if (existing) { Object.assign(existing, prod); updated++; rows.push({code:row.code,name:row.name,status:'updated'}); }
          else          { D.products.push(prod); added++; rows.push({code:row.code,name:row.name,status:'added'}); }
        });
        setProducts([...D.products]);
        setImportResult({rows,added,updated,skipped:0,errors:0});
        if (toast) toast('ok', `Import สำเร็จ: +${added} / อัพเดต ${updated}`);
      } catch(err) { if (toast) toast('err','อ่านไฟล์ไม่ได้: '+err.message); }
      e.target.value = '';
    };
    reader.readAsText(file, 'utf-8');
  };

  /* ── Open edit modal ── */
  const openEdit = (p) => {
    setEditProd(p);
    setEditForm({ code:p.code, name:p.name, cat:p.cat||'ปลา', sell:String(p.sell||''), cost:String(p.cost||''), min:String(p.min||''), tax:p.tax||'vat7', unitType:p.unitType||'kg', unitLabel:p.unitLabel||'KG' });
  };

  /* ── Save edit ── */
  const saveEdit = async () => {
    if (!editForm.name) { if (toast) toast('err','กรุณากรอกชื่อสินค้า'); return; }
    const uLabel = editForm.unitType === 'kg' ? 'KG' : (editForm.unitLabel||'หน่วย');
    const payload = { name:editForm.name, cat:editForm.cat, sell:parseFloat(editForm.sell)||0, cost:parseFloat(editForm.cost)||0, min:parseFloat(editForm.min)||0, tax:editForm.tax, unitType:editForm.unitType, unitLabel:uLabel };
    const dbPayload = { name:payload.name, category:payload.cat, sell_price:payload.sell, cost_price:payload.cost, min_qty:payload.min, tax_type:payload.tax, unit_type:payload.unitType, unit_label:uLabel };

    const finish = async (msg) => {
      if (window.SP_API && typeof window.SP_API.reloadProducts === 'function') {
        try { await window.SP_API.reloadProducts(); } catch(e) { Object.assign(editProd, payload); }
      } else {
        Object.assign(editProd, payload);
      }
      setProducts([...window.SP_DATA.products]);
      setEditProd(null);
      if (toast) toast('ok', msg);
    };

    if (window.SP_API && typeof window.SP_API.updateProduct === 'function') {
      try {
        await window.SP_API.updateProduct(editProd.code, dbPayload);
        await finish(`อัพเดต ${payload.name} ลง DB เรียบร้อย`);
      } catch (err) {
        console.warn('[Products] updateProduct ล้มเหลว:', err.message);
        await finish(`อัพเดต ${payload.name} เรียบร้อย (บันทึกในเครื่อง)`);
      }
      return;
    }
    await finish(`อัพเดต ${payload.name} เรียบร้อย`);
  };

  /* ── Deactivate / Reactivate product ── */
  const doDeactivateProduct = async () => {
    const p = deactivateConfirm; if (!p) return;
    try {
      if (window.SP_API && typeof window.SP_API.toggleProductActive === 'function') {
        await window.SP_API.toggleProductActive(p.code, false);
      }
      const idx = D.products.findIndex(x => x.code === p.code);
      if (idx >= 0) D.products[idx].is_active = false;
      setProducts([...D.products]);
      setDeactivateConfirm(null);
      if (toast) toast('ok', `ปิดการใช้งาน ${p.name} เรียบร้อย`);
    } catch (err) {
      if (toast) toast('err', 'เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const doReactivateProduct = async (p) => {
    try {
      if (window.SP_API && typeof window.SP_API.toggleProductActive === 'function') {
        await window.SP_API.toggleProductActive(p.code, true);
      }
      const idx = D.products.findIndex(x => x.code === p.code);
      if (idx >= 0) D.products[idx].is_active = true;
      setProducts([...D.products]);
      if (toast) toast('ok', `เปิดการใช้งาน ${p.name} เรียบร้อย`);
    } catch (err) {
      if (toast) toast('err', 'เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  /* ── Delete product ── */
  const doDeleteProduct = async () => {
    const p = deleteConfirm; if (!p) return;
    try {
      if (window.SP_API && typeof window.SP_API.deleteProduct === 'function') {
        await window.SP_API.deleteProduct(p.code);
      }
      const idx = D.products.findIndex(x => x.code === p.code);
      if (idx >= 0) D.products.splice(idx, 1);
      setProducts([...D.products]);
      setDeleteConfirm(null);
      if (toast) toast('ok', `ลบสินค้า ${p.name} เรียบร้อย`);
    } catch (err) {
      if (toast) toast('err', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  /* ── Add product ── */
  const addProduct = async () => {
    if (!form.code||!form.name) { if (toast) toast('err','กรุณากรอกรหัสและชื่อสินค้า'); return; }
    if (D.products.find(p=>p.code===form.code)) { if (toast) toast('err',`รหัส ${form.code} มีอยู่แล้ว`); return; }
    const addULabel = form.unitType === 'kg' ? 'KG' : (form.unitLabel||'หน่วย');
    const payload = { code:form.code, name:form.name, cat:form.cat, sell:parseFloat(form.sell)||0, cost:parseFloat(form.cost)||0, stock:parseFloat(form.stock)||0, min:parseFloat(form.min)||0, tax:form.tax, unitType:form.unitType||'kg', unitLabel:addULabel };
    /* backend ใช้ชื่อ field ต่างจาก mock data — ต้อง map ก่อนส่ง */
    const dbPayload = { code:payload.code, name:payload.name, category:payload.cat, sell_price:payload.sell, cost_price:payload.cost, stock_qty:payload.stock, min_qty:payload.min, tax_type:payload.tax, unit_type:payload.unitType, unit_label:addULabel };

    const finishAdd = (id, okMsg) => {
      const p = { id, ...payload };
      D.products.push(p);
      setProducts([...D.products]);
      setShowAdd(false);
      setForm({ code:'', name:'', cat:'ปลา', sell:'', cost:'', stock:'0', min:'10', tax:'vat7' });
      if (toast) toast('ok', okMsg);
    };

    /* ── บันทึกลง DB (มี fallback เป็น mock data เสมอถ้า DB ใช้ไม่ได้) ── */
    if (window.SP_API && typeof window.SP_API.createProduct === 'function') {
      try {
        const result = await window.SP_API.createProduct(dbPayload);
        finishAdd(result.id || Date.now(), `เพิ่มสินค้า ${payload.name} ลง DB เรียบร้อย`);
      } catch (err) {
        console.warn('[Products] createProduct ไม่สำเร็จ (บันทึกในเครื่องแทน):', err.message);
        finishAdd(Date.now(), `เพิ่มสินค้า ${payload.name} เรียบร้อย (บันทึกในเครื่อง — ยังไม่เชื่อมต่อ DB)`);
      }
      return;
    }

    /* ── fallback: mock data ── */
    finishAdd(Date.now(), `เพิ่มสินค้า ${payload.name} เรียบร้อย`);
  };

  return (
    <div>
      <Card title="รายการสินค้า" actions={
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="fc" placeholder="ค้นหาสินค้า..." value={prodSearch} onChange={e=>{ setProdSearch(e.target.value); setProdPage(1); }} style={{ width:180, padding:'6px 10px', fontSize:12.5 }} />
          <Button variant="bg2" size="sm" icon="download" onClick={downloadTemplate}>Template CSV</Button>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--rs)', background:'var(--sur)', border:'1px solid var(--b2)', fontSize:12.5, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap', color:'var(--tx)' }}>
            <Icon name="download" size={14} />Import CSV
            <input ref={csvRef} type="file" accept=".csv,text/csv" style={{ display:'none' }} onChange={importCSV} />
          </label>
          <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('products.csv',['รหัส','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก (KG)','ขั้นต่ำ (KG)','ภาษี'],products.map(p=>[p.code,p.name,p.cat,p.sell,p.cost,p.stock.toFixed(2),p.min,p.tax]))}>CSV</Button>
          <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายการสินค้า',['รหัส','ชื่อสินค้า','หมวด','ราคาขาย','ราคาทุน','สต็อก KG','ขั้นต่ำ KG','ภาษี'],products.map(p=>[p.code,p.name,p.cat,p.sell,p.cost,p.stock.toFixed(2),p.min,p.tax]))}>PDF</Button>
          <Button variant="bp" size="sm" onClick={()=>setShowAdd(true)}>+ เพิ่มสินค้า</Button>
        </div>
      }>
        <div className="tw"><table>
          <thead><tr>
            <th>รหัส</th><th>ชื่อสินค้า</th><th>หมวด</th>
            <th style={{textAlign:'right'}}>ราคาขาย</th><th style={{textAlign:'right'}}>ราคาทุน</th>
            <th>คงเหลือ</th><th>ขั้นต่ำ</th><th>ภาษี</th><th></th>
          </tr></thead>
          <tbody>{prodSlice.length===0
            ? <tr><td colSpan={9} style={{ textAlign:'center', padding:'24px 0', color:'var(--t3)' }}>ไม่พบสินค้าที่ตรงกับคำค้นหา</td></tr>
            : prodSlice.map(p=>{
            const uLabel = p.unitLabel || 'KG';
            const fmtAmt = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}) + ' ' + uLabel;
            return (
            <tr key={p.id} style={{ borderBottom:'1px solid var(--bd)', opacity: p.is_active === false ? 0.6 : 1 }}>
              <td className="mono">{p.code}</td>
              <td style={{ fontWeight:600 }}>
                {p.name}
                {p.is_active === false && <span style={{ marginLeft:7, fontSize:10.5, padding:'2px 6px', borderRadius:4, background:'var(--s3,#e5e5e5)', color:'var(--t3)', fontWeight:600, verticalAlign:'middle' }}>ระงับ</span>}
              </td>
              <td>{p.cat}</td>
              <td style={{ textAlign:'right' }}>{window.fmtMoney(p.sell)}<span style={{ fontSize:11, color:'var(--t3)' }}>/{uLabel}</span></td>
              <td style={{ textAlign:'right', color:'var(--t2)' }}>{window.fmtMoney(p.cost)}<span style={{ fontSize:11, color:'var(--t3)' }}>/{uLabel}</span></td>
              <td><StockPill stock={p.stock} min={p.min} unitLabel={uLabel}/></td>
              <td style={{ color:'var(--t3)', fontSize:12.5 }}>{fmtAmt(p.min)}</td>
              <td>{p.tax==='vat7'&&<Badge kind="info">Incl VAT</Badge>}
              {p.tax==='vat7_excl'&&<Badge kind="pending">Exclude VAT</Badge>}
              {p.tax==='nonvat'&&<Badge kind="sample">Non VAT</Badge>}</td>
              <td>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {p.is_active !== false ? (
                    <>
                      <Button variant="bg2" size="sm" onClick={()=>openEdit(p)}>แก้ไข</Button>
                      <button onClick={()=>setDeactivateConfirm(p)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--b2)', borderRadius:6, cursor:'pointer', background:'var(--sur)', color:'var(--t2)', fontFamily:'inherit' }}>ปิดการใช้งาน</button>
                    </>
                  ) : (
                    <button onClick={()=>doReactivateProduct(p)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--gn)', borderRadius:6, cursor:'pointer', background:'rgba(34,197,94,.08)', color:'var(--gn)', fontFamily:'inherit', fontWeight:600 }}>เปิดใช้งาน</button>
                  )}
                  <button onClick={()=>setDeleteConfirm(p)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid rgba(208,48,48,.35)', borderRadius:6, cursor:'pointer', background:'var(--rbg)', color:'var(--rd)', fontFamily:'inherit' }}>ลบ</button>
                </div>
              </td>
            </tr>
          )})}</tbody>
        </table></div>
        <Paginator page={prodPage} totalPages={prodTotalPages} setPage={setProdPage} total={prodTotal} pageSize={20} noun="สินค้า" />
      </Card>

      {importResult && <ImportResultModal result={importResult} entityLabel="สินค้า" onClose={()=>setImportResult(null)} />}

      {/* Deactivate product confirm */}
      {deactivateConfirm && <div className="ov"><div className="md" style={{ width:380 }}>
        <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--t2)' }}><Icon name="x-circle" size={22}/></div>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>ปิดการใช้งานสินค้า?</div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>ระงับการใช้งาน <b>{deactivateConfirm.name}</b> ({deactivateConfirm.code})</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>สินค้ายังอยู่ในรายการ สามารถเปิดใช้งานใหม่ได้ภายหลัง</div>
        </div>
        <div className="md-f" style={{ marginTop:20 }}>
          <Button variant="bg2" onClick={()=>setDeactivateConfirm(null)}>ยกเลิก</Button>
          <button onClick={doDeactivateProduct} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--t2)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>ยืนยันปิดใช้งาน</button>
        </div>
      </div></div>}

      {/* Delete product confirm */}
      {deleteConfirm && <div className="ov"><div className="md" style={{ width:380 }}>
        <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="x-circle" size={22}/></div>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>ลบสินค้า?</div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>ต้องการลบ <b>{deleteConfirm.name}</b> ({deleteConfirm.code}) ออกจากระบบ?</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>ประวัติการรับ/ขายที่ผ่านมาจะยังคงอยู่ในระบบ</div>
        </div>
        <div className="md-f" style={{ marginTop:20 }}>
          <Button variant="bg2" onClick={()=>setDeleteConfirm(null)}>ยกเลิก</Button>
          <button onClick={doDeleteProduct} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>ยืนยันลบ</button>
        </div>
      </div></div>}

      {/* Edit product modal */}
      {editProd && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setEditProd(null)}>
          <div className="md" style={{ width:500 }}>
            <div className="md-h"><span className="md-t">แก้ไขสินค้า <span style={{ fontFamily:'var(--font-mono)', fontSize:13, color:'var(--t2)' }}>{editProd.code}</span></span><button type="button" className="md-x" aria-label="ปิด" onClick={()=>setEditProd(null)}>✕</button></div>
            <div className="md-b">
              <div className="gr c2">
                <Field label="หมวดหมู่">
                  <select className="fc" value={editForm.cat} onChange={e=>setEditForm(f=>({...f,cat:e.target.value}))}>
                    <option>ปลา</option><option>กุ้ง</option><option>หอย</option><option>อื่นๆ</option>
                  </select>
                </Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="ชื่อสินค้า" required><input className="fc" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></Field>
                </div>
                <Field label={`ราคาขาย/${editForm.unitType==='unit'?(editForm.unitLabel||'หน่วย'):'KG'}`}><input type="number" className="fc" value={editForm.sell} onChange={e=>setEditForm(f=>({...f,sell:e.target.value}))} placeholder="0.00" /></Field>
                <Field label={`ราคาทุน/${editForm.unitType==='unit'?(editForm.unitLabel||'หน่วย'):'KG'}`}><input type="number" className="fc" value={editForm.cost} onChange={e=>setEditForm(f=>({...f,cost:e.target.value}))} placeholder="0.00" /></Field>
                <Field label="ขั้นต่ำ"><input type="number" className="fc" value={editForm.min} onChange={e=>setEditForm(f=>({...f,min:e.target.value}))} placeholder="10" /></Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="หน่วยสินค้า">
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                        <input type="radio" name="editUnitType" value="kg" checked={editForm.unitType==='kg'} onChange={()=>setEditForm(f=>({...f,unitType:'kg',unitLabel:'KG'}))} />
                        ชั่งน้ำหนัก (KG)
                      </label>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                        <input type="radio" name="editUnitType" value="unit" checked={editForm.unitType==='unit'} onChange={()=>setEditForm(f=>({...f,unitType:'unit',unitLabel:f.unitLabel==='KG'?'หน่วย':f.unitLabel}))} />
                        นับจำนวน
                      </label>
                      {editForm.unitType==='unit' && (
                        <input className="fc" value={editForm.unitLabel} onChange={e=>setEditForm(f=>({...f,unitLabel:e.target.value}))} placeholder="ชิ้น / กล่อง / แพ็ค" style={{ width:130, padding:'5px 8px', fontSize:12.5 }} />
                      )}
                    </div>
                  </Field>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="ภาษี">
                    <select className="fc" value={editForm.tax} onChange={e=>setEditForm(f=>({...f,tax:e.target.value}))}>
                      <option value="vat7">Include VAT (ราคารวม VAT)</option>
                      <option value="vat7_excl">Exclude VAT (ราคาไม่รวม VAT, +7%)</option>
                      <option value="nonvat">Non VAT</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setEditProd(null)}>ยกเลิก</Button>
              <Button variant="bp" icon="check" onClick={saveEdit}>บันทึก</Button>
            </div>
          </div>
        </div>
      )}

      {/* Add product modal */}
      {showAdd && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="md" style={{ width:500 }}>
            <div className="md-h"><span className="md-t">เพิ่มสินค้าใหม่</span><button type="button" className="md-x" aria-label="ปิด" onClick={()=>setShowAdd(false)}>✕</button></div>
            <div className="md-b">
              <div className="gr c2">
                <Field label="รหัสสินค้า" required><input className="fc" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="000007" maxLength={6} style={{ fontFamily:'var(--font-mono)' }} /></Field>
                <Field label="หมวดหมู่" required>
                  <select className="fc" value={form.cat} onChange={e=>setForm(f=>({...f,cat:e.target.value}))}>
                    <option>ปลา</option><option>กุ้ง</option><option>หอย</option><option>อื่นๆ</option>
                  </select>
                </Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="ชื่อสินค้า" required><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ชื่อสินค้า..." /></Field>
                </div>
                <Field label={`ราคาขาย/${form.unitType==='unit'?(form.unitLabel||'หน่วย'):'KG'}`} required><input type="number" className="fc" value={form.sell} onChange={e=>setForm(f=>({...f,sell:e.target.value}))} placeholder="0.00" /></Field>
                <Field label={`ราคาทุน/${form.unitType==='unit'?(form.unitLabel||'หน่วย'):'KG'}`} required><input type="number" className="fc" value={form.cost} onChange={e=>setForm(f=>({...f,cost:e.target.value}))} placeholder="0.00" /></Field>
                <Field label="สต็อกเริ่มต้น"><input type="number" className="fc" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))} placeholder="0.000" step="0.001" /></Field>
                <Field label="ขั้นต่ำ"><input type="number" className="fc" value={form.min} onChange={e=>setForm(f=>({...f,min:e.target.value}))} placeholder="10" /></Field>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="หน่วยสินค้า">
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                        <input type="radio" name="addUnitType" value="kg" checked={form.unitType==='kg'} onChange={()=>setForm(f=>({...f,unitType:'kg',unitLabel:'KG'}))} />
                        ชั่งน้ำหนัก (KG)
                      </label>
                      <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13 }}>
                        <input type="radio" name="addUnitType" value="unit" checked={form.unitType==='unit'} onChange={()=>setForm(f=>({...f,unitType:'unit',unitLabel:f.unitLabel==='KG'?'หน่วย':f.unitLabel}))} />
                        นับจำนวน
                      </label>
                      {form.unitType==='unit' && (
                        <input className="fc" value={form.unitLabel} onChange={e=>setForm(f=>({...f,unitLabel:e.target.value}))} placeholder="ชิ้น / กล่อง / แพ็ค" style={{ width:130, padding:'5px 8px', fontSize:12.5 }} />
                      )}
                    </div>
                  </Field>
                </div>
                <div style={{ gridColumn:'1/-1' }}>
                  <Field label="ภาษี">
                    <select className="fc" value={form.tax} onChange={e=>setForm(f=>({...f,tax:e.target.value}))}>
                      <option value="vat7">Include Vat (ราคารวม Vat)</option>
                      <option value="vat7_excl">Exclude VAT (ราคาไม่รวม VAT, +7%)</option>
                      <option value="nonvat">Non VAT</option>
                    </select>
                  </Field>
                </div>
              </div>
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setShowAdd(false)}>ยกเลิก</Button>
              <Button variant="bp" icon="check" onClick={addProduct}>บันทึกสินค้า</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══ SHARED: Import Result Modal ═══ */
function ImportResultModal({ result, entityLabel, onClose }) {
  if (!result) return null;
  const { rows=[], added=0, updated=0, skipped=0, errors=0 } = result;
  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="md" style={{ width:620 }}>
        <div className="md-h">
          <span className="md-t">ผลการ Import {entityLabel}</span>
          <button type="button" className="md-x" aria-label="ปิด" onClick={onClose}>✕</button>
        </div>
        <div className="md-b">
          {/* Summary chips */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            {[['เพิ่มใหม่', added, 'var(--gn)', 'var(--gbg)'],['อัพเดต', updated, 'var(--ac)', 'var(--abg)'],['ข้าม/ซ้ำ', skipped, 'var(--t2)', 'var(--s2)'],['Error', errors, 'var(--rd)', 'var(--rbg)']].map(([l,n,c,bg])=>(
              <div key={l} style={{ padding:'8px 16px', borderRadius:'var(--rs)', background:bg, textAlign:'center' }}>
                <div style={{ fontSize:20, fontWeight:800, color:c }}>{n}</div>
                <div style={{ fontSize:11, color:c, fontWeight:600 }}>{l}</div>
              </div>
            ))}
            <div style={{ marginLeft:'auto', padding:'8px 16px', background:'var(--s2)', borderRadius:'var(--rs)', textAlign:'center' }}>
              <div style={{ fontSize:20, fontWeight:800, color:'var(--tx)' }}>{rows.length}</div>
              <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600 }}>รวม</div>
            </div>
          </div>
          {/* Detail table */}
          <div style={{ maxHeight:320, overflowY:'auto', border:'1px solid var(--bd)', borderRadius:'var(--rs)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12.5 }}>
              <thead><tr style={{ background:'var(--s2)', position:'sticky', top:0 }}>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)' }}>รหัส</th>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)' }}>ชื่อ</th>
                <th style={{ padding:'7px 12px', textAlign:'center', fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)' }}>สถานะ</th>
                <th style={{ padding:'7px 12px', textAlign:'left', fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)' }}>หมายเหตุ</th>
              </tr></thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)', background:r.status==='error'?'var(--rbg)':'' }}>
                    <td style={{ padding:'7px 12px', fontFamily:'var(--font-mono)', fontSize:12 }}>{r.code}</td>
                    <td style={{ padding:'7px 12px', fontWeight:r.status==='added'?600:400 }}>{r.name}</td>
                    <td style={{ padding:'7px 12px', textAlign:'center' }}>
                      <span className={'bx '+(r.status==='added'?'xg':r.status==='updated'?'xb':r.status==='error'?'xr':'xx')}>
                        {{added:'เพิ่มใหม่',updated:'อัพเดต',skipped:'ซ้ำ/ข้าม',error:'Error'}[r.status]||r.status}
                      </span>
                    </td>
                    <td style={{ padding:'7px 12px', fontSize:11.5, color:r.status==='error'?'var(--rd)':'var(--t3)' }}>{r.note||''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bp" icon="download" onClick={()=>window.exportCSV('import_result.csv',['รหัส','ชื่อ','สถานะ','หมายเหตุ'],rows.map(r=>[r.code,r.name,r.status,r.note||'']))}>Export ผล</Button>
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══ CUSTOMERS ═══ */
function Customers({ toast }) {
  const D = window.SP_DATA;
  const [customers,        setCustomers]        = React.useState(() => [...D.customers]);
  const [importResult,     setImportResult]     = React.useState(null);
  const [showAdd,          setShowAdd]          = React.useState(false);
  const [editModal,        setEditModal]        = React.useState(null);
  const [deleteConfirm,    setDeleteConfirm]    = React.useState(null);
  const [deactivateConfirm,setDeactivateConfirm]= React.useState(null);
  const [form, setForm] = React.useState({ code:'', name:'', type:'wholesale', tax:'', tel:'', addr:'', discount:'0', branch:'head' });
  const [editForm, setEditForm] = React.useState({ name:'', type:'wholesale', tax:'', tel:'', addr:'', discount:'0', branch:'head' });
  const [custSearch, setCustSearch] = React.useState('');
  const csvRef = React.useRef(null);
  const refreshCusts = () => setCustomers([...D.customers]);
  const filteredCusts = custSearch.trim()
    ? customers.filter(c => c.name.toLowerCase().includes(custSearch.toLowerCase()) || c.code.toLowerCase().includes(custSearch.toLowerCase()) || (c.tel||'').includes(custSearch))
    : customers;
  const { slice: custSlice, page: custPage, totalPages: custTotalPages, setPage: setCustPage, total: custTotal } = usePagination(filteredCusts, 20);

  const downloadTemplate = () => {
    window.exportCSV('customers_template.csv',
      ['code','name','type','tax','tel','addr','discount'],
      [['CUS006','ร้านอาหารใหม่','wholesale','','081-xxx-xxxx','กรุงเทพฯ','0'],
       ['CUS007','Online Store','online','','','','']]
    );
  };

  const importCSV = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const lines   = ev.target.result.replace(/\r/g,'').split('\n').filter(l=>l.trim());
        const headers = lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/"/g,''));
        const need    = ['code','name','type'];
        const missing = need.filter(k=>!headers.includes(k));
        if (missing.length) { if(toast)toast('err',`ขาดคอลัมน์: ${missing.join(', ')}`); return; }
        let added=0,updated=0,skipped=0,errors=0;
        const rows = [];
        lines.slice(1).forEach(line => {
          if (!line.trim()) return;
          const vals = line.split(',').map(v=>v.trim().replace(/"/g,''));
          const row  = {}; headers.forEach((h,i)=>row[h]=vals[i]||'');
          if (!row.code||!row.name) { rows.push({code:row.code||'?',name:row.name||'?',status:'error',note:'ขาดรหัสหรือชื่อ'}); errors++; return; }
          const existing = D.customers.find(c=>c.code===row.code);
          const cust = { id:existing?.id||Date.now()+Math.random(), code:row.code, name:row.name, type:row.type||'wholesale', tax:row.tax||'', tel:row.tel||'', addr:row.addr||'', discount:parseFloat(row.discount)||0 };
          if (existing) { Object.assign(existing,cust); updated++; rows.push({code:row.code,name:row.name,status:'updated'}); }
          else { D.customers.push(cust); added++; rows.push({code:row.code,name:row.name,status:'added'}); }
        });
        setCustomers([...D.customers]);
        setImportResult({rows,added,updated,skipped,errors});
        if(toast)toast('ok',`Import สำเร็จ: +${added} / อัพเดต ${updated}`);
      } catch(err) { if(toast)toast('err','อ่านไฟล์ไม่ได้: '+err.message); }
      e.target.value='';
    };
    reader.readAsText(file,'utf-8');
  };

  const addCustomer = async () => {
    if (!form.code||!form.name) { if(toast)toast('err','กรุณากรอกรหัสและชื่อลูกค้า'); return; }
    if (D.customers.find(c=>c.code===form.code)) { if(toast)toast('err',`รหัส ${form.code} มีอยู่แล้ว`); return; }
    const payload = { code:form.code, name:form.name, type:form.type, tax:form.tax, tel:form.tel, addr:form.addr, discount:parseFloat(form.discount)||0, branch:form.branch||'head' };
    const dbPayload = { code:payload.code, name:payload.name, type:payload.type, tax_id:payload.tax, tel:payload.tel, address:payload.addr, discount:payload.discount, branch:payload.branch };
    const finishAdd = (id, okMsg) => {
      const c = { id, ...payload, is_active:true };
      D.customers.push(c); refreshCusts();
      setShowAdd(false); setForm({code:'',name:'',type:'wholesale',tax:'',tel:'',addr:'',discount:'0',branch:'head'});
      if(toast)toast('ok', okMsg);
    };
    if (window.SP_API && typeof window.SP_API.createCustomer === 'function') {
      try {
        const result = await window.SP_API.createCustomer(dbPayload);
        finishAdd(result.id || Date.now(), `เพิ่มลูกค้า ${payload.name} ลง DB เรียบร้อย`);
      } catch (err) {
        finishAdd(Date.now(), `เพิ่มลูกค้า ${payload.name} เรียบร้อย (บันทึกในเครื่อง)`);
      }
      return;
    }
    finishAdd(Date.now(), `เพิ่มลูกค้า ${payload.name} เรียบร้อย`);
  };

  const openEditCust = (c) => {
    setEditForm({ name:c.name, type:c.type||'wholesale', tax:c.tax||'', tel:c.tel||'', addr:c.addr||'', discount:String(c.discount||0), branch:c.branch||'head' });
    setEditModal(c);
  };

  const saveEditCust = async () => {
    if (!editForm.name) { toast('err','กรุณากรอกชื่อลูกค้า'); return; }
    try {
      const payload = { name:editForm.name, type:editForm.type, tax_id:editForm.tax, tel:editForm.tel, address:editForm.addr, discount:parseFloat(editForm.discount)||0, branch:editForm.branch||'head', is_active:true, updated_by:'Admin' };
      if (window.SP_API && typeof window.SP_API.updateCustomer === 'function') {
        await window.SP_API.updateCustomer(editModal.code, payload);
      }
      const idx = D.customers.findIndex(c => c.code === editModal.code);
      if (idx >= 0) Object.assign(D.customers[idx], { name:editForm.name, type:editForm.type, tax:editForm.tax, tel:editForm.tel, addr:editForm.addr, discount:parseFloat(editForm.discount)||0, branch:editForm.branch||'head' });
      refreshCusts(); setEditModal(null);
      toast('ok', `แก้ไขข้อมูล ${editForm.name} เรียบร้อย`);
    } catch (err) { toast('err', 'แก้ไขไม่สำเร็จ: ' + err.message); }
  };

  const doDeleteCust = async () => {
    const c = deleteConfirm; if (!c) return;
    try {
      if (window.SP_API && typeof window.SP_API.deleteCustomer === 'function') {
        await window.SP_API.deleteCustomer(c.code);
      }
      const idx = D.customers.findIndex(x => x.code === c.code);
      if (idx >= 0) D.customers.splice(idx, 1);
      refreshCusts(); setDeleteConfirm(null);
      toast('ok', `ลบลูกค้า ${c.name} เรียบร้อย`);
    } catch (err) { toast('err', 'ลบไม่สำเร็จ: ' + err.message); }
  };

  const doDeactivateCust = async () => {
    const c = deactivateConfirm; if (!c) return;
    try {
      if (window.SP_API && typeof window.SP_API.toggleCustomerActive === 'function') {
        await window.SP_API.toggleCustomerActive(c.code, false);
      }
      const idx = D.customers.findIndex(x => x.code === c.code);
      if (idx >= 0) D.customers[idx].is_active = false;
      refreshCusts(); setDeactivateConfirm(null);
      toast('ok', `ปิดการใช้งาน ${c.name} เรียบร้อย`);
    } catch (err) { toast('err', 'เกิดข้อผิดพลาด: ' + err.message); }
  };

  const doReactivateCust = async (c) => {
    try {
      if (window.SP_API && typeof window.SP_API.toggleCustomerActive === 'function') {
        await window.SP_API.toggleCustomerActive(c.code, true);
      }
      const idx = D.customers.findIndex(x => x.code === c.code);
      if (idx >= 0) D.customers[idx].is_active = true;
      refreshCusts();
      toast('ok', `เปิดการใช้งาน ${c.name} เรียบร้อย`);
    } catch (err) { toast('err', 'เกิดข้อผิดพลาด: ' + err.message); }
  };

  return (
    <div>
      <Card title="รายการลูกค้า" actions={
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          <input className="fc" placeholder="ค้นหาลูกค้า..." value={custSearch} onChange={e=>{ setCustSearch(e.target.value); setCustPage(1); }} style={{ width:180, padding:'6px 10px', fontSize:12.5 }} />
          <Button variant="bg2" size="sm" icon="download" onClick={downloadTemplate}>Template CSV</Button>
          <label style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 12px', borderRadius:'var(--rs)', background:'var(--sur)', border:'1px solid var(--b2)', fontSize:12.5, fontWeight:500, cursor:'pointer', whiteSpace:'nowrap' }}>
            <Icon name="download" size={14} />Import CSV
            <input ref={csvRef} type="file" accept=".csv" style={{ display:'none' }} onChange={importCSV} />
          </label>
          <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('customers.csv',['รหัส','ชื่อ','ประเภท','เลขภาษี','โทร','ที่อยู่','ส่วนลด'],customers.map(c=>[c.code,c.name,c.type,c.tax||'',c.tel||'',c.addr||'',c.discount||0]))}>CSV</Button>
          <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายการลูกค้า',['รหัส','ชื่อ','ประเภท','เลขภาษี','โทร','ที่อยู่','ส่วนลด'],customers.map(c=>[c.code,c.name,c.type,c.tax||'',c.tel||'',c.addr||'',c.discount||0]))}>PDF</Button>
          <Button variant="bp" size="sm" onClick={()=>setShowAdd(true)}>+ เพิ่มลูกค้า</Button>
        </div>
      }>
        <div className="tw"><table>
          <thead><tr><th>รหัส</th><th>ชื่อลูกค้า</th><th>ประเภท</th><th>เลขผู้เสียภาษี</th><th>สาขา</th><th>โทร</th><th>ส่วนลด</th><th></th></tr></thead>
          <tbody>{custSlice.length===0
            ? <tr><td colSpan={8} style={{ textAlign:'center', padding:'24px 0', color:'var(--t3)' }}>ไม่พบลูกค้าที่ตรงกับคำค้นหา</td></tr>
            : custSlice.map(c=>(
            <tr key={c.id} style={{ borderBottom:'1px solid var(--bd)', opacity: c.is_active === false ? 0.6 : 1 }}>
              <td className="mono" style={{ color:'var(--t2)', padding:'10px 14px' }}>{c.code}</td>
              <td style={{ fontWeight:600, padding:'10px 14px' }}>
                {c.name}
                {c.is_active === false && <span style={{ marginLeft:7, fontSize:10.5, padding:'2px 6px', borderRadius:4, background:'var(--s3,#e5e5e5)', color:'var(--t3)', fontWeight:600, verticalAlign:'middle' }}>ระงับ</span>}
              </td>
              <td style={{ padding:'10px 14px' }}><Badge kind={c.type}/></td>
              <td className="mono" style={{ padding:'10px 14px' }}>{c.tax||'—'}</td>
              <td style={{ fontSize:12.5, padding:'10px 14px', color:'var(--t2)' }}>{(!c.branch||c.branch==='head')?'สำนักงานใหญ่':c.branch}</td>
              <td style={{ color:'var(--t2)', fontSize:13, padding:'10px 14px' }}>{c.tel||'—'}</td>
              <td style={{ color:'var(--am)', fontWeight:600, padding:'10px 14px' }}>{c.discount>0?window.fmtMoney(c.discount):'—'}</td>
              <td style={{ padding:'10px 14px' }}>
                <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                  {c.is_active !== false ? (
                    <>
                      <button onClick={()=>openEditCust(c)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--ac)', borderRadius:6, cursor:'pointer', background:'var(--abg)', color:'var(--ac)', fontFamily:'inherit', fontWeight:600 }}>แก้ไข</button>
                      <button onClick={()=>setDeactivateConfirm(c)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--b2)', borderRadius:6, cursor:'pointer', background:'var(--sur)', color:'var(--t2)', fontFamily:'inherit' }}>ปิดการใช้งาน</button>
                    </>
                  ) : (
                    <button onClick={()=>doReactivateCust(c)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--gn)', borderRadius:6, cursor:'pointer', background:'rgba(34,197,94,.08)', color:'var(--gn)', fontFamily:'inherit', fontWeight:600 }}>เปิดใช้งาน</button>
                  )}
                  <button onClick={()=>setDeleteConfirm(c)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid rgba(208,48,48,.35)', borderRadius:6, cursor:'pointer', background:'var(--rbg)', color:'var(--rd)', fontFamily:'inherit' }}>ลบ</button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
        <Paginator page={custPage} totalPages={custTotalPages} setPage={setCustPage} total={custTotal} pageSize={20} noun="ลูกค้า" />
      </Card>

      {importResult && <ImportResultModal result={importResult} entityLabel="ลูกค้า" onClose={()=>setImportResult(null)} />}

      {/* ── Add modal ── */}
      {showAdd && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="md" style={{ width:480 }}>
            <div className="md-h"><span className="md-t">เพิ่มลูกค้าใหม่</span><button type="button" className="md-x" aria-label="ปิด" onClick={()=>setShowAdd(false)}>✕</button></div>
            <div className="md-b">
              <div className="gr c2">
                <Field label="รหัสลูกค้า" required><input className="fc" value={form.code} onChange={e=>setForm(f=>({...f,code:e.target.value}))} placeholder="CUS006" style={{fontFamily:'var(--font-mono)'}}/></Field>
                <Field label="ประเภท"><select className="fc" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}><option value="wholesale">Wholesale</option><option value="online">Online</option></select></Field>
                <div style={{gridColumn:'1/-1'}}><Field label="ชื่อลูกค้า" required><input className="fc" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ชื่อร้าน/บริษัท"/></Field></div>
                <Field label="เลขผู้เสียภาษี" optional><input className="fc" value={form.tax} onChange={e=>setForm(f=>({...f,tax:e.target.value}))} style={{fontFamily:'var(--font-mono)'}}/></Field>
                <Field label="เบอร์โทร" optional><input className="fc" value={form.tel} onChange={e=>setForm(f=>({...f,tel:e.target.value}))}/></Field>
                <div style={{gridColumn:'1/-1'}}><Field label="ที่อยู่" optional><textarea className="fc" rows="2" value={form.addr} onChange={e=>setForm(f=>({...f,addr:e.target.value}))} style={{resize:'vertical'}}/></Field></div>
                <Field label="ส่วนลดประจำ (฿)" optional><input type="number" className="fc" value={form.discount} onChange={e=>setForm(f=>({...f,discount:e.target.value}))} placeholder="0"/></Field>
                <Field label="สาขา">
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <select className="fc" style={{flex:1}} value={form.branch==='head'?'head':'branch'} onChange={e=>setForm(f=>({...f,branch:e.target.value==='head'?'head':'สาขาที่ '}))}>
                      <option value="head">สำนักงานใหญ่</option>
                      <option value="branch">สาขา</option>
                    </select>
                    {form.branch!=='head' && <input className="fc" style={{width:80}} placeholder="เลขสาขา" value={form.branch.replace(/^สาขาที่\s*/,'')} onChange={e=>setForm(f=>({...f,branch:'สาขาที่ '+e.target.value}))}/>}
                  </div>
                </Field>
              </div>
            </div>
            <div className="md-f"><Button variant="bg2" onClick={()=>setShowAdd(false)}>ยกเลิก</Button><Button variant="bp" icon="check" onClick={addCustomer}>บันทึก</Button></div>
          </div>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editModal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setEditModal(null)}>
          <div className="md" style={{ width:480 }}>
            <div className="md-h">
              <span className="md-t">แก้ไขลูกค้า — <span style={{ fontFamily:'var(--font-mono)', color:'var(--ac)' }}>{editModal.code}</span></span>
              <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setEditModal(null)}>✕</button>
            </div>
            <div className="md-b">
              <div className="gr c2">
                <Field label="ประเภท"><select className="fc" value={editForm.type} onChange={e=>setEditForm(f=>({...f,type:e.target.value}))}><option value="wholesale">Wholesale</option><option value="online">Online</option></select></Field>
                <div style={{gridColumn:'1/-1'}}><Field label="ชื่อลูกค้า" required><input className="fc" value={editForm.name} onChange={e=>setEditForm(f=>({...f,name:e.target.value}))} /></Field></div>
                <Field label="เลขผู้เสียภาษี" optional><input className="fc" value={editForm.tax} onChange={e=>setEditForm(f=>({...f,tax:e.target.value}))} style={{fontFamily:'var(--font-mono)'}}/></Field>
                <Field label="เบอร์โทร" optional><input className="fc" value={editForm.tel} onChange={e=>setEditForm(f=>({...f,tel:e.target.value}))}/></Field>
                <div style={{gridColumn:'1/-1'}}><Field label="ที่อยู่" optional><textarea className="fc" rows="2" value={editForm.addr} onChange={e=>setEditForm(f=>({...f,addr:e.target.value}))} style={{resize:'vertical'}}/></Field></div>
                <Field label="ส่วนลดประจำ (฿)" optional><input type="number" className="fc" value={editForm.discount} onChange={e=>setEditForm(f=>({...f,discount:e.target.value}))} placeholder="0"/></Field>
                <Field label="สาขา">
                  <div style={{display:'flex',gap:6,alignItems:'center'}}>
                    <select className="fc" style={{flex:1}} value={editForm.branch==='head'?'head':'branch'} onChange={e=>setEditForm(f=>({...f,branch:e.target.value==='head'?'head':'สาขาที่ '}))}>
                      <option value="head">สำนักงานใหญ่</option>
                      <option value="branch">สาขา</option>
                    </select>
                    {editForm.branch!=='head' && <input className="fc" style={{width:80}} placeholder="เลขสาขา" value={editForm.branch.replace(/^สาขาที่\s*/,'')} onChange={e=>setEditForm(f=>({...f,branch:'สาขาที่ '+e.target.value}))}/>}
                  </div>
                </Field>
              </div>
            </div>
            <div className="md-f"><Button variant="bg2" onClick={()=>setEditModal(null)}>ยกเลิก</Button><Button variant="bp" icon="check" onClick={saveEditCust}>บันทึก</Button></div>
          </div>
        </div>
      )}

      {/* ── Deactivate confirm ── */}
      {deactivateConfirm && <div className="ov"><div className="md" style={{ width:380 }}>
        <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--s2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--t2)' }}><Icon name="x-circle" size={22}/></div>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>ปิดการใช้งานลูกค้า?</div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>ระงับการใช้งาน <b>{deactivateConfirm.name}</b> ({deactivateConfirm.code})</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>ลูกค้ายังอยู่ในรายการ สามารถเปิดใช้งานใหม่ได้ภายหลัง</div>
        </div>
        <div className="md-f" style={{ marginTop:20 }}>
          <Button variant="bg2" onClick={()=>setDeactivateConfirm(null)}>ยกเลิก</Button>
          <button onClick={doDeactivateCust} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--t2)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>ยืนยันปิดใช้งาน</button>
        </div>
      </div></div>}

      {/* ── Delete confirm ── */}
      {deleteConfirm && <div className="ov"><div className="md" style={{ width:380 }}>
        <div style={{ padding:'24px 24px 0', textAlign:'center' }}>
          <div style={{ width:48, height:48, borderRadius:14, background:'var(--rbg)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', color:'var(--rd)' }}><Icon name="x-circle" size={22}/></div>
          <div style={{ fontSize:16, fontWeight:800, marginBottom:6 }}>ลบลูกค้า?</div>
          <div style={{ fontSize:13, color:'var(--t2)' }}>ต้องการลบ <b>{deleteConfirm.name}</b> ({deleteConfirm.code}) ออกจากระบบ?</div>
          <div style={{ fontSize:12, color:'var(--t3)', marginTop:6 }}>ประวัติการขายที่ผ่านมาจะยังคงอยู่ในระบบ</div>
        </div>
        <div className="md-f" style={{ marginTop:20 }}>
          <Button variant="bg2" onClick={()=>setDeleteConfirm(null)}>ยกเลิก</Button>
          <button onClick={doDeleteCust} style={{ padding:'9px 20px', borderRadius:'var(--rs)', background:'var(--rd)', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', border:'none', fontFamily:'inherit' }}>ยืนยันลบ</button>
        </div>
      </div></div>}
    </div>
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

/* ═══ ISSUE FULL INV FROM TIV ═══ */
function IssueINVModal({ tiv, onConfirm, onClose, toast }) {
  const D   = window.SP_DATA;
  const co  = D.company;
  const st  = window.SP_STATE;
  const $   = window.fmtMoney;

  const [saving, setSaving] = React.useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [invDate] = React.useState(tiv.date || today);

  const invPfx = (st.docPrefixes?.inv) || 'INV';
  const now    = new Date();
  const yyyymm = String(now.getFullYear()) + String(now.getMonth() + 1).padStart(2, '0'); // key ใน DB
  const yymm   = String(now.getFullYear()).slice(-2) + String(now.getMonth() + 1).padStart(2, '0'); // ใส่ในเลขเอกสาร
  const [nextNo, setNextNo] = React.useState(`${invPfx}${yymm}???`);

  React.useEffect(() => {
    const compute = async () => {
      let lastSeq = 0;
      if (window.SP_API) {
        try {
          const rows = await window.SP_API.getCounters();
          const row  = rows.find(r => r.prefix === invPfx && String(r.year_month) === yyyymm);
          if (row) lastSeq = Number(row.last_counter) || 0;
        } catch (e) { /* fallback */ }
      }
      if (lastSeq === 0) {
        const pat = `${invPfx}${yymm}`;
        lastSeq = (st.invoices || [])
          .filter(iv => iv.no && iv.no.startsWith(pat))
          .map(iv => parseInt(iv.no.slice(pat.length), 10))
          .filter(n => !isNaN(n))
          .reduce((m, n) => Math.max(m, n), 0);
      }
      setNextNo(`${invPfx}${yymm}${String(lastSeq + 1).padStart(3, '0')}`);
    };
    compute();
  }, []);

  const cust = D.customers.find(c => c.id === tiv.custId);

  const doIssue = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        invoice_type:    'INV',
        prefix:          invPfx,
        channel:         tiv.channel || 'wholesale',
        ref_invoice_no:  tiv.no,
        customer_id:     tiv.custId || null,
        customer_name:   tiv.custName || '—',
        customer_tax_id: tiv.custTax || '',
        invoice_date:    invDate,
        gross_sale:      tiv.grossSale ?? tiv.total,
        discount:        tiv.discount ?? 0,
        net_sale:        tiv.netSale  ?? tiv.total,
        vat_base:        tiv.vatBase  ?? (tiv.total - (tiv.vat7 || 0)),
        vat7:            tiv.vat7     ?? 0,
        total:           tiv.total,
        payment_method:  tiv.pay || null,
        items: (tiv.items || []).map(it => ({
          code:   it.code,
          name:   it.name,
          weight: it.weight,
          price:  it.price || it.price_per_kg || 0,
          tax:    it.tax || it.tax_type || 'vat7',
        })),
      };

      if (window.SP_API) {
        const result = await window.SP_API.createInvoice(payload);
        const invNo  = result.invoice_no;

        // อัปเดต full_inv_no บน TIV ใน DB
        await window.SP_API.updateInvoiceFullInvNo(tiv.id, invNo);

        // Reload invoices จาก DB เพื่อให้ข้อมูลถูกต้อง
        await window.SP_API.reloadInvoices();
        const newInv = st.invoices.find(x => x.no === invNo);
        toast('ok', `ออกใบกำกับภาษี ${invNo} เรียบร้อย`);
        onConfirm(newInv || { ...payload, id: result.invoice_id, no: invNo, type: 'A4',
          thermalNo: tiv.no, fullInvNo: null, printCount: 0, voided: false,
          date: invDate, dateDisplay: tiv.dateDisplay });
      } else {
        // Mock mode
        const invNo = window.nextDocNo('invCounterA4', invPfx, true);
        const d = new Date(invDate);
        const beDate = `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`;
        const newInv = {
          id: Date.now(), no: invNo, thermalNo: tiv.no, type: 'A4',
          channel: tiv.channel || 'wholesale', fullInvNo: null, printCount: 0,
          custId: tiv.custId, custName: tiv.custName, custTax: tiv.custTax || '',
          date: invDate, dateDisplay: beDate,
          items: tiv.items || [],
          grossSale: tiv.grossSale ?? tiv.total,
          discount:  tiv.discount ?? 0,
          netSale:   tiv.netSale  ?? tiv.total,
          vatBase:   tiv.vatBase  ?? (tiv.total - (tiv.vat7 || 0)),
          vat7: tiv.vat7 ?? 0,
          total: tiv.total,
          pay: tiv.pay, status: 'paid', voided: false,
        };
        st.invoices.unshift(newInv);
        const tivInState = st.invoices.find(x => x.id === tiv.id);
        if (tivInState) tivInState.fullInvNo = invNo;
        toast('ok', `ออกใบกำกับภาษี ${invNo} เรียบร้อย`);
        onConfirm(newInv);
      }
    } catch (err) {
      toast('err', `ออกใบกำกับไม่สำเร็จ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md" style={{ width: 520 }}>
        <div className="md-h">
          <span className="md-t">ออกใบกำกับภาษีเต็มรูปแบบ</span>
          <button type="button" className="md-x" aria-label="ปิด" onClick={onClose}>✕</button>
        </div>
        <div className="md-b">
          {/* Header: INV number + date side by side */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
            <div>
              <label className="fl" style={{ marginBottom:4, display:'block' }}>เลขที่ INV ที่จะออก</label>
              <div style={{ padding:'10px 14px', background:'var(--abg)', borderRadius:'var(--rs)', fontFamily:'var(--font-mono)', fontWeight:800, fontSize:15, color:'var(--ac)', border:'2px solid var(--ac)', letterSpacing:1 }}>
                {nextNo}
              </div>
              {invPfx !== 'INV' && (
                <div style={{ fontSize:11, color:'var(--am)', marginTop:4 }}>⚠ prefix ปัจจุบัน "{invPfx}" — เปลี่ยนได้ที่ ตั้งค่า → เลขเอกสาร</div>
              )}
            </div>
            <div>
              <label className="fl" style={{ marginBottom:4, display:'block' }}>วันที่ใบกำกับ</label>
              <DateField value={invDate} readOnly style={{ height:44, background:'var(--s2)', cursor:'default' }} />
            </div>
          </div>

          {/* TIV ref + Customer info box */}
          <div style={{ padding:'12px 14px', background:'var(--s2)', borderRadius:'var(--rs)', border:'1px solid var(--bd)', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>อ้างอิง TIV</div>
                <div style={{ fontFamily:'var(--font-mono)', fontWeight:700, fontSize:13, color:'var(--ac)' }}>{tiv.no}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:2 }}>ยอดรวม</div>
                <div style={{ fontWeight:800, fontSize:16, color:'var(--gn)' }}>{$(tiv.total)}</div>
              </div>
            </div>
            {/* Customer details */}
            {(cust || tiv.custName) && (
              <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid var(--bd)' }}>
                <div style={{ fontSize:11, color:'var(--t3)', marginBottom:4 }}>ลูกค้า / Customer</div>
                <div style={{ fontWeight:700, fontSize:13 }}>{cust?.name || tiv.custName}</div>
                {(cust?.tax || tiv.custTax) && (
                  <div style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)', marginTop:2 }}>
                    เลขภาษี: {cust?.tax || tiv.custTax}
                  </div>
                )}
                {(cust?.addr) && (
                  <div style={{ fontSize:12, color:'var(--t2)', marginTop:2, lineHeight:1.6 }}>{cust.addr}</div>
                )}
              </div>
            )}
          </div>

          {/* Items summary */}
          <div style={{ borderRadius:'var(--rs)', border:'1px solid var(--bd)', overflow:'hidden', fontSize:12.5 }}>
            <div style={{ padding:'8px 12px', background:'var(--s2)', fontWeight:700, color:'var(--t2)', fontSize:12, borderBottom:'1px solid var(--bd)' }}>
              รายการสินค้า ({(tiv.items || []).length} รายการ)
            </div>
            {(tiv.items || []).slice(0, 5).map((it, i) => {
              const qty = window.fmtItemQty(Number(it.weight), it.code);
              const lineAmt = Number(it.weight) * Number(it.price || it.price_per_kg || 0);
              return (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', borderBottom:'1px solid var(--bd)', background: i%2===0?'var(--sur)':'var(--s2)' }}>
                  <div style={{ flex:1, overflow:'hidden', paddingRight:8 }}>
                    <div style={{ fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{it.name}</div>
                    <div style={{ fontSize:11, color:'var(--t3)', fontFamily:'var(--font-mono)' }}>{it.code}</div>
                  </div>
                  <div style={{ textAlign:'right', whiteSpace:'nowrap', fontFamily:'var(--font-mono)', fontSize:12 }}>
                    <div style={{ color:'var(--t2)' }}>{qty}</div>
                    <div style={{ fontWeight:700 }}>{$(lineAmt)}</div>
                  </div>
                </div>
              );
            })}
            {(tiv.items || []).length > 5 && (
              <div style={{ padding:'6px 12px', color:'var(--t3)', fontSize:11.5, background:'var(--s2)' }}>
                ...และอีก {tiv.items.length - 5} รายการ
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 12px', fontWeight:800, background:'var(--s3)', borderTop:'2px solid var(--bd)' }}>
              <span>ยอดรวมทั้งสิ้น</span>
              <span style={{ color:'var(--gn)', fontSize:15 }}>{$(tiv.total)}</span>
            </div>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ยกเลิก</Button>
          <Button variant="bp" icon={saving ? undefined : 'check'} onClick={doIssue} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : `ออกใบกำกับ ${nextNo}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
window.IssueINVModal = IssueINVModal;

/* ═══ AMEND / CANCEL INV → CN / DN / CORRECTION (Thai VAT Law ม.86/9, 86/10) ═══
   Rules:
   • Customer info change only (same amount) → Corrected Tax Invoice (ใบกำกับแก้ไข)
   • Amount decreased  → Credit Note / ใบลดหนี้  (CN)
   • Amount increased  → Debit Note  / ใบเพิ่มหนี้ (DN)
   • All cases: void original INV + restore stock + date = original INV date        */
function AmendINVModal({ inv, onConfirm, onClose, toast }) {
  const D   = window.SP_DATA;
  const st  = window.SP_STATE;

  const [custName,   setCustName]   = React.useState(inv.custName || '');
  const [custAddr,   setCustAddr]   = React.useState(
    inv.custAddr || D.customers?.find(c=>c.id===inv.custId)?.addr || ''
  );
  const [custTax,    setCustTax]    = React.useState(inv.custTax || '');
  const [branchType, setBranchType] = React.useState(() => {
    const b = inv.custBranch || D.customers?.find(c=>c.id===inv.custId)?.branch || 'head';
    return (b === 'head' || !b) ? 'head' : 'other';
  });
  const [branchName, setBranchName] = React.useState(() => {
    const b = inv.custBranch || D.customers?.find(c=>c.id===inv.custId)?.branch || 'head';
    return (b === 'head' || !b) ? '' : b;
  });
  const [reason,     setReason]     = React.useState('');
  const [saving,     setSaving]     = React.useState(false);

  const custBranch = branchType === 'head' ? 'head' : (branchName.trim() || 'head');

  const origAddr   = inv.custAddr || D.customers?.find(c=>c.id===inv.custId)?.addr || '';
  const origBranch = inv.custBranch || D.customers?.find(c=>c.id===inv.custId)?.branch || 'head';
  const custInfoChanged =
    custName.trim() !== (inv.custName||'').trim() ||
    custTax.trim()  !== (inv.custTax||'').trim()  ||
    custAddr.trim() !== origAddr.trim()             ||
    custBranch      !== origBranch;

  const pfx  = st.docPrefixes || {};
  const now  = new Date();
  const yymm = String(now.getFullYear()) + String(now.getMonth()+1).padStart(2,'0');
  const nextNo = custInfoChanged
    ? (pfx.inv||'INV') + '-' + yymm + '-' + String(st.invCounterA4||1).padStart(4,'0')
    : '—';

  const doAmend = async () => {
    if (!custInfoChanged) { toast('err', 'ไม่มีการเปลี่ยนแปลงข้อมูลลูกค้า'); return; }
    if (!reason.trim())   { toast('err', 'กรุณาระบุเหตุผล'); return; }
    if (saving) return;
    setSaving(true);
    try {
      const usr      = D.user?.name || 'Admin';
      const refNo    = inv.no;
      const refDate  = inv.date;
      const noteText = 'ออกใบกำกับภาษีฉบับใหม่แทนฉบับเดิม เลขที่ ' + refNo;

      if (window.SP_API) {
        await window.SP_API.voidInvoice(inv.id, {
          voided_by:     usr,
          void_reason:   reason,
          restore_stock: false,
        });

        const payload = {
          invoice_type:    'INV',
          prefix:          pfx.inv || 'INV',
          channel:         inv.channel || 'wholesale',
          ref_invoice_no:  refNo,
          customer_id:     inv.custId || null,
          customer_name:   custName,
          customer_tax_id: custTax,
          customer_branch: custBranch,
          invoice_date:    refDate,
          gross_sale:      Number(inv.gross_sale || inv.grossSale || 0),
          discount:        Number(inv.discount || 0),
          net_sale:        Number(inv.net_sale  || inv.netSale   || 0),
          vat_base:        Number(inv.vat_base  || inv.vatBase   || 0),
          vat7:            Number(inv.vat7  || 0),
          total:           Number(inv.total || 0),
          payment_method:  inv.pay || null,
          note:            noteText,
          reason:          reason,
          items: (inv.items || []).map(it => ({
            code:   it.code,
            name:   it.name,
            weight: Number(it.weight || 0),
            price:  Number(it.price  || it.price_per_kg || 0),
            tax:    it.tax || 'vat7',
          })),
        };

        const result   = await window.SP_API.createInvoice(payload);
        const newDocNo = result.invoice_no;

        const tiv2 = st.invoices.find(x => x.no === inv.thermalNo && x.type === 'Thermal');
        if (tiv2) {
          await window.SP_API.updateInvoiceFullInvNo(tiv2.id, newDocNo).catch(() => {});
          tiv2.fullInvNo = newDocNo;
        }

        await window.SP_API.logAudit('REPLACE_INV', inv.no, newDocNo, reason);
        await window.SP_API.reloadInvoices();
        await window.SP_API.reloadProducts();

        st.invCounterA4 = (st.invCounterA4||0) + 1;

        const newDoc = {
          ...(st.invoices.find(x => x.no === newDocNo) || { ...payload, no: newDocNo, id: result.invoice_id }),
          refInvDate: inv.dateDisplay || inv.date,
          custAddr,
        };
        toast('ok', 'ยกเลิก ' + refNo + ' แล้ว — ออก INV ' + newDocNo + ' เรียบร้อย');
        onConfirm(newDoc);

      } else {
        st.invoices = st.invoices.map(x => x.id===inv.id
          ? { ...x, voided:true, status:'voided', voidedBy:usr, voidReason:reason, stockRestored:false }
          : x
        );

        const d = new Date(refDate);
        const beDate = refDate
          ? String(d.getDate()).padStart(2,'0') + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String((d.getFullYear()+543)%100)
          : inv.dateDisplay;
        const newDoc = {
          id: Date.now(), no: nextNo, type: 'A4',
          thermalNo: inv.thermalNo, refInvNo: refNo, refInvDate: inv.dateDisplay || inv.date,
          channel: inv.channel||'wholesale',
          custId: inv.custId, custName, custTax, custAddr, custBranch,
          date: refDate, dateDisplay: beDate,
          items: inv.items,
          grossSale: Number(inv.gross_sale||inv.grossSale||0),
          discount:  Number(inv.discount||0),
          netSale:   Number(inv.net_sale||inv.netSale||0),
          vatBase:   Number(inv.vat_base||inv.vatBase||0),
          vat7:      Number(inv.vat7||0),
          total:     Number(inv.total||0),
          pay: inv.pay, status:'paid', voided:false, printCount:0,
          note: noteText, reason,
        };
        st.invoices.unshift(newDoc);
        st.invCounterA4 = (st.invCounterA4||1) + 1;

        const tiv2 = st.invoices.find(x => x.no === inv.thermalNo && x.type === 'Thermal');
        if (tiv2) tiv2.fullInvNo = nextNo;

        toast('ok', 'ยกเลิก ' + refNo + ' แล้ว — ออก INV ' + nextNo + ' เรียบร้อย');
        onConfirm(newDoc);
      }
    } catch (err) {
      toast('err', 'ดำเนินการไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ov" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="md" style={{ width:'min(600px,97vw)' }}>
        <div className="md-h">
          <span className="md-t">แก้ไขหัวใบกำกับภาษี — <span style={{ fontFamily:'var(--font-mono)', color:'var(--rd)' }}>{inv.no}</span></span>
          <button type="button" className="md-x" aria-label="ปิด" onClick={onClose}>✕</button>
        </div>

        <div className="md-b">
          <div style={{ padding:'9px 14px', background:'rgba(66,99,235,.07)', border:'1px solid rgba(66,99,235,.25)', borderRadius:'var(--rs)', marginBottom:14, fontSize:12, lineHeight:1.7 }}>
            <b>ℹ แก้ไขข้อมูลลูกค้า:</b> ใบกำกับเดิม <b>{inv.no}</b> จะถูก<b>ยกเลิก</b> และออก<b>ใบกำกับภาษีฉบับใหม่</b>แทน
            &nbsp;· วันที่ตรงกับฉบับเดิม = <b>{inv.dateDisplay || inv.date}</b>
          </div>

          <div style={{ marginBottom:14 }}>
            <div style={{ fontWeight:700, fontSize:12, color:'var(--t2)', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>ข้อมูลผู้ซื้อ (แก้ไขได้)</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 12px' }}>
              <div className="fg" style={{ margin:0 }}>
                <label className="fl">ชื่อบริษัท / ลูกค้า <span style={{ color:'var(--rd)' }}>*</span></label>
                <input className="fc" value={custName} onChange={e=>setCustName(e.target.value)} />
              </div>
              <div className="fg" style={{ margin:0 }}>
                <label className="fl">เลขประจำตัวผู้เสียภาษี</label>
                <input className="fc" value={custTax} onChange={e=>setCustTax(e.target.value)} placeholder="0000000000000" />
              </div>
              <div className="fg" style={{ margin:0, gridColumn:'1 / -1' }}>
                <label className="fl">ที่อยู่</label>
                <input className="fc" value={custAddr} onChange={e=>setCustAddr(e.target.value)} />
              </div>
              <div className="fg" style={{ margin:0 }}>
                <label className="fl">ประเภทสาขา</label>
                <select className="fc" value={branchType} onChange={e=>setBranchType(e.target.value)}>
                  <option value="head">สำนักงานใหญ่</option>
                  <option value="other">สาขา</option>
                </select>
              </div>
              {branchType === 'other' && (
                <div className="fg" style={{ margin:0 }}>
                  <label className="fl">ชื่อ / รหัสสาขา</label>
                  <input className="fc" value={branchName} onChange={e=>setBranchName(e.target.value)}
                    placeholder="เช่น สาขาลาดพร้าว / 00001" />
                </div>
              )}
            </div>
          </div>

          {custInfoChanged && (
            <div style={{ padding:'10px 14px', background:'rgba(66,99,235,.07)', border:'1px solid rgba(66,99,235,.25)', borderRadius:'var(--rs)', marginBottom:14 }}>
              <div style={{ fontSize:11, color:'var(--t2)', marginBottom:3 }}>เอกสารที่จะออก</div>
              <div style={{ fontWeight:800, fontSize:14, color:'var(--ac)' }}>
                <span style={{ display:'inline-block', padding:'2px 8px', borderRadius:4, background:'var(--ac)', color:'#fff', fontSize:11, fontFamily:'var(--font-mono)', marginRight:8 }}>INV</span>
                ใบกำกับภาษีฉบับใหม่ (แทนฉบับเดิม)
                <span style={{ fontSize:11, color:'var(--t2)', marginLeft:8, fontWeight:400 }}>→ {nextNo}</span>
              </div>
              <div style={{ fontSize:11, color:'var(--t2)', marginTop:4 }}>
                ออกใบกำกับภาษีฉบับใหม่แทนเลขที่ <b>{inv.no}</b> ลงวันที่ <b>{inv.dateDisplay || inv.date}</b>
              </div>
            </div>
          )}

          <div className="fg" style={{ marginBottom:0 }}>
            <label className="fl">เหตุผล <span style={{ color:'var(--rd)' }}>*</span></label>
            <textarea className="fc" rows={2} value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="เช่น ข้อมูลลูกค้าผิด / ชื่อบริษัทไม่ถูกต้อง / เลขภาษีผิด…"
              style={{ resize:'vertical' }} />
          </div>
        </div>

        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ยกเลิก</Button>
          <button onClick={doAmend}
            disabled={saving || !custInfoChanged || !reason.trim()}
            style={{
              display:'flex', alignItems:'center', gap:7,
              padding:'9px 22px', borderRadius:'var(--rs)',
              background: (custInfoChanged&&reason.trim()&&!saving) ? 'var(--ac)' : 'var(--s2)',
              color: (custInfoChanged&&reason.trim()&&!saving) ? '#fff' : 'var(--t3)',
              fontSize:14, fontWeight:700,
              cursor: (custInfoChanged&&reason.trim()&&!saving) ? 'pointer' : 'not-allowed',
              border:'none', fontFamily:'inherit',
              opacity: (custInfoChanged&&reason.trim()&&!saving) ? 1 : 0.55,
            }}>
            {saving ? 'กำลังบันทึก…' : !custInfoChanged ? 'ยังไม่มีการเปลี่ยนแปลง' : ('ออกใบกำกับใหม่ ' + nextNo)}
          </button>
        </div>
      </div>
    </div>
  );
}
window.AmendINVModal = AmendINVModal;

/* ═══ TIV ABBREVIATED INVOICE MODAL — รูปแบบเดียวกับใบเสร็จตอนชำระเงิน ═══ */
function TIVDocModal({ tiv, onClose, toast, onVoid }) {
  if (!tiv) return null;
  const co  = window.SP_DATA.company;
  const usr = window.SP_DATA.user;
  const $   = window.fmtMoney;
  const nf  = n => Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const net      = Number(tiv.total || tiv.netSale || 0);
  const disc     = Number(tiv.discount || 0);
  const subtotal = Number(tiv.grossSale || net + disc || 0);
  const vat      = Number(tiv.vat7 || 0);
  const preVat   = net - vat;
  const payLabel = { cash:'เงินสด', transfer:'เงินโอน', credit:'เครดิต' }[tiv.pay] || '—';

  /* Merge same product + same weight */
  const items = window.mergeInvItems ? window.mergeInvItems(tiv.items || [], disc) : (tiv.items || []);
  const totalW = items.reduce((s,it) => s + (it.indivWeight || Number(it.weight||0)), 0);

  const DL = { borderBottom:'1px dashed #ccc', margin:'8px 0' };

  const handlePrint = () => {
    window.printDoc('tiv', { ...tiv, items: tiv.items });
    const st  = window.SP_STATE;
    const inv = st.invoices.find(x => x.id === tiv.id);
    if (inv) inv.printCount = (inv.printCount||0)+1;
    if (window.SP_API && typeof window.SP_API.logPrint === 'function') {
      window.SP_API.logPrint('TIV', tiv.no).catch(()=>{});
    }
  };

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="md" style={{ width:480 }}>
        <div className="md-h">
          <span className="md-t">{tiv.voided ? 'ใบเสร็จยกเลิก' : 'ใบเสร็จรับเงิน / ใบกำกับภาษีแบบย่อ'}</span>
          <div style={{ display:'flex', gap:8 }}>
            <Button variant={tiv.voided ? 'bg2' : 'bp'} size="sm" icon="printer" onClick={handlePrint}>พิมพ์{tiv.voided?' (สำเนายกเลิก)':''}</Button>
            <button type="button" className="md-x" aria-label="ปิด" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="md-b" style={{ background:'#f5f4f0', padding:'16px' }}>
          <div style={{ background:'#fff', maxWidth:400, margin:'0 auto', padding:'20px 20px 16px', fontFamily:'var(--font-sans)', color:'#18171a', boxShadow:'0 2px 12px rgba(0,0,0,.1)', borderRadius:4 }}>

            {/* Void stamp */}
            {tiv.voided && (
              <div style={{ textAlign:'center', marginBottom:14 }}>
                <span style={{ fontSize:24, fontWeight:900, color:'#c0392b', letterSpacing:6 }}>ยกเลิก</span>
              </div>
            )}

            {/* Header */}
            <div style={{ textAlign:'center', marginBottom:12 }}>
              <div style={{ fontSize:14, fontWeight:800, marginBottom:3 }}>{co.name}</div>
              <div style={{ fontSize:10.5, color:'#555', lineHeight:1.7 }}>{co.addr}</div>
              <div style={{ fontSize:10.5, color:'#555' }}>เลขประจำตัวผู้เสียภาษี {co.tax}</div>
              <div style={{ fontSize:10.5, color:'#555' }}>(สำนักงานใหญ่)</div>
            </div>

            <div style={{ ...DL }} />
            <div style={{ textAlign:'center', padding:'6px 0', marginBottom:8 }}>
              <div style={{ fontSize:12.5, fontWeight:800 }}>ใบเสร็จรับเงิน/ใบกำกับภาษีแบบย่อ</div>
            </div>

            {/* Doc info */}
            <div style={{ fontSize:12, marginBottom:10 }}>
              {[
                ['เลขที่เอกสาร', tiv.no || tiv.thermalNo],
                ['วันที่ขาย',    tiv.dateDisplay || tiv.date || ''],
                ['พนักงานขาย',   usr?.name || 'Admin'],
                ...(tiv.custName && tiv.custName !== '—' ? [['ลูกค้า', tiv.custName]] : []),
                ...(tiv.replaces ? [['ออกแทนใบ', tiv.replaces]] : []),
              ].map(([l,v]) => (
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
            {items.map((it, i) => {
              const w       = Number(it.indivWeight || it.weight || 0);
              const p       = Number(it.price || it.price_per_kg || 0);
              const uInfo   = window.unitOf ? window.unitOf(it.code) : { unitType:'kg', unitLabel:'KG' };
              const isUnit  = uInfo.unitType === 'unit';
              const qty     = isUnit ? w * (it.scanCount||1) : (it.scanCount || 1);
              const iDisc   = Number(it.lineDisc || 0);
              const total   = isUnit ? qty * p - iDisc : qty * w * p - iDisc;
              const subInfo = isUnit
                ? `${qty} ${uInfo.unitLabel} · ฿${p}/${uInfo.unitLabel}`
                : `${w.toFixed(3)} KG · ฿${p}/KG`;
              return (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 36px 80px 85px', gap:4, fontSize:12, marginBottom:8, alignItems:'start' }}>
                  <div>
                    <div style={{ fontWeight:600, lineHeight:1.4 }}>{it.name}</div>
                    <div style={{ fontSize:10.5, color:'#888' }}>{subInfo}</div>
                    {iDisc > 0 && <div style={{ fontSize:10.5, color:'#e00' }}>ส่วนลด -{nf(iDisc)}</div>}
                  </div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:600 }}>{qty}</div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11.5 }}>{nf(isUnit ? p : w * p)}</div>
                  <div style={{ textAlign:'right', fontFamily:'var(--font-mono)', fontSize:11.5, fontWeight:700 }}>{nf(total)}</div>
                </div>
              );
            })}
            <div style={{ fontSize:11, color:'#666', borderTop:'1px dashed #ccc', paddingTop:6, marginBottom:6 }}>
              รายการ: {items.length} &nbsp;·&nbsp; น้ำหนักรวม: {totalW.toFixed(3)} KG
            </div>

            {/* Totals */}
            <div style={{ ...DL }} />
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
              <span style={{ color:'#555' }}>รวมเป็นเงิน</span><span>{nf(subtotal)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:3 }}>
              <span style={{ color:'#555' }}>ส่วนลด</span>
              <span style={{ color: disc>0?'#e00':'inherit', fontWeight: disc>0?700:400 }}>
                {disc>0 ? '-'+nf(disc) : '0.00'}
              </span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:3 }}>
              <span style={{ color:'#555' }}>รวมมูลค่าสินค้า (ก่อน VAT)</span><span>{$(preVat)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:4 }}>
              <span style={{ color:'#555' }}>ภาษีมูลค่าเพิ่ม 7%</span><span>{$(vat)}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:15, fontWeight:800, borderTop:'2px solid #18171a', borderBottom:'2px solid #18171a', padding:'5px 0', margin:'4px 0 8px' }}>
              <span>รวมทั้งสิ้น</span><span>{$(net)}</span>
            </div>

            <div style={{ ...DL }} />
            <div style={{ fontSize:12, marginBottom:8 }}>
              <span style={{ color:'#555' }}>ประเภทการชำระเงิน: </span><b>{payLabel}</b>
            </div>

            {tiv.voided ? (
              <div style={{ borderTop:'2px dashed #c0392b', paddingTop:10, marginTop:4 }}>
                <div style={{ textAlign:'center', fontSize:12, fontWeight:800, color:'#c0392b', marginBottom:6 }}>
                  — เอกสารฉบับนี้ถูกยกเลิกแล้ว —
                </div>
                <div style={{ fontSize:11, color:'#666', display:'grid', gridTemplateColumns:'auto 1fr', gap:'3px 10px' }}>
                  <span>วันที่ยกเลิก:</span><span style={{ fontWeight:700 }}>{(() => {
                    const v = tiv.voidedAt;
                    if (!v) return '—';
                    if (v.includes('T') || v.includes('Z')) {
                      const d = new Date(v);
                      const dd = String(d.getDate()).padStart(2,'0');
                      const mm = String(d.getMonth()+1).padStart(2,'0');
                      const yy = d.getFullYear()+543;
                      const hh = String(d.getHours()).padStart(2,'0');
                      const mi = String(d.getMinutes()).padStart(2,'0');
                      return `${dd}/${mm}/${yy} ${hh}:${mi}`;
                    }
                    return v;
                  })()}</span>
                  <span>ผู้ยกเลิก:</span><span>{tiv.voidedBy || '—'}</span>
                  <span>เหตุผล:</span><span>{tiv.voidReason || '—'}</span>
                </div>
              </div>
            ) : (
              <div style={{ textAlign:'center', fontSize:11, color:'#888', borderTop:'1px dashed #ccc', paddingTop:10 }}>
                ขอบคุณที่ใช้บริการ
              </div>
            )}
          </div>
        </div>

        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
          {!tiv.voided && onVoid && (
            <button onClick={onVoid}
              style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:'var(--rs)', background:'var(--rbg)', color:'var(--rd)', fontSize:13, fontWeight:700, cursor:'pointer', border:'1px solid rgba(208,48,48,.3)', fontFamily:'inherit' }}>
              <Icon name="x-circle" size={14} style={{ color:'var(--rd)' }}/> ยกเลิกใบนี้
            </button>
          )}
          <Button variant="bp" icon="printer" onClick={handlePrint}>พิมพ์</Button>
        </div>
      </div>
    </div>
  );
}

/* ═══ เอกสารปรับปรุงสต็อก (ADJ) ═══ */
function AdjDocument({ doc, onClose, toast }) {
  if (!doc) return null;
  const co  = window.SP_DATA.company;
  const nf  = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const ACC       = '#1a4fa0';
  const ACC_LIGHT = '#e8eef8';
  const items = doc.items || [];

  const adjTypeLabel = { expired:'หมดอายุ', damage:'เสียหาย', recount:'นับใหม่', other:'อื่นๆ' }[doc.adjType] || doc.adjType;
  const netAdj = Number(doc.totalAdj || 0);

  const TH = { padding:'8px 10px', background:ACC, color:'#fff', fontWeight:700, fontSize:11.5,
    borderBottom:'1px solid rgba(0,0,0,.15)', borderRight:'1px solid rgba(255,255,255,.2)', verticalAlign:'middle' };
  const TD = { padding:'8px 10px', fontSize:12.5, borderBottom:'1px solid #e8e8e8', borderRight:'1px solid #e8e8e8', verticalAlign:'top' };

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="md" style={{ width:'min(860px,96vw)' }}>
        <div className="md-h">
          <span className="md-t" style={{ color:ACC }}>
            เอกสารปรับปรุงสต็อก · <span style={{ fontFamily:'var(--font-mono)' }}>{doc.id}</span>
          </span>
          <div style={{ display:'flex', gap:8 }}>
            <Button variant="bp" size="sm" icon="printer" onClick={()=>toast('info','กำลังพิมพ์เอกสาร ADJ…')}>พิมพ์</Button>
            <button type="button" className="md-x" aria-label="ปิด" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="md-b" style={{ background:'#e8e7e2', padding:16, overflowX:'auto' }}>
          <div style={{ width:'100%', maxWidth:794, background:'#fff', margin:'0 auto',
            boxShadow:'0 2px 16px rgba(0,0,0,.12)', fontFamily:'var(--font-sans)',
            color:'#111', padding:'24px 28px', boxSizing:'border-box', fontSize:12.5 }}>

            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              borderBottom:`3px solid ${ACC}`, paddingBottom:14, marginBottom:14 }}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                {co.logoUrl && <img src={co.logoUrl} alt="logo" style={{ width:52,height:52,objectFit:'contain',borderRadius:6,flexShrink:0 }} />}
                <div>
                  <div style={{ fontSize:16, fontWeight:800, color:'#111' }}>{co.name}</div>
                  {co.nameEn && <div style={{ fontSize:11.5, fontWeight:600, color:'#444' }}>{co.nameEn}</div>}
                  <div style={{ fontSize:11, color:'#555', lineHeight:1.8, marginTop:2 }}>
                    {co.addr && <div>{co.addr}</div>}
                    <div>โทร. {co.tel}{co.email ? ` | ${co.email}` : ''}</div>
                    <div>เลขประจำตัวผู้เสียภาษี <b style={{ color:'#111' }}>{co.tax}</b></div>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'right', minWidth:200, flexShrink:0 }}>
                <div style={{ fontSize:20, fontWeight:800, color:ACC, lineHeight:1.3 }}>เอกสารปรับปรุงสต็อก</div>
                <div style={{ fontSize:12, color:'#555', marginTop:2 }}>Stock Adjustment Document</div>
              </div>
            </div>

            {/* Meta grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:0,
              border:'1px solid #ccc', borderRadius:6, overflow:'hidden', marginBottom:14 }}>
              <div style={{ padding:'12px 16px' }}>
                <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:'4px 12px', fontSize:12.5 }}>
                  <span style={{ color:'#888' }}>ประเภท:</span>
                  <b>{adjTypeLabel}</b>
                  <span style={{ color:'#888' }}>เหตุผล:</span>
                  <span>{doc.reason || '—'}</span>
                  {doc.note && <><span style={{ color:'#888' }}>หมายเหตุ:</span><span>{doc.note}</span></>}
                  <span style={{ color:'#888' }}>ผู้อนุมัติ:</span>
                  <span>{doc.approver || '—'}</span>
                </div>
              </div>
              <div style={{ padding:'12px 16px', background:ACC_LIGHT, minWidth:180, borderLeft:'1px solid #ccc' }}>
                <div style={{ fontSize:11, color:'#666', marginBottom:2 }}>เลขที่เอกสาร</div>
                <div style={{ fontFamily:'var(--font-mono)', fontSize:14, fontWeight:800, color:ACC, marginBottom:8 }}>{doc.id}</div>
                <div style={{ fontSize:11, color:'#666', marginBottom:2 }}>วันที่</div>
                <div style={{ fontWeight:700 }}>{doc.dateDisplay || doc.date}</div>
              </div>
            </div>

            {/* Items table */}
            <table style={{ width:'100%', borderCollapse:'collapse', border:'1px solid #ccc', marginBottom:14 }}>
              <thead>
                <tr>
                  <th style={{ ...TH, width:36 }}>#</th>
                  <th style={TH}>รหัส</th>
                  <th style={TH}>ชื่อสินค้า</th>
                  <th style={{ ...TH, textAlign:'right' }}>ก่อนปรับ (KG)</th>
                  <th style={{ ...TH, textAlign:'right' }}>ปรับ (+/-)</th>
                  <th style={{ ...TH, textAlign:'right', borderRight:'none' }}>หลังปรับ (KG)</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={it.code+i}>
                    <td style={{ ...TD, color:'#999', fontSize:11 }}>{i+1}</td>
                    <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:11.5 }}>{it.code}</td>
                    <td style={{ ...TD, fontWeight:600 }}>{it.name}</td>
                    <td style={{ ...TD, textAlign:'right', fontFamily:'var(--font-mono)' }}>{nf(it.before)}</td>
                    <td style={{ ...TD, textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:700,
                      color: Number(it.adj) >= 0 ? '#15803d' : '#dc2626' }}>
                      {Number(it.adj) >= 0 ? '+' : ''}{nf(it.adj)}
                    </td>
                    <td style={{ ...TD, textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:700, borderRight:'none' }}>{nf(it.after)}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan="6" style={{ padding:20, textAlign:'center', color:'#aaa' }}>ไม่มีรายการ</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr style={{ background:ACC_LIGHT }}>
                  <td colSpan="3" style={{ padding:'8px 10px', fontWeight:700, fontSize:12 }}>รวม {items.length} รายการ</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:700 }}>{nf(doc.totalBefore||0)}</td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:800,
                    color: netAdj >= 0 ? '#15803d' : '#dc2626' }}>
                    {netAdj >= 0 ? '+' : ''}{nf(netAdj)}
                  </td>
                  <td style={{ padding:'8px 10px', textAlign:'right', fontFamily:'var(--font-mono)', fontWeight:700 }}>{nf(doc.totalAfter||0)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:0,
              border:'1px solid #ccc', borderRadius:6, overflow:'hidden', marginTop:8 }}>
              {['ผู้จัดทำ / Prepared by','ผู้ตรวจสอบ / Checked by','ผู้อนุมัติ / Approved by'].map((label, i) => (
                <div key={i} style={{ padding:'10px 14px', borderRight: i<2 ? '1px solid #ccc' : 'none' }}>
                  {i === 2 && doc.approver && <div style={{ fontSize:12.5, fontWeight:700, textAlign:'center', marginBottom:6 }}>{doc.approver}</div>}
                  <div style={{ marginTop: i === 2 && doc.approver ? 20 : 40, borderTop:'1px solid #bbb',
                    paddingTop:6, textAlign:'center', fontSize:11, color:'#666' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign:'center', fontSize:10.5, color:'#aaa', marginTop:12 }}>
              NEXflow — {co.name}
            </div>
          </div>
        </div>

        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
          <Button variant="bp" icon="printer" onClick={()=>toast('info','กำลังพิมพ์เอกสาร ADJ…')}>พิมพ์ A4</Button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { InvoiceList, StockManage, Users, Settings, Products, Customers, Placeholder, AdjDocument, IssueINVModal, AmendINVModal, TIVDocModal });
