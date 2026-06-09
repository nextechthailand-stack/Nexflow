/* StockPro UI Kit — primitives: Icon (inlined Lucide paths from source), Button, Badge, Card, Field, StatCard */
const { useState, useEffect, useRef } = React;

// Exact Lucide paths as inlined in the source app
const ICONS = {
  dashboard: <g><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></g>,
  'arrow-right': <path d="M5 12h14M12 5l7 7-7 7"/>,
  'arrow-left': <path d="M19 12H5M12 19l-7-7 7-7"/>,
  'file-text': <g><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></g>,
  'bar-chart': <g><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></g>,
  warehouse: <g><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8h2M7 12h2M11 8h6M11 12h6"/></g>,
  package: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
  users: <g><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></g>,
  user: <g><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></g>,
  settings: <g><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></g>,
  check: <polyline points="20 6 9 17 4 12"/>,
  'chevron-right': <path d="M9 18l6-6-6-6"/>,
  'chevron-down': <polyline points="6 9 12 15 18 9"/>,
  'x-circle': <g><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></g>,
  search: <g><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></g>,
  download: <g><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></g>,
  printer: <g><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></g>,
  cube: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>,
  coin: <g><circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/></g>,
};

function Icon({ name, size = 16, className = '', style = {} }) {
  return (
    <svg className={'ic ' + className} width={size} height={size} viewBox="0 0 24 24" style={style}>
      {ICONS[name] || null}
    </svg>
  );
}

function Button({ variant = 'bp', size, children, icon, ...rest }) {
  const cls = ['btn', variant, size === 'sm' ? 'bsm' : size === 'lg' ? 'blg' : ''].filter(Boolean).join(' ');
  return <button className={cls} {...rest}>{icon && <Icon name={icon} size={15} />}{children}</button>;
}

const BADGE_MAP = {
  wholesale:{c:'xb',t:'Wholesale'}, online:{c:'xp',t:'Online'}, general:{c:'xx',t:'ทั่วไป'}, sample:{c:'xx',t:'Sample'},
  expired:{c:'xr',t:'Expired'}, other:{c:'xx',t:'Other'}, paid:{c:'xg',t:'ชำระแล้ว'},
  pending:{c:'xa',t:'รอชำระ'}, void:{c:'xr',t:'ยกเลิก'},
};
function Badge({ kind, children }) {
  const m = BADGE_MAP[kind];
  return <span className={'bx ' + (m ? m.c : 'xx')}>{children || (m && m.t) || kind}</span>;
}

function StockPill({ stock, min }) {
  let c = 'spg', t = window.fmtKg(stock);
  if (stock <= 0) { c = 'spr'; t = 'หมดสต็อก'; }
  else if (stock < min) { c = 'spa'; }
  return <span className={'sp ' + c}>{t}</span>;
}

function Card({ title, actions, children, style, className }) {
  return (
    <div className={'card' + (className ? ' ' + className : '')} style={style}>
      {(title || actions) && <div className="ch"><span className="ct-t">{title}</span>{actions}</div>}
      {children}
    </div>
  );
}

function StatCard({ icon, iconTone = 'ac', label, value, valueTone, sub }) {
  const bg = { ac:'var(--abg)', gn:'var(--gbg)', am:'var(--ambg)', rd:'var(--rbg)', pu:'var(--pbg)' }[iconTone];
  const fg = { ac:'var(--ac)', gn:'var(--gn)', am:'var(--am)', rd:'var(--rd)', pu:'var(--pu)' }[iconTone];
  return (
    <div className="st">
      <div className="st-l"><span className="st-ic" style={{ background: bg, color: fg }}><Icon name={icon} size={14} /></span>{label}</div>
      <div className="st-v" style={valueTone ? { color: `var(--${valueTone})` } : {}}>{value}</div>
      {sub && <div className="st-s">{sub}</div>}
    </div>
  );
}

function Field({ label, required, optional, children, value, ...rest }) {
  return (
    <div className="fg">
      {label && <label className="fl">{label} {required && <span className="req">*</span>}{optional && <span style={{color:'var(--t3)',fontWeight:400,fontSize:'11.5px'}}> (ไม่บังคับ)</span>}</label>}
      {children || <input className="fc" value={value} {...rest} />}
    </div>
  );
}

function CompanyLogo({ size = 40, radius = 11 }) {
  const logoUrl = window.SP_DATA?.company?.logoUrl;
  if (logoUrl) {
    return <img src={logoUrl} alt="logo" style={{ width:size, height:size, borderRadius:radius, objectFit:'contain', background:'#fff', flexShrink:0 }} />;
  }
  return (
    <div style={{ width:size, height:size, borderRadius:radius, background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:Math.round(size*0.4), flexShrink:0 }}>SP</div>
  );
}

Object.assign(window, { Icon, Button, Badge, StockPill, Card, StatCard, Field, CompanyLogo });
