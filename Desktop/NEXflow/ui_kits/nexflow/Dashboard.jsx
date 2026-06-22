/* NEXflow UI Kit — Dashboard (period tabs + tweak-aware) */

const DASH_CSS = `
  @keyframes popIn { 0%{ transform:translateY(7px) scale(.8); opacity:0; } 100%{ transform:translateY(0) scale(1); opacity:1; } }
  @keyframes pulseRing {
    0%  { transform:scale(1);   opacity:.7; }
    70% { transform:scale(2.2); opacity:0; }
    100%{ transform:scale(1);   opacity:0; }
  }
  .bar-value {
    font-size:10px; font-weight:800; padding:3px 8px; border-radius:100px;
    background:var(--sur); border:1px solid var(--bd); color:var(--tx);
    white-space:nowrap; box-shadow:0 2px 8px rgba(0,0,0,.08);
    animation: popIn .5s cubic-bezier(.25,1,.5,1) both;
  }
  .bar-value.top { background:linear-gradient(135deg,#0d9272,#10b894); color:#fff; border-color:transparent; }
  .bar-seg {
    transform-origin:bottom center; border-radius:6px 6px 0 0;
    transition:height .9s cubic-bezier(.25,1,.5,1); cursor:pointer;
  }
  .bar-seg:hover { filter:brightness(1.12) saturate(1.05); }
  .dash-kpi {
    position:relative; overflow:hidden; border-radius:var(--r-lg);
    padding:22px 24px 20px; cursor:default;
    transition:box-shadow .2s ease, opacity .5s ease;
  }
  .dash-card {
    background:var(--sur); border:1px solid var(--bd);
    border-radius:var(--r-lg); overflow:hidden; will-change:transform;
    box-shadow:0 2px 12px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
    transition: opacity .45s ease, transform .45s ease;
  }
  .dash-card:hover { box-shadow:0 12px 32px rgba(0,0,0,.10), 0 2px 6px rgba(0,0,0,.05); }
  .dash-card-h {
    display:flex; align-items:center; justify-content:space-between;
    padding:14px 20px 12px; border-bottom:1px solid var(--bd);
  }
  .dash-card-t { font-size:13px; font-weight:700; color:var(--t2); letter-spacing:.01em; }
  .period-tab {
    padding:4px 11px; border-radius:100px; font-size:11.5px; font-weight:700;
    cursor:pointer; border:none; transition:all .15s; background:transparent; color:var(--t2);
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
  .rev-tooltip {
    position:absolute; pointer-events:none; z-index:20;
    background:rgba(10,10,20,.88); backdrop-filter:blur(14px);
    color:#fff; border-radius:var(--rs); padding:8px 13px;
    white-space:nowrap; box-shadow:0 4px 22px rgba(0,0,0,.3);
    border:1px solid rgba(255,255,255,.12); transform:translateX(-50%);
  }
  @media (prefers-reduced-motion: reduce) {
    .dash-kpi, .dash-card, .bar-seg, .stock-bar-fill, .seg-arc,
    .bar-value, .live-dot::after { animation: none !important; transition: none !important; }
  }
`;

