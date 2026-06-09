/* StockPro UI Kit — Dashboard (period tabs + tweak-aware) */

const DASH_CSS = `
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes pulseRing {
    0%  { transform:scale(1);   opacity:.7; }
    70% { transform:scale(2.2); opacity:0; }
    100%{ transform:scale(1);   opacity:0; }
  }
  .dash-kpi {
    position:relative; overflow:hidden; border-radius:16px;
    padding:22px 24px 20px; cursor:default;
    transition:transform .2s ease, box-shadow .2s ease, opacity .5s ease;
  }
  .dash-kpi:hover { transform:translateY(-3px); }
  .dash-kpi-shimmer {
    position:absolute; top:0; left:-100%; width:60%; height:100%;
    background:linear-gradient(90deg,transparent 0%,rgba(255,255,255,.14) 50%,transparent 100%);
    animation: shimmer 2.8s ease-in-out infinite; pointer-events:none;
  }
  .dash-card {
    background:var(--sur); border:1px solid var(--bd);
    border-radius:16px; overflow:hidden;
    box-shadow:0 2px 12px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    transition: opacity .45s ease, transform .45s ease;
  }
  .dash-card-h {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px 12px; border-bottom:1px solid var(--bd);
  }
  .dash-card-t { font-size:13px; font-weight:700; color:var(--t2); letter-spacing:.01em; }
  .bar-seg { border-radius:6px 6px 0 0; transition:height .9s cubic-bezier(.34,1.4,.64,1); cursor:pointer; }
  .bar-seg:hover { filter:brightness(1.12); }
  .period-tab {
    padding:4px 11px; border-radius:100px; font-size:11.5px; font-weight:700;
    cursor:pointer; border:none; transition:all .15s; background:transparent; color:var(--t3);
    font-family:inherit;
  }
  .period-tab.active { background:var(--ac); color:#fff; box-shadow:0 2px 8px rgba(59,91,219,.3); }
  .period-tab:not(.active):hover { background:var(--s2); color:var(--t2); }
  .tbl-row { transition:background .13s; }
  .tbl-row:hover td { background:rgba(59,91,219,.04); }
  .live-dot { width:7px;height:7px;border-radius:50%;background:var(--gn);position:relative;flex-shrink:0; }
  .live-dot::after { content:'';position:absolute;inset:-2px;border-radius:50%;background:var(--gn);animation:pulseRing 1.8s ease-out infinite; }
  .stock-bar { height:5px;border-radius:100px;overflow:hidden;background:var(--s2);margin-top:6px; }
  .stock-bar-fill { height:100%;border-radius:100px;transition:width 1s cubic-bezier(.22,1,.36,1); }
  .seg-arc { transition:stroke-dasharray 1.2s cubic-bezier(.22,1,.36,1); }
  .channel-row {
    display:flex;align-items:center;justify-content:space-between;
    padding:8px 0;border-bottom:1px solid var(--bd);transition:background .13s;cursor:default;
  }
  .channel-row:last-child { border:none; }
  .channel-row:hover { background:var(--s2);margin:0 -16px;padding:8px 16px;border-radius:8px; }
`;

const PERIODS = [
  { id:'7d',  label:'7 วัน' },
  { id:'1m',  label:'1 เดือน' },
  { id:'3m',  label:'3 เดือน' },
  { id:'6m',  label:'6 เดือน' },
  { id:'1y',  label:'1 ปี' },
];

function useCountUp(target, duration, started) {
  const [val, setVal] = React.useState(0);
  React.useEffect(() => {
    if (!started) return;
    let s = null, raf;
    const step = ts => {
      if (!s) s = ts;
      const p = Math.min((ts - s) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * e));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, started]);
  return val;
}

