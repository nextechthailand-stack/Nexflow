# NEXflow UI Redesign — Design Spec
**Date:** 2026-06-23
**Branch:** feat/notes-sync-v2
**Status:** Approved — ready for implementation

---

## 1. Direction

**Direction B — Ultra-clean White**

White sidebar, cool canvas, Sky Blue accent. Feels like a modern SaaS tool (Linear / Notion family) while keeping the warm Thai seafood business context readable and professional.

---

## 2. Color Tokens

| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#f8fafc` | Page canvas (cool white) |
| `--sur` | `#ffffff` | Surface / cards / sidebar |
| `--ac` | `#0EA5E9` | Accent — Sky Blue (buttons, active nav, links, chart bars above avg) |
| `--abg` | `#f0f9ff` | Accent bg tint (active nav background, badges) |
| `--gn` | `#10b981` | Success / today's revenue / "today" KPI bar |
| `--am` | `#c47b00` | Warning / amber (avg reference line, low stock) |
| `--rd` | `#d03030` | Danger / cancellation / out-of-stock |
| `--pu` | `#6741d9` | Online channel badge |
| `--thd` | `#241d3d` | Dark headings / primary text |
| `--t2` | `#64748b` | Secondary text / nav labels |
| `--t3` | `#94a3b8` | Muted / timestamps / placeholders |
| `--bdr` | `#e9ecef` | Default border (sidebar divider, card border) |
| `--bdr2` | `#f1f5f9` | Subtle border (table row dividers) |

**Logo mark only:** `linear-gradient(135deg, #DC2626, #991B1B)` — red appears exclusively in the logo mark SVG, nowhere else in UI.

---

## 3. Sidebar

- Background: `#ffffff`
- Right border: `0.5px solid #e9ecef`
- Width: `200px` (full sidebar) / icon-only collapsed at `56px`
- **Logo area** (top): logo mark (red gradient) + "NEXflow" wordmark in `#0f172a` — separated by `0.5px solid #f0f0f0` bottom border
- **Nav items:** padding `7px 10px`, border-radius `8px`, font-size `13px`, font-weight `600`, color `#64748b`
- **Active nav item:** background `#f0f9ff`, color `#0369a1`, icon dot background `#0EA5E9`
- **User footer:** avatar circle (bg `#0EA5E9`, white initials) + name/role — separated by `0.5px solid #f0f0f0` top border

---

## 4. Top Bar

- Background: `#ffffff`
- Bottom border: `0.5px solid #e9ecef`
- Page title: `15px`, `font-weight: 700`, `color: #0f172a`
- Live pill (Dashboard only): bg `#ecfdf5`, text `#059669`, dot `#10b981`

---

## 5. Cards

- Background: `#ffffff`
- Border: `0.5px solid #e5e7eb`
- Border-radius: `10px`
- Box-shadow: `0 1px 3px rgba(0,0,0,.04)`
- Card header: padding `9px 14px`, border-bottom `0.5px solid #f1f5f9`, font `12px / 700 / #475569`

---

## 6. KPI Cards

Left border accent (3px) encodes meaning:
- `#10b981` — today's revenue / success metric
- `#0EA5E9` — monthly / accent metric
- `#F59E0B` — count / warning-adjacent metric

---

## 7. Table Headers — E3 Style

```css
th {
  background: #f1f5f9;
  color: #0f172a;
  font-size: 11.5px;
  font-weight: 800;
  border-bottom: 2px solid #475569;
  padding: 9px 14px;
  text-align: left;
}
```

Table row dividers: `border-bottom: 0.5px solid #f1f5f9`

---

## 8. Badges / Pills

| Type | Background | Text |
|------|-----------|------|
| Wholesale / Blue | `#e0f2fe` | `#0369a1` |
| Online / Violet | `#f5f3ff` | `#6d28d9` |
| Success | `#d1fae5` | `#065f46` |
| Warning | `#fef3c7` | `#92400e` |
| Danger | `#fee2e2` | `#b91c1c` |
| Accent (active tag) | `#f0f9ff` | `#0EA5E9` |

---

## 9. Charts

**Bar chart (revenue)**
- Above-average bars: `#0EA5E9` (solid)
- Below-average bars: `rgba(14,165,233,.28)` (faded)
- Today's bar (last): `#10b981` (green)
- AVG reference line: `1.5px dashed #F59E0B`, opacity `.55`
- AVG label: bg `#fffbeb`, text `#F59E0B`

**Top sellers bar**
- Rank 1: `#10b981` (green)
- Rank 2: `#0EA5E9` (blue)
- Rank 3–4: descending opacity blue

**Donut / pie**
- Wholesale: `#0EA5E9`
- Online: `#7C3AED`
- Other: `#10b981`

---

## 10. Buttons

**Primary:** background `#0EA5E9`, text `#ffffff`, border-radius `8px`
**Ghost/outline:** border `1.5px solid #0EA5E9`, text `#0EA5E9`, transparent bg
**Danger:** background `#d03030` or outline variant

---

## 11. Semantic Colors (unchanged)

These are NOT the accent — they carry fixed meaning across all screens:

| Semantic | Color | Usage |
|----------|-------|-------|
| Success | `#10b981` / bg `#d1fae5` | Paid, received, in-stock |
| Warning | `#c47b00` / bg `#fef3c7` | Low stock, pending |
| Danger | `#d03030` / bg `#fee2e2` | Cancelled, out-of-stock, error |
| Online channel | `#6741d9` / bg `#f5f3ff` | Online sale type badge |

---

## 12. Scope of Changes

Files that need updating:

| File | Change |
|------|--------|
| `colors_and_type.css` | Update `--ac`, `--bg`, `--sur`, add `--abg`, `--bdr`, `--bdr2` |
| `ui_kits/nexflow/kit.css` | Sidebar styles, table header E3, card styles, badge palette |
| `ui_kits/nexflow/Shell.jsx` | Sidebar bg white, active nav sky blue, logo mark red gradient |
| `ui_kits/nexflow/Dashboard.jsx` | KPI left-border accent, chart color logic (already done for bars/avg) |
| `ui_kits/nexflow/StockOut.jsx` | Table headers E3, badge colors |
| `ui_kits/nexflow/StockIn.jsx` | Table headers E3, badge colors |
| `ui_kits/nexflow/Reports.jsx` | Table headers E3, chart colors |
| `ui_kits/nexflow/Extras.jsx` | Table headers E3, badge colors, button colors |
| `ui_kits/nexflow/Invoice.jsx` | Button colors (non-print elements) |

---

## 13. Out of Scope

- Dark mode (existing `dark` tweak-panel theme — leave untouched)
- Print styles (Invoice A4, thermal receipt)
- Login screen (already clean)
- Barcode / scanner logic
- Any business logic or data changes
