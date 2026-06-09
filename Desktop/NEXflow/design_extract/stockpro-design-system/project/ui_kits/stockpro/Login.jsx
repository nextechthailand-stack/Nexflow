/* StockPro UI Kit — Login screen */
function Login({ onLogin }) {
  const [user, setUser] = useState('admin');
  const [pass, setPass] = useState('1234');
  const [err, setErr] = useState(false);
  const submit = () => {
    if (user === 'admin' && pass === '1234') onLogin();
    else setErr(true);
  };
  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">SP</div>
        <div className="login-title">StockPro</div>
        <div className="login-sub">ระบบบริหารสต็อกสินค้า — เข้าสู่ระบบ</div>
        {err && <div className="nc" style={{ background:'var(--rbg)', color:'var(--rt)', marginBottom:12, display:'block' }}>Username หรือ Password ไม่ถูกต้อง</div>}
        <label className="login-label">Username</label>
        <input className="login-input" value={user} onChange={e => setUser(e.target.value)} onKeyDown={e => e.key==='Enter'&&submit()} placeholder="กรอก Username" />
        <label className="login-label">Password</label>
        <input className="login-input" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={e => e.key==='Enter'&&submit()} placeholder="กรอก Password" />
        <div className="remember-row">
          <input type="checkbox" defaultChecked style={{ width:15, height:15, accentColor:'var(--ac)' }} id="rem" />
          <label htmlFor="rem">จดจำการเข้าสู่ระบบ</label>
        </div>
        <button className="login-btn" onClick={submit}>เข้าสู่ระบบ</button>
        <div style={{ textAlign:'center', marginTop:14, fontSize:12, color:'var(--t3)' }}>Demo: admin / 1234</div>
      </div>
    </div>
  );
}
window.Login = Login;
