# StockPro — Design System

A design system reconstructed from the **StockPro** product: a Thai-language
seafood inventory & point-of-sale / stock-management web application.

> **Primary source**
> GitHub: [`nextechthailand-stack/Stockpro`](https://github.com/nextechthailand-stack/Stockpro)
> — single file `stockpro-v50new1.html` (a self-contained ~400 KB HTML/CSS/JS app).
> A copy lives in this project at `stockpro-v50new1.html` for reference.
>
> Explore that repository further to build higher-fidelity designs against this product.

---

## 1. Product context

**StockPro** (Thai: *ระบบบริหารสต็อกสินค้า* — "product stock management system")
is a single-screen-app web tool built for a Thai **frozen-seafood wholesaler**.
The demo company is *บริษัท ซีฟู้ด โปรวิชั่น จำกัด* (Seafood Provision Co., Ltd).

The defining workflow is **barcode-driven weighing**: every package gets a
**13-digit barcode** that encodes a 5-digit product code plus the package weight
(e.g. `1200001239094` → product `00001`, `23.909 KG`). Staff scan to receive
stock in and scan again to cut stock / sell — the system reads code + weight
automatically. Products are priced **per kilogram**.

### What's in the app (one product, many screens)
| Area (Thai) | English | Purpose |
|---|---|---|
| เข้าสู่ระบบ | Login | Username/password gate |
| Dashboard | Dashboard | KPIs, 7-day chart, best-sellers, recent issues, low-stock alert |
| รับสินค้าเข้า | Stock In | Scan-to-receive (GRN), running summary panel |
| ตัดสต็อก / ขาย | Stock Out / Sell | Scan-to-issue; types: Wholesale · Online · Sample · Expired · Other |
| ใบกำกับภาษี | Tax Invoices | Full & abbreviated Thai tax invoices, A4 print, thermal receipt, void/cancel |
| รายงาน | Reports | Sales by product, movement, with printable report headers |
| การจัดการสต็อก | Stock Management | Balances, stock movement ledger |
| สินค้า | Products | Product CRUD, CSV import, VAT type per item |
| ลูกค้า | Customers | Wholesale / online / retail customers, CSV import |
| จัดการผู้ใช้ | Users | Admin / staff accounts |
| ตั้งค่าระบบ | Settings | Company header (for invoices), currency, VAT rate, date format |

### Domain specifics that shape the design
- **Thai-first UI.** All labels, buttons and copy are Thai; data values mix Thai
  product names with Latin/numeric codes.
- **Thai tax compliance.** VAT 7%, "Include VAT" vs "Non VAT" per product,
  full vs abbreviated tax invoices, 13-digit tax IDs, ORIGINAL/COPY invoice badges.
- **Buddhist Era dates.** Years shown as พ.ศ. (e.g. `15/05/68` = 2568 BE = 2025 CE).
- **Weight precision.** Everything is `0.000 KG`; money is `฿0.00`.
- **Sample products:** salmon (ปลาแซลมอนนอร์เวย์), white shrimp (กุ้งขาวแวนนาไม),
  yellowfin tuna (ปลาทูน่าครีบเหลือง), frozen scallop (หอยเชลล์แช่แข็ง),
  dory fillet (ปลาดอลลี่ฟิลเล่), lobster (กุ้งมังกร).

---

## 2. Content fundamentals (voice & copy)

**Language.** Thai throughout, with English/Latin reserved for technical tokens
(`Username`, `Password`, `PO`, `VAT`, `UOM`, `CSV`, `INV-…`, `Dashboard`).
The product name **StockPro** stays in Latin everywhere.

**Tone.** Plain, operational, transactional — this is a back-office tool for
staff, not a marketing surface. Copy is **instructional and confirmational**,
never playful or persuasive.

**Person.** Implicit imperative — the UI tells the user what to do without
"you/I". Buttons are bare verbs or verb phrases:
- *เข้าสู่ระบบ* (Log in) · *บันทึกรับสินค้าเข้า* (Save stock-in) ·
  *ล้างทั้งหมด* (Clear all) · *ยืนยันยกเลิกใบเสร็จ* (Confirm void invoice).

**Casing.** Thai has no case. The few Latin labels use Title Case for fields
(`Username`) and ALL-CAPS only for unit/format tokens (`KG`, `PCS`, `CSV`, `VAT`).
Tiny section eyebrows in the sidebar are uppercase Latin/Thai with wide tracking.

**Microcopy patterns.**
- Status hints pair a pulsing dot + short phrase: *พร้อมรับสัญญาณ — เพิ่มอัตโนมัติ*
  ("Ready for signal — auto-add").
- Helper text under inputs explains the *why*: *ใช้เป็นหลักที่ 3-7 ของบาร์โค้ด 13 หลัก*
  ("used as digits 3–7 of the 13-digit barcode").
- Empty states are encouraging + directive: *ยังไม่มีรายการ / สแกนบาร์โค้ดด้านบน…*
  ("No items yet / scan a barcode above…").
- Required fields marked with a red `*`. Optional fields say *(ไม่บังคับ)*.
- Toasts are terse: success / error / info, one line.

**Numbers & symbols.** Currency prefix `฿`, thousands separators, two decimals
for money, three decimals for weight. Codes always monospace.

**Emoji.** **None.** No emoji anywhere. No decorative unicode. The only
glyph-as-icon is the `✕` close affordance in modals.

---

## 3. Visual foundations

### Color & vibe
A **warm, paper-like, dense back-office** aesthetic — not a cool SaaS blue.
The canvas is warm off-white `#f0efe9`; cards are pure white; text is a warm
near-black `#18171a`. Greys carry a slight warm cast (`#6a6870`, `#a09fa8`).

A **single brand gradient** (blue `#5b7cff` → violet `#8b5cf6`, 135°) is the
only "exciting" color, used sparingly: the **SP logo mark**, the **active nav
icon**, **avatars**, the **login background** (deeper navy→indigo→teal), and the
primary-CTA glow. Everything else is functional semantic color.

**Semantic system** — five roles, each a trio of *{solid, tint-bg, dark-text}*:
- **Accent / primary** indigo-blue `#3b5bdb` — primary buttons, links, focus rings.
- **Success / money / stock-in** green `#0d9272` — totals, confirm, GRN.
- **Warning / low-stock / discount** amber `#c47b00`.
- **Danger / void / out-of-stock** red `#d03030`.
- **Special / online** violet `#6741d9`.

Imagery: **there is none.** No photography, no illustration, no stock art. The
product is 100% UI chrome, type, tables and inline icons. Visual interest comes
from color-coded badges/pills, the dark sidebar, and the gradient mark.

### Type
Thai system stack **Sarabun → Leelawadee UI → Tahoma**. Compact, dense scale;
base 15px. Big numbers (stat values, invoice totals) go to 24px/700 with
slightly negative tracking. Codes, barcodes and tax IDs are **Courier New mono**
with letter-spacing. See `colors_and_type.css` for the full scale.

### Spacing & layout
- 4px base grid. Card padding ~20px; toolbar height 56px; sidebar width 240px.
- **Fixed app shell:** dark sidebar (left, scroll-internal nav) + sticky top
  toolbar + scrolling content area. Pages are `display:none`/`block` swaps.
- Content uses CSS grid heavily: 4-up stat grids, `1fr / right-panel` split
  layouts (scan list + sticky summary), 2/3-column form grids.
- Tables are first-class: striped hover, sticky-feeling headers on `--s2`,
  hairline row dividers.

### Surfaces, borders, radii, shadows
- **Cards:** white, 1px hairline border `rgba(0,0,0,.08)`, radius **12px**,
  very soft resting shadow (`--sh`). Not flat, not heavy.
- **Buttons / inputs / badges-bg:** radius **8px**. Tiny chips: 4px.
- **Pills & badges:** fully rounded (100px).
- **Shadows** are subtle and layered for resting cards; modals/toasts get a
  larger soft drop; primary CTAs get a colored glow (`rgba(59,91,219,.35)`).
- **Inputs:** 1px border, **focus = accent border + 3px translucent ring**
  (`0 0 0 3px rgba(59,91,219,.12)`). Barcode inputs are special: 2px accent
  border, monospace, larger, with a status glyph on the right.

### Backgrounds & texture
Flat warm fills only. **No** patterns, **no** noise, **no** blur except the
modal overlay (`backdrop-filter: blur(3px)` over `rgba(0,0,0,.4)`). The only
gradients are the brand mark, the login backdrop, the stock-in summary header,
and the active-nav highlight wash.

### Motion
Fast and functional. Control feedback **0.13s**; overlays/toasts **0.18–0.25s**.
Named animations: `pop` (modal scale-in .94→1), `slideUp` (toast), `fadeUp`
(parse results), `badgePop` (count badge scale-in), `pulse` (live dot),
`scanPulse` / `highlightNew` (scan feedback). **Eases are ease / ease-out — no
bounce, no spring.**

### Interaction states
- **Hover:** buttons darken to their `-dark` tone (primary → `--at`) or filter
  brightness; ghost buttons fill `--s2`; nav items lighten text + bg wash.
- **Focus:** accent border + soft accent ring.
- **Active/selected:** accent border + tint bg (`--abg`) on selectable cards
  (product type, VAT option); active nav gets the gradient icon + glow.
- **Press:** no deliberate shrink; the login CTA *lifts* (`translateY(-1px)`).
- **Disabled:** `--s2` fill, `--t3` text, `not-allowed`.

---

## 4. Iconography

**System:** [Lucide](https://lucide.dev) (a.k.a. Feather-style) line icons,
hand-inlined as SVG in the source. Stroke `2` (sometimes 2.2–2.5 for small
sizes), `stroke-linecap: round`, `stroke-linejoin: round`, `fill: none`,
`stroke: currentColor`. Sizes: 13–16px inline, 18–22px in feature tiles.

Because the originals are standard Lucide paths, this design system uses the
**Lucide CDN** for icons (documented in `ASSETS.md` / used by the UI kit) — a
faithful, exact match to the source rather than a substitution. Common icons in
use: `layout-grid` (dashboard), `arrow-right`/`arrow-left` (in/out),
`file-text` (invoice), `bar-chart` (reports), `warehouse`/`package` (stock,
products), `users`/`user` (customers, users), `settings` (gear), `check`,
`x` / `x-circle` (close, void), `search`, `chevron-right/down`, `download`.

- **Icon "chips":** many nav/stat icons sit in a 28–40px rounded-square tile
  (`--s2` bg, 7–10px radius); the **active** state swaps the tile to the brand
  gradient with a glow and white stroke.
- **No icon font**, no sprite sheet — icons are inline SVG.
- **No emoji, no unicode icons** (except `✕` for modal close and `฿` as the
  currency symbol).
- **Logo:** there is no image logo. The brand mark is the letters **"SP"** in
  800-weight white on a brand-gradient rounded square (10–14px radius). The
  wordmark is **"StockPro"** in 700-weight. Recreated in `assets/` as
  `logo-mark.svg` and `logo-lockup.svg`.

See `assets/ASSETS.md` for the full inventory.

---

## 5. Index — what's in this design system

| Path | What |
|---|---|
| `README.md` | This file — product context, content & visual foundations, iconography |
| `colors_and_type.css` | All color + type tokens (CSS custom properties) and semantic helpers |
| `SKILL.md` | Agent-Skill manifest for using this system in Claude Code |
| `stockpro-v50new1.html` | Imported source app (reference only) |
| `assets/` | Recreated logo mark + lockup, `ASSETS.md` inventory |
| `preview/` | Design-system spec cards (colors, type, spacing, components) |
| `ui_kits/stockpro/` | High-fidelity, interactive recreation of the StockPro app |

### UI kits
- **`ui_kits/stockpro/`** — the StockPro web app. `index.html` boots a faithful
  click-through (login → dashboard → scan stock-in → cut stock → invoice).
  Components: `Shell` (sidebar + topbar), `Login`, `Dashboard`, `StockIn`,
  `StockOut`, `Invoice`, plus primitives (`Button`, `Badge`, `StatCard`,
  `Card`, `Table`, `Field`, `Icon`). See its own `README.md`.

---

## 6. Caveats / substitutions
- **Font** is loaded from **Google Fonts (Sarabun)** rather than the OS-local
  Sarabun the product relies on. Same family — flag if you have a licensed/local
  copy to drop into `fonts/`.
- **Icons** use the **Lucide CDN**; the source inlines the same Lucide paths, so
  this is an exact match, not a visual substitution.
- The product has **no real imagery or brand logo file** — the "SP" gradient
  mark is recreated from CSS. If a real logo exists, please share it.
