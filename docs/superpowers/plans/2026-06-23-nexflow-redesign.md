# NEXflow UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Sky Blue redesign — white sidebar, `#f8fafc` canvas, `#0EA5E9` accent, E3 table headers — across the entire NEXflow app.

**Architecture:** CSS variable changes in `colors_and_type.css` cascade to all screens automatically. Targeted overrides in `kit.css` handle table headers and nav icon styles. `Dashboard.jsx` needs one hardcoded color updated. No other JSX files require changes.

**Tech Stack:** CSS custom properties, React (Babel standalone), no bundler

## Global Constraints

- Never touch print styles (Invoice A4 / thermal receipt)
- Never touch Login screen styles
- Dark mode (`data-theme="dark"`) overrides must remain untouched
- Do not use `git add .` — stage specific files only
- After each commit restart Electron (`start-desktop.bat`) to verify; browser preview at `http://localhost:3000/ui_kits/nexflow/index.html` also works
- Spec: `docs/superpowers/specs/2026-06-23-nexflow-redesign-design.md`

---

### Task 1: Update CSS tokens — canvas, accent, nav active state

**Files:**
- Modify: `colors_and_type.css` (lines 52–82 and 95–96)

**Interfaces:**
- Produces: `--bg:#f8fafc`, `--s2:#f1f5f9`, `--ac:#0EA5E9`, `--abg:#f0f9ff`, `--at:#0369a1`, `--nav-active:#f0f9ff`, `--nav-active-fg:#0369a1` — consumed by every component via CSS variables

- [ ] **Step 1: Edit `colors_and_type.css` — surface tokens**

Replace these lines in the neutrals block (around line 52–55):
```css
  --bg:  #f8fafc;  /* app canvas — cool white           */
  --sur: #ffffff;  /* card / panel surface               */
  --s2:  #f1f5f9;  /* subtle fill, hover, table stripe   */
  --s3:  #e2e8f0;  /* deeper fill                        */
```

- [ ] **Step 2: Edit `colors_and_type.css` — accent tokens**

Replace the accent block (around line 96):
```css
  --ac:  #0EA5E9;  --abg: #f0f9ff;  --at: #0369a1;
```

- [ ] **Step 3: Edit `colors_and_type.css` — nav active tokens**

Replace the nav-active and nav-active-fg lines (around lines 80–81):
```css
  --nav-active:   #f0f9ff;        /* active row fill — sky blue tint */
  --nav-active-fg:#0369a1;        /* active label — sky blue         */
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000/ui_kits/nexflow/index.html`, log in as `admin / 1234`.
Expected:
- App canvas is cool white (`#f8fafc`), not warm paper
- Active nav item has light-blue tint background
- Primary buttons are sky blue

- [ ] **Step 5: Commit**

```bash
git add colors_and_type.css
git commit -m "style: update CSS tokens — sky blue accent, cool white canvas"
```

---

### Task 2: Update `kit.css` — table headers (E3), nav icon, avatar, form ring

**Files:**
- Modify: `ui_kits/nexflow/kit.css` (lines 116, 39, 44, 88)

**Interfaces:**
- Consumes: `--ac` from Task 1
- Produces: E3-style table headers (light gray bg + bold black + 2px `#475569` border), sky blue nav icon + avatar, sky blue form focus ring

- [ ] **Step 1: Edit `kit.css` — table `th` (line 116)**

Replace:
```css
th{text-align:left;padding:9px 14px;font-size:13px;font-weight:700;color:var(--thd-fg);border-bottom:1px solid var(--bd);background:var(--thd);white-space:nowrap}
```
With:
```css
th{text-align:left;padding:9px 14px;font-size:11.5px;font-weight:800;color:#0f172a;border-bottom:2px solid #475569;background:#f1f5f9;white-space:nowrap}
```

- [ ] **Step 2: Edit `kit.css` — active nav icon shadow (line 39)**

