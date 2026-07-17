/* StockPro UI Kit — Thai tax invoice (A4) shown in a modal */
function Invoice({ invoice, onClose, toast }) {
  if (!invoice) return null;
  const D = window.SP_DATA;
  const co = D.company;
  const beDate = (iso) => {
    const d = new Date(iso); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${(d.getFullYear()+543)%100}`;
  };
  return (
    <div className="ov" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="md" style={{ width:720 }}>
        <div className="md-h">
          <span className="md-t">ใบกำกับภาษี · {invoice.no}</span>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <Button variant="bp" size="sm" icon="printer" onClick={() => toast('info', 'กำลังพิมพ์ใบกำกับภาษี…')}>พิมพ์</Button>
            <div className="md-x" onClick={onClose}>✕</div>
          </div>
        </div>
        <div className="md-b" style={{ background:'var(--s2)' }}>
          <div className="inv-page">
            <div className="inv-orig">ต้นฉบับ</div>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:6 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:'var(--grad-brand)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:16 }}>SP</div>
              <div>
                <div style={{ fontSize:17, fontWeight:800, color:'var(--ac)' }}>{co.name}</div>
                <div style={{ fontSize:11.5, color:'var(--t2)', lineHeight:1.7 }}>{co.addr}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'var(--t2)', borderTop:'2px solid var(--bd)', borderBottom:'1px solid var(--bd)', padding:'8px 0', margin:'8px 0' }}>
              <span>เลขประจำตัวผู้เสียภาษี: <b className="mono">{co.tax}</b></span>
              <span>โทร {co.tel}</span>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', margin:'12px 0' }}>
              <div style={{ fontSize:13 }}>
                <div style={{ fontWeight:700, marginBottom:3 }}>ลูกค้า</div>
                <div>{invoice.cust ? invoice.cust.name : '—'}</div>
                {invoice.cust && invoice.cust.tax && <div className="mono" style={{ color:'var(--t2)' }}>เลขภาษี {invoice.cust.tax}</div>}
              </div>
              <div style={{ fontSize:13, textAlign:'right' }}>
                <div>เลขที่: <b className="mono">{invoice.no}</b></div>
                <div>วันที่: <b>{beDate(invoice.date)}</b></div>
                <div style={{ marginTop:4 }}><Badge kind={invoice.saleType} /></div>
              </div>
            </div>
            <table className="inv-tbl">
              <thead><tr><th style={{ width:30 }}>#</th><th>รายการ</th><th style={{ textAlign:'right' }}>น้ำหนัก</th><th style={{ textAlign:'right' }}>ราคา/KG</th><th style={{ textAlign:'right' }}>จำนวนเงิน</th></tr></thead>
              <tbody>
                {invoice.items.map((it, i) => (
                  <tr key={i}><td>{i+1}</td><td>{it.name} <span className="mono" style={{ color:'var(--t3)' }}>({it.code})</span></td><td style={{ textAlign:'right' }}>{it.weight.toFixed(3)}</td><td style={{ textAlign:'right' }}>฿{it.price}</td><td style={{ textAlign:'right' }}>{window.fmtMoney(it.weight*it.price)}</td></tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan="4" style={{ textAlign:'right' }}>ยอดรวม</td><td style={{ textAlign:'right' }}>{window.fmtMoney(invoice.subtotal)}</td></tr>
                {invoice.discount > 0 && <tr><td colSpan="4" style={{ textAlign:'right' }}>ส่วนลด</td><td style={{ textAlign:'right' }}>-{window.fmtMoney(invoice.discount)}</td></tr>}
                <tr><td colSpan="4" style={{ textAlign:'right' }}>VAT 7% (รวมในราคา)</td><td style={{ textAlign:'right' }}>{window.fmtMoney(invoice.vat)}</td></tr>
                <tr><td colSpan="4" style={{ textAlign:'right', fontSize:14 }}>ยอดสุทธิ</td><td style={{ textAlign:'right', fontSize:14, color:'var(--gn)' }}>{window.fmtMoney(invoice.total)}</td></tr>
              </tfoot>
            </table>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:28, fontSize:12, color:'var(--t2)' }}>
              <div style={{ textAlign:'center', flex:1 }}>____________________<br/>ผู้รับสินค้า</div>
              <div style={{ textAlign:'center', flex:1 }}>____________________<br/>ผู้มีอำนาจลงนาม</div>
            </div>
          </div>
        </div>
        <div className="md-f">
          <Button variant="bg2" onClick={onClose}>ปิด</Button>
          <Button variant="bs" icon="check" onClick={() => { toast('ok', 'บันทึกใบกำกับเรียบร้อย'); onClose(); }}>เสร็จสิ้น</Button>
        </div>
      </div>
    </div>
  );
}
window.Invoice = Invoice;
