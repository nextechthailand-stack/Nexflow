/* NEXflow — Web UI static server (Node.js version of serve.pl)
 * Used when running as a Windows Service (via NSSM) instead of a visible
 * cmd window running serve.pl. Serves the whole project root on port 3000
 * with SPA fallback, same behavior as serve.pl / electron/main.js's
 * internal static server.
 *
 * Run manually for testing:
 *   node database\web_server.js
 */
const path = require('path');
const express = require('express');

const ROOT = path.join(__dirname, '..'); // โฟลเดอร์ NEXflow (parent ของ database/)
const PORT = process.env.PORT || 3000;

const app = express();

/* ปิด cache ทุกชั้น — กัน browser เก็บ data.js/*.jsx เวอร์ชันเก่าไว้ */
app.use(express.static(ROOT, {
  etag: false,
  lastModified: false,
  cacheControl: false,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Access-Control-Allow-Origin', '*');
  },
}));

/* SPA fallback — URL ที่ไม่มีนามสกุลไฟล์ (เช่น /settings) ให้เสิร์ฟ index.html ของ nexflow */
app.use((req, res) => {
  if (!path.extname(req.path)) {
    res.sendFile(path.join(ROOT, 'ui_kits', 'nexflow', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[NEXflow Web] Serving ${ROOT} on port ${PORT}`);
});
