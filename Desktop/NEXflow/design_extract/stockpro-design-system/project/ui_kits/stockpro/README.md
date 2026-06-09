# StockPro — UI Kit

A high-fidelity, interactive recreation of the **StockPro** Thai seafood
inventory web app, rebuilt as small React (JSX) components from the source
(`nextechthailand-stack/Stockpro`). These are cosmetic recreations for
prototyping — not production logic.

## Run it
Open `index.html`. Log in with the prefilled demo creds (**admin / 1234**),
then click through:
1. **Dashboard** — KPI stats, low-stock alert, 7-day chart, top sellers, recent issues.
2. **รับสินค้าเข้า (Stock In)** — scan a demo barcode (or "สแกนต่อเนื่อง ×3"); items
   stream into the list and the right panel tallies weight + cost. Save → toast.
3. **ตัดสต็อก / ขาย (Stock Out)** — scan items, pick a sale type + customer + discount,
   then **ตัดสต็อก + ออกใบกำกับ** opens a printable Thai tax invoice.
4. **สินค้า / ลูกค้า (Products / Customers)** — data tables with stock pills & VAT badges.

The barcode parser is real: a 13-digit code = `[2 prefix][5 product code][5
weight×1000][1 check]`, e.g. `1200001239094` → product `00001`, `23.909 KG`.

## Files
| File | What |
|---|---|
| `index.html` | Boots React + Babel, loads everything, wires routing, the invoice modal, and toasts |
| `kit.css` | All component styles, adapted verbatim from the source; imports the DS root tokens |
| `data.js` | Mock products, customers, issues, chart data; `parseBarcode`, `fmtMoney`, `fmtKg` |
| `primitives.jsx` | `Icon` (inlined Lucide paths), `Button`, `Badge`, `StockPill`, `Card`, `StatCard`, `Field` |
| `Login.jsx` | Login screen (gradient backdrop, gradient mark) |
| `Shell.jsx` | App shell — dark sidebar nav + sticky top toolbar |
| `Dashboard.jsx` | Dashboard page |
| `StockIn.jsx` | Scan-to-receive flow + summary panel |
| `StockOut.jsx` | Scan-to-sell flow + sale type / customer / discount + issue |
| `Invoice.jsx` | Thai A4 tax invoice rendered in a modal |
| `Extras.jsx` | Products & Customers tables + a placeholder for routes not built here |

## Conventions for reuse
- Every component reads design tokens from `../../colors_and_type.css` (via
  `kit.css`). Change a token there and the whole kit follows.
- JSX files attach their exports to `window` (Babel scripts don't share scope).
  Add new files as `<script type="text/babel" src="...">` **before** the inline
  `App` script in `index.html`.
- Icons: use `<Icon name="..." />` — names match the source's Lucide set
  (`dashboard`, `arrow-right`, `file-text`, `warehouse`, `package`, `users`,
  `settings`, `check`, `x-circle`, …).

## Coverage / omissions
Built faithfully: Login, Shell, Dashboard, Stock In, Stock Out, Invoice,
Products, Customers. **Intentionally stubbed** (exist in the product, not in
this kit): Reports, Stock Management, Users, Settings, the abbreviated/thermal
invoice variants, and the void-invoice flow — each shows a labelled placeholder.
