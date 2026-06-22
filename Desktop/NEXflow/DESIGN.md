---
name: NEXflow
description: Thai seafood inventory and stock-management Electron desktop app — precision tools for the people who run the market.
colors:
  action-indigo: "#3b5bdb"
  action-indigo-deep: "#2c44a8"
  success-teal: "#0d9272"
  success-teal-bg: "#e6f6f2"
  warning-amber: "#c47b00"
  warning-amber-bg: "#fff4e0"
  danger-red: "#d03030"
  danger-red-bg: "#fff0f0"
  online-violet: "#6741d9"
  canvas: "#f0efe9"
  surface: "#ffffff"
  surface-raised: "#f7f6f2"
  surface-deep: "#eeecea"
  ink: "#141318"
  ink-secondary: "#4d4b56"
  ink-tertiary: "#7c7a87"
  table-header: "#241d3d"
  border-subtle: "rgba(0,0,0,0.08)"
  border-strong: "rgba(0,0,0,0.14)"
  brand-blue: "#5b7cff"
  brand-violet: "#8b5cf6"
typography:
  display:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.5px"
  headline:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 800
    lineHeight: 1.2
  title:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 800
    lineHeight: 1.3
  body:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.4
  caption:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.4
  meta:
    fontFamily: "Sarabun, Leelawadee UI, Tahoma, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "Courier New, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    letterSpacing: "0.07em"
rounded:
  surface: "12px"
  control: "8px"
  chip: "4px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.action-indigo}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.action-indigo-deep}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-success:
    backgroundColor: "{colors.success-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-warning:
    backgroundColor: "{colors.warning-amber}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-ghost:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
  input-default:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  input-focus:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "9px 12px"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.surface}"
    padding: "18px"
  badge-success:
    backgroundColor: "{colors.success-teal-bg}"
    textColor: "#075c48"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  badge-warning:
    backgroundColor: "{colors.warning-amber-bg}"
    textColor: "#7a4d00"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  badge-danger:
    backgroundColor: "{colors.danger-red-bg}"
    textColor: "#8c1a1a"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
  badge-action:
    backgroundColor: "#edf2ff"
    textColor: "{colors.action-indigo-deep}"
    rounded: "{rounded.pill}"
    padding: "2px 9px"
---

# Design System: NEXflow

## 1. Overview

**Creative North Star: "The Trusted Ledger"**

NEXflow is a professional tool, not a product experience. The people using it are weighing fish, printing invoices, and reconciling stock at 5 AM. Every design decision is governed by one question: does this make the work faster and more accurate, or does it slow the worker down? Decoration that cannot answer yes is prohibited.

The visual system is Thai-first and task-first. Sarabun handles Thai and Latin with equal precision; the scale stays compact because the UI is dense with data, not sparse with breathing room. The palette is functional — each color carries a status role (action, success, warning, danger, online) and is never used decoratively. The warm paper canvas (`#f0efe9`) grounds the interface without pulling attention away from the content. Surfaces separate from each other by tone, not shadow.

The system explicitly rejects: legacy ERP clutter (SAP-style crowded toolbars), generic SaaS blue (cookie-cutter dashboards with no identity), budget POS aesthetics (plastic-looking controls, low-contrast type), and consumer app energy (gratuitous color, entertainment-first motion).

**Key Characteristics:**
- Single Thai-optimized typeface at fixed scale — no display/body pairing, no fluid sizes
- Five semantic colors, each with a tinted background pair — used for status, never decoration
- Flat + tonal surface separation — depth conveyed by background tone, not shadow
- Dark violet-black (`#241d3d`) table headers for authoritative data presentation
- Brand gradient (blue→violet, `#5b7cff → #8b5cf6`) reserved for identity moments only
- Compact density: 4px base grid, 15px body, Thai line-height 1.6

## 2. Colors: The Status Palette

Five functional roles. Each color answers a specific question; only that question.

### Primary

- **Action Indigo** (`#3b5bdb`): The only color for primary interactive elements — the button you press to commit, the active nav item, focus rings, and selected states. Used on ≤10% of any given screen. Its rarity is the point.
- **Action Indigo Deep** (`#2c44a8`): Hover and pressed state of Action Indigo only. Never used at rest.

### Secondary

- **Online Violet** (`#6741d9`): Identifies the online sales channel exclusively — the badge that says "this came from a web order." Appears only in that context. Not a second accent.

### Tertiary

- **Brand Blue / Violet** (`#5b7cff → #8b5cf6` gradient): The brand identity gradient. Reserved for the login screen background, the active nav icon tile, avatar initials, and logo mark. It is identity, not UI.