Replace:
```css
.ni.on .ni-ic{background:var(--grad-brand);color:#fff;box-shadow:0 3px 10px rgba(91,124,255,.4)}
```
With:
```css
.ni.on .ni-ic{background:var(--ac);color:#fff;box-shadow:0 3px 10px rgba(14,165,233,.35)}
```

- [ ] **Step 3: Edit `kit.css` — user avatar (line 44)**

Replace:
```css
.av{width:32px;height:32px;border-radius:50%;background:var(--grad-brand);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
```
With:
```css
.av{width:32px;height:32px;border-radius:50%;background:var(--ac);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:#fff;flex-shrink:0}
```

- [ ] **Step 4: Edit `kit.css` — form focus ring (line 88)**

Replace:
```css
.fc:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(59,91,219,.12)}
```
With:
```css
.fc:focus{border-color:var(--ac);box-shadow:0 0 0 3px rgba(14,165,233,.15)}
```

- [ ] **Step 5: Verify in browser**

Check:
- All table headers (open any screen with a table — StockOut, Reports, Extras) show light-gray bg + bold black text + 2px dark-gray bottom border
- Active sidebar nav icon is sky blue (not purple gradient)
- User avatar (bottom left of sidebar) is sky blue
- Click any input field — focus ring should be sky blue

- [ ] **Step 6: Commit**

```bash
git add ui_kits/nexflow/kit.css
git commit -m "style: E3 table headers, sky blue nav icon + avatar + form ring"
```

---

### Task 3: Update Dashboard.jsx — month KPI card to Sky Blue

**Files:**
- Modify: `ui_kits/nexflow/Dashboard.jsx` (line 224)

**Interfaces:**
- Consumes: nothing from previous tasks (hardcoded hex values)
- Produces: month KPI card renders with sky blue gradient when kpiStyle is 'gradient'

- [ ] **Step 1: Edit `Dashboard.jsx` line 224**

Replace:
```jsx
<KpiCard label={t('kpi_month_sales')} rawValue={S.month}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={t('kpi_month_sales_sub',{pct:monthPct,target:k(S.monthTarget)})} gradient="linear-gradient(135deg,#3b5bdb,#5b7cff)" solidColor="#3b5bdb" icon="bar-chart"  delay={.12} started={mounted} />
```
With:
```jsx
<KpiCard label={t('kpi_month_sales')} rawValue={S.month}  displayFn={v=>'฿'+v.toLocaleString('en-US')} sub={t('kpi_month_sales_sub',{pct:monthPct,target:k(S.monthTarget)})} gradient="linear-gradient(135deg,#0EA5E9,#38BDF8)" solidColor="#0EA5E9" icon="bar-chart"  delay={.12} started={mounted} />
```

- [ ] **Step 2: Verify in browser**

Navigate to Dashboard. Open Tweaks panel (⚙ button) and switch KPI style to 'gradient'.
Expected: month KPI card shows sky blue gradient (not indigo).
Switch back to 'minimal' — all three KPI cards should look clean without gradients.

- [ ] **Step 3: Commit**

```bash
git add ui_kits/nexflow/Dashboard.jsx
git commit -m "style: month KPI card — sky blue gradient"
```

---

### Task 4: Push and final verification

- [ ] **Step 1: Push to dev**

```bash
git push origin dev
```

- [ ] **Step 2: Full visual walkthrough**

Open the app and check each screen:
1. **Dashboard** — cool white canvas, sky blue KPI accent card, sky blue bars above avg, green today bar, amber avg line
2. **StockIn** — table header E3 style, sky blue scan zone border
3. **StockOut** — table header E3, sky blue primary button
4. **Reports** — all 6 tabs: table headers E3, chart bars sky blue
5. **Invoice List (Extras)** — table headers E3, badges correct colors
6. **Stock Manage** — table headers E3
7. **Settings** — form focus rings sky blue
8. **Dark mode** — open Tweaks panel → set theme to 'dark' — verify dark mode still works (colors should use the dark overrides from `colors_and_type.css`)

- [ ] **Step 3: Done**
