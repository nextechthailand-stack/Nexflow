/* NEXflow UI Kit — Reports (6 tabs: รายการสินค้า, ภาษีซื้อ-ขาย, Daily Sale, Payment, % Discount, รายลูกค้า) */

const RPT_TABS = [
  { id:'product',  label:'rpt_tab_product' },
  { id:'tax',      label:'rpt_tab_tax' },
  { id:'daily',    label:'rpt_tab_daily' },
  { id:'payment',  label:'rpt_tab_payment' },
  { id:'discount', label:'rpt_tab_discount' },
  { id:'customer', label:'rpt_tab_customer' },
];
const PAY_LABELS = { cash:'เงินสด', transfer:'โอนเงิน', credit:'เครดิต' };
const PAY_ICONS  = { cash:'🟩', transfer:'🏦', credit:'💳' };
const PAY_COLORS = { cash:'#3b5bdb', transfer:'#0d9272', credit:'#c47b00' };

/* Donut chart — slices:[{pct,color,label}], size=px */
function PieChart({ slices = [], size = 180 }) {
  const R = size / 2, r = R * 0.58, cx = R, cy = R;
  const circumference = 2 * Math.PI * r;
  const GAP = slices.length > 1 ? 2.5 : 0; // gap between slices in px

  let offset = 0;
  const arcs = slices.map((s, i) => {
    const dash = Math.max(0, s.pct * circumference - GAP);
    const arc = { ...s, dash, gap: circumference - dash, offset };
    offset += s.pct * circumference;
    return arc;
  });

  const total = slices.reduce((a, s) => a + (s.amount || 0), 0);

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          {/* track */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--s3,#eee)" strokeWidth={R*0.22} />
          {arcs.map((a, i) => (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={a.color} strokeWidth={R*0.22}
              strokeDasharray={`${a.dash} ${a.gap}`}
              strokeDashoffset={-a.offset}
              strokeLinecap="butt"
              style={{ transition:'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease' }}
            />
          ))}
        </svg>
        {/* center label */}
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
          <div style={{ fontSize: size * 0.11, fontWeight:800, color:'var(--tx)', letterSpacing:'-.5px', lineHeight:1.1 }}>
            {slices.length === 1 ? '100%' : `${slices.length}`}
          </div>
          <div style={{ fontSize: size * 0.075, color:'var(--t3)', fontWeight:500 }}>
            {slices.length === 1 ? slices[0].label : 'ช่องทาง'}
          </div>
        </div>
      </div>
    </div>
  );
}