### Neutral

- **Canvas** (`#f0efe9`): App background. Warm, low-chroma — doesn't compete with content but is visibly warmer than a pure white.
- **Surface** (`#ffffff`): Card and panel surface. White. Clear hierarchy against Canvas.
- **Surface Raised** (`#f7f6f2`): Table row stripe, hover fill, secondary input bg.
- **Surface Deep** (`#eeecea`): Deeper fill for nested elements.
- **Ink** (`#141318`): Primary text. Near-black, warm undertone. 4.5:1+ against Surface.
- **Ink Secondary** (`#4d4b56`): Secondary text, table data, form labels.
- **Ink Tertiary** (`#7c7a87`): Meta, captions, placeholders. Only on Surface (white) or Surface Raised — never on Canvas alone.
- **Table Header** (`#241d3d`): Deep violet-black for `<thead>` rows. White text on this surface. Authoritative, echoes the dark sidebar.
- **Border Subtle** (`rgba(0,0,0,0.08)`): Hairline between cards and panels.
- **Border Strong** (`rgba(0,0,0,0.14)`): Input strokes, stronger dividers.

### Semantic pairs (status colors)

Each status color pairs with a tinted background for badges, pills, and notice areas:

| Role | Tone | Background | Text |
|------|------|-----------|------|
| Success / stock-in | `#0d9272` | `#e6f6f2` | `#075c48` |
| Warning / low stock | `#c47b00` | `#fff4e0` | `#7a4d00` |
| Danger / void | `#d03030` | `#fff0f0` | `#8c1a1a` |
| Online / violet | `#6741d9` | `#f3effe` | `#4a2fa8` |
| Action / primary | `#3b5bdb` | `#edf2ff` | `#2c44a8` |

### Named Rules

**The One Voice Rule.** Action Indigo (`#3b5bdb`) appears only on interactive controls and current selection indicators. It is never used as a decorative accent, section highlight, or illustrative color. Its scarcity makes it trustworthy.

**The Role Discipline Rule.** Success Teal signals stock-in and positive financial events. Warning Amber signals low stock and caution. Danger Red signals void, cancellation, and out-of-stock. Swapping these roles for visual variety is prohibited. A user under time pressure reads these colors before they read the label.

## 3. Typography

**Body / UI Font:** Sarabun (Google Fonts CDN → system fallback: Leelawadee UI, Tahoma, Segoe UI)  
**Mono Font:** Courier New (barcode digits, product codes, tax IDs, document numbers)

**Character:** A single Thai-optimized humanist sans at multiple weights. Sarabun handles Thai script and Latin with consistent metrics. There is no display/body pairing — the variety comes from weight (400 to 800) and size, not from mixing families. This is a data-dense tool; exotic typefaces are a distraction.

### Hierarchy

- **Display** (700, 24px, lh 1.1, -0.5px tracking): KPI stat values, large numbers on dashboard. Tight and weighty — numbers command attention.
- **Headline** (800, 18px, lh 1.2): Report company name, page-level heroes. Rarely used; this weight signals the most important text on a page.
- **Title** (800, 16px, lh 1.3): Toolbar title, modal header, card-group label. The strongest weight at this size makes section ownership unambiguous.
- **Card Title** (800, 14.5px, lh 1.4): Individual card headers (`.ct-t`). Heavy weight compensates for smaller size.
- **Body** (400, 15px, lh 1.6): Default interface text. 1.6 line-height is required for Thai diacritics — never compress this.
- **Control** (500–600, 13.5px): Buttons, table cells, secondary content. Slight weight added for small-size legibility.
- **Label** (700, 13px): Form field labels, section labels. Bold makes them scannable at a glance.
- **Caption** (600, 12px): Input labels, column headers in non-table contexts.
- **Meta** (500, 11px): Sub-text, invoice item meta, version string.
- **Eyebrow** (700, 10.5px, uppercase, 0.09em tracking): Nav section dividers, system tags only. Not to be used as section headings.
- **Mono** (400, 12px, 0.07em tracking): Barcodes, product codes, document numbers, tax IDs. Never body text.

### Named Rules

**The Thai Line-Height Rule.** Body line-height is 1.6, always. Thai diacritics stack above and below base characters; anything below 1.5 clips ascenders and descenders. This is non-negotiable across every screen density.

**The Fixed Scale Rule.** Do not use `clamp()` or viewport-relative font sizes. Users work at consistent desktop DPI. A heading that changes size as the window resizes creates instability in a data-heavy layout where column widths matter.

