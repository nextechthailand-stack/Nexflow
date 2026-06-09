/* StockPro UI Kit — App shell: sidebar nav + top toolbar */
const NAV = [
  { sec:'หลัก' },
  { id:'dashboard', icon:'dashboard', label:'Dashboard' },
  { sec:'สต็อก' },
  { id:'stock-in', icon:'arrow-right', label:'รับสินค้าเข้า' },
  { id:'stock-out', icon:'arrow-left', label:'ตัดสต็อก / ขาย' },
  { sec:'บัญชี' },
  { id:'invoices', icon:'file-text', label:'ใบกำกับภาษี' },
  { sec:'รายงาน & ข้อมูล' },
  { id:'reports', icon:'bar-chart', label:'รายงาน' },
  { id:'stock-manage', icon:'warehouse', label:'การจัดการสต็อก', badge:2 },
  { id:'products', icon:'package', label:'สินค้า' },
  { id:'customers', icon:'users', label:'ลูกค้า' },
  { id:'users', icon:'user', label:'จัดการผู้ใช้' },
  { id:'settings', icon:'settings', label:'ตั้งค่าระบบ' },
];

const PAGE_META = {
  dashboard:{ t:'Dashboard', s:'ภาพรวมระบบสต็อกสินค้า' },
  'stock-in':{ t:'รับสินค้าเข้า', s:'สแกนบาร์โค้ด — อ่านรหัส + น้ำหนักอัตโนมัติ' },
  'stock-out':{ t:'ตัดสต็อก / ขาย', s:'Wholesale · Online · Sample · Expired · Other' },
  invoices:{ t:'ใบกำกับภาษี', s:'ออกและพิมพ์ใบกำกับภาษีเต็มรูป / อย่างย่อ' },
  reports:{ t:'รายงาน', s:'รายงานการขายและการเคลื่อนไหวสต็อก' },
  'stock-manage':{ t:'การจัดการสต็อก', s:'ยอดคงเหลือและประวัติการเคลื่อนไหว' },
  products:{ t:'สินค้า', s:'จัดการรายการสินค้าและราคา' },
  customers:{ t:'ลูกค้า', s:'ฐานข้อมูลลูกค้าค้าส่งและออนไลน์' },
  users:{ t:'จัดการผู้ใช้', s:'บัญชีผู้ใช้งานระบบ' },
  settings:{ t:'ตั้งค่าระบบ', s:'ข้อมูลบริษัทและการตั้งค่า' },
};

function Shell({ page, setPage, onLogout, children }) {
  const D = window.SP_DATA;
  const meta = PAGE_META[page] || { t:'', s:'' };
  const today = new Date().toLocaleDateString('th-TH', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
  return (
    <div className="app">
      <aside className="sb">
        <div className="sb-logo">
          <div className="sb-mark">SP</div>
          <div><div className="sb-name">StockPro</div><div className="sb-ver">v2.0 Premium</div></div>
        </div>
        <nav className="sb-nav">
          {NAV.map((n, i) => n.sec
            ? <div className="sb-sec" key={'s'+i}>{n.sec}</div>
            : <div key={n.id} className={'ni' + (page === n.id ? ' on' : '')} onClick={() => setPage(n.id)}>
                <div className="ni-ic"><Icon name={n.icon} size={16} /></div>
                {n.label}
                {n.badge && <span className="ni-badge">{n.badge}</span>}
              </div>
          )}
        </nav>
        <div className="sb-user">
          <div className="av">{D.user.initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sb-user-name">{D.user.name}</div>
            <div className="sb-user-role">{D.user.role}</div>
          </div>
          <button className="sb-out" onClick={onLogout} title="ออกจากระบบ">ออก</button>
        </div>
      </aside>
      <main className="mn">
        <div className="tb">
          <div>
            <div className="tb-title">{meta.t}</div>
            <div className="tb-sub">{meta.s}</div>
          </div>
          <div className="tb-date">{today}</div>
        </div>
        <div className="ct">{children}</div>
      </main>
    </div>
  );
}
window.Shell = Shell;