function Reports({ toast = ()=>{} }) {
  const [, t] = useLang();
  /* Re-render เมื่อ reloadInvoices() อัปเดตข้อมูล */
  const [dataVer, setDataVer] = React.useState(window.SP_DASH_VERSION || 0);
  React.useEffect(() => {
    const onUpdate = () => setDataVer(v => v + 1);
    window.addEventListener('sp:data-updated', onUpdate);
    return () => window.removeEventListener('sp:data-updated', onUpdate);
  }, []);

  const D = window.SP_DATA;
  const [tab, setTab]           = React.useState('product');
  const [prodSub, setProdSub]   = React.useState('flat'); /* flat | byproduct */
  const [taxSub, setTaxSub]     = React.useState('sale'); /* sale | buy */
  const [dateFrom, setDateFrom] = React.useState(() => window.toLocalISODate());
  const [dateTo, setDateTo]     = React.useState(() => window.toLocalISODate());
  const [search, setSearch]         = React.useState('');
  const [discSearch, setDiscSearch] = React.useState('');
  const [custModal, setCustModal]   = React.useState(null);
  const [taxDocModal, setTaxDocModal] = React.useState(null); /* TIV invoice popup */
  const [taxA4Modal,  setTaxA4Modal]  = React.useState(null); /* INV/A4 invoice popup */
  const [taxGrnModal, setTaxGrnModal] = React.useState(null); /* GRN popup */

  React.useEffect(() => { setSearch(''); setDiscSearch(''); }, [tab]);

  /* ── filter ── */
  const allRows = D.reportRows;
  const rows = allRows.filter(r => {
    if (dateFrom && r.dateISO < dateFrom) return false;
    if (dateTo   && r.dateISO > dateTo)   return false;
    if (search) {
      const s = search.toLowerCase();
      return r.prod?.toLowerCase().includes(s) || r.code?.includes(s) ||
             r.inv?.includes(s) || D.customers.find(c=>c.id===r.custId)?.name.includes(s);
    }
    return true;
  });

  const $   = window.fmtMoney;
  const sum = (f) => rows.reduce((s,r) => s+(r[f]||0), 0);
  const totGross = sum('grossSale'), totDisc = sum('discount'),
        totNet   = sum('netSale'),  totVat  = sum('vat'),
        totTotal = sum('total'),    totW    = sum('w');
  const totKgW  = rows.filter(r => (window.unitOf ? window.unitOf(r.code).unitType === 'kg' : true)).reduce((s,r) => s+(r.w||0), 0);
  const totUnitQ = rows.filter(r => (window.unitOf ? window.unitOf(r.code).unitType !== 'kg' : false)).reduce((s,r) => s+(r.w||0), 0);
  /* helper: แสดงจำนวนผสม KG/unit */
  const qtyMix = (kgW, unitQ) =>
    kgW>0 && unitQ>0 ? kgW.toFixed(3)+' KG / '+Math.round(unitQ)+' units'
    : kgW>0 ? kgW.toFixed(3)+' KG'
    : unitQ>0 ? Math.round(unitQ)+' units' : '—';
  const billSet  = new Set(rows.map(r=>r.inv));
  const billCount = billSet.size;

  /* ── by-product (group same product, sum totals) ── */
  const byProduct = {};
  rows.forEach(r => {
    const k = r.code || r.prod;
    if (!byProduct[k]) byProduct[k] = { code:r.code, prod:r.prod, cnt:0, w:0, gross:0, disc:0, net:0, vat:0, total:0 };
    const p = byProduct[k];
    p.cnt++; p.w += r.w||0; p.gross += r.grossSale||0; p.disc += r.discount||0;
    p.net += r.netSale||0; p.vat += r.vat||0; p.total += r.total||0;
  });
  const productRows = Object.values(byProduct).sort((a,b) => b.total - a.total);

  /* ── by-date ── */
  const byDate = {};
  rows.forEach(r => {
    if (!byDate[r.dateISO]) byDate[r.dateISO] = { date:r.date, dateISO:r.dateISO, cnt:0, _bills:new Set(), gross:0, disc:0, net:0, vat:0, total:0, cash:0, transfer:0, credit:0, wholesale:0, online:0, sample:0, expired:0, other:0 };
    const d = byDate[r.dateISO];
    d._bills.add(r.inv);
    d.gross+=r.grossSale; d.disc+=r.discount; d.net+=r.netSale; d.vat+=r.vat; d.total+=r.total;
    if (r.pay) d[r.pay] = (d[r.pay]||0) + r.total;
    if (r.channel) d[r.channel] = (d[r.channel]||0) + r.total;
  });
  const dateRows = Object.values(byDate)
    .map(d => ({ ...d, cnt: d._bills.size }))
    .sort((a,b) => (b.dateISO||'').localeCompare(a.dateISO||''));

  /* ── by-payment ── */
  const byPay = {};
  rows.forEach(r => {
    const k = r.pay||'cash';
    if (!byPay[k]) byPay[k] = { pay:k, cnt:0, _bills:new Set(), w:0, kgW:0, unitQ:0, net:0, vat:0, total:0 };
    const isKgR = window.unitOf ? window.unitOf(r.code).unitType === 'kg' : true;
    byPay[k]._bills.add(r.inv); byPay[k].w+=r.w;
    if (isKgR) byPay[k].kgW+=r.w; else byPay[k].unitQ+=r.w;
    byPay[k].net+=r.netSale; byPay[k].vat+=r.vat; byPay[k].total+=r.total;
  });
  const payRows = Object.values(byPay).map(p => ({ ...p, cnt: p._bills.size }));
  const payTotal = payRows.reduce((s,p)=>s+p.total,0);

  /* ── by-customer ── */
  const byCust = {};
  rows.forEach(r => {
    const cust = D.customers.find(c=>c.id===r.custId) || { id:0, code:'—', name:'ไม่ระบุ', type:'other', tax:'', tel:'', addr:'' };
    if (!byCust[cust.id]) byCust[cust.id] = { ...cust, cnt:0, _bills:new Set(), w:0, kgW:0, unitQ:0, disc:0, total:0, txns:[] };
    const isKgRow = window.unitOf ? window.unitOf(r.code).unitType === 'kg' : true;
    byCust[cust.id]._bills.add(r.inv); byCust[cust.id].w+=r.w;
    if (isKgRow) byCust[cust.id].kgW += (r.w||0);
    else         byCust[cust.id].unitQ += (r.w||0);
    byCust[cust.id].disc+=r.discount; byCust[cust.id].total+=r.total;
    byCust[cust.id].txns.push(r);
  });
  const custRows = Object.values(byCust).map(c => ({ ...c, cnt: c._bills.size })).sort((a,b)=>b.total-a.total);

  /* ── discount rows ── */
  const discRows = rows.filter(r=>r.discount>0);
  const discFiltered = discSearch.trim()
    ? discRows.filter(r => r.inv?.toLowerCase().includes(discSearch.toLowerCase()))
    : discRows;
  const allDiscBills = allRows.filter(r=>r.discount>0 && (!dateFrom||r.dateISO>=dateFrom) && (!dateTo||r.dateISO<=dateTo));
  const avgDiscPct = totGross > 0 ? (totDisc/totGross*100) : 0;

  /* ── Pagination (per table) ── */
  const flatPag    = usePagination(rows, 20);
  const byProdPag  = usePagination(productRows, 20);
  const payRowsSorted = [...rows].sort((a,b)=>a.pay?.localeCompare(b.pay||''));
  const payBillPag = usePagination(payRowsSorted, 20);
  const discPag    = usePagination(discFiltered, 20);
  const custPag    = usePagination(custRows, 20);

  /* ── Pie chart helper ── */
  function PieChart({ slices, size=160, cx=80, cy=80, r=65 }) {
    let angle = -Math.PI/2;
    const paths = slices.map((s, i) => {
      const sweep = s.pct * 2 * Math.PI;
      const x1 = cx + r*Math.cos(angle), y1 = cy + r*Math.sin(angle);
      angle += sweep;
      const x2 = cx + r*Math.cos(angle), y2 = cy + r*Math.sin(angle);
      const large = sweep > Math.PI ? 1 : 0;
      const midA = angle - sweep/2;
      const tx = cx + (r*0.65)*Math.cos(midA), ty = cy + (r*0.65)*Math.sin(midA);
      return { d:`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`, color:s.color, label:s.label, pct:(s.pct*100).toFixed(1)+'%', tx, ty };
    });
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display:'block', margin:'0 auto' }}>
        {paths.map((p,i) => <path key={i} d={p.d} fill={p.color} opacity=".88" />)}
        {paths.map((p,i) => p.pct !== '0.0%' && (
          <text key={'t'+i} x={p.tx} y={p.ty} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="11" fontWeight="700">{p.pct}</text>
        ))}
      </svg>
    );
  }

  /* ── Filter bar ── */
  const FilterBar = ({ showSearch=true, onExport, onPdf }) => (
    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:16, padding:'10px 14px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
      <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)', whiteSpace:'nowrap' }}>ช่วงวันที่:</span>
      <DateField style={{ width:145 }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
      <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
      <DateField style={{ width:145 }} value={dateTo} onChange={e=>setDateTo(e.target.value)} />
      {(dateFrom||dateTo) && <button className="btn bg2 bsm" onClick={()=>{setDateFrom('');setDateTo('');}}>ล้าง</button>}
      {showSearch && (
        <div style={{ position:'relative', marginLeft:'auto' }}>
          <input className="fc" placeholder="ค้นหา…" style={{ paddingLeft:30, width:200 }} value={search} onChange={e=>setSearch(e.target.value)} />
          <Icon name="search" size={13} style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--t3)' }} />
        </div>
      )}
      <Button variant="bg2" size="sm" icon="download" onClick={onExport||undefined}>CSV</Button>
      {onPdf && <Button variant="bg2" size="sm" icon="printer" onClick={onPdf}>PDF</Button>}
    </div>
  );

  /* ── Shared styles ── */
  const TH = { padding:'9px 14px', textAlign:'left', fontSize:11.5, fontWeight:800, color:'#0f172a', borderBottom:'2px solid #475569', background:'#f1f5f9', whiteSpace:'nowrap' };
  const THR = { ...TH, textAlign:'right' };
  const TD = { padding:'11px 14px', borderBottom:'1px solid var(--bd)', verticalAlign:'middle' };
  const TDR = { ...TD, textAlign:'right' };
  const TF = { padding:'9px 14px', fontWeight:700, background:'var(--s2)', borderTop:'2px solid var(--bd)' };
  const TFR = { ...TF, textAlign:'right' };
  const KPI = ({ label, sub, value, color }) => (
    <div className="card" style={{ padding:'14px 18px' }}>
      <div style={{ fontSize:11.5, color:'var(--t2)', marginBottom:6 }}>{label} {sub&&<span style={{ fontSize:10.5, color:'var(--t3)' }}>{sub}</span>}</div>
      <div style={{ fontSize:20, fontWeight:800, color:color||'var(--tx)', letterSpacing:'-.4px' }}>{value}</div>
    </div>
  );

  /* ══════════════════════════════════════════════════════ */
  return (
    <div>
      <div className="tabs">
        {RPT_TABS.map(rpt => <div key={rpt.id} className={'tab'+(tab===rpt.id?' on':'')} onClick={()=>setTab(rpt.id)}>{t(rpt.label)}</div>)}
      </div>

      {/* ── TAB 1: รายการสินค้า ── */}
      {tab==='product' && (
        <div>
          {/* Inner sub-tabs — exactly 2 */}
          <div style={{ display:'flex', gap:4, marginBottom:16, background:'var(--s2)', borderRadius:'var(--rs)', padding:4, width:'fit-content', border:'1px solid var(--bd)' }}>
            {[['flat','รายการทั้งหมด'],['byproduct','แยกตามสินค้า']].map(([id,label])=>(
              <button key={id} onClick={()=>setProdSub(id)}
                style={{ padding:'6px 16px', borderRadius:6, fontSize:13, fontWeight:prodSub===id?700:500, cursor:'pointer', border:'none', transition:'all .15s', fontFamily:'inherit', background:prodSub===id?'var(--ac)':'transparent', color:prodSub===id?'#fff':'var(--t2)', boxShadow:prodSub===id?'0 2px 8px rgba(59,91,219,.3)':'none' }}>
                {label}
              </button>
            ))}
          </div>

          <FilterBar
            onExport={()=>window.exportCSV('report_products.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','ชำระ','จำนวน','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],rows.map(r=>{const isKg=window.unitOf?window.unitOf(r.code).unitType==='kg':true;return[r.date,r.inv,r.code,r.prod,r.channel,PAY_LABELS[r.pay]||r.pay,isKg?r.w.toFixed(3)+' KG':window.fmtItemQty(r.w,r.code),r.grossSale,r.discount||0,r.netSale,r.vat.toFixed(2),r.total];}))}
            onPdf={()=>window.exportPDF('รายงานรายการสินค้า',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','จำนวน','ยอดรวม'],rows.map(r=>{const isKg=window.unitOf?window.unitOf(r.code).unitType==='kg':true;return[r.date,r.inv,r.code,r.prod,r.channel,isKg?r.w.toFixed(3)+' KG':window.fmtItemQty(r.w,r.code),r.total];}),`${rows.length} รายการ | รวม ${totKgW.toFixed(3)} KG | ยอดรวม ${$(totTotal)}`)}
          />
          {prodSub==='flat' && (
          <Card title={`รายการสินค้าทั้งหมด · ${rows.length} รายการ`} actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('report_products.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','ชำระ','จำนวน','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],rows.map(r=>{const isKg=window.unitOf?window.unitOf(r.code).unitType==='kg':true;return[r.date,r.inv,r.code,r.prod,r.channel,PAY_LABELS[r.pay]||r.pay,isKg?r.w.toFixed(3)+' KG':window.fmtItemQty(r.w,r.code),r.grossSale,r.discount||0,r.netSale,r.vat.toFixed(2),r.total];}))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายการสินค้าทั้งหมด',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','จำนวน','ยอดรวม'],rows.map(r=>{const isKg=window.unitOf?window.unitOf(r.code).unitType==='kg':true;return[r.date,r.inv,r.code,r.prod,r.channel,isKg?r.w.toFixed(3)+' KG':window.fmtItemQty(r.w,r.code),r.total];}))}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={TH}>เลขที่บิล</th><th style={TH}>รหัส</th><th style={TH}>สินค้า</th>
                <th style={TH}>ช่องทาง</th><th style={TH}>ชำระ</th><th style={THR}>จำนวน</th>
                <th style={THR}>Gross Sale</th><th style={THR}>Discount</th><th style={THR}>Net Sale</th>
                <th style={THR}>VAT 7%</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {rows.length===0 ? <tr><td colSpan="12" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                : flatPag.slice.map((r,i) => {
                  const isKg = window.unitOf ? window.unitOf(r.code).unitType === 'kg' : true;
                  return (
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{r.date}</span></td>
                    <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{r.inv}</span></td>
                    <td style={TD}><span className="mono">{r.code}</span></td>
                    <td style={TD}><span style={{ fontWeight:600 }}>{r.prod}</span></td>
                    <td style={TD}><Badge kind={r.channel}/></td>
                    <td style={TD}><span style={{ fontSize:12.5 }}>{PAY_LABELS[r.pay]||r.pay}</span></td>
                    <td style={TDR}>{isKg ? r.w.toFixed(3)+' KG' : window.fmtItemQty(r.w, r.code)}</td>
                    <td style={TDR}>{$(r.grossSale)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{r.discount>0?'-'+$(r.discount):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700 }}>{$(r.netSale)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(r.vat)}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(r.total)}</td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot><tr>
                <td colSpan="6" style={TF}>รวม {rows.length} รายการ · {billCount} บิล</td>
                <td style={TFR}>{totKgW > 0 ? totKgW.toFixed(3)+' KG' : '—'}</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={TFR}>{$(totNet)}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
            <Paginator page={flatPag.page} totalPages={flatPag.totalPages} setPage={flatPag.setPage} total={flatPag.total} pageSize={flatPag.pageSize} setPageSize={flatPag.setPageSize} noun="รายการ" />
          </Card>
          )}

          {prodSub==='byproduct' && (
          <Card title={`สรุปยอดขายแยกตามสินค้า · ${productRows.length} รายการสินค้า`} actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('report_products_byproduct.csv',['รหัส','สินค้า','จำนวนรายการ','จำนวน','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],productRows.map(p=>{const isKg=window.unitOf?window.unitOf(p.code).unitType==='kg':true;return[p.code,p.prod,p.cnt,isKg?p.w.toFixed(3)+' KG':window.fmtItemQty(p.w,p.code),p.gross,p.disc,p.net,p.vat.toFixed(2),p.total];}))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('สรุปยอดขายแยกตามสินค้า',['รหัส','สินค้า','จำนวนรายการ','จำนวน','ยอดรวม'],productRows.map(p=>{const isKg=window.unitOf?window.unitOf(p.code).unitType==='kg':true;return[p.code,p.prod,p.cnt,isKg?p.w.toFixed(3)+' KG':window.fmtItemQty(p.w,p.code),p.total];}),`${productRows.length} รายการสินค้า | รวม ${totKgW.toFixed(3)} KG | ยอดรวม ${$(totTotal)}`)}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>สินค้า</th><th style={THR}>จำนวนรายการ</th>
                <th style={THR}>จำนวน</th>
                <th style={THR}>Gross Sale</th><th style={THR}>Discount</th><th style={THR}>Net Sale</th>
                <th style={THR}>VAT 7%</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {productRows.length===0 ? <tr><td colSpan="9" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                : byProdPag.slice.map((p,i) => {
                  const isKg = window.unitOf ? window.unitOf(p.code).unitType === 'kg' : true;
                  return (
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span className="mono">{p.code}</span></td>
                    <td style={TD}><span style={{ fontWeight:600 }}>{p.prod}</span></td>
                    <td style={TDR}>{p.cnt}</td>
                    <td style={TDR}>{isKg ? p.w.toFixed(3)+' KG' : window.fmtItemQty(p.w, p.code)}</td>
                    <td style={TDR}>{$(p.gross)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{p.disc>0?'-'+$(p.disc):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700 }}>{$(p.net)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(p.vat)}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(p.total)}</td>
                  </tr>
                  );
                })}
              </tbody>
              <tfoot><tr>
                <td colSpan="2" style={TF}>รวม {productRows.length} รายการสินค้า</td>
                <td style={TFR}>{rows.length}</td>
                <td style={TFR}>{totKgW > 0 ? totKgW.toFixed(3)+' KG' : '—'}</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={TFR}>{$(totNet)}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
            <Paginator page={byProdPag.page} totalPages={byProdPag.totalPages} setPage={byProdPag.setPage} total={byProdPag.total} pageSize={byProdPag.pageSize} setPageSize={byProdPag.setPageSize} noun="รายการสินค้า" />
          </Card>
          )}
        </div>
      )}

      {/* ── TAB 2: ภาษีซื้อ-ขาย ── */}
      {tab==='tax' && (() => {
        /* ── ภาษีขาย: from invoices directly (incl vat7 + vat7_excl) ── */
        const allInvs = window.SP_STATE?.invoices || window.SP_DATA?.invoices || [];
        const taxSaleRows = allInvs
          .filter(iv => {
            const t = iv.type||'';
            if (t==='A4'||t==='INV') return false;
            const d = (iv.date||'').slice(0,10);
            if (dateFrom && d < dateFrom) return false;
            if (dateTo   && d > dateTo)   return false;
            return true;
          })
          .map(iv => {
            const isVoided = !!(iv.voided || iv.is_voided || iv.status==='voided');
            const items = iv.items||[];
            const disc  = Number(iv.discount||0);
            const totalGross = items.reduce((s,it)=>s+Number(it.weight||0)*Number(it.price||it.price_per_kg||0),0);
            let inclTotal=0, vatAmt=0;
            items.forEach(it => {
              const gross    = Number(it.weight||0)*Number(it.price||it.price_per_kg||0);
              const lineDisc = totalGross>0 ? disc*(gross/totalGross) : 0;
              const lineNet  = gross - lineDisc;
              if (it.tax==='vat7')      { inclTotal+=lineNet;        vatAmt+=lineNet*7/107; }
              else if (it.tax==='vat7_excl') { inclTotal+=lineNet*1.07; vatAmt+=lineNet*0.07; }
              else                        { inclTotal+=lineNet; }
            });
            if (!items.length) { inclTotal=Number(iv.total||0); vatAmt=Number(iv.vat7||0); }
            return {
              dateISO: (iv.date||'').slice(0,10),
              date: iv.dateDisplay||iv.date||'—',
              no: iv.fullInvNo||iv.no||iv.invoice_no||'—',
              tivNo: iv.no||'—',
              replaces: iv.replaces||null,
              custId: iv.custId||iv.customer_id,
              custBranch: iv.custBranch || 'head',
              inclTotal, vat: vatAmt,
              voided: isVoided,
            };
          })
          .sort((a,b)=>a.dateISO.localeCompare(b.dateISO)||a.no.localeCompare(b.no));
        const taxSaleActive  = taxSaleRows.filter(r=>!r.voided);
        const taxSaleTotIncl = taxSaleActive.reduce((s,r)=>s+r.inclTotal,0);
        const taxSaleTotVat  = taxSaleActive.reduce((s,r)=>s+r.vat,0);

        /* ── ภาษีซื้อ: from GRN logs (vat7 + vat7_excl) ── */
        const grnAll = window.SP_STATE?.grnLogs || window.SP_DATA?.grnLogs || [];
        const taxBuyRows = grnAll
          .filter(g => {
            const d = g.date||'';
            if (dateFrom && d < dateFrom) return false;
            if (dateTo   && d > dateTo)   return false;
            return (g.items||[]).some(it=>it.tax==='vat7'||it.tax==='vat7_excl');
          })
          .map(g => {
            let inclTotal=0, vatAmt=0;
            (g.items||[]).forEach(it => {
              const v = Number(it.value||0);
              if (it.tax==='vat7')      { inclTotal+=v;        vatAmt+=v*7/107; }
              else if (it.tax==='vat7_excl') { inclTotal+=v*1.07; vatAmt+=v*0.07; }
            });
            return { ...g, inclTotal, vatAmt };
          })
          .sort((a,b)=>(a.date||'').localeCompare(b.date||''));
        const taxBuyTotIncl = taxBuyRows.reduce((s,r)=>s+r.inclTotal,0);
        const taxBuyTotVat  = taxBuyRows.reduce((s,r)=>s+r.vatAmt,0);

        const branchLabel = b => (!b || b === 'head') ? 'สำนักงานใหญ่' : b;
        const THSUB = { fontSize:12, fontWeight:700, padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontFamily:'inherit' };
        const EXPBTN = { display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:600, padding:'5px 10px', borderRadius:6, border:'1px solid var(--bd)', background:'var(--s2)', color:'var(--t2)', cursor:'pointer', fontFamily:'inherit' };
        const DOCLINK = { background:'none', border:'none', padding:0, cursor:'pointer', fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:3 };
        return (
        <div>
          {/* Date filter */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', marginBottom:14, padding:'10px 14px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)', boxShadow:'var(--sh)' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)', whiteSpace:'nowrap' }}>ช่วงวันที่:</span>
            <DateField style={{ width:145 }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
            <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
            <DateField style={{ width:145 }} value={dateTo} onChange={e=>setDateTo(e.target.value)} />
            {(dateFrom||dateTo) && <button className="btn bg2 bsm" onClick={()=>{setDateFrom('');setDateTo('');}}>ล้าง</button>}
          </div>

          {/* Sub-tabs */}
          <div style={{ display:'flex', gap:8, marginBottom:16 }}>
            <button style={{ ...THSUB, background:taxSub==='sale'?'var(--ac)':'var(--s2)', color:taxSub==='sale'?'#fff':'var(--t2)' }} onClick={()=>setTaxSub('sale')}>
              📤 รายงานภาษีขาย
            </button>
            <button style={{ ...THSUB, background:taxSub==='buy'?'var(--pu)':'var(--s2)', color:taxSub==='buy'?'#fff':'var(--t2)' }} onClick={()=>setTaxSub('buy')}>
              📥 รายงานภาษีซื้อ
            </button>
          </div>

          {/* ── ภาษีขาย ── */}
          {taxSub==='sale' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
                <button style={EXPBTN} onClick={()=>window.exportCSV('vat_sale.csv',['ลำดับ','วันที่','เลขที่เอกสาร','หมายเหตุ','ชื่อผู้ซื้อ','สาขาที่','มูลค่าสินค้า','จำนวนเงินภาษี'],taxSaleRows.map((r,i)=>{const c=D.customers.find(x=>x.id===r.custId);return[i+1,r.date,r.no,r.voided?'ยกเลิก':'',c?.name||'ลูกค้าทั่วไป',branchLabel(r.custBranch),r.voided?'—':$(r.inclTotal),r.voided?'—':$(r.vat)];}))}>
                  <Icon name="download" size={13}/> CSV
                </button>
                <button style={EXPBTN} onClick={()=>window.exportPDF('รายงานภาษีขาย',['ลำดับ','วันที่','เลขที่เอกสาร','ชื่อผู้ซื้อ','สาขาที่','มูลค่าสินค้า','จำนวนเงินภาษี'],taxSaleRows.map((r,i)=>{const c=D.customers.find(x=>x.id===r.custId);return[i+1,r.date,r.voided?r.no+' [ยกเลิก]':r.no,c?.name||'ลูกค้าทั่วไป',branchLabel(r.custBranch),r.voided?'—':$(r.inclTotal),r.voided?'—':$(r.vat)];}),`รวม ${taxSaleActive.length} ใบ | VAT ${$(taxSaleTotVat)} | มูลค่ารวม ${$(taxSaleTotIncl)}`)}>
                  <Icon name="printer" size={13}/> PDF
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                <KPI label="จำนวนใบกำกับ" value={taxSaleActive.length+' ใบ'} color="var(--ac)" />
                <KPI label="มูลค่าสินค้ารวม" sub="รวม VAT" value={$(taxSaleTotIncl)} color="var(--gn)" />
                <KPI label="ภาษีขาย (VAT 7%)" value={$(taxSaleTotVat)} color="var(--pu)" />
              </div>
              <Card title={`รายงานภาษีขาย — ${taxSaleRows.length} รายการ${taxSaleRows.length>taxSaleActive.length?' (ยกเลิก '+( taxSaleRows.length-taxSaleActive.length)+' ใบ)':''}`}>
                <div className="tw"><table>
                  <thead><tr>
                    <th style={{ ...TH, textAlign:'center', width:44 }}>ลำดับ</th>
                    <th style={TH}>วันที่</th>
                    <th style={TH}>เลขที่เอกสาร</th>
                    <th style={TH}>ชื่อบริษัท</th>
                    <th style={{ ...TH, textAlign:'center' }}>สาขาที่</th>
                    <th style={THR}>มูลค่าสินค้า (฿)</th>
                    <th style={THR}>จำนวนเงินภาษี (฿)</th>
                  </tr></thead>
                  <tbody>
                    {taxSaleRows.length===0
                      ? <tr><td colSpan="7" style={{ padding:'28px', textAlign:'center', color:'var(--t3)' }}>ไม่มีรายการในช่วงวันที่เลือก</td></tr>
                      : taxSaleRows.map((r,i) => {
                          const cust = D.customers.find(c=>c.id===r.custId);
                          const allInvs = window.SP_STATE?.invoices||[];
                          /* ถ้ามี fullInvNo ให้เปิด INV (A4), ไม่เช่นนั้นเปิด TIV */
                          const invObj = allInvs.find(iv=>iv.no===r.no||iv.invoice_no===r.no)
                            || allInvs.find(iv=>iv.no===r.tivNo||iv.thermalNo===r.tivNo);
                          const isA4 = invObj && (invObj.type==='A4'||invObj.type==='INV');
                          const openDoc = () => {
                            if (!invObj) return;
                            if (isA4) setTaxA4Modal(invObj);
                            else setTaxDocModal(invObj);
                          };
                          return (
                            <tr key={r.tivNo} style={{ borderBottom:'1px solid var(--bd)', opacity: r.voided ? 0.55 : 1, background: r.voided ? 'var(--s2)' : undefined }}>
                              <td style={{ ...TD, textAlign:'center', color:'var(--t3)', fontSize:12 }}>{i+1}</td>
                              <td style={{ ...TD, fontWeight:600, color: r.voided ? 'var(--t3)' : undefined }}>{r.date}</td>
                              <td style={TD}>
                                <div>
                                  <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                                    <button style={{ ...DOCLINK, color: r.voided ? 'var(--t3)' : 'var(--ac)' }}
                                      onClick={openDoc}>
                                      {r.no}
                                    </button>
                                    {r.voided && <span style={{ fontSize:10, fontWeight:700, color:'#fff', background:'var(--rd)', borderRadius:3, padding:'1px 5px', lineHeight:'14px', letterSpacing:.3 }}>ยกเลิก</span>}
                                  </span>
                                  {r.replaces && (
                                    <div style={{ fontSize:10.5, color:'var(--am)', marginTop:2, lineHeight:1.4 }}>
                                      ↩ ออกแทนฉบับเดิม <span style={{ fontFamily:'var(--font-mono)', fontWeight:700 }}>{r.replaces}</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td style={{ ...TD, color: r.voided ? 'var(--t3)' : undefined }}>{cust?.name||'ลูกค้าทั่วไป'}</td>
                              <td style={{ ...TD, textAlign:'center', fontSize:12, color:'var(--t2)' }}>{branchLabel(r.custBranch)}</td>
                              <td style={{ ...TDR, fontWeight:700, color: r.voided ? 'var(--t3)' : undefined, textDecoration: r.voided ? 'line-through' : undefined }}>{r.voided ? '—' : $(r.inclTotal)}</td>
                              <td style={{ ...TDR, color: r.voided ? 'var(--t3)' : 'var(--pu)', fontWeight:700, textDecoration: r.voided ? 'line-through' : undefined }}>{r.voided ? '—' : $(r.vat)}</td>
                            </tr>
                          );
                        })
                    }
                  </tbody>
                  <tfoot><tr>
                    <td colSpan="4" style={{ ...TF }}>รวมทั้งหมด ({taxSaleActive.length} รายการ)</td>
                    <td style={TF}></td>
                    <td style={{ ...TFR, color:'var(--gn)' }}>{$(taxSaleTotIncl)}</td>
                    <td style={{ ...TFR, color:'var(--pu)' }}>{$(taxSaleTotVat)}</td>
                  </tr></tfoot>
                </table></div>
              </Card>
            </div>
          )}

          {/* ── ภาษีซื้อ ── */}
          {taxSub==='buy' && (
            <div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
                <button style={EXPBTN} onClick={()=>window.exportCSV('vat_buy.csv',['ลำดับ','วันที่','เลขที่เอกสาร','ชื่อบริษัท','ผู้รับสินค้า','สาขาที่','มูลค่าสินค้า','จำนวนเงินภาษี'],taxBuyRows.map((r,i)=>[i+1,r.dateDisplay||r.date,r.id,D.company.name,r.receiver||'—','สำนักงานใหญ่',$(r.inclTotal),$(r.vatAmt)]))}>
                  <Icon name="download" size={13}/> CSV
                </button>
                <button style={EXPBTN} onClick={()=>window.exportPDF('รายงานภาษีซื้อ',['ลำดับ','วันที่','เลขที่เอกสาร','ชื่อบริษัท','สาขาที่','มูลค่าสินค้า','จำนวนเงินภาษี'],taxBuyRows.map((r,i)=>[i+1,r.dateDisplay||r.date,r.id,D.company.name,'สำนักงานใหญ่',$(r.inclTotal),$(r.vatAmt)]),`รวม ${taxBuyRows.length} ใบ | VAT ${$(taxBuyTotVat)} | มูลค่ารวม ${$(taxBuyTotIncl)}`)}>
                  <Icon name="printer" size={13}/> PDF
                </button>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:16 }}>
                <KPI label="จำนวนใบรับสินค้า (GRN)" value={taxBuyRows.length+' ใบ'} color="var(--pu)" />
                <KPI label="มูลค่าสินค้ารวม" sub="รวม VAT" value={$(taxBuyTotIncl)} color="var(--gn)" />
                <KPI label="ภาษีซื้อ (VAT 7%)" value={$(taxBuyTotVat)} color="var(--ac)" />
              </div>
              <Card title={`รายงานภาษีซื้อ — ${taxBuyRows.length} รายการ`}>
                <div className="tw"><table>
                  <thead><tr>
                    <th style={{ ...TH, textAlign:'center', width:44 }}>ลำดับ</th>
                    <th style={TH}>วันที่</th>
                    <th style={TH}>เลขที่เอกสาร</th>
                    <th style={TH}>ชื่อบริษัท</th>
                    <th style={TH}>ผู้รับสินค้า</th>
                    <th style={{ ...TH, textAlign:'center' }}>สาขาที่</th>
                    <th style={THR}>มูลค่าสินค้า (฿)</th>
                    <th style={THR}>จำนวนเงินภาษี (฿)</th>
                  </tr></thead>
                  <tbody>
                    {taxBuyRows.length===0
                      ? <tr><td colSpan="8" style={{ padding:'28px', textAlign:'center', color:'var(--t3)' }}>ไม่มีรายการในช่วงวันที่เลือก</td></tr>
                      : taxBuyRows.map((r,i) => (
                          <tr key={r.id} style={{ borderBottom:'1px solid var(--bd)' }}>
                            <td style={{ ...TD, textAlign:'center', color:'var(--t3)', fontSize:12 }}>{i+1}</td>
                            <td style={{ ...TD, fontWeight:600 }}>{r.dateDisplay||r.date}</td>
                            <td style={TD}>
                              <button style={{ ...DOCLINK, color:'var(--pu)' }}
                                onClick={()=>setTaxGrnModal(r)}>
                                {r.id}
                              </button>
                            </td>
                            <td style={{ ...TD, fontSize:12, color:'var(--t2)' }}>{D.company.name}</td>
                            <td style={TD}>{r.receiver||'—'}</td>
                            <td style={{ ...TD, textAlign:'center', fontSize:12, color:'var(--t2)' }}>สนญ.</td>
                            <td style={{ ...TDR, fontWeight:700 }}>{$(r.inclTotal)}</td>
                            <td style={{ ...TDR, color:'var(--ac)', fontWeight:700 }}>{$(r.vatAmt)}</td>
                          </tr>
                        ))
                    }
                  </tbody>
                  <tfoot><tr>
                    <td colSpan="5" style={{ ...TF }}>รวมทั้งหมด ({taxBuyRows.length} รายการ)</td>
                    <td style={TF}></td>
                    <td style={{ ...TFR, color:'var(--gn)' }}>{$(taxBuyTotIncl)}</td>
                    <td style={{ ...TFR, color:'var(--ac)' }}>{$(taxBuyTotVat)}</td>
                  </tr></tfoot>
                </table></div>
              </Card>
            </div>
          )}

          {taxGrnModal && <GrnDoc grn={taxGrnModal} onClose={()=>setTaxGrnModal(null)} />}
        </div>
        );
      })()}

      {/* ── TAB 3: Daily Sale ── */}
      {tab==='daily' && (
        <div>
          <FilterBar showSearch={false}
            onExport={()=>window.exportCSV('report_daily.csv',['วันที่','Gross Sale','Discount','Net Sale','VAT 7%','เงินสด','โอนเงิน','เครดิต','จำนวน'],dateRows.map(d=>[d.date,d.gross,d.disc||0,d.net,d.vat,(d.cash||0),(d.transfer||0),(d.credit||0),d.cnt]))}
            onPdf={()=>window.exportPDF('Daily Sale Report',['วันที่','Gross Sale','Discount','Net Sale','VAT 7%','จำนวน'],dateRows.map(d=>[d.date,d.gross,d.disc||0,d.net,d.vat,d.cnt]),`รวม ${dateRows.length} วัน | ยอดรวม ${$(totTotal)}`)}
          />
          <Card title="ยอดตารายวัน (Invoice)" style={{ marginBottom:14 }}>
            <div style={{ fontSize:12, color:'var(--t3)', padding:'4px 20px 8px', display:'flex', gap:16 }}>
              <span style={{ color:'var(--gn)', fontWeight:700 }}>Gross / Discount / Net / VAT — ยอดตามวัน · จำนวน</span>
            </div>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={THR}>Gross Sale</th><th style={THR}>Discount</th>
                <th style={THR}>Net Sale</th><th style={THR}>VAT 7%</th>
                <th style={THR}>เงินสด</th><th style={THR}>โอนเงิน</th><th style={THR}>เครดิต</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวน</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                    <td style={TDR}>{$(d.gross)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{d.disc>0?'-'+$(d.disc):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700, color:'var(--ac)' }}>{$(d.net)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(d.vat)}</td>
                    <td style={TDR}>{d.cash?$(d.cash):'—'}</td>
                    <td style={TDR}>{d.transfer?$(d.transfer):'—'}</td>
                    <td style={TDR}>{d.credit?$(d.credit):'—'}</td>
                    <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{d.cnt}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td style={TF}>รวม {dateRows.length} วัน</td>
                <td style={TFR}>{$(totGross)}</td><td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={{ ...TFR, color:'var(--ac)' }}>{$(totNet)}</td><td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='cash').reduce((s,r)=>s+r.total,0))}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='transfer').reduce((s,r)=>s+r.total,0))}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='credit').reduce((s,r)=>s+r.total,0))}</td>
                <td style={{ ...TF, textAlign:'center' }}>{rows.length}</td>
              </tr></tfoot>
            </table></div>
          </Card>
          <Card title="ยอดตัดสต็อกแยกตามประเภท">
            <div style={{ fontSize:12, color:'var(--t3)', padding:'4px 20px 8px', display:'flex', gap:12 }}>
              {['Wholesale','Online','Sample','Expired','Other'].map(ch => (
                <span key={ch} style={{ color:'var(--t2)', fontWeight:600 }}>{ch}</span>
              ))}
            </div>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th>
                <th style={{ ...THR, color:'var(--ac)' }}>Wholesale</th>
                <th style={{ ...THR, color:'var(--pu)' }}>Online</th>
                <th style={THR}>Sample</th><th style={{ ...THR, color:'var(--rd)' }}>Expired</th><th style={THR}>Other</th>
                <th style={THR}>รวมทุกประเภท</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                    <td style={{ ...TDR, color:'var(--ac)', fontWeight:700 }}>{d.wholesale?$(d.wholesale):'—'}</td>
                    <td style={{ ...TDR, color:'var(--pu)', fontWeight:700 }}>{d.online?$(d.online):'—'}</td>
                    <td style={TDR}>{d.sample?$(d.sample):'—'}</td>
                    <td style={{ ...TDR, color:'var(--rd)' }}>{d.expired?$(d.expired):'—'}</td>
                    <td style={TDR}>{d.other?$(d.other):'—'}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td style={TF}>รวม {dateRows.length} วัน</td>
                {['wholesale','online','sample','expired','other'].map(ch=>(
                  <td key={ch} style={TFR}>{$(rows.filter(r=>r.channel===ch).reduce((s,r)=>s+r.total,0))}</td>
                ))}
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
          </Card>
        </div>
      )}

      {/* ── TAB 4: Payment ── */}
      {tab==='payment' && (
        <div>
          <FilterBar showSearch={false}
            onExport={()=>window.exportCSV('report_payment.csv',['ช่องทาง','จำนวนบิล','จำนวน','Net Sale','VAT','ยอดรวม','สัดส่วน %'],payRows.map(p=>[PAY_LABELS[p.pay]||p.pay,p.cnt,qtyMix(p.kgW,p.unitQ),$(p.net),$(p.vat),$(p.total),payTotal>0?((p.total/payTotal)*100).toFixed(2)+'%':'']))}
            onPdf={()=>window.exportPDF('รายงาน Payment',['ช่องทาง','จำนวนบิล','จำนวน','Net Sale','VAT','ยอดรวม','สัดส่วน %'],payRows.map(p=>[PAY_LABELS[p.pay]||p.pay,p.cnt,qtyMix(p.kgW,p.unitQ),$(p.net),$(p.vat),$(p.total),payTotal>0?((p.total/payTotal)*100).toFixed(2)+'%':'']),`รวม ${billCount} บิล | ยอดรวม ${$(totTotal)}`)}
          />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>
            <Card title="รายงานแยกตามประเภทชำระเงิน">
              <div className="tw"><table>
                <thead><tr>
                  <th style={TH}>ประเภทชำระเงิน</th>
                  <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                  <th style={THR}>จำนวน</th>
                  <th style={THR}>Net Sale</th><th style={THR}>VAT</th>
                  <th style={THR}>ยอดรวม</th><th style={THR}>สัดส่วน %</th>
                </tr></thead>
                <tbody>
                  {payRows.map(p=>(
                    <tr key={p.pay} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={TD}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <span style={{ width:10, height:10, borderRadius:3, background:PAY_COLORS[p.pay]||'var(--t3)', flexShrink:0 }}></span>
                          <span style={{ fontWeight:700, fontSize:13.5 }}>{PAY_LABELS[p.pay]||p.pay}</span>
                        </div>
                      </td>
                      <td style={{ ...TD, textAlign:'center' }}>{p.cnt}</td>
                      <td style={TDR}>{qtyMix(p.kgW, p.unitQ)}</td>
                      <td style={TDR}>{$(p.net)}</td>
                      <td style={{ ...TDR, color:'var(--pu)' }}>{$(p.vat)}</td>
                      <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(p.total)}</td>
                      <td style={TDR}>{payTotal>0?(p.total/payTotal*100).toFixed(2)+'%':'—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td style={TF}>รวม</td>
                  <td style={{ ...TF, textAlign:'center' }}>{billCount}</td>
                  <td style={TFR}>{qtyMix(totKgW, totUnitQ)}</td>
                  <td style={TFR}>{$(totNet)}</td>
                  <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                  <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
                  <td style={TFR}>100.00%</td>
                </tr></tfoot>
              </table></div>
            </Card>
            <Card title="สัดส่วนการชำระเงิน">
              {payTotal > 0 ? (() => {
                const sorted = [...payRows].sort((a,b)=>b.total-a.total);
                /* donut via SVG */
                const SZ = 180, CX = 90, CY = 90, R = 72, RI = 44;
                const isSingle = sorted.length === 1;
                let angle = -Math.PI / 2;
                const slices = sorted.map(p => {
                  const pct = p.total / payTotal;
                  const sweep = pct * 2 * Math.PI;
                  /* SVG arc ไม่รองรับ sweep=2π (จุดเริ่ม=จุดสิ้นสุด) — ใช้ circle แทนเมื่อ slice เดียว */
                  const x1 = CX + R*Math.cos(angle),  y1 = CY + R*Math.sin(angle);
                  const xi1= CX + RI*Math.cos(angle), yi1= CY + RI*Math.sin(angle);
                  angle += sweep;
                  const x2 = CX + R*Math.cos(angle),  y2 = CY + R*Math.sin(angle);
                  const xi2= CX + RI*Math.cos(angle), yi2= CY + RI*Math.sin(angle);
                  const large = sweep > Math.PI ? 1 : 0;
                  const midA = angle - sweep/2;
                  const lx = CX + (R+12)*Math.cos(midA), ly = CY + (R+12)*Math.sin(midA);
                  return { p, pct, large, x1,y1,x2,y2,xi1,yi1,xi2,yi2, lx, ly,
                    d: `M${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} L${xi2},${yi2} A${RI},${RI} 0 ${large},0 ${xi1},${yi1} Z`,
                    color: PAY_COLORS[p.pay]||'#999' };
                });
                const dominant = sorted[0];
                return (
                  <div style={{ padding:'14px 16px' }}>
                    {/* Donut */}
                    <div style={{ position:'relative', width:SZ, height:SZ, margin:'0 auto 18px' }}>
                      <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`} style={{ display:'block' }}>
                        <defs>
                          {slices.map((s,i)=>(
                            <radialGradient key={i} id={`pg${i}`} cx="50%" cy="50%" r="50%">
                              <stop offset="0%" stopColor={s.color} stopOpacity=".95" />
                              <stop offset="100%" stopColor={s.color} stopOpacity=".75" />
                            </radialGradient>
                          ))}
                        </defs>
                        {isSingle ? (
                          <>
                            <circle cx={CX} cy={CY} r={R}  fill={`url(#pg0)`} stroke="var(--bg)" strokeWidth="2" />
                            <circle cx={CX} cy={CY} r={RI} fill="var(--bg)" />
                          </>
                        ) : slices.map((s,i)=>(
                          <path key={i} d={s.d} fill={`url(#pg${i})`}
                            stroke="var(--bg)" strokeWidth="2" />
                        ))}
                        {/* % labels outside for large slices */}
                        {slices.filter(s=>s.pct>=0.08).map((s,i)=>{
                          const midA2 = Math.atan2(s.y2-CY, s.x2-CX) - (s.pct*Math.PI);
                          const px = CX + (R-18)*Math.cos(midA2), py = CY + (R-18)*Math.sin(midA2);
                          return (
                            <text key={i} x={px} y={py} textAnchor="middle" dominantBaseline="middle"
                              fill="#fff" fontSize="11" fontWeight="800">{(s.pct*100).toFixed(1)}%</text>
                          );
                        })}
                        {/* center */}
                        <text x={CX} y={CY-7} textAnchor="middle" fill="var(--tx)" fontSize="10" fontWeight="600" opacity=".6">ยอดรวม</text>
                        <text x={CX} y={CY+9} textAnchor="middle" fill="var(--tx)" fontSize="13" fontWeight="800">
                          {payTotal>=1000000
                            ? (payTotal/1000000).toFixed(1)+'M'
                            : payTotal>=1000
                              ? (payTotal/1000).toFixed(1)+'K'
                              : Math.round(payTotal)}
                        </text>
                        <text x={CX} y={CY+22} textAnchor="middle" fill="var(--t3)" fontSize="9">฿</text>
                      </svg>
                    </div>
                    {/* Legend */}
                    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      {sorted.map(p=>{
                        const pct = payTotal>0 ? p.total/payTotal : 0;
                        const color = PAY_COLORS[p.pay]||'#999';
                        return (
                          <div key={p.pay}>
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                                <span style={{ width:10, height:10, borderRadius:3, background:color, flexShrink:0, boxShadow:`0 1px 4px ${color}55` }}></span>
                                <span style={{ fontSize:13, fontWeight:700 }}>{PAY_LABELS[p.pay]||p.pay}</span>
                                <span style={{ fontSize:11.5, color:'var(--t3)', fontWeight:400 }}>{p.cnt} บิล</span>
                              </div>
                              <div style={{ textAlign:'right' }}>
                                <span style={{ fontSize:13, fontWeight:800, color:'var(--tx)' }}>{$(p.total)}</span>
                                <span style={{ fontSize:11, color:'var(--t3)', marginLeft:5 }}>{(pct*100).toFixed(1)}%</span>
                              </div>
                            </div>
                            <div style={{ height:6, borderRadius:100, background:'var(--s2)', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:'100%', background:color, borderRadius:100, transform:`scaleX(${pct.toFixed(4)})`, transformOrigin:'left', transition:'transform .5s ease', boxShadow:`0 1px 4px ${color}66` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* dominant badge */}
                    <div style={{ marginTop:14, padding:'8px 12px', borderRadius:'var(--rs)', background:'var(--s2)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <span style={{ fontSize:12, color:'var(--t2)' }}>ช่องทางหลัก</span>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ width:8, height:8, borderRadius:2, background:PAY_COLORS[dominant.pay]||'#999', flexShrink:0 }}></span>
                        <span style={{ fontSize:13, fontWeight:800 }}>{PAY_LABELS[dominant.pay]||dominant.pay}</span>
                        <span style={{ fontSize:12, color:'var(--gn)', fontWeight:700 }}>{(dominant.total/payTotal*100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })() : <div style={{ padding:'40px 0', textAlign:'center', color:'var(--t3)' }}>ไม่มีข้อมูล</div>}
            </Card>
          </div>
          <Card title="รายการบิลแยกตามช่องทางชำระเงิน">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={TH}>เลขที่บิล</th><th style={TH}>ลูกค้า</th>
                <th style={TH}>ช่องทาง</th><th style={THR}>Gross Sale</th>
                <th style={THR}>Discount</th><th style={THR}>VAT</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {payBillPag.slice.map((r,i)=>{
                  const cust = D.customers.find(c=>c.id===r.custId);
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{r.date}</span></td>
                      <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{r.inv}</span></td>
                      <td style={TD}><span style={{ fontWeight:600 }}>{cust?.name||'—'}</span></td>
                      <td style={TD}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ width:8, height:8, borderRadius:2, background:PAY_COLORS[r.pay]||'#999', flexShrink:0 }}></span>
                          <span style={{ fontSize:13, fontWeight:700 }}>{PAY_LABELS[r.pay]||r.pay}</span>
                        </div>
                      </td>
                      <td style={TDR}>{$(r.grossSale)}</td>
                      <td style={{ ...TDR, color:'var(--am)' }}>{r.discount>0?'-'+$(r.discount):'—'}</td>
                      <td style={{ ...TDR, color:'var(--pu)' }}>{$(r.vat)}</td>
                      <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(r.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
            <Paginator page={payBillPag.page} totalPages={payBillPag.totalPages} setPage={payBillPag.setPage} total={payBillPag.total} pageSize={payBillPag.pageSize} setPageSize={payBillPag.setPageSize} noun="รายการ" />
          </Card>
        </div>
      )}

      {/* ── TAB 5: % Discount ── */}
      {tab==='discount' && (
        <div>
          <FilterBar showSearch={false}
            onExport={()=>window.exportCSV('report_discount.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','Gross Sale','ส่วนลด','ส่วนลด %','Net Sale','VAT','ยอดรวม'],discFiltered.map(r=>[r.date,r.inv,r.code,r.prod,r.grossSale,r.discount,r.grossSale>0?((r.discount/r.grossSale)*100).toFixed(2)+'%':'',r.netSale,r.vat.toFixed(2),r.total]))}
            onPdf={()=>window.exportPDF('รายงาน % Discount',['วันที่','เลขที่บิล','สินค้า','Gross Sale','ส่วนลด','ส่วนลด %','Net Sale'],discFiltered.map(r=>[r.date,r.inv,r.prod,r.grossSale,r.discount,r.grossSale>0?((r.discount/r.grossSale)*100).toFixed(2)+'%':'',r.netSale]),`${discFiltered.length} รายการ | ส่วนลดรวม ${$(totDisc)} | อัตราเฉลี่ย ${avgDiscPct.toFixed(2)}%`)}
          />
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'10px 14px', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:'var(--r)' }}>
            <Icon name="search" size={13} style={{ color:'var(--t3)', flexShrink:0 }} />
            <input className="fc" placeholder="ค้นหาเลขที่บิล เช่น ABB2606…" style={{ flex:1, maxWidth:280 }}
              value={discSearch} onChange={e=>setDiscSearch(e.target.value)} />
            {discSearch && <button className="btn bg2 bsm" onClick={()=>setDiscSearch('')}>ล้าง</button>}
            {discSearch && <span style={{ fontSize:12.5, color:'var(--t2)' }}>พบ <b>{discFiltered.length}</b> รายการ</span>}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:20 }}>
            <KPI label="มีดิสเค้าท์" value={`${discRows.length} / ${billCount} บิล`} color="var(--am)" />
            <KPI label="ส่วนลดรวม" value={$(totDisc)} color="var(--am)" />
            <KPI label="Gross Sale" value={$(totGross)} color="var(--gn)" />
            <KPI label="Net Sale" value={$(totNet)} color="var(--ac)" />
            <KPI label="อัตราส่วนลดเฉลี่ย" sub="จากยอดขาย" value={avgDiscPct.toFixed(2)+'%'} color="var(--am)" />
          </div>
          <Card title="สรุปส่วนลดแยกตามวันที่" style={{ marginBottom:14 }}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={TH}>เลขที่บิล</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                <th style={THR}>Gross Sale</th><th style={THR}>ส่วนลดรวม (฿)</th>
                <th style={THR}>ส่วนลด (%)</th><th style={THR}>Net Sale</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i)=>{
                  const dr = rows.filter(r=>r.date===d.date && r.discount>0);
                  const invNos = [...new Set(dr.map(r=>r.inv))].sort();
                  const dPct = d.gross>0?(d.disc/d.gross*100):0;
                  const first = invNos[0], last = invNos[invNos.length-1];
                  const rangeLabel = invNos.length === 0
                    ? <span style={{ color:'var(--t3)', fontSize:12 }}>—</span>
                    : invNos.length === 1
                      ? <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)', fontWeight:700 }}>{first}</span>
                      : <div>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)', fontWeight:700 }}>{first}</span>
                          <span style={{ color:'var(--t3)', margin:'0 4px', fontSize:11 }}>—</span>
                          <span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)', fontWeight:700 }}>{last}</span>
                        </div>;
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                      <td style={TD}>{rangeLabel}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{invNos.length > 0 ? <span style={{ fontWeight:700 }}>{invNos.length}</span> : <span style={{ color:'var(--t3)' }}>0</span>} บิล</td>
                      <td style={TDR}>{$(d.gross)}</td>
                      <td style={{ ...TDR, color:'var(--am)', fontWeight:700 }}>{d.disc>0?'-'+$(d.disc):'—'}</td>
                      <td style={{ ...TDR, color:'var(--am)' }}>{d.disc>0?dPct.toFixed(2)+'%':'—'}</td>
                      <td style={{ ...TDR, fontWeight:700, color:'var(--ac)' }}>{$(d.net)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr>
                <td colSpan="3" style={TF}>รวมทั้งหมด</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>{avgDiscPct.toFixed(2)}%</td>
                <td style={{ ...TFR, color:'var(--ac)' }}>{$(totNet)}</td>
              </tr></tfoot>
            </table></div>
          </Card>
          <Card title="รายละเอียดรายการสินค้าที่มีส่วนลด">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={TH}>เลขที่บิล</th><th style={TH}>รหัสสินค้า</th>
                <th style={TH}>สินค้า</th><th style={THR}>Gross Sale</th>
                <th style={THR}>ส่วนลด (฿)</th><th style={THR}>ส่วนลด (%)</th>
                <th style={THR}>Net Sale</th><th style={THR}>VAT</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {discFiltered.length===0 ? <tr><td colSpan="10" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>{discSearch ? `ไม่พบเลขที่บิล "${discSearch}"` : 'ไม่มีรายการที่มีส่วนลดในช่วงนี้'}</td></tr>
                : discPag.slice.map((r,i)=>{
                  const pct = r.grossSale>0?(r.discount/r.grossSale*100):0;
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{r.date}</span></td>
                      <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{r.inv}</span></td>
                      <td style={TD}><span className="mono">{r.code}</span></td>
                      <td style={{ ...TD, fontWeight:600 }}>{r.prod}</td>
                      <td style={TDR}>{$(r.grossSale)}</td>
                      <td style={{ ...TDR, color:'var(--am)', fontWeight:700 }}>-{$(r.discount)}</td>
                      <td style={{ ...TDR, color:'var(--am)' }}>{pct.toFixed(2)}%</td>
                      <td style={{ ...TDR, fontWeight:700 }}>{$(r.netSale)}</td>
                      <td style={{ ...TDR, color:'var(--pu)' }}>{$(r.vat)}</td>
                      <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(r.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              {discRows.length>0 && <tfoot><tr>
                <td colSpan="4" style={TF}>รวม {discRows.length} รายการ</td>
                <td style={TFR}>{$(discRows.reduce((s,r)=>s+r.grossSale,0))}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(discRows.reduce((s,r)=>s+r.discount,0))}</td>
                <td style={TFR}>{totGross>0?(totDisc/totGross*100).toFixed(2)+'%':'—'}</td>
                <td style={TFR}>{$(discRows.reduce((s,r)=>s+r.netSale,0))}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(discRows.reduce((s,r)=>s+r.vat,0))}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(discRows.reduce((s,r)=>s+r.total,0))}</td>
              </tr></tfoot>}
            </table></div>
            <Paginator page={discPag.page} totalPages={discPag.totalPages} setPage={discPag.setPage} total={discPag.total} pageSize={discPag.pageSize} setPageSize={discPag.setPageSize} noun="รายการ" />
          </Card>
        </div>
      )}

      {/* ── TAB 6: รายลูกค้า ── */}
      {tab==='customer' && (
        <div>
          <FilterBar
            onExport={()=>window.exportCSV('report_customers.csv',['รหัส','ชื่อลูกค้า','ประเภท','จำนวนบิล','จำนวน','ส่วนลด','ยอดรวม'],custRows.map(c=>[c.code,c.name,c.type,c.cnt,qtyMix(c.kgW,c.unitQ),c.disc,$(c.total)]))}
          />
          <Card title="ยอดขายรายลูกค้า">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>ชื่อลูกค้า</th><th style={TH}>ประเภท</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                <th style={THR}>จำนวน</th>
                <th style={THR}>ส่วนลดรวม</th><th style={THR}>ยอดรวมสุทธิ</th><th style={TH}></th>
              </tr></thead>
              <tbody>
                {custRows.length===0 ? <tr><td colSpan="8" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>ไม่พบข้อมูล</td></tr>
                : custPag.slice.map((c,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span className="mono" style={{ color:'var(--t2)' }}>{c.code}</span></td>
                    <td style={{ ...TD, fontWeight:600 }}>{c.name}</td>
                    <td style={TD}><Badge kind={c.type}/></td>
                    <td style={{ ...TD, textAlign:'center' }}>{c.cnt} บิล</td>
                    <td style={TDR}>{qtyMix(c.kgW, c.unitQ)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{c.disc>0?'-'+$(c.disc):'—'}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(c.total)}</td>
                    <td style={TD}>
                      <button onClick={()=>setCustModal(c)} style={{ fontSize:12, padding:'4px 10px', border:'1px solid var(--ac)', borderRadius:6, cursor:'pointer', background:'var(--abg)', color:'var(--ac)', fontWeight:700, fontFamily:'inherit', transition:'all .13s' }}>
                        ดูรายงานเพิ่ม
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              {custRows.length>0 && <tfoot><tr>
                <td colSpan="3" style={TF}>รวม {custRows.length} ราย</td>
                <td style={{ ...TF, textAlign:'center' }}>{billCount} บิล</td>
                <td style={TFR}>{qtyMix(totKgW, totUnitQ)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
                <td style={TF}></td>
              </tr></tfoot>}
            </table></div>
            <Paginator page={custPag.page} totalPages={custPag.totalPages} setPage={custPag.setPage} total={custPag.total} pageSize={custPag.pageSize} setPageSize={custPag.setPageSize} noun="ราย" />
          </Card>
        </div>
      )}

      {/* ── Customer detail modal ── */}
      {custModal && (
        <Overlay onClick={e=>e.target===e.currentTarget&&setCustModal(null)}>
          <div className="md" style={{ width:660 }}>
            <div className="md-h">
              <span className="md-t">ประวัติการซื้อ: {custModal.name}</span>
              <div className="md-x" onClick={()=>setCustModal(null)}>✕</div>
            </div>
            <div className="md-b">
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:18 }}>
                <div style={{ fontSize:13 }}>
                  {[['ชื่อลูกค้า', custModal.name],['เลขประจำตัวผู้เสียภาษี', custModal.tax||'—'],['โทรศัพท์', custModal.tel||'—'],['จำนวนบิล', custModal.cnt+' ใบ'],['ส่วนลดรวม', custModal.disc>0?'-'+$(custModal.disc):'—'],['ยอดซื้อสะสม', $(custModal.total)]].map(([l,v],i)=>(
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--bd)' }}>
                      <span style={{ color:'var(--t2)' }}>{l}</span>
                      <span style={{ fontWeight: i>=4?800:600, color: i===4?'var(--am)':i===5?'var(--gn)':'var(--tx)' }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ fontSize:11.5, fontWeight:700, color:'var(--t3)', marginBottom:6 }}>ที่อยู่:</div>
                  <div style={{ fontSize:13, lineHeight:1.7, color:'var(--t2)' }}>{custModal.addr||'—'}</div>
                </div>
              </div>
              {(()=>{
                const grp = {};
                (custModal.txns||[]).forEach(r => {
                  if (!grp[r.inv]) grp[r.inv] = { inv:r.inv, date:r.date, channel:r.channel||r.pay, kgW:0, unitQ:0, disc:0, total:0 };
                  const isKg = window.unitOf ? window.unitOf(r.code).unitType === 'kg' : true;
                  if (isKg) grp[r.inv].kgW += (r.w||0);
                  else grp[r.inv].unitQ += (r.w||0);
                  grp[r.inv].disc += (r.discount||0);
                  grp[r.inv].total += (r.total||0);
                });
                const grouped = Object.values(grp);
                const INVLINK = { background:'none', border:'none', padding:0, fontFamily:'var(--font-mono)', fontSize:12, fontWeight:700, textDecoration:'underline', textDecorationStyle:'dotted', textUnderlineOffset:3 };
                return (<React.Fragment>
                  <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>ประวัติการซื้อ ({grouped.length} บิล)</div>
                  <div className="tw"><table>
                    <thead><tr>
                      <th style={TH}>เลขที่กำกับ</th><th style={TH}>วันที่</th>
                      <th style={THR}>น้ำหนัก / จำนวน</th>
                      <th style={THR}>ส่วนลด</th><th style={THR}>ยอดรวม</th><th style={TH}>ประเภทชำระ</th>
                    </tr></thead>
                    <tbody>
                      {grouped.map((g,i)=>{
                        const allInvs = window.SP_STATE?.invoices||[];
                        const invObj = allInvs.find(iv=>iv.no===g.inv||iv.invoice_no===g.inv)
                          || allInvs.find(iv=>iv.thermalNo===g.inv);
                        const isA4 = invObj && (invObj.type==='A4'||invObj.type==='INV');
                        const openDoc = () => { if (!invObj) return; if (isA4) setTaxA4Modal(invObj); else setTaxDocModal(invObj); };
                        return (
                        <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                          <td style={TD}>
                            <button style={{ ...INVLINK, cursor:invObj?'pointer':'default', color:invObj?'var(--ac)':'var(--t2)' }}
                              onClick={invObj?openDoc:undefined}>{g.inv}</button>
                          </td>
                          <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{g.date}</span></td>
                          <td style={TDR}>{qtyMix(g.kgW, g.unitQ)}</td>
                          <td style={{ ...TDR, color:'var(--am)' }}>{g.disc>0?'-'+$(g.disc):'—'}</td>
                          <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(g.total)}</td>
                          <td style={TD}><Badge kind={g.channel}/></td>
                        </tr>
                        );
                      })}
                    </tbody>
                    <tfoot><tr>
                      <td colSpan="2" style={TF}>รวม {grouped.length} บิล</td>
                      <td style={TFR}>{qtyMix(custModal.kgW||0, custModal.unitQ||0)}</td>
                      <td style={{ ...TFR, color:'var(--am)' }}>{custModal.disc>0?'-'+$(custModal.disc):'—'}</td>
                      <td style={{ ...TFR, color:'var(--gn)' }}>{$(custModal.total)}</td>
                      <td style={TF}></td>
                    </tr></tfoot>
                  </table></div>
                </React.Fragment>);
              })()}
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setCustModal(null)}>ปิด</Button>
            </div>
          </div>
        </Overlay>
      )}
      {/* Document popups — rendered after custModal so they appear on top */}
      {taxDocModal && <TIVDocModal tiv={taxDocModal} onClose={()=>setTaxDocModal(null)} toast={toast} onVoid={()=>setTaxDocModal(null)} />}
      {taxA4Modal && (
        <Overlay onClick={e=>e.target===e.currentTarget&&setTaxA4Modal(null)}>
          <div className="md" style={{ width:'min(860px,96vw)' }}>
            <div className="md-h">
              <span className="md-t">ใบกำกับภาษี · <span style={{ fontFamily:'var(--font-mono)' }}>{taxA4Modal.no}</span></span>
              <div style={{ display:'flex', gap:8 }}>
                <Button variant="bp" size="sm" icon="printer" onClick={()=>{window.printDoc('inv',taxA4Modal);toast('info','กำลังพิมพ์ใบกำกับภาษี…');}}>พิมพ์</Button>
                <button type="button" className="md-x" aria-label="ปิด" onClick={()=>setTaxA4Modal(null)}>✕</button>
              </div>
            </div>
            <div className="md-b" style={{ background:'#e8e7e2', padding:'16px', overflowX:'auto' }}>
              <A4Content iv={taxA4Modal} />
            </div>
            <div className="md-f">
              <Button variant="bg2" onClick={()=>setTaxA4Modal(null)}>ปิด</Button>
            </div>
          </div>
        </Overlay>
      )}
    </div>
  );
}
window.Reports = Reports;