## 4. Elevation

NEXflow uses **tonal separation** as the primary depth signal. Cards are white (`#ffffff`) on a warm canvas (`#f0efe9`); the contrast between surface and background creates hierarchy without any shadow.

Resting card shadows exist in the codebase (`0 1px 3px rgba(0,0,0,.07), 0 1px 2px rgba(0,0,0,.04)`) but are so subtle they read as border reinforcement, not elevation. New work should not add to this vocabulary.

### Shadow Vocabulary

- **Float** (`0 4px 20px rgba(0,0,0,.10)`): Toasts, floating panels, date pickers. Communicates Z-axis position when a layer must visually detach from the page.
- **Modal** (`0 12px 60px rgba(0,0,0,.18)`): Full dialog overlays only. Stronger to anchor a blocking surface.
- **Brand Glow** (`0 4px 16px rgba(59,91,219,.35)`): The login button CTA glow. Restricted to the login screen; the only shadow that uses color.

### Named Rules

**The Flat-First Rule.** Surfaces are separated by tone (`--sur`, `--s2`, `--s3`, `--bg`), not by shadow. Add a shadow only when the element floats above the document flow (fixed position, `position: absolute` dropdowns, modals). Ambient or decorative box-shadow on cards, stat tiles, or table rows is prohibited.

## 5. Components

### Buttons

Buttons are workhorses. They carry intent (action, confirm, warn, cancel) through color, not decoration.

- **Shape:** Gently curved control (8px radius, `--rs`)
- **Primary (Action Indigo):** `#3b5bdb` background, white text, `8px 16px` padding. Hover: `#2c44a8`. Active: scale(0.96). The only button that uses the brand glow shadow on the login screen — never on interior screens.
- **Success (Stock-In):** `#0d9272` background, white text. Used for GRN confirm and positive actions.
- **Warning:** `#c47b00` background, white text. Used for amber-state alerts and GRN document actions.
- **Ghost:** White background, `#141318` text, `rgba(0,0,0,.14)` border. Hover: `#f7f6f2` background. For secondary actions alongside a primary.
- **Danger:** `#d03030` background, white text. Void and destructive actions only.
- **Size modifiers:** `sm` (6px 12px, 12.5px font) for toolbar density; `lg` (13px 22px, 15px font, 700 weight) for primary CTAs in scan flows.

### Badges / Status Pills

Round pill (100px radius) semantic indicators. The tinted-background + dark-text-tone pairs are pre-defined per role. Never invent a new color combination — pick from the five semantic pairs.

- **Shape:** Pill (100px radius), `2px 9px` padding, 12px text, 600 weight
- **Stock pill** (`.sp` class): Slightly larger, 700 weight, 3px 9px padding — for stock-on-hand display

### Cards / Containers

- **Corner style:** Generously rounded (12px, `--r`)
- **Background:** White (`#ffffff`) on Canvas
- **Shadow strategy:** Flat-first. The existing 1px border + 1px soft shadow is grandfathered; new cards use border only.
- **Border:** `rgba(0,0,0,.08)` hairline, 1px
- **Card header** (`.ch`): `12px 18px` padding, bold title (14.5px, 800), separated by hairline border from body
- **Card body** (`.cb`): `18px` padding

### Inputs / Fields

- **Style:** 1px stroke (`rgba(0,0,0,.14)`), white background, 8px radius, `9px 12px` padding, 14px text
- **Label:** 13px, 700, Ink Secondary — placed above the input, 5px gap
- **Focus:** Action Indigo border (`#3b5bdb`) + indigo tint ring (`0 0 0 3px rgba(59,91,219,.12)`)
- **Error / required:** Red star marker (`#d03030`) on label; error state uses Danger Red border
- **Date fields:** Custom overlay pattern to force `dd/mm/yyyy` display regardless of OS locale

### Navigation (Sidebar)

The sidebar is the only surface with its own independent token set (`--nav-*`). Day mode: white sidebar on warm canvas. Night mode: near-black (`#0e0d16`).

- **Width:** 240px fixed
- **Nav item:** 8px radius, 13.5px Sarabun 600, `8px 10px` padding. Hover: subtle fill (`--nav-hover`). Active: indigo-tinted fill + bold text + brand gradient icon tile.
- **Active icon tile:** 30px × 30px, 8px radius, `linear-gradient(135deg, #5b7cff, #8b5cf6)` — the only interior use of the brand gradient.
- **Section dividers:** 10px uppercase, 800 weight, 0.09em tracking, Ink Tertiary — "STOCK", "TOOLS" etc.
- **User footer:** Avatar (32px circle, brand gradient bg), name (12.5px, 700), role (10.5px, muted)