const PERIODS = [
  { id:'7d',  label:'period_7d' },
  { id:'1m',  label:'period_1m' },
  { id:'3m',  label:'period_3m' },
  { id:'6m',  label:'period_6m' },
  { id:'1y',  label:'period_1y' },
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
      <div style={{ background:'var(--sur)', border:'1px solid var(--bd)', borderTop:`3px solid ${solidColor}`, borderRadius:'var(--r-lg)', padding:'18px 20px', opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
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
      <div style={{ background:'rgba(255,255,255,.07)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:'var(--r-lg)', padding:'22px 24px 20px', opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s`, boxShadow:`0 8px 32px ${solidColor}33` }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
          <span style={{ fontSize:11.5, fontWeight:700, color:'rgba(255,255,255,.6)', textTransform:'uppercase', letterSpacing:'.08em' }}>{label}</span>
          <span style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,.15)', display:'flex', alignItems:'center', justifyContent:'center' }}><Icon name={icon} size={15} style={{ color:'rgba(255,255,255,.9)' }} /></span>
        </div>
        <div style={{ fontSize:30, fontWeight:800, color:'#fff', letterSpacing:'-.8px', lineHeight:1 }}>{displayFn(v)}</div>
        <div style={{ marginTop:8, fontSize:12, color:'rgba(255,255,255,.5)' }}>{sub}</div>
      </div>
    );
  }

  // Default: gradient
  return (
    <div className="dash-kpi" style={{ background:gradient, boxShadow:`0 8px 32px ${solidColor}44`, opacity:started?1:0, transform:started?'translateY(0)':'translateY(20px)', transition:`opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
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
  const [lang, t] = useLang();
  const [dataVer, setDataVer] = React.useState(window.SP_DASH_VERSION || 0);
  React.useEffect(() => {
    /* build ครั้งแรกเมื่อ mount เท่านั้น */
    if (window.SP_API && typeof window.SP_API.rebuildDashboard === 'function') {
      window.SP_API.rebuildDashboard();
    }
    const onUpdate = () => setDataVer(v => v + 1);
    window.addEventListener('sp:data-updated', onUpdate);
    return () => window.removeEventListener('sp:data-updated', onUpdate);
  }, []);

  const D = window.SP_DATA;
  const S = D.sales;
  const SS = D.stockStats || {};
  const [mounted, setMounted] = React.useState(false);
  const [period, setPeriod] = React.useState('7d');
  const [hovBar, setHovBar] = React.useState(null);
  const recentPag = usePagination(D.recentIssues, 25);
  React.useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  /* Inject styles once */
  React.useEffect(() => {
    const id = 'dash-inject';
    if (document.getElementById(id)) return;
    const el = document.createElement('style'); el.id = id; el.textContent = DASH_CSS;
    document.head.appendChild(el);
  }, []);

  const outOfStock = D.products.filter(p => p.stock <= 0);
  const lowStock   = D.products.filter(p => p.stock > 0 && p.stock < p.min);
  const criticals  = D.products.filter(p => p.stock <= p.min); // รวมทั้งหมด
  const stockValue = D.products.reduce((s, p) => s + p.stock * p.cost, 0);
  const stockHealth = D.products.slice().sort((a, b) => (a.stock / a.min) - (b.stock / b.min)).slice(0, 4);
  const k = n => '฿' + Math.round(n).toLocaleString('en-US');
  const channelTotal = D.salesByChannel.reduce((s, c) => s + c.value, 0);
  const hasChannelData = channelTotal > 0;
  const channelDivisor = channelTotal || 1;
  const monthPct = Math.round((S.month / (S.monthTarget || 1)) * 100);

  /* Period chart data */
  const pd = D.revenue[period];
  const maxRev = Math.max(...pd.values);
  const totalRev = pd.values.reduce((a, b) => a + b, 0);
  const showBarLabels = pd.values.length <= 12;
  const showTopLabels = pd.values.length <= 12;
  /* For 30-bar (1m), show every 5th x-label */
  const xLabel = (i) => {
    const n = pd.values.length;
    if (n <= 14) return pd.labels[i];
    if (n <= 31) return (i % 5 === 0 || i === n - 1) ? pd.labels[i] : '';
    return (i % 4 === 0 || i === n - 1) ? pd.labels[i] : '';
  };

  /* Donut */
  const R = 46, CIRC = 2 * Math.PI * R;
  let acc = 0;
  const TONE_COLOR = { ac:'#3b5bdb', pu:'#6741d9', gn:'#0d9272', am:'#c47b00' };
  /* Monochromatic indigo palette for channel breakdown */
  const CHANNEL_PALETTE = ['#3b5bdb', '#5876e8', '#7592ee', '#92adf4', '#afc8fa'];
  const donutSegs = D.salesByChannel.map((c, i) => {
    const frac = hasChannelData ? (c.value / channelDivisor) : 0;
    const segLen = frac * CIRC;
    const offset = -(acc); acc += segLen;
    return { ...c, segLen, offset, color: CHANNEL_PALETTE[i % CHANNEL_PALETTE.length] };
  });

  return (
    <div>
      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        <KpiCard label={t('kpi_today_sales')}   rawValue={S.today}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={t('kpi_today_sales_sub',{pct:S.todayDelta})}      gradient="linear-gradient(135deg,#0d9272,#10b894)" solidColor="#0d9272" icon="coin"       delay={.05} started={mounted} />
        <KpiCard label={t('kpi_month_sales')} rawValue={S.month}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={t('kpi_month_sales_sub',{pct:monthPct,target:k(S.monthTarget)})} gradient="linear-gradient(135deg,#3b5bdb,#5b7cff)" solidColor="#3b5bdb" icon="bar-chart"  delay={.12} started={mounted} />
        <KpiCard label={t('kpi_bills_today')}       rawValue={S.bills}  displayFn={v=>v+' '+t('kpi_bills_unit')}                       sub={t('kpi_bills_sub',{avg:k(S.avgPerBill)})}          gradient="linear-gradient(135deg,#c47b00,#e09b20)" solidColor="#c47b00" icon="file-text"  delay={.19} started={mounted} />
      </div>

      {/* ── Stock Management Stats Row ─────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16, opacity:mounted?1:0, transition:'opacity .5s ease .22s' }}>
        <div className="dash-card" style={{ padding:'14px 18px' }}>
          <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="warehouse" size={13} style={{ color:'var(--ac)' }}/> {t('kpi_grn_month')}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--ac)' }}>{SS.grnCount||0} <span style={{ fontSize:12, fontWeight:600 }}>{t('kpi_grn_unit')}</span></div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{(SS.grnWeight||0).toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})} KG · {k(SS.grnValue||0)}</div>
        </div>
        <div className="dash-card" style={{ padding:'14px 18px' }}>
          <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="package" size={13} style={{ color:'var(--gn)' }}/> {t('kpi_stock_value')}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--gn)' }}>{k(stockValue)}</div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{t('kpi_stock_value_sub',{n:D.products.length})}</div>
        </div>
        <div className="dash-card" style={{ padding:'14px 18px' }}>
          <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="settings" size={13} style={{ color:'var(--am)' }}/> {t('kpi_adj_month')}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color:'var(--am)' }}>{SS.adjCount||0} <span style={{ fontSize:12, fontWeight:600 }}>{t('kpi_adj_unit')}</span></div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>ADJ documents</div>
        </div>
        <div className="dash-card" style={{ padding:'14px 18px' }}>
          <div style={{ fontSize:11, color:'var(--t2)', fontWeight:600, marginBottom:5, display:'flex', alignItems:'center', gap:5 }}>
            <Icon name="x-circle" size={13} style={{ color: (outOfStock.length>0)?'var(--rd)':'var(--am)' }}/> {t('kpi_stock_status')}
          </div>
          <div style={{ fontSize:20, fontWeight:800, color: (outOfStock.length+lowStock.length)>0?'var(--rd)':'var(--gn)' }}>
            {outOfStock.length>0 ? t('kpi_stock_status_out',{n:outOfStock.length}) : lowStock.length>0 ? t('kpi_stock_status_low',{n:lowStock.length}) : t('kpi_stock_status_ok')}
          </div>
          <div style={{ fontSize:11, color:'var(--t3)', marginTop:3 }}>{t('kpi_items_to_order',{n:criticals.length})}</div>
        </div>
      </div>

      {/* ── Stock Alert Banner ─────────────────────────────── */}
      {criticals.length > 0 && (
        <div style={{ marginBottom:16, borderRadius:12, overflow:'hidden', border: outOfStock.length > 0 ? '1.5px solid rgba(208,48,48,.25)' : '1.5px solid rgba(196,123,0,.25)', background: outOfStock.length > 0 ? 'var(--rbg)' : 'var(--ambg)', opacity:mounted?1:0, transition:'opacity .5s ease .1s' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom: outOfStock.length > 0 ? '1px solid rgba(208,48,48,.15)' : '1px solid rgba(196,123,0,.15)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:16 }}>{outOfStock.length > 0 ? '🔴' : '🟡'}</span>
              <span style={{ fontWeight:700, fontSize:13, color: outOfStock.length > 0 ? 'var(--rd)' : 'var(--am)' }}>
                {outOfStock.length > 0
                  ? t('alert_out_low',{out:outOfStock.length, low:lowStock.length})
                  : t('alert_low_only',{low:lowStock.length})}
              </span>
            </div>
            <button onClick={() => setPage('stock-in')}
              style={{ fontSize:12, fontWeight:700, color:'#fff', background: outOfStock.length > 0 ? 'var(--rd)' : 'var(--am)', border:'none', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontFamily:'inherit' }}>
              {t('btn_receive_stock')}
            </button>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:8, padding:'10px 16px' }}>
            {criticals.slice(0, 6).map(p => (
              <div key={p.id} style={{ display:'flex', alignItems:'center', gap:7, background:'rgba(255,255,255,.6)', borderRadius:8, padding:'6px 11px', border: p.stock <= 0 ? '1px solid rgba(208,48,48,.3)' : '1px solid rgba(196,123,0,.2)' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background: p.stock <= 0 ? 'var(--rd)' : 'var(--am)', flexShrink:0 }}></span>
                <div>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--tx)' }}>{p.name}</div>
                  <div style={{ fontSize:11, color: p.stock <= 0 ? 'var(--rd)' : 'var(--am)', fontWeight:600, fontFamily:'var(--font-mono)' }}>
                    {p.stock <= 0 ? t('alert_out') : `${Number(p.stock).toFixed(1)} / ${p.min} KG`}
                  </div>
                </div>
              </div>
            ))}
            {criticals.length > 6 && (
              <div style={{ display:'flex', alignItems:'center', fontSize:12, color:'var(--t2)', fontWeight:600 }}>
                {t('alert_more',{n:criticals.length - 6})}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Revenue chart + Donut */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>

        {/* Revenue chart with period tabs */}
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.22s' }}>
          <div className="dash-card-h">
            <div>
              <div className="dash-card-t">{t('revenue_title')}</div>
              <div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{t('revenue_sub',{total:(totalRev/1000).toFixed(0), unit:pd.unit})}</div>
            </div>
            {/* Period tabs */}
            <div style={{ display:'flex', gap:3 }}>
              {PERIODS.map(p => (
                <button key={p.id} className={'period-tab' + (period===p.id?' active':'')} onClick={() => { setPeriod(p.id); setHovBar(null); }}>
                  {t(p.label)}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding:'16px 20px 14px' }}>
            <div style={{ position:'relative', height:184 }}>
              {/* Hover tooltip */}
              {hovBar !== null && (
                <div className="rev-tooltip" style={{
                  top: 4,
                  left: `calc(38px + ${((hovBar + 0.5) / pd.values.length).toFixed(4)} * (100% - 38px))`,
                }}>
                  <div style={{ fontSize:9.5, color:'rgba(255,255,255,.6)', marginBottom:2 }}>{pd.labels[hovBar]}</div>
                  <div style={{ fontSize:13 }}>฿{pd.values[hovBar].toLocaleString('en-US')}</div>
                </div>
              )}
              {/* Y-axis gridlines */}
              {[100,75,50,25,0].map(p => (
                <div key={p} style={{ position:'absolute', left:0, right:0, top:`${100-p}%`, borderTop:'1px dashed rgba(0,0,0,.06)', display:'flex', alignItems:'center' }}>
                  <span style={{ fontSize:9.5, color:'var(--t3)', marginTop:-7, marginLeft:2, minWidth:34 }}>
                    {maxRev * p / 100 >= 1000 ? Math.round(maxRev * p / 100 / 1000) + 'k' : Math.round(maxRev * p / 100)}
                  </span>
                </div>
              ))}
              {/* Bar columns */}
              <div style={{ position:'absolute', inset:'0 0 0 38px', display:'flex', alignItems:'flex-end', gap: pd.values.length > 20 ? 2 : 6 }}>
                {pd.values.map((v, i) => {
                  const pct = maxRev > 0 ? Math.round((v / maxRev) * 100) : 0;
                  const isLast = i === pd.values.length - 1;
                  const isHov  = hovBar === i;
                  return (
                    <div key={period+i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', height:'100%', minWidth:0 }}
                      onMouseEnter={() => setHovBar(i)}
                      onMouseLeave={() => setHovBar(null)}
                    >
                      <div className={'bar-seg' + (isLast ? ' top-bar' : '')} style={{
                        width:'100%',
                        height: mounted ? (v > 0 ? `${Math.max(5, pct)}%` : '0%') : '2px',
                        transitionDelay: `${(0.08 + i * Math.min(0.06, 2/pd.values.length)).toFixed(2)}s`,
                        background: isLast
                          ? 'linear-gradient(180deg,#0d9272,#10b894)'
                          : isHov
                            ? 'linear-gradient(180deg,#7b9cff,#2b4fd4)'
                            : 'linear-gradient(180deg,var(--ac),#5b7cff)',
                        boxShadow: isHov
                          ? '0 4px 18px rgba(59,91,219,.45)'
                          : isLast ? '0 4px 14px rgba(13,146,114,.3)' : 'none',
                      }}></div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* X-axis labels */}
            <div style={{ display:'flex', gap: pd.values.length > 20 ? 0 : 6, paddingLeft:38, marginTop:8 }}>
              {pd.values.map((_, i) => (
                <div key={i} style={{ flex:1, textAlign:'center', fontSize:9.5, color: hovBar===i ? 'var(--ac)' : 'var(--t3)', fontWeight: hovBar===i ? 700 : 600, minWidth:0, overflow:'hidden', whiteSpace:'nowrap', transition:'color .12s' }}>{xLabel(i)}</div>
              ))}
            </div>
          </div>
          <div style={{ padding:'8px 20px 14px', borderTop:'1px solid var(--bd)', display:'flex', justifyContent:'space-between', fontSize:11.5 }}>
            <span style={{ display:'flex', alignItems:'center', gap:6, color:'var(--gn)', fontWeight:600 }}><span className="live-dot"></span>{t('live_update')}</span>
            <span style={{ color:'var(--t3)' }}>{t('revenue_max',{max:maxRev.toLocaleString('en-US'), unit:pd.unit})}</span>
          </div>
        </div>

        {/* Donut: sales by channel */}
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.30s' }}>
          <div className="dash-card-h"><div className="dash-card-t">{t('channel_title')}</div></div>
          <div style={{ padding:'16px' }}>
            <div style={{ position:'relative', width:140, height:140, margin:'0 auto 16px' }}>
              <svg width="140" height="140" viewBox="0 0 120 120" className="donut-ring">
                <circle cx="60" cy="60" r={R} fill="none" stroke="var(--s2)" strokeWidth="16" />
                <g transform="rotate(-90 60 60)">
                  {donutSegs.map((s, i) => (
                    <circle key={i} cx="60" cy="60" r={R} fill="none"
                      stroke={s.color} strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={mounted ? `${s.segLen-2} ${CIRC-(s.segLen-2)}` : `0 ${CIRC}`}
                      strokeDashoffset={-s.offset} className="seg-arc"
                      style={{ transitionDelay:`${(0.35+i*0.12).toFixed(2)}s`, filter:`drop-shadow(0 2px 4px ${s.color}55)` }} />
                  ))}
                </g>
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:10, color:'var(--t3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.05em' }}>{t('channel_total')}</div>
                <div style={{ fontSize:16, fontWeight:800, letterSpacing:'-.5px', marginTop:1 }}>{(channelTotal/1000).toFixed(0)}k</div>
              </div>
            </div>
            {D.salesByChannel.map((c, i) => {
              const cColor = CHANNEL_PALETTE[i % CHANNEL_PALETTE.length];
              return (
              <div key={c.id} className="channel-row">
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ width:11, height:11, borderRadius:4, background:cColor, flexShrink:0, boxShadow:`0 0 0 4px ${cColor}22` }}></span>
                  <div><div style={{ fontSize:13, fontWeight:600 }}>{c.label}</div><div style={{ fontSize:10.5, color:'var(--t3)' }}>{c.en}</div></div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:13, fontWeight:800, color:cColor }}>{k(c.value)}</div>
                  <div style={{ fontSize:10.5, color:'var(--t3)', marginTop:1 }}>{hasChannelData ? Math.round((c.value/channelDivisor)*100) : 0}%</div>
                </div>
              </div>
              );
            })}
            {!hasChannelData && (
              <div style={{ textAlign:'center', padding:'10px 4px 2px', fontSize:11.5, color:'var(--t3)' }}>
                {t('channel_empty')}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top sellers + Stock health */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:14, marginBottom:14 }}>
        <div className="dash-card" style={{ opacity:mounted?1:0, transform:mounted?'scale(1)':'scale(.96)', transitionDelay:'.36s' }}>
          <div className="dash-card-h"><div className="dash-card-t">{t('top_sellers_title')}</div><span style={{ fontSize:11, color:'var(--t3)' }}>{t('top_sellers_sub')}</span></div>
          <div style={{ padding:'14px 20px' }}>
            {D.topSellers.length === 0 && (
              <div style={{ textAlign:'center', padding:'22px 4px', fontSize:12.5, color:'var(--t3)' }}>
                {t('top_sellers_empty')}
              </div>
            )}
            {D.topSellers.slice().sort((a,b)=>b.revenue-a.revenue).map((s, i) => {
              const topRev = Math.max(...D.topSellers.map(x=>x.revenue), 1);
              const colors = ['var(--gn)','var(--ac)','rgba(59,91,219,.6)','rgba(59,91,219,.35)'];
              return (
                <div key={i} style={{ marginBottom:14 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <span style={{ width:22, height:22, borderRadius:7, background:i===0?'var(--grad-brand)':'var(--s2)', display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, color:i===0?'#fff':'var(--t2)', flexShrink:0 }}>{i+1}</span>
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
            <div className="dash-card-t">{t('stock_health_title')}</div>
            <button onClick={() => setPage('stock-manage')} style={{ fontSize:12, fontWeight:600, color:'var(--ac)', background:'var(--abg)', border:'none', borderRadius:6, padding:'4px 10px', cursor:'pointer' }}>{t('btn_view_all')}</button>
          </div>
          <div style={{ padding:'14px 16px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:14 }}>
              <div style={{ background:'var(--gbg)', borderRadius:'var(--r)', padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'var(--gt)', textTransform:'uppercase', letterSpacing:'.05em' }}>{t('stock_health_value')}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--gt)', marginTop:3, letterSpacing:'-.4px' }}>{(stockValue/1000).toFixed(0)}k ฿</div>
              </div>
              <div style={{ background:'var(--ambg)', borderRadius:'var(--r)', padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color:'var(--amt)', textTransform:'uppercase', letterSpacing:'.05em' }}>{t('stock_health_low')}</div>
                <div style={{ fontSize:15, fontWeight:800, color:'var(--amt)', marginTop:3 }}>{lowStock.length} {t('stock_health_items')}</div>
              </div>
              <div style={{ background: outOfStock.length > 0 ? 'var(--rbg)' : 'var(--s2)', borderRadius:'var(--r)', padding:'10px 12px' }}>
                <div style={{ fontSize:10.5, fontWeight:700, color: outOfStock.length > 0 ? 'var(--rd)' : 'var(--t3)', textTransform:'uppercase', letterSpacing:'.05em' }}>{t('stock_health_out')}</div>
                <div style={{ fontSize:15, fontWeight:800, color: outOfStock.length > 0 ? 'var(--rd)' : 'var(--t3)', marginTop:3 }}>{outOfStock.length} {t('stock_health_items')}</div>
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
          <div><div className="dash-card-t">{t('recent_sales_title')}</div><div style={{ fontSize:11, color:'var(--t3)', marginTop:2 }}>{t('recent_sales_count',{n:D.recentIssues.length})}</div></div>
          <button onClick={() => setPage('stock-out')} style={{ fontSize:12.5, fontWeight:700, color:'#fff', background:'var(--ac)', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', boxShadow:'0 3px 10px rgba(59,91,219,.3)', transition:'all .15s' }}>{t('btn_new_sale')}</button>
        </div>
        <div className="tw tw-fit" style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:'var(--thd)' }}>
                {[t('th_no'),t('th_date'),t('th_channel'),t('th_code'),t('th_product'),t('th_weight'),t('th_value'),t('th_invoice')].map(h => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:13, fontWeight:700, color:'var(--thd-fg)', borderBottom:'1px solid var(--bd)', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentPag.slice.map((r, i) => (
                <tr key={(r.id ?? '') + '-' + (r.inv ?? '') + '-' + i} className="tbl-row" style={{ borderBottom:'1px solid var(--bd)' }}>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{r.id}</td>
                  <td style={{ padding:'11px 14px', fontSize:12.5, color:'var(--t2)' }}>{r.date}</td>
                  <td style={{ padding:'11px 14px' }}><Badge kind={r.type} /></td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t3)' }}>{r.code}</td>
                  <td style={{ padding:'11px 14px', fontWeight:600 }}>{r.prod}</td>
                  <td style={{ padding:'11px 14px' }}>{window.fmtItemQty(r.w, r.code)}</td>
                  <td style={{ padding:'11px 14px', fontWeight:800, color:r.val?'var(--gn)':'var(--t3)' }}>{r.val?window.fmtMoney(r.val):'—'}</td>
                  <td style={{ padding:'11px 14px', fontFamily:'var(--font-mono)', fontSize:12, color:'var(--t2)' }}>{r.inv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Paginator page={recentPag.page} totalPages={recentPag.totalPages} setPage={recentPag.setPage} total={recentPag.total} pageSize={recentPag.pageSize} setPageSize={recentPag.setPageSize} noun="รายการ" />
      </div>
    </div>
  );
}
window.Dashboard = Dashboard;
