/* NEXflow UI Kit — App shell: sidebar nav + top toolbar */
const NAV = [
  { sec:'nav_sec_main' },
  { id:'dashboard', icon:'dashboard', label:'nav_dashboard' },
  { sec:'nav_sec_stock' },
  { id:'stock-in', icon:'arrow-right', label:'nav_stock_in' },
  { id:'stock-out', icon:'arrow-left', label:'nav_stock_out' },
  { sec:'nav_sec_account' },
  { id:'invoices', icon:'file-text', label:'nav_invoices' },
  { sec:'nav_sec_reports' },
  { id:'reports', icon:'bar-chart', label:'nav_reports' },
  { id:'stock-manage', icon:'warehouse', label:'nav_stock_manage' },
  { id:'products', icon:'package', label:'nav_products' },
  { id:'customers', icon:'users', label:'nav_customers' },
  { id:'users', icon:'user', label:'nav_users' },
  { id:'settings', icon:'settings', label:'nav_settings' },
];

const PAGE_META = {
  dashboard:{ t:'page_dashboard_t', s:'page_dashboard_s' },
  'stock-in':{ t:'page_stockin_t', s:'page_stockin_s' },
  'stock-out':{ t:'page_stockout_t', s:'page_stockout_s' },
  invoices:{ t:'page_invoices_t', s:'page_invoices_s' },
  reports:{ t:'page_reports_t', s:'page_reports_s' },
  'stock-manage':{ t:'page_stockmanage_t', s:'page_stockmanage_s' },
  products:{ t:'page_products_t', s:'page_products_s' },
  customers:{ t:'page_customers_t', s:'page_customers_s' },
  users:{ t:'page_users_t', s:'page_users_s' },
  settings:{ t:'page_settings_t', s:'page_settings_s' },
};