### Tables

Tables are the primary data surface. They must be fast to scan.

- **Header row:** `#241d3d` background, white text, 13px 700, `9px 14px` padding. The dark header makes column ownership unambiguous.
- **Data rows:** 14px, `var(--tx)`, `9px 14px` padding, hairline bottom border. Hover: `--s2` fill.
- **Mono data:** `Courier New` 12px for codes, IDs, weights — monospace aligns decimal points in columns.
- **Sticky headers:** Use `position: sticky; top: 0; z-index: 1` on `<th>` in scrollable tables.

### Stat Cards

KPI tiles on the dashboard. Fixed structure: icon tile + label + value + sub-text.

- **Container:** Card base (white, 12px radius, `15px 18px` padding)
- **Icon tile:** 28px × 28px, 7px radius, semantic background (`--abg`, `--gbg`, etc.), semantic icon color
- **Value:** 24px, 800, -0.5px tracking (Display scale). Color defaults to Ink; optionally tinted with semantic tone.
- **Label:** 12.5px, 600, Ink Secondary
- **Sub-text:** 11.5px, Ink Tertiary

### Login Screen

- **Background:** `linear-gradient(135deg, #1e1b4b 0%, #3b2f8a 50%, #1e3a5f 100%)` — the one full-bleed dramatic surface in the product
- **Card:** White, `rgba(255,255,255,.97)`, 20px radius, `48px 44px` padding, `0 24px 80px rgba(0,0,0,.35)` shadow
- **CTA button:** Brand gradient background, brand glow shadow — the only interior use of the gradient on a button

## 6. Do's and Don'ts

### Do:

- **Do** use the five semantic colors (Action Indigo, Success Teal, Warning Amber, Danger Red, Online Violet) strictly by their role. A "success" action is always Teal; a "warning" is always Amber. Role integrity is the system's trust signal.
- **Do** separate surfaces tonally: `#ffffff` cards on `#f0efe9` canvas on `#f7f6f2` raised elements. Depth through tone, not shadow.
- **Do** use `#241d3d` for all `<thead>` rows. The dark header makes data tables authoritative and scannable.
- **Do** use Sarabun at 1.6 line-height for all body text. Thai diacritics require it.
- **Do** restrict the brand gradient (`#5b7cff → #8b5cf6`) to the login screen, active nav icon tile, and avatar. It is identity, not decoration.
- **Do** use monospace (`Courier New`) for all barcodes, product codes, document numbers, and weight values in table columns.
- **Do** use the pill shape (100px radius) for status badges. Rounded-rectangle badges are for a different system.
- **Do** keep button shapes consistent at 8px radius across every screen. Same vocabulary, every surface.

### Don't:

- **Don't** use Action Indigo (`#3b5bdb`) as a decorative accent, section color, or illustrative fill. It signals "press me" or "you are here." Nothing else.
- **Don't** add ambient or decorative box-shadow to cards, stat tiles, or table rows. The Flat-First Rule governs. Shadow appears only on floating layers (modals, toasts, absolute-positioned dropdowns).
- **Don't** introduce a new typeface. Sarabun handles every role — display through micro. A second sans family will conflict with Thai glyph metrics.
- **Don't** use `clamp()` or viewport-relative font sizes. Fixed rem/px scale only. Fluid headings destabilize data-dense layouts.
- **Don't** put the brand gradient on interior buttons. It belongs on the login CTA and the active nav icon tile — nowhere else inside the authenticated app.
- **Don't** make it look like a legacy ERP system (SAP, Oracle): no cluttered toolbars, no gray-on-gray nested panels, no 8-level deep menu trees.
- **Don't** make it look like a generic SaaS dashboard: no "hero metric" pattern (giant number + gradient accent), no cookie-cutter blue-on-white palette with no identity, no identical card grids.
- **Don't** make it look like a budget POS app: no plastic-looking rounded buttons in primary colors, no low-contrast label text, no garish status indicators.
- **Don't** use motion choreography or page-load sequences. State-change transitions only, 130–250ms. Users are mid-task; they don't wait for animation.
- **Don't** use `border-left` greater than 1px as a colored stripe on cards, alerts, or list items. Use background tints or full borders instead.
- **Don't** use gradient text (`background-clip: text`). Emphasis is weight or size.