/* KPI Card — three styles via window.SP_TWEAKS.kpiStyle */
function KpiCard({ label, rawValue, displayFn, sub, gradient, solidColor, icon, delay, started }) {
  const v = useCountUp(rawValue, 1300, started);
  const style = (window.SP_TWEAKS || {}).kpiStyle || 'gradient';

  if (style === 'minimal') {
    return (
      <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderTop:`3px solid ${solidColor}`, borderRadius:16, padding:'18px 20px', opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ width:28, height:28, borderRadius:8, background:`${solidColor}18`, display:'flex', alignItems:'center', justifyContent:'center', color:solidColor }}><Icon name={icon} size={14} /></span>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--t2)', textTransform:'uppercase', letterSpacing:'.06em' }}>{label}</span>
        </div>
        <div style={{ fontSize:28, fontWeight:800, color:solidColor, letterSpacing:'-.6px', lineHeight:1 }}>{displayFn(v)}</div>
        <div style={{ marginTop:8, fontSize:12, color:'var(--t3)' }}>{sub}</div>
      </div>
    );
  }

  if (style === 'glass') {
    return (
      <div style={{ background:'rgba(255,255,255,.07)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:16, padding:'22px 24px 20px', opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s`, boxShadow:`0 8px 32px ${solidColor}33` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</span>
          <span style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={15} style={{ color:'rgba(255,255,255,.9)' }} /></span>
        </div>
        <div style={{ fontSize:30, fontWeight:800, backgroundImage:`linear-gradient(135deg, #fff 30%, ${solidColor})`, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-.8px', lineHeight:1 }}>{displayFn(v)}</div>
        <div style={{ marginTop:8, fontSize:12, color:'rgba(255,255,255,.5)' }}>{sub}</div>
      </div>
    );
  }

  // Default: gradient
  return (
    <div className="dash-kpi" style={{ background:gradient, boxShadow:`0 8px 32px ${solidColor}44`, opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
      <div className="dash-kpi-shimmer"></div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <span style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,.75)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</span>
        <span style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={15} style={{ color:'#fff' }} /></span>
      </div>
      <div style={{ fontSize:30, fontWeight:800, color:'#fff', letterSpacing:'-.8px', lineHeight:1 }}>{displayFn(v)}</div>
      <div style={{ marginTop:8, fontSize:12, color:'rgba(255,255,255,.7)' }}>{sub}</div>
    </div>
  );
}

/* ── Dashboard ── */
function Dashboard({ setPage }) {
  const D = window.SP_DATA;
  const S = D.sales;
  const [mounted, setMounted] = React.useState(false);
  const [period, setPeriod] = React.useState('7d');
  React.useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  /* Inject styles once */
  React.useEffect(() => {
    const id = 'dash-inject';
    if (document.getElementById(id)) return;
    const el = document.createElement('style'); el.id = id; el.textContent = DASH_CSS;
    document.head.appendChild(el);
  }, []);

  const lowStock = D.products.filter(p => p.stock < p.min);
  const stockValue = D.products.reduce((s, p) => s + p.stock * p.cost, 0);
  const stockHealth = D.products.slice().sort((a, b) => (a.stock / a.min) - (b.stock / b.min)).slice(0, 4);
  const k = n => '฿' + Math.round(n).toLocaleString('en-US');
  const channelTotal = D.salesByChannel.reduce((s, c) => s + c.value, 0);
  const monthPct = Math.round((S.month / S.monthTarget) * 100);

  /* Period chart data */
  const pd = D.revenue[period];
  const maxRev = Math.max(...pd.values);
  const totalRev = pd.values.reduce((a, b) => a + b, 0);
  const showBarLabels = pd.values.length <= 12;
  const showTopLabels = pd.values.length <= 12;
  /* For 30-bar (1m), show every 5th x-label */
  const xLabel = (i) => {
    if (pd.values.length <= 12) return pd.labels[i];
    return (i % 5 === 0 || i === pd.values.length - 1) ? pd.labels[i] : '';
  };

  /* Donut */
  const R = 46, CIRC = 2 * Math.PI * R;
  let acc = 0;
  const TONE_COLOR = { ac:'#3b5bdb', pu:'#6741d9', gn:'#0d9272', am:'#c47b00' };
  const donutSegs = D.salesByChannel.map(c => {
    const frac = c.value / channelTotal;
    const segLen = frac * CIRC;
    const offset = -(acc); acc += segLen;
    return { ...c, segLen, offset };
  });

  return (
    <div>
      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard label="ยอดขายวันนี้"   rawValue={S.today}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={`▲ ${S.todayDelta}% จากเมื่อวาน`}      gradient="linear-gradient(135deg,#0d9272,#10b894)" solidColor="#0d9272" icon="coin"       delay={.05} started={mounted} />
        <KpiCard label="ยอดขายเดือนนี้" rawValue={S.month}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={`${monthPct}% ของเป้า ${k(S.monthTarget)}`} gradient="linear-gradient(135deg,#3b5bdb,#5b7cff)" solidColor="#3b5bdb" icon="bar-chart"  delay={.12} started={mounted} />
        <KpiCard label="บิลวันนี้"       rawValue={S.bills}  displayFn={v=>v+' บิล'}                       sub={`เฉลี่ย ${k(S.avgPerBill)} / บิล`}          gradient="linear-gradient(135deg,#c47b00,#e09b20)" solidColor="#c47b00" icon="file-text"  delay={.19} started={mounted} />
      </div>

      {/* Revenue chart + Donut */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>

        {/* Revenue chart with period tabs */}
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.22s' }}>
          <div className="dash-card-h">
            <div>
              <div className="dash-card-t">ยอดขาย</div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>รวม {(totalRev/1000).toFixed(0)}k ฿ · {pd.unit}</div>
            </div>
            {/* Period tabs */}
            <div style={{ display:'flex', gap:3 }}>
              {PERIODS.map(p => (
                <button key={p.id} className={'period-tab' + (period===p.id?' active':'')} onClick={() => { setPeriod(p.id); }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'20px 20px 14px' }}>
            <div style={{ position:'relative', height:160 }}>
              {[100,75,50,25,0].map(p => (
                <div key={p} style={{ position:'absolute', left:0, right:0, top:`${100-p}%`, borderTop:'1px dashed rgba(0,0,0,.06)', display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:9.5, color:'var(--t3)', marginTop:-7, marginLeft:2, minWidth:34 }}>
                    {maxRev * p / 100 >= 1000 ? Math.round(maxRev * p / 100 / 1000) + 'k' : Math.round(maxRev * p / 100)}
                  </span>
                </div>
              ))}
              <div style={{ position:'absolute', inset:'0 0 0 38px', display:'flex', alignItems:'flex-end', gap: pd.values.length > 20 ? 2 : 6 }}>
                {pd.values.map((v, i) => (
                  <div key={period+i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', minWidth:0 }}>
                    {showTopLabels && (
                      <div style={{ fontSize:9, fontWeight:700, color:'var(--t2)', marginBottom:3, opacity:mounted?1:0, transition:`opacity .4s ${(0.1+i*.04).toFixed(2)}s`, whiteSpace:'nowrap' }}>
                        {v >= 1000 ? Math.round(v/1000)+'k' : v}
                      </div>
                    )}
                    <div className="bar-seg" style={{
                      width:'100%',
                      height: mounted ? `${Math.round((v/maxRev)*100)}%` : '2px',
                      transitionDelay: `${(0.08 + i * Math.min(0.06, 2/pd.values.length)).toFixed(2)}s`,
                      background: i === pd.values.length-1
                        ? 'linear-gradient(180deg,#0d9272,#10b894)'
                        : 'linear-gradient(180deg,var(--ac),#5b7cff)',
                      boxShadow: i===pd.values.length-1 ? '0 4px 14px rgba(13,146,114,.3)' : 'none',
                    }} title={`${pd.labels[i]}: ฿${v.toLocaleString('en-US')}`}></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex', gap: pd.values.length > 20 ? 0 : 6, paddingLeft:38, marginTop:8 }}>
              {pd.values.map((_, i) => (
                <div key={i} style={{ flex:1, textAlign:'center', fontSize:9.5, color:'var(--t3)', fontWeight:600, minWidth:0, overflow:'hidden', whiteSpace:'nowrap' }}>{xLabel(i)}</div>
              ))}
            </div>
          </div>
          <div style={{ padding:'8px 20px 14px', borderTop:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', fontSize:11.5 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, color:'var(--gn)', fontWeight:600 }}><span className="live-dot"></span>อัปเดตสด</span>
            <span style={{ color:'var(--t3)' }}>สูงสุด ฿{maxRev.toLocaleString('en-US')} / {pd.unit}</span>
          </div>
        </div>

        {/* Donut: sales by channel */}
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.30s' }}>
          <div className="dash-card-h"><div className="dash-card-t">ยอดขายตามช่องทาง</div></div>
          <div style={{ padding:'16px' }}>
            <div style={{ position:'relative', width:140, height:140, margin:'0 auto 16px' }}>
              <svg width="140" height="140" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--s2)" strokeWidth="16" />
                <g transform="rotate(-90 60 60)">
                  {donutSegs.map((s, i) => (
                    <circle key={i} cx="60" cy="60" r={R} fill="none"
                      stroke={TONE_COLOR[s.tone]||'#ccc'} strokeWidth="16" strokeLinecap="butt"
                      strokeDasharray={mounted ? `${s.segLen-2} ${CIRC-(s.segLen-2)}` : `0 ${CIRC}`}
                      strokeDashoffset={-s.offset} className="seg-arc"
                      style={{ transitionDelay:`${(0.35+i*0.12).toFixed(2)}s` }} />
                  ))}
                </g>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em' }}>รวม</div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.5px', marginTop:1 }}>{(channelTotal/1000).toFixed(0)}k</div>
              </div>
            </div>
            {D.salesByChannel.map(c => (
              <div key={c.id} className="channel-row">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:10, height:10, borderRadius:3, background:TONE_COLOR[c.tone], flexShrink:0 }}></span>
                  <div><div style={{ fontSize:13, fontWeight:600 }}>{c.label}</div><div style={{ fontSize:10.5, color:'var(--t3)' }}>{c.en}</div></div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:700 }}>{k(c.value)}</div>
                  <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>{Math.round((c.value/channelTotal)*100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top sellers + Stock health */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.36s' }}>
          <div className="dash-card-h"><div className="dash-card-t">สินค้าขายดีเดือนนี้</div><span style={{ fontSize:11, color:'var(--t3)' }}>เรียงตามยอดขาย ฿</span></div>
          <div style={{ padding:'14px 20px' }}>
            {D.topSellers.slice().sort((a,b)=>b.revenue-a.revenue).map((s, i) => {
              const topRev = Math.max(...D.topSellers.map(x=>x.revenue));
              const colors = ['var(--gn)','var(--ac)','var(--pu)','var(--am)'];
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:22, height:22, borderRadius:7, background:i===0?'linear-gradient(135deg,#f6c90e,#e4a200)':'var(--s2)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:i===0?'#fff':'var(--t2)', flexShrink:0 }}>{i+1}</span>
                      <span style={{ fontSize:13, fontWeight:600 }}>{s.name}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <span style={{ fontSize:13, fontWeight:800, color:'var(--gn)' }}>{k(s.revenue)}</span>
                      <span style={{ fontSize:11, color:'var(--t3)', marginLeft:6 }}>{s.kg} KG</span>
                    </div>
                  </div>
                  <div className="stock-bar">
                    <div className="stock-bar-fill" style={{ width:mounted?`${(s.revenue/topRev)*100}%`:'0%', background:colors[i], transitionDelay:`${(0.5+i*0.1).toFixed(1)}s` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.42s' }}>
          <div className="dash-card-h">
            <div className="dash-card-t">สุขภาพสต็อก · Top 4</div>
            <button onClick={() => setPage('stock-manage')} style={{ fontSize:12, fontWeight:600, color:'var(--ac)', background:'var(--abg)', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>ดูทั้งหมด →</button>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:14 }}>
              <div style={{ background:'linear-gradient(135deg,var(--gbg),#e0f5ee)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'var(--gt)', textTransform:'uppercase', letterSpacing:'.05em' }}>มูลค่าสต็อก</div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--gt)', marginTop:3, letterSpacing:'-.4px' }}>{(stockValue/1000).toFixed(0)}k</div>
              </div>
              <div style={{ background:'linear-gradient(135deg,var(--ambg),#fff8e0)', borderRadius:10, padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'var(--amt)', textTransform:'uppercase', letterSpacing:'.05em' }}>ใกล้หมด</div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--amt)', marginTop:3 }}>{lowStock.length} รายการ</div>
              </div>
            </div>
            {stockHealth.map((p, i) => {
              const ratio = p.stock / p.min;
              const pct = Math.min(ratio*100, 100);
              const color = p.stock<=0?'var(--rd)':ratio<1?'var(--am)':'var(--gn)';
              return (
                <div key={p.id} style={{ paddingBottom:10, marginBottom:i<3?10:0, borderBottom:i<3?'1px solid var(--bd)':'none' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                      <div style={{ fontFamily:'var(--font-mono)', fontSize:11, color:'var(--t3)', marginTop:1 }}>{p.code}</div>
                    </div>
                    <StockPill stock={p.stock} min={p.min} />
                  </div>
                  <div className="stock-bar">
                    <div className="stock-bar-fill" style={{ width:mounted?pct+'%':'0%', background:color, transitionDelay:`${(0.6+i*0.1).toFixed(1)}s` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent sales */}
      <div className="dash-card" style={{ marginBottom:2, opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.48s' }}>
        <div className="dash-card-h">
          <div><div className="dash-card-t">รายการขายล่าสุด</div><div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{D.recentIssues.length} รายการ</div></div>
          <button onClick={() => setPage('stock-out')} style={{ fontSize:12.5, fontWeight:700, color:'#fff', background:'var(--ac)', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', boxShadow:'0 3px 10px rgba(59,91,219,.3)', transition:'all .15s' }}>+ ขายใหม่</button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--s2)' }}>
                {['เลขที่','วันที่','ช่องทาง','รหัส','สินค้า','น้ำหนัก','มูลค่า','ใบกำกับ'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:11.5, fontWeight:700, color:'var(--t2)', borderBottom:'1px solid var(--bd)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {D.recentIssues.map(r => (
                <tr key={r.id} className="tbl-row" style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{r.id}</td>
                  <td style={{ padding:'11px 14px', fontSize:12.5, color:'var(--t2)' }}>{r.date}</td>
                  <td style={{ padding:'11px 14px' }}><Badge kind={r.type} /></td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)' }}>{r.code}</td>
                  <td style={{ padding:'11px 14px', fontWeight:600 }}>{r.prod}</td>
                  <td style={{ padding:'11px 14px' }}>{r.w.toFixed(1)} KG</td>
                  <td style={{ padding:'11px 14px', fontWeight:800, color:r.val?'var(--gn)':'var(--t3)' }}>{r.val?window.fmtMoney(r.val):'—'}</td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{r.inv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
