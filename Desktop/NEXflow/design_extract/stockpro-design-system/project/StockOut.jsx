/* StockPro UI Kit — Stock Out (cut stock / sell) + issue invoice */
const SALE_TYPES = [
{ id: 'wholesale', label: 'ค้าส่ง', en: 'Wholesale' },
{ id: 'online', label: 'ออนไลน์', en: 'Online' },
{ id: 'sample', label: 'ตัวอย่าง', en: 'Sample' },
{ id: 'expired', label: 'หมดอายุ', en: 'Expired' },
{ id: 'other', label: 'อื่นๆ', en: 'Other' }];


function StockOut({ toast, onIssue }) {
  const D = window.SP_DATA;
  const [items, setItems] = useState([]);
  const [bc, setBc] = useState('');
  const [status, setStatus] = useState('');
  const [saleType, setSaleType] = useState('wholesale');
  const [custId, setCustId] = useState(1);
  const [discType, setDiscType] = useState('none');
  const [discVal, setDiscVal] = useState(0);
  const inputRef = useRef(null);
  const seq = useRef(0);

  const scan = (raw) => {
    const parsed = window.parseBarcode(raw);
    if (!parsed) {setStatus('err');toast('err', 'บาร์โค้ดไม่ถูกต้อง');return;}
    setStatus('ok');
    setItems((prev) => [{ key: ++seq.current, code: parsed.code, name: parsed.prod.name, weight: parsed.weight, price: parsed.prod.sell, stock: parsed.prod.stock, tax: parsed.prod.tax, isnew: true }, ...prev]);
    setBc('');
    setTimeout(() => setItems((prev) => prev.map((it) => ({ ...it, isnew: false }))), 650);
    setTimeout(() => inputRef.current && inputRef.current.focus(), 0);
  };
  const onKey = (e) => {if (e.key === 'Enter' && bc.trim()) scan(bc.trim());};
  const del = (key) => setItems((prev) => prev.filter((it) => it.key !== key));

  const subtotal = items.reduce((s, i) => s + i.weight * i.price, 0);
  const discount = discType === 'percent' ? subtotal * (Number(discVal) || 0) / 100 : discType === 'amount' ? Number(discVal) || 0 : 0;
  const afterDisc = Math.max(0, subtotal - discount);
  const vatBase = items.filter((i) => i.tax === 'vat7').reduce((s, i) => s + i.weight * i.price, 0);
  const vat = afterDisc / (subtotal || 1) * (vatBase * 7 / 107);
  const total = afterDisc;
  const totalW = items.reduce((s, i) => s + i.weight, 0);

  const issue = () => {
    if (!items.length) {toast('err', 'ยังไม่มีรายการ');return;}
    const cust = D.customers.find((c) => c.id === Number(custId));
    onIssue({
      no: 'INV-202506-' + String(Math.floor(Math.random() * 9000) + 1000),
      date: new Date().toISOString().slice(0, 10),
      cust, saleType, items, subtotal, discount, vat, total, weight: totalW
    });
    setItems([]);setDiscType('none');setDiscVal(0);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 18, alignItems: 'start' }}>
      <div>
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="ch"><span className="ct-t">สแกนบาร์โค้ดสินค้า</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 600, color: 'var(--gn)' }}><span className="dot"></span>พร้อมรับสัญญาณ</div>
          </div>
          <div className="cb">
            <div className="si-scan-zone" style={{ background: '#fff', border: '2px solid var(--ac)', padding: 0 }}>
              <div style={{ position: 'relative' }}>
                <input ref={inputRef} className="si-bc-main" value={bc} inputMode="numeric" style={{ boxShadow: 'none' }}
                onChange={(e) => {setBc(e.target.value);setStatus('');}} onKeyDown={onKey} autoFocus
                placeholder="สแกนหรือพิมพ์บาร์โค้ด 13 หลัก…" />
                <span className="si-bc-icon" style={{ color: status === 'ok' ? 'var(--gn)' : status === 'err' ? 'var(--rd)' : 'var(--t3)' }}>{status === 'ok' ? '✓' : status === 'err' ? '✕' : ''}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--t3)', marginTop: 8 }}><span className="dot"></span>ระบบอ่านรหัสสินค้าและน้ำหนักอัตโนมัติ</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
              {D.demoBarcodes.map((b) =>
              <button key={b.code} className="demo-btn" onClick={() => scan(b.code)}>
                  <div className="mono" style={{ color: 'var(--tx)' }}>{b.code}</div><div style={{ color: 'var(--t3)' }}>{b.label}</div>
                </button>
              )}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--bd)' }}></div>
          <div className="ch" style={{ padding: '10px 20px' }}>
            <span className="ct-t">รายการสินค้า {items.length > 0 && <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t3)' }}>· {items.length} รายการ</span>}</span>
            <Button variant="bg2" size="sm" onClick={() => setItems([])}>ล้างทั้งหมด</Button>
          </div>
          <div className="cb" style={{ paddingTop: 6 }}>
            {items.length === 0 ?
            <div className="nc nc-b">สแกนบาร์โค้ดด้านบนเพื่อเพิ่มสินค้า</div> :
            <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {items.map((it) =>
              <div className={'item-row' + (it.isnew ? ' isnew' : '')} key={it.key} style={{ gridTemplateColumns: '1fr 90px 90px 90px 28px' }}>
                      <div><div style={{ fontSize: 13, fontWeight: 600 }}>{it.name}</div><div className="mono" style={{ marginTop: 2 }}>{it.code}</div></div>
                      <div style={{ fontSize: 12.5, color: 'var(--t3)', textAlign: 'center' }}>{it.stock.toFixed(1)} KG</div>
                      <div style={{ padding: '5px 8px', background: 'var(--abg)', borderRadius: 'var(--rs)', fontSize: 13, fontWeight: 700, color: 'var(--at)', textAlign: 'center' }}>{it.weight.toFixed(3)}</div>
                      <div style={{ fontSize: 13, textAlign: 'center' }}>฿{it.price}</div>
                      <div className="idel" onClick={() => del(it.key)}>✕</div>
                    </div>
              )}
                </div>
            }
          </div>
        </div>
      </div>

      {/* Right: type, customer, discount, totals */}
      <div style={{ position: 'sticky', top: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Card title="ประเภทการตัดสต็อก">
          <div className="cb" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }} data-comment-anchor="33a9a54012-div-105-11">
            {SALE_TYPES.map((t) =>
            <div key={t.id} onClick={() => setSaleType(t.id)}
            style={{ padding: '10px 12px', border: '2px solid ' + (saleType === t.id ? 'var(--ac)' : 'var(--bd)'), background: saleType === t.id ? 'var(--abg)' : 'var(--sur)', borderRadius: 'var(--rs)', cursor: 'pointer', transition: 'all .13s' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: saleType === t.id ? 'var(--at)' : 'var(--tx)' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'var(--t3)' }}>{t.en}</div>
              </div>
            )}
          </div>
        </Card>

        <div className="sum-card">
          <div className="sum-head"><span className="sum-title">สรุปการขาย</span><div className="sum-count"><Icon name="cube" size={13} /> {window.fmtKg(totalW)}</div></div>
          <div className="sum-body">
            <Field label="ลูกค้า">
              <select className="fc" value={custId} onChange={(e) => setCustId(e.target.value)}>
                {D.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8 }}>
              <Field label="ส่วนลด"><select className="fc" value={discType} onChange={(e) => setDiscType(e.target.value)}>
                <option value="none">ไม่มี</option><option value="amount">บาท</option><option value="percent">%</option>
              </select></Field>
              {discType !== 'none' && <Field label="จำนวน"><input className="fc" type="number" value={discVal} onChange={(e) => setDiscVal(e.target.value)} /></Field>}
            </div>
            <div className="sum-row"><span className="sum-l">ยอดรวม</span><span className="sum-v">{window.fmtMoney(subtotal)}</span></div>
            {discount > 0 && <div className="sum-row"><span className="sum-l">ส่วนลด</span><span className="sum-v" style={{ color: 'var(--am)' }}>-{window.fmtMoney(discount)}</span></div>}
            <div className="sum-row"><span className="sum-l">VAT 7% (ในราคา)</span><span className="sum-v">{window.fmtMoney(vat)}</span></div>
            <div className="sum-row" style={{ borderTop: '1px solid var(--bd)', paddingTop: 10 }}><span className="sum-l" style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>ยอดสุทธิ</span><span className="sum-v big">{window.fmtMoney(total)}</span></div>
          </div>
          <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button variant="bp" size="lg" icon="file-text" style={{ width: '100%', justifyContent: 'center' }} onClick={issue}>ตัดสต็อก + ออกใบกำกับ</Button>
          </div>
        </div>
      </div>
    </div>);

}
window.StockOut = StockOut;