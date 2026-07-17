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
  return (
    <div className="app">
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-mark"><img src="../../assets/nexflow-logo.png" alt="NexFlow" /></div>
          <div><div className="sb-name">{t('app_name')}</div><div className="sb-ver">{t('app_ver')}</div></div>
        </div>
        <nav className="sb-nav">
          {NAV.map((n, i) => n.sec
            ? <div className="sb-sec" key={'s'+i}>{t(n.sec)}</div>
            : <button type="button" key={n.id} className={'ni' + (page === n.id ? ' on' : '')} onClick={() => setPage(n.id)} aria-current={page === n.id ? 'page' : undefined}>
                <div className="ni-ic"><Icon name={n.icon} size={16} /></div>
                {t(n.label)}
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
          <div>
            <div className="tb-title">{t(meta.t)}</div>
            <div className="tb-sub">{t(meta.s)}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
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
