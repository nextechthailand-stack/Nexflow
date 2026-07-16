/* NEXflow UI Kit — i18n (Thai / English) */
const SP_I18N = {
  th: {
    app_name: 'NexFlow',
    app_ver: 'v2.0 Premium',

    /* Nav sections */
    nav_sec_main: 'หลัก',
    nav_sec_stock: 'สต็อก',
    nav_sec_account: 'บัญชี',
    nav_sec_reports: 'รายงาน & ข้อมูล',

    /* Nav items */
    nav_dashboard: 'Dashboard',
    nav_stock_in: 'รับสินค้าเข้า',
    nav_stock_out: 'ตัดสต็อก / ขาย',
    nav_invoices: 'ใบกำกับภาษี',
    nav_reports: 'รายงาน',
    nav_stock_manage: 'การจัดการสต็อก',
    nav_products: 'สินค้า',
    nav_customers: 'ลูกค้า',
    nav_users: 'จัดการผู้ใช้',
    nav_settings: 'ตั้งค่าระบบ',
    nav_logout: 'ออก',
    nav_logout_title: 'ออกจากระบบ',
    theme_to_dark: 'โหมดกลางคืน',
    theme_to_light: 'โหมดกลางวัน',

    /* Page header (title / subtitle) */
    page_dashboard_t: 'Dashboard',
    page_dashboard_s: 'ภาพรวมระบบสต็อกสินค้า',
    page_stockin_t: 'รับสินค้าเข้า',
    page_stockin_s: 'สแกนบาร์โค้ด — อ่านรหัส + น้ำหนักอัตโนมัติ',
    page_stockout_t: 'ตัดสต็อก / ขาย',
    page_stockout_s: 'Wholesale · Online · Sample · Expired · Other',
    page_invoices_t: 'ใบกำกับภาษี',
    page_invoices_s: 'ออกและพิมพ์ใบกำกับภาษีเต็มรูป / อย่างย่อ',
    page_reports_t: 'รายงาน',
    page_reports_s: 'รายงานการขายและการเคลื่อนไหวสต็อก',
    page_stockmanage_t: 'การจัดการสต็อก',
    page_stockmanage_s: 'ยอดคงเหลือและประวัติการเคลื่อนไหว',
    page_products_t: 'สินค้า',
    page_products_s: 'จัดการรายการสินค้าและราคา',
    page_customers_t: 'ลูกค้า',
    page_customers_s: 'ฐานข้อมูลลูกค้าค้าส่งและออนไลน์',
    page_users_t: 'จัดการผู้ใช้',
    page_users_s: 'บัญชีผู้ใช้งานระบบ',
    page_settings_t: 'ตั้งค่าระบบ',
    page_settings_s: 'ข้อมูลบริษัทและการตั้งค่า',

    /* Login */
    login_app_sub: 'ระบบบริหารสต็อกสินค้า — เข้าสู่ระบบ',
    login_username: 'Username',
    login_password: 'Password',
    login_username_ph: 'กรอก Username',
    login_password_ph: 'กรอก Password',
    login_remember: 'จดจำการเข้าสู่ระบบ',
    login_forgot: 'ลืมรหัสผ่าน?',
    login_btn: 'เข้าสู่ระบบ',
    login_btn_busy: 'กำลังเข้าสู่ระบบ…',
    login_err_required: 'กรุณากรอก Username และ Password',
    login_err_no_db: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้',
    login_err_default: 'เข้าสู่ระบบไม่สำเร็จ',

    forgot_desc: 'กรอก Username ของคุณ ระบบจะส่งรหัสยืนยัน 6 หลักไปยังอีเมลที่ผูกกับบัญชีนี้',
    forgot_btn: 'ส่งรหัสยืนยัน',
    forgot_btn_busy: 'กำลังส่งรหัส…',
    forgot_err_required: 'กรุณากรอก Username',
    forgot_err_default: 'ไม่สามารถส่งรหัสยืนยันได้',
    forgot_sent: 'ส่งรหัสยืนยันไปที่ {email} แล้ว — กรุณาตรวจสอบอีเมล',

    reset_desc: 'กรอกรหัสยืนยันที่ได้รับทางอีเมล พร้อมตั้งรหัสผ่านใหม่',
    reset_code_label: 'รหัสยืนยัน (6 หลัก)',
    reset_code_ph: 'เช่น 123456',
    reset_new_pass: 'รหัสผ่านใหม่',
    reset_new_pass_ph: 'กรอกรหัสผ่านใหม่',
    reset_confirm_pass: 'ยืนยันรหัสผ่านใหม่',
    reset_confirm_pass_ph: 'กรอกรหัสผ่านใหม่อีกครั้ง',
    reset_btn: 'รีเซ็ตรหัสผ่าน',
    reset_btn_busy: 'กำลังบันทึก…',
    reset_err_required: 'กรุณากรอกข้อมูลให้ครบถ้วน',
    reset_err_mismatch: 'รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน',
    reset_err_default: 'รีเซ็ตรหัสผ่านไม่สำเร็จ',
    reset_success: 'รีเซ็ตรหัสผ่านสำเร็จ — กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    back_to_login: '← กลับไปหน้าเข้าสู่ระบบ',
    login_success: 'เข้าสู่ระบบสำเร็จ — ยินดีต้อนรับ',

    /* Dashboard */
    kpi_today_sales: 'ยอดขายวันนี้',
    kpi_today_sales_sub: '▲ {pct}% จากเมื่อวาน',
    kpi_month_sales: 'ยอดขายเดือนนี้',
    kpi_month_sales_sub: '{pct}% ของเป้า {target}',
    kpi_bills_today: 'บิลวันนี้',
    kpi_bills_unit: 'บิล',
    kpi_bills_sub: 'เฉลี่ย {avg} / บิล',
    kpi_grn_month: 'รับสินค้าเดือนนี้',
    kpi_grn_unit: 'ครั้ง',
    kpi_stock_value: 'มูลค่าสต็อกรวม',
    kpi_stock_value_sub: '{n} รายการสินค้า',
    kpi_adj_month: 'ปรับปรุงสต็อกเดือนนี้',
    kpi_adj_unit: 'รายการ',
    kpi_stock_status: 'สถานะสต็อก',
    kpi_stock_status_out: '{n} หมด',
    kpi_stock_status_low: '{n} ใกล้หมด',
    kpi_stock_status_ok: 'ปกติ',
    kpi_items_to_order: '{n} รายการต้องสั่งซื้อ',

    alert_out_low: 'แจ้งเตือน: สินค้าหมดสต็อก {out} รายการ, ใกล้หมด {low} รายการ',
    alert_low_only: 'แจ้งเตือน: สินค้าใกล้หมดสต็อก {low} รายการ',
    alert_more: '+{n} รายการ',
    alert_out: 'หมดสต็อก',
    btn_receive_stock: '+ รับสินค้าเข้า',

    revenue_title: 'ยอดขาย',
    revenue_sub: 'รวม {total}k ฿ · {unit}',
    live_update: 'อัปเดตสด',
    revenue_max: 'สูงสุด ฿{max} / {unit}',

    channel_title: 'ยอดขายตามช่องทาง',
    channel_total: 'รวม',
    channel_empty: 'ยังไม่มีข้อมูลยอดขาย — ตัวเลขจะเริ่มแสดงเมื่อมีการขายเกิดขึ้น',

    top_sellers_title: 'สินค้าขายดีเดือนนี้',
    top_sellers_sub: 'เรียงตามยอดขาย ฿',
    top_sellers_empty: 'ยังไม่มีสินค้าขายดี — ข้อมูลจะปรากฏเมื่อมีรายการขายเกิดขึ้น',

    stock_health_title: 'สุขภาพสต็อก · Top 4',
    stock_health_value: 'มูลค่าสต็อก',
    stock_health_low: 'ใกล้หมด',
    stock_health_out: 'หมดสต็อก',
    stock_health_items: 'รายการ',
    btn_view_all: 'ดูทั้งหมด →',

    recent_sales_title: 'รายการขายล่าสุด',
    recent_sales_count: '{n} รายการ',
    btn_new_sale: '+ ขายใหม่',
    th_no: 'เลขที่',
    th_date: 'วันที่',
    th_channel: 'ช่องทาง',
    th_code: 'รหัส',
    th_product: 'สินค้า',
    th_weight: 'จำนวน',
    th_value: 'มูลค่า',
    th_invoice: 'ใบกำกับ',

    period_7d: '7 วัน',
    period_1m: '1 เดือน',
    period_3m: '3 เดือน',
    period_6m: '6 เดือน',
    period_1y: '1 ปี',

    /* Stock Management report tabs */
    sm_tab_balance: 'รายงานสินค้าคงเหลือ',
    sm_tab_movement: 'รายงานความเคลื่อนไหวสต็อก',
    sm_tab_adjust: 'ปรับปรุงสต็อก',
    sm_tab_adjlog: 'รายงานการปรับปรุง',
    sm_tab_grn: 'รายงานรับเข้าสินค้า (GRN)',

    /* Reports.jsx tabs */
    rpt_tab_product: 'รายการสินค้า',
    rpt_tab_tax: 'ภาษีซื้อ-ขาย',
    rpt_tab_daily: 'Daily Sale',
    rpt_tab_payment: 'Payment',
    rpt_tab_discount: '% Discount',
    rpt_tab_customer: 'รายลูกค้า',
    page_per_page: 'หน้า',
  },

  en: {
    app_name: 'NexFlow',
    app_ver: 'v2.0 Premium',

    nav_sec_main: 'Main',
    nav_sec_stock: 'Stock',
    nav_sec_account: 'Accounting',
    nav_sec_reports: 'Reports & Data',

    nav_dashboard: 'Dashboard',
    nav_stock_in: 'Stock In',
    nav_stock_out: 'Stock Out / Sale',
    nav_invoices: 'Tax Invoices',
    nav_reports: 'Reports',
    nav_stock_manage: 'Stock Management',
    nav_products: 'Products',
    nav_customers: 'Customers',
    nav_users: 'User Management',
    nav_settings: 'Settings',
    nav_logout: 'Logout',
    nav_logout_title: 'Sign out',
    theme_to_dark: 'Night mode',
    theme_to_light: 'Day mode',

    page_dashboard_t: 'Dashboard',
    page_dashboard_s: 'Stock management overview',
    page_stockin_t: 'Stock In',
    page_stockin_s: 'Scan barcode — auto-read code + weight',
    page_stockout_t: 'Stock Out / Sale',
    page_stockout_s: 'Wholesale · Online · Sample · Expired · Other',
    page_invoices_t: 'Tax Invoices',
    page_invoices_s: 'Issue and print full / abbreviated tax invoices',
    page_reports_t: 'Reports',
    page_reports_s: 'Sales and stock movement reports',
    page_stockmanage_t: 'Stock Management',
    page_stockmanage_s: 'Stock balances and movement history',
    page_products_t: 'Products',
    page_products_s: 'Manage product list and prices',
    page_customers_t: 'Customers',
    page_customers_s: 'Wholesale and online customer database',
    page_users_t: 'User Management',
    page_users_s: 'System user accounts',
    page_settings_t: 'Settings',
    page_settings_s: 'Company information and settings',

    login_app_sub: 'Stock Management System — Sign in',
    login_username: 'Username',
    login_password: 'Password',
    login_username_ph: 'Enter Username',
    login_password_ph: 'Enter Password',
    login_remember: 'Remember me',
    login_forgot: 'Forgot password?',
    login_btn: 'Sign in',
    login_btn_busy: 'Signing in…',
    login_err_required: 'Please enter Username and Password',
    login_err_no_db: 'Unable to connect to database',
    login_err_default: 'Sign in failed',

    forgot_desc: 'Enter your Username and we will send a 6-digit verification code to the email linked to this account',
    forgot_btn: 'Send verification code',
    forgot_btn_busy: 'Sending…',
    forgot_err_required: 'Please enter Username',
    forgot_err_default: 'Unable to send verification code',
    forgot_sent: 'Verification code sent to {email} — please check your email',

    reset_desc: 'Enter the verification code you received by email and set a new password',
    reset_code_label: 'Verification code (6 digits)',
    reset_code_ph: 'e.g. 123456',
    reset_new_pass: 'New password',
    reset_new_pass_ph: 'Enter new password',
    reset_confirm_pass: 'Confirm new password',
    reset_confirm_pass_ph: 'Re-enter new password',
    reset_btn: 'Reset password',
    reset_btn_busy: 'Saving…',
    reset_err_required: 'Please fill in all fields',
    reset_err_mismatch: 'New passwords do not match',
    reset_err_default: 'Failed to reset password',
    reset_success: 'Password reset successful — please sign in with your new password',
    back_to_login: '← Back to sign in',
    login_success: 'Signed in successfully — welcome',

    kpi_today_sales: "Today's Sales",
    kpi_today_sales_sub: '▲ {pct}% vs yesterday',
    kpi_month_sales: 'Sales This Month',
    kpi_month_sales_sub: '{pct}% of target {target}',
    kpi_bills_today: 'Bills Today',
    kpi_bills_unit: 'bills',
    kpi_bills_sub: 'Avg {avg} / bill',
    kpi_grn_month: 'Stock Received This Month',
    kpi_grn_unit: 'times',
    kpi_stock_value: 'Total Stock Value',
    kpi_stock_value_sub: '{n} products',
    kpi_adj_month: 'Stock Adjustments This Month',
    kpi_adj_unit: 'items',
    kpi_stock_status: 'Stock Status',
    kpi_stock_status_out: '{n} out of stock',
    kpi_stock_status_low: '{n} low stock',
    kpi_stock_status_ok: 'Normal',
    kpi_items_to_order: '{n} items need reorder',

    alert_out_low: 'Alert: {out} item(s) out of stock, {low} item(s) low stock',
    alert_low_only: 'Alert: {low} item(s) low on stock',
    alert_more: '+{n} more',
    alert_out: 'Out of stock',
    btn_receive_stock: '+ Receive Stock',

    revenue_title: 'Revenue',
    revenue_sub: 'Total {total}k ฿ · {unit}',
    live_update: 'Live update',
    revenue_max: 'Max ฿{max} / {unit}',

    channel_title: 'Sales by Channel',
    channel_total: 'Total',
    channel_empty: 'No sales data yet — figures will appear once sales occur',

    top_sellers_title: 'Top Sellers This Month',
    top_sellers_sub: 'Sorted by revenue ฿',
    top_sellers_empty: 'No top sellers yet — data will appear once sales occur',

    stock_health_title: 'Stock Health · Top 4',
    stock_health_value: 'Stock Value',
    stock_health_low: 'Low Stock',
    stock_health_out: 'Out of Stock',
    stock_health_items: 'items',
    btn_view_all: 'View all →',

    recent_sales_title: 'Recent Sales',
    recent_sales_count: '{n} items',
    btn_new_sale: '+ New Sale',
    th_no: 'No.',
    th_date: 'Date',
    th_channel: 'Channel',
    th_code: 'Code',
    th_product: 'Product',
    th_weight: 'Weight',
    th_value: 'Value',
    th_invoice: 'Invoice',

    period_7d: '7d',
    period_1m: '1mo',
    period_3m: '3mo',
    period_6m: '6mo',
    period_1y: '1yr',

    /* Stock Management report tabs */
    sm_tab_balance: 'Stock Balance Report',
    sm_tab_movement: 'Stock Movement Report',
    sm_tab_adjust: 'Stock Adjustment',
    sm_tab_adjlog: 'Adjustment Report',
    sm_tab_grn: 'Goods Received Report (GRN)',

    /* Reports.jsx tabs */
    rpt_tab_product: 'Product Report',
    rpt_tab_tax: 'Sales/Purchase Tax',
    rpt_tab_daily: 'Daily Sale',
    rpt_tab_payment: 'Payment',
    rpt_tab_discount: '% Discount',
    rpt_tab_customer: 'Customer Report',
    page_per_page: 'page',
  },
};

window.SP_I18N = SP_I18N;

window.getLang = () => localStorage.getItem('sp_lang') || 'th';
window.setLang = (lang) => {
  localStorage.setItem('sp_lang', lang);
  window.dispatchEvent(new Event('sp:lang-changed'));
};

/* ใส่ {placeholder} แทนค่าด้วย vars */
function i18nFormat(str, vars) {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
}

function useLang() {
  const [lang, setLangState] = React.useState(window.getLang());
  React.useEffect(() => {
    const h = () => setLangState(window.getLang());
    window.addEventListener('sp:lang-changed', h);
    return () => window.removeEventListener('sp:lang-changed', h);
  }, []);
  const t = React.useCallback((key, vars) => {
    const dict = SP_I18N[lang] || SP_I18N.th;
    const str = dict[key] !== undefined ? dict[key] : (SP_I18N.th[key] !== undefined ? SP_I18N.th[key] : key);
    return i18nFormat(str, vars);
  }, [lang]);
  return [lang, t];
}
window.useLang = useLang;