function Shell({ page, setPage, onLogout, children }) {
  const [lang, t] = useLang();
  const D = window.SP_DATA;
  const meta = PAGE_META[page] || { t:'', s:'' };
  const today = new Date().toLocaleDateString(lang === 'en' ? 'en-US' : 'th-TH', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

  // Day/Night theme — persisted to localStorage, applied on <html data-theme>
  const [theme, setTheme] = React.useState(() => localStorage.getItem('sp-theme') || 'light');
  React.useEffect(() => {
    document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : '';
    localStorage.setItem('sp-theme', theme);
  }, [theme]);
  const isDark = theme === 'dark';

  // Sidebar off-canvas (มือถือ/แท็บเล็ตแนวตั้ง) — เปิด/ปิดด้วยปุ่ม hamburger บน toolbar
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const goPage = (id) => { setPage(id); setSidebarOpen(false); };

  /* ── กระดิ่งแจ้งเตือนสต็อกหมด/ใกล้หมด ──
     Shell ไม่ remount ตอนเปลี่ยนหน้า (ต่างจากหน้าอื่นที่ remount ทุกครั้ง) จึงต้อง
     ฟัง event 'sp:data-updated' เพื่อ re-render เมื่อสต็อกเปลี่ยน (เช่น หลังขาย/รับสินค้า/
     เครื่องอื่นแก้ไขสต็อก) และโหลดสต็อกล่าสุดเองตอนแอปเริ่มด้วย */
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [, setNotifVer] = React.useState(0);
  React.useEffect(() => {
    const onUpdate = () => setNotifVer(v => v + 1);
    window.addEventListener('sp:data-updated', onUpdate);
    if (window.SP_API) window.SP_API.reloadProducts().then(onUpdate).catch(() => {});
    return () => window.removeEventListener('sp:data-updated', onUpdate);
  }, []);
  const outOfStockList = (D.products || []).filter(p => p.stock <= 0);
  const lowStockList   = (D.products || []).filter(p => p.stock > 0 && p.stock < p.min);
  const notifItems = [...outOfStockList.map(p => ({ ...p, kind:'out' })), ...lowStockList.map(p => ({ ...p, kind:'low' }))];
  const notifCount = notifItems.length;
  const goStockAndClose = () => { setNotifOpen(false); goPage('stock-manage'); };

  return (
    <div className={'app' + (sidebarOpen ? ' sb-open' : '')}>
      {sidebarOpen && <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-mark"><img src="../../assets/nexflow-logo.png" alt="NexFlow" /></div>
          <div><div className="sb-name">{t('app_name')}</div><div className="sb-ver">{t('app_ver')}</div></div>
        </div>
        <nav className="sb-nav">
          {NAV.map((n, i) => n.sec
            ? <div className="sb-sec" key={'s'+i}>{t(n.sec)}</div>
            : <button type="button" key={n.id} className={'ni' + (page === n.id ? ' on' : '')} onClick={() => goPage(n.id)} aria-current={page === n.id ? 'page' : undefined} title={t(n.label)}>
                <div className="ni-ic"><Icon name={n.icon} size={16} /></div>
                <span className="ni-label">{t(n.label)}</span>
                {n.badge && <span className="ni-badge">{n.badge}</span>}
              </button>
          )}
        </nav>
        <div className="sb-user">
          <div className="av">{D.user.initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sb-user-name">{D.user.name}</div>
            <div className="sb-user-role">{D.user.role}</div>
          </div>
          <button className="sb-out" onClick={onLogout} title={t('nav_logout_title')}>{t('nav_logout')}</button>
        </div>
      </aside>
      <main className="mn">
        <div className="tb">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button type="button" className="sb-toggle" onClick={() => setSidebarOpen(v => !v)} aria-label={t('nav_menu_toggle') || 'Menu'}>
              <Icon name="menu" size={18} />
            </button>
            <div>
              <div className="tb-title">{t(meta.t)}</div>
              <div className="tb-sub">{t(meta.s)}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ position:'relative' }}>
              <button type="button" onClick={() => setNotifOpen(v => !v)}
                title="แจ้งเตือนสต็อกสินค้า" aria-label="แจ้งเตือนสต็อกสินค้า"
                style={{ position:'relative', display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:100, border:'1px solid var(--bd)', background: notifOpen?'var(--s2)':'var(--sur)', color:'var(--t2)', cursor:'pointer', transition:'all .15s' }}>
                <Icon name="bell" size={16} />
                {notifCount > 0 && (
                  <span style={{ position:'absolute', top:-2, right:-2, minWidth:16, height:16, padding:'0 3px', borderRadius:100, background:'var(--rd)', color:'#fff', fontSize:10, fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                    {notifCount > 99 ? '99+' : notifCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <>
                  <div onClick={() => setNotifOpen(false)} style={{ position:'fixed', inset:0, zIndex:40 }} />
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', right:0, width:330, maxHeight:420, overflow:'hidden', display:'flex', flexDirection:'column', background:'var(--sur)', border:'1px solid var(--bd)', borderRadius:12, boxShadow:'var(--sh-modal, 0 12px 32px rgba(0,0,0,.18))', zIndex:41 }}>
                    <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div style={{ fontWeight:800, fontSize:13.5, color:'var(--t1)' }}>แจ้งเตือนสต็อกสินค้า</div>
                      {notifCount > 0 && <span style={{ fontSize:11, fontWeight:700, color:'var(--rd)' }}>{notifCount} รายการ</span>}
                    </div>
                    <div style={{ overflowY:'auto', flex:1 }}>
                      {notifCount === 0 ? (
                        <div style={{ padding:'28px 16px', textAlign:'center', color:'var(--t3)', fontSize:12.5 }}>ไม่มีการแจ้งเตือน — สต็อกสินค้าปกติทั้งหมด</div>
                      ) : notifItems.slice(0, 50).map((p, i) => (
                        <div key={p.code + i} style={{ padding:'9px 14px', borderBottom:'1px solid var(--bd)', display:'flex', alignItems:'center', gap:9 }}>
                          <span style={{ width:7, height:7, borderRadius:100, flexShrink:0, background: p.kind==='out' ? 'var(--rd)' : 'var(--am)' }} />
                          <div style={{ minWidth:0, flex:1 }}>
                            <div style={{ fontSize:12.5, fontWeight:600, color:'var(--t1)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.name}</div>
                            <div style={{ fontSize:11, color: p.kind==='out' ? 'var(--rd)' : 'var(--am)' }}>
                              {p.kind==='out' ? 'หมดสต็อก' : `ใกล้หมด — คงเหลือ ${p.stock} ${p.unitLabel||''} (ขั้นต่ำ ${p.min})`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {notifCount > 0 && (
                      <button type="button" onClick={goStockAndClose}
                        style={{ padding:'10px 14px', border:'none', borderTop:'1px solid var(--bd)', background:'var(--s2)', color:'var(--ac)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:'inherit' }}>
                        ดูรายละเอียดสต็อกทั้งหมด →
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <div className="tb-date">{today}</div>
            <button onClick={() => setTheme(isDark ? 'light' : 'dark')}
              title={isDark ? t('theme_to_light') : t('theme_to_dark')}
              aria-label={isDark ? t('theme_to_light') : t('theme_to_dark')}
              style={{ display:'flex', alignItems:'center', justifyContent:'center', width:34, height:34, borderRadius:100, border:'1px solid var(--bd)', background:'var(--sur)', color:'var(--t2)', cursor:'pointer', transition:'all .15s' }}>
              <Icon name={isDark ? 'sun' : 'moon'} size={16} />
            </button>
            <div style={{ display:'flex', gap:4, background:'var(--s2)', borderRadius:100, padding:3 }}>
              <button onClick={() => window.setLang('th')}
                style={{ padding:'4px 11px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, background: lang==='th'?'var(--ac)':'transparent', color: lang==='th'?'#fff':'var(--t2)' }}>
                ไทย
              </button>
              <button onClick={() => window.setLang('en')}
                style={{ padding:'4px 11px', borderRadius:100, border:'none', cursor:'pointer', fontFamily:'inherit', fontSize:12, fontWeight:700, background: lang==='en'?'var(--ac)':'transparent', color: lang==='en'?'#fff':'var(--t2)' }}>
                EN
              </button>
            </div>
          </div>
        </div>
        <div className="ct pg" key={page}>{children}</div>
      </main>
    </div>
  );
}
window.Shell = Shell;
