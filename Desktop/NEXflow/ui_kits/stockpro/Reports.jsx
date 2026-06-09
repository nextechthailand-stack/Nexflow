/* StockPro UI Kit — Reports (6 tabs: รายการสินค้า, ภาษีซื้อ-ขาย, Daily Sale, Payment, % Discount, รายลูกค้า) */

const RPT_TABS = [
  { id:'product',  label:'รายการสินค้า' },
  { id:'tax',      label:'ภาษีซื้อ-ขาย' },
  { id:'daily',    label:'Daily Sale' },
  { id:'payment',  label:'Payment' },
  { id:'discount', label:'% Discount' },
  { id:'customer', label:'รายลูกค้า' },
];
const PAY_LABELS = { cash:'เงินสด', transfer:'โอนเงิน', credit:'เครดิต' };
const PAY_ICONS  = { cash:'🟩', transfer:'🏦', credit:'💳' };
const PAY_COLORS = { cash:'#3b5bdb', transfer:'#0d9272', credit:'#c47b00' };

function Reports() {
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
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo]     = React.useState('');
  const [search, setSearch]     = React.useState('');
  const [custModal, setCustModal] = React.useState(null);

  React.useEffect(() => { setSearch(''); }, [tab]);

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
    if (!byDate[r.dateISO]) byDate[r.dateISO] = { date:r.date, cnt:0, gross:0, disc:0, net:0, vat:0, total:0, cash:0, transfer:0, credit:0, wholesale:0, online:0, sample:0, expired:0, other:0 };
    const d = byDate[r.dateISO];
    d.cnt++; d.gross+=r.grossSale; d.disc+=r.discount; d.net+=r.netSale; d.vat+=r.vat; d.total+=r.total;
    if (r.pay) d[r.pay] = (d[r.pay]||0) + r.total;
    if (r.channel) d[r.channel] = (d[r.channel]||0) + r.total;
  });
  const dateRows = Object.values(byDate).sort((a,b) => b.dateISO?.localeCompare(a.dateISO||'')||0);

  /* ── by-payment ── */
  const byPay = {};
  rows.forEach(r => {
    const k = r.pay||'cash';
    if (!byPay[k]) byPay[k] = { pay:k, cnt:0, w:0, net:0, vat:0, total:0 };
    byPay[k].cnt++; byPay[k].w+=r.w; byPay[k].net+=r.netSale; byPay[k].vat+=r.vat; byPay[k].total+=r.total;
  });
  const payRows = Object.values(byPay);
  const payTotal = payRows.reduce((s,p)=>s+p.total,0);

  /* ── by-customer ── */
  const byCust = {};
  rows.forEach(r => {
    const cust = D.customers.find(c=>c.id===r.custId) || { id:0, code:'—', name:'ไม่ระบุ', type:'other', tax:'', tel:'', addr:'' };
    if (!byCust[cust.id]) byCust[cust.id] = { ...cust, cnt:0, w:0, disc:0, total:0, txns:[] };
    byCust[cust.id].cnt++; byCust[cust.id].w+=r.w; byCust[cust.id].disc+=r.discount; byCust[cust.id].total+=r.total;
    byCust[cust.id].txns.push(r);
  });
  const custRows = Object.values(byCust).sort((a,b)=>b.total-a.total);

  /* ── discount rows ── */
  const discRows = rows.filter(r=>r.discount>0);
  const allDiscBills = allRows.filter(r=>r.discount>0 && (!dateFrom||r.dateISO>=dateFrom) && (!dateTo||r.dateISO<=dateTo));
  const avgDiscPct = totGross > 0 ? (totDisc/totGross*100) : 0;

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
      <input type="date" className="fc" style={{ width:140 }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)} />
      <span style={{ fontSize:12, color:'var(--t3)' }}>ถึง</span>
      <input type="date" className="fc" style={{ width:140 }} value={dateTo} onChange={e=>setDateTo(e.target.value)} />
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
  const TH = { padding:'9px 14px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)', background:'var(--s2)', whiteSpace:'nowrap' };
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
        {RPT_TABS.map(t => <div key={t.id} className={'tab'+(tab===t.id?' on':'')} onClick={()=>setTab(t.id)}>{t.label}</div>)}
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
            onExport={()=>window.exportCSV('report_products.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','ชำระ','น้ำหนัก KG','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],rows.map(r=>[r.date,r.inv,r.code,r.prod,r.channel,PAY_LABELS[r.pay]||r.pay,r.w.toFixed(3),r.grossSale,r.discount||0,r.netSale,r.vat.toFixed(2),r.total]))}
            onPdf={()=>window.exportPDF('รายงานรายการสินค้า',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','น้ำหนัก KG','ยอดรวม'],rows.map(r=>[r.date,r.inv,r.code,r.prod,r.channel,r.w.toFixed(3),r.total]),`${rows.length} รายการ | รวม ${totW.toFixed(3)} KG | ยอดรวม ${$(totTotal)}`)}
          />
          {prodSub==='flat' && (
          <Card title={`รายการสินค้าทั้งหมด · ${rows.length} รายการ`} actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('report_products.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','ชำระ','น้ำหนัก KG','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],rows.map(r=>[r.date,r.inv,r.code,r.prod,r.channel,PAY_LABELS[r.pay]||r.pay,r.w.toFixed(3),r.grossSale,r.discount||0,r.netSale,r.vat.toFixed(2),r.total]))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('รายการสินค้าทั้งหมด',['วันที่','เลขที่บิล','รหัส','สินค้า','ช่องทาง','น้ำหนัก KG','ยอดรวม'],rows.map(r=>[r.date,r.inv,r.code,r.prod,r.channel,r.w.toFixed(3),r.total]))}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={TH}>เลขที่บิล</th><th style={TH}>รหัส</th><th style={TH}>สินค้า</th>
                <th style={TH}>ช่องทาง</th><th style={TH}>ชำระ</th><th style={THR}>น้ำหนัก</th>
                <th style={THR}>Gross Sale</th><th style={THR}>Discount</th><th style={THR}>Net Sale</th>
                <th style={THR}>VAT 7%</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {rows.length===0 ? <tr><td colSpan="12" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                : rows.map((r,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{r.date}</span></td>
                    <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{r.inv}</span></td>
                    <td style={TD}><span className="mono">{r.code}</span></td>
                    <td style={TD}><span style={{ fontWeight:600 }}>{r.prod}</span></td>
                    <td style={TD}><Badge kind={r.channel}/></td>
                    <td style={TD}><span style={{ fontSize:12.5 }}>{PAY_LABELS[r.pay]||r.pay}</span></td>
                    <td style={TDR}>{r.w.toFixed(3)}</td>
                    <td style={TDR}>{$(r.grossSale)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{r.discount>0?'-'+$(r.discount):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700 }}>{$(r.netSale)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(r.vat)}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(r.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan="6" style={TF}>รวม {rows.length} รายการ · {billCount} บิล</td>
                <td style={TFR}>{totW.toFixed(3)}</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={TFR}>{$(totNet)}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
          </Card>
          )}

          {prodSub==='byproduct' && (
          <Card title={`สรุปยอดขายแยกตามสินค้า · ${productRows.length} รายการสินค้า`} actions={<div style={{display:'flex',gap:6}}>
            <Button variant="bg2" size="sm" icon="download" onClick={()=>window.exportCSV('report_products_byproduct.csv',['รหัส','สินค้า','จำนวนรายการ','น้ำหนักรวม KG','Gross Sale','Discount','Net Sale','VAT 7%','ยอดรวม'],productRows.map(p=>[p.code,p.prod,p.cnt,p.w.toFixed(3),p.gross,p.disc,p.net,p.vat.toFixed(2),p.total]))}>CSV</Button>
            <Button variant="bg2" size="sm" icon="printer" onClick={()=>window.exportPDF('สรุปยอดขายแยกตามสินค้า',['รหัส','สินค้า','จำนวนรายการ','น้ำหนักรวม KG','ยอดรวม'],productRows.map(p=>[p.code,p.prod,p.cnt,p.w.toFixed(3),p.total]),`${productRows.length} รายการสินค้า | รวม ${totW.toFixed(3)} KG | ยอดรวม ${$(totTotal)}`)}>PDF</Button>
          </div>}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>สินค้า</th><th style={THR}>จำนวนรายการ</th><th style={THR}>น้ำหนักรวม</th>
                <th style={THR}>Gross Sale</th><th style={THR}>Discount</th><th style={THR}>Net Sale</th>
                <th style={THR}>VAT 7%</th><th style={THR}>ยอดรวม</th>
              </tr></thead>
              <tbody>
                {productRows.length===0 ? <tr><td colSpan="9" style={{ padding:'32px', textAlign:'center', color:'var(--t3)' }}>ไม่พบรายการ</td></tr>
                : productRows.map((p,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span className="mono">{p.code}</span></td>
                    <td style={TD}><span style={{ fontWeight:600 }}>{p.prod}</span></td>
                    <td style={TDR}>{p.cnt}</td>
                    <td style={TDR}>{p.w.toFixed(3)}</td>
                    <td style={TDR}>{$(p.gross)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{p.disc>0?'-'+$(p.disc):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700 }}>{$(p.net)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(p.vat)}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(p.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td colSpan="2" style={TF}>รวม {productRows.length} รายการสินค้า</td>
                <td style={TFR}>{rows.length}</td>
                <td style={TFR}>{totW.toFixed(3)}</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={TFR}>{$(totNet)}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
          </Card>
          )}
        </div>
      )}

      {/* ── TAB 2: ภาษีซื้อ-ขาย ── */}
      {tab==='tax' && (
        <div>
          <FilterBar showSearch={false}
            onExport={()=>window.exportCSV('report_tax.csv',['วันที่','จำนวนรายการ','Gross Sale','Discount','Net Sale','VAT 7%','เงินสด','โอนเงิน','เครดิต','รวม'],dateRows.map(d=>[d.date,d.cnt,d.gross,d.disc||0,d.net,d.vat,(d.cash||0),(d.transfer||0),(d.credit||0),d.total]))}
            onPdf={()=>window.exportPDF('รายงานภาษีซื้อ-ขาย',['วันที่','จำนวนรายการ','Gross Sale','Discount','Net Sale','VAT 7%','รวม'],dateRows.map(d=>[d.date,d.cnt,d.gross,d.disc||0,d.net,d.vat,d.total]),`รวม ${rows.length} รายการ | VAT ${$(totVat)} | ยอดรวม ${$(totTotal)}`)}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
            <KPI label="จำนวนบิลทั้งหมด" value={billCount+' ใบ'} color="var(--ac)" />
            <KPI label="Gross Sale" sub="แยกรายการสินค้า" value={$(totGross)} color="var(--gn)" />
            <KPI label="Discount" sub="ส่วนลดทั้งหมด" value={totDisc>0?'-'+$(totDisc):'฿0.00'} color="var(--am)" />
            <KPI label="Net Sale" sub="หลังลดส่วนลด" value={$(totNet)} color="var(--ac)" />
            <KPI label="VAT 7%" sub="ภาษีมูลค่าเพิ่ม" value={$(totVat)} color="var(--pu)" />
            <KPI label="Sale incl. VAT" sub="ยอดรวมทั้งสิ้น" value={$(totTotal)} color="var(--tx)" />
          </div>

          {/* ── สรุปยอดประจำวัน — compact invoice range view ── */}
          <Card title="สรุปยอดประจำวัน" style={{ marginBottom:14 }}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th>
                <th style={TH}>เลขที่ TIV (อย่างย่อ)</th>
                <th style={TH}>เลขที่ INV (เต็มรูปแบบ)</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                <th style={THR}>น้ำหนักรวม (KG)</th>
                <th style={THR}>ยอดรวม (฿)</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i) => {
                  const dayRows = rows.filter(r => r.date === d.date);
                  const tivs = dayRows.map(r => r.thermalInv).filter(Boolean).sort();
                  const invs = dayRows.filter(r => r.channel==='wholesale').map(r => r.inv).filter(x=>x&&x.startsWith('INV')).sort();
                  const rng = arr => arr.length > 1 ? `${arr[0]} – ${arr[arr.length-1]}` : (arr[0]||'—');
                  const kgDay = dayRows.reduce((s,r)=>s+r.w,0);
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={{ ...TD, fontWeight:700 }}>{d.date}</td>
                      <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{rng(tivs)}</td>
                      <td style={{ ...TD, fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{rng(invs)}</td>
                      <td style={{ ...TD, textAlign:'center', fontWeight:700 }}>{dayRows.length} บิล</td>
                      <td style={TDR}>{kgDay.toFixed(3)}</td>
                      <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(d.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr>
                <td style={TF}>รวมทั้งหมด</td>
                <td colSpan="2" style={{ ...TF, fontSize:11.5, color:'var(--t3)' }}>
                  TIV ต่อไป: <span style={{ fontFamily:'var(--font-mono)', color:'var(--t2)' }}>…-{String(window.SP_STATE.invCounterThermal).padStart(4,'0')}</span>
                  &nbsp;&nbsp; INV ต่อไป: <span style={{ fontFamily:'var(--font-mono)', color:'var(--ac)' }}>…-{String(window.SP_STATE.invCounterA4).padStart(4,'0')}</span>
                </td>
                <td style={{ ...TF, textAlign:'center' }}>{rows.length} บิล</td>
                <td style={TFR}>{totW.toFixed(3)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
          </Card>

          <Card title="สรุปเอกสารแยกตามวันที่ (ภาษีซื้อ-ขาย)" style={{ marginBottom:14 }}>
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th><th style={{ ...TH, textAlign:'center' }}>จำนวนรายการ</th>
                <th style={THR}>Gross Sale</th><th style={THR}>Discount</th><th style={THR}>Net Sale</th>
                <th style={THR}>VAT 7%</th><th style={THR}>เงินสด</th><th style={THR}>โอนเงิน</th><th style={THR}>เครดิต</th><th style={THR}>รวม</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                    <td style={{ ...TD, textAlign:'center' }}>{d.cnt} รายการ</td>
                    <td style={TDR}>{$(d.gross)}</td>
                    <td style={{ ...TDR, color:'var(--am)' }}>{d.disc>0?'-'+$(d.disc):'—'}</td>
                    <td style={{ ...TDR, fontWeight:700 }}>{$(d.net)}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{$(d.vat)}</td>
                    <td style={TDR}>{d.cash?$(d.cash):'—'}</td>
                    <td style={TDR}>{d.transfer?$(d.transfer):'—'}</td>
                    <td style={TDR}>{d.credit?$(d.credit):'—'}</td>
                    <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(d.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr>
                <td style={TF}>รวม {dateRows.length} วัน</td>
                <td style={{ ...TF, textAlign:'center' }}>{rows.length} รายการ</td>
                <td style={TFR}>{$(totGross)}</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={TFR}>{$(totNet)}</td>
                <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='cash').reduce((s,r)=>s+r.total,0))}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='transfer').reduce((s,r)=>s+r.total,0))}</td>
                <td style={TFR}>{$(rows.filter(r=>r.pay==='credit').reduce((s,r)=>s+r.total,0))}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
              </tr></tfoot>
            </table></div>
          </Card>
          <Card title="สรุปประเภทตามประเภท">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>วันที่</th>
                <th style={{ ...THR, color:'var(--ac)' }}>Wholesale</th>
                <th style={{ ...THR, color:'var(--pu)' }}>Online</th>
                <th style={THR}>Sample</th>
                <th style={{ ...THR, color:'var(--rd)' }}>Expired</th>
                <th style={THR}>Other</th>
                <th style={{ ...THR, fontWeight:800 }}>รวมทุกประเภท</th>
              </tr></thead>
              <tbody>
                {dateRows.map((d,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                    <td style={{ ...TDR, color:'var(--ac)' }}>{d.wholesale?$(d.wholesale):'—'}</td>
                    <td style={{ ...TDR, color:'var(--pu)' }}>{d.online?$(d.online):'—'}</td>
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
            onExport={()=>window.exportCSV('report_payment.csv',['ช่องทาง','จำนวนบิล','น้ำหนัก KG','Net Sale','VAT','ยอดรวม','สัดส่วน %'],payRows.map(p=>[PAY_LABELS[p.pay]||p.pay,p.cnt,p.w.toFixed(3),$(p.net),$(p.vat),$(p.total),payTotal>0?((p.total/payTotal)*100).toFixed(2)+'%':'']))}
            onPdf={()=>window.exportPDF('รายงาน Payment',['ช่องทาง','จำนวนบิล','น้ำหนัก KG','Net Sale','VAT','ยอดรวม','สัดส่วน %'],payRows.map(p=>[PAY_LABELS[p.pay]||p.pay,p.cnt,p.w.toFixed(3),$(p.net),$(p.vat),$(p.total),payTotal>0?((p.total/payTotal)*100).toFixed(2)+'%':'']),`รวม ${billCount} บิล | ยอดรวม ${$(totTotal)}`)}
          />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>
            <Card title="รายงานแยกตามประเภทชำระเงิน">
              <div className="tw"><table>
                <thead><tr>
                  <th style={TH}>ประเภทชำระเงิน</th>
                  <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th>
                  <th style={THR}>น้ำหนักกรัม (KG)</th>
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
                      <td style={TDR}>{p.w.toFixed(3)}</td>
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
                  <td style={TFR}>{totW.toFixed(3)}</td>
                  <td style={TFR}>{$(totNet)}</td>
                  <td style={{ ...TFR, color:'var(--pu)' }}>{$(totVat)}</td>
                  <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
                  <td style={TFR}>100.00%</td>
                </tr></tfoot>
              </table></div>
            </Card>
            <Card title="สัดส่วนการชำระเงิน">
              <div style={{ padding:'16px 14px' }}>
                {payTotal > 0 && (
                  <PieChart size={160} slices={payRows.map(p=>({ pct:p.total/payTotal, color:PAY_COLORS[p.pay]||'#999', label:PAY_LABELS[p.pay]||p.pay }))} />
                )}
                <div style={{ marginTop:16 }}>
                  {payRows.map(p=>(
                    <div key={p.pay} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--bd)' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ width:10, height:10, borderRadius:3, background:PAY_COLORS[p.pay]||'#999', flexShrink:0 }}></span>
                        <span style={{ fontSize:13, fontWeight:600 }}>{PAY_LABELS[p.pay]||p.pay}</span>
                      </div>
                      <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)' }}>{payTotal>0?(p.total/payTotal*100).toFixed(2)+'%':'—'}</span>
                    </div>
                  ))}
                </div>
              </div>
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
                {rows.sort((a,b)=>a.pay?.localeCompare(b.pay||'')).map((r,i)=>{
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
          </Card>
        </div>
      )}

      {/* ── TAB 5: % Discount ── */}
      {tab==='discount' && (
        <div>
          <FilterBar showSearch={false}
            onExport={()=>window.exportCSV('report_discount.csv',['วันที่','เลขที่บิล','รหัส','สินค้า','Gross Sale','ส่วนลด','ส่วนลด %','Net Sale','VAT','ยอดรวม'],discRows.map(r=>[r.date,r.inv,r.code,r.prod,r.grossSale,r.discount,r.grossSale>0?((r.discount/r.grossSale)*100).toFixed(2)+'%':'',r.netSale,r.vat.toFixed(2),r.total]))}
            onPdf={()=>window.exportPDF('รายงาน % Discount',['วันที่','เลขที่บิล','สินค้า','Gross Sale','ส่วนลด','ส่วนลด %','Net Sale'],discRows.map(r=>[r.date,r.inv,r.prod,r.grossSale,r.discount,r.grossSale>0?((r.discount/r.grossSale)*100).toFixed(2)+'%':'',r.netSale]),`${discRows.length} รายการ | ส่วนลดรวม ${$(totDisc)} | อัตราเฉลี่ย ${avgDiscPct.toFixed(2)}%`)}
          />
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
                  const invNos = [...new Set(dr.map(r=>r.inv))];
                  const dPct = d.gross>0?(d.disc/d.gross*100):0;
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={{ ...TD, fontWeight:600 }}>{d.date}</td>
                      <td style={TD}>{invNos.map(n=><span key={n} style={{ fontFamily:'var(--font-mono)', fontSize:11.5, color:'var(--ac)', display:'block' }}>{n}</span>)}</td>
                      <td style={{ ...TD, textAlign:'center' }}>{dr.length} บิล</td>
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
                {discRows.length===0 ? <tr><td colSpan="10" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>ไม่มีรายการที่มีส่วนลดในช่วงนี้</td></tr>
                : discRows.map((r,i)=>{
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
          </Card>
        </div>
      )}

      {/* ── TAB 6: รายลูกค้า ── */}
      {tab==='customer' && (
        <div>
          <FilterBar
            onExport={()=>window.exportCSV('report_customers.csv',['รหัส','ชื่อลูกค้า','ประเภท','จำนวนบิล','น้ำหนัก KG','ส่วนลด','ยอดรวม'],custRows.map(c=>[c.code,c.name,c.type,c.cnt,c.w.toFixed(3),c.disc,$(c.total)]))}
            onPdf={()=>window.exportPDF('รายงานยอดขายรายลูกค้า',['รหัส','ชื่อลูกค้า','ประเภท','จำนวนบิล','น้ำหนัก KG','ส่วนลด','ยอดรวม'],custRows.map(c=>[c.code,c.name,c.type,c.cnt,c.w.toFixed(3),c.disc,$(c.total)]),`${custRows.length} ราย | รวม ${billCount} บิล | ยอดรวม ${$(totTotal)}`)}
          />
          <Card title="ยอดขายรายลูกค้า">
            <div className="tw"><table>
              <thead><tr>
                <th style={TH}>รหัส</th><th style={TH}>ชื่อลูกค้า</th><th style={TH}>ประเภท</th>
                <th style={{ ...TH, textAlign:'center' }}>จำนวนบิล</th><th style={THR}>น้ำหนักรวม</th>
                <th style={THR}>ส่วนลดรวม</th><th style={THR}>ยอดรวมสุทธิ</th><th style={TH}></th>
              </tr></thead>
              <tbody>
                {custRows.length===0 ? <tr><td colSpan="8" style={{ padding:'24px', textAlign:'center', color:'var(--t3)' }}>ไม่พบข้อมูล</td></tr>
                : custRows.map((c,i)=>(
                  <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                    <td style={TD}><span className="mono" style={{ color:'var(--t2)' }}>{c.code}</span></td>
                    <td style={{ ...TD, fontWeight:600 }}>{c.name}</td>
                    <td style={TD}><Badge kind={c.type}/></td>
                    <td style={{ ...TD, textAlign:'center' }}>{c.cnt} บิล</td>
                    <td style={TDR}>{c.w.toFixed(3)} KG</td>
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
                <td style={TFR}>{totW.toFixed(3)} KG</td>
                <td style={{ ...TFR, color:'var(--am)' }}>-{$(totDisc)}</td>
                <td style={{ ...TFR, color:'var(--gn)' }}>{$(totTotal)}</td>
                <td style={TF}></td>
              </tr></tfoot>}
            </table></div>
          </Card>
        </div>
      )}

      {/* ── Customer detail modal ── */}
      {custModal && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setCustModal(null)}>
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
              <div style={{ fontSize:13, fontWeight:700, marginBottom:10 }}>ประวัติการซื้อ ({custModal.txns?.length||0} รายการ)</div>
              <div className="tw"><table>
                <thead><tr>
                  <th style={TH}>เลขที่กำกับ</th><th style={TH}>วันที่</th><th style={TH}>รายการ</th>
                  <th style={THR}>น้ำหนัก</th><th style={THR}>ส่วนลด</th><th style={THR}>ยอดรวม</th>
                  <th style={TH}>ช่าว</th>
                </tr></thead>
                <tbody>
                  {(custModal.txns||[]).map((r,i)=>(
                    <tr key={i} style={{ borderBottom:'1px solid var(--bd)' }}>
                      <td style={TD}><span style={{ fontFamily:'var(--font-mono)', fontSize:12, color:'var(--ac)' }}>{r.inv}</span></td>
                      <td style={TD}><span style={{ fontSize:12.5, color:'var(--t2)' }}>{r.date}</span></td>
                      <td style={{ ...TD, fontWeight:600, fontSize:12.5 }}>{r.prod}</td>
                      <td style={TDR}>{r.w.toFixed(3)} KG</td>
                      <td style={{ ...TDR, color:'var(--am)' }}>{r.discount>0?$(r.discount):'—'}</td>
                      <td style={{ ...TDR, fontWeight:800, color:'var(--gn)' }}>{$(r.total)}</td>
                      <td style={TD}><Badge kind={r.channel}/></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr>
                  <td colSpan="3" style={TF}>รวม {custModal.txns?.length||0} รายการ</td>
                  <td style={TFR}>{(custModal.txns||[]).reduce((s,r)=>s+r.w,0).toFixed(3)} KG</td>
                  <td style={{ ...TFR, color:'var(--am)' }}>{custModal.disc>0?$(custModal.disc):'—'}</td>
                  <td style={{ ...TFR, color:'var(--gn)' }}>{$(custModal.total)}</td>
                  <td style={TF}></td>
                </tr></tfoot>
              </table></div>
            </div>
            <div className="md-f">
              <Button variant="bg2" icon="download">Export</Button>
              <Button variant="bg2" onClick={()=>setCustModal(null)}>ปิด</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
window.Reports = Reports;
