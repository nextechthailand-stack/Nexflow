---
name: stockpro-design
description: Use this skill to generate well-branded interfaces and assets for StockPro, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. StockPro is a Thai-language seafood inventory & stock-management web app (barcode-driven weighing, Thai tax invoices, VAT 7%, Buddhist-era dates).
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick map
- `README.md` — product context, content & visual foundations, iconography, index.
- `colors_and_type.css` — all color + type tokens (CSS custom properties) + semantic helpers. Import this first.
- `assets/` — `logo-mark.svg`, `logo-lockup.svg`, `ASSETS.md` (icons = Lucide CDN).
- `preview/` — small spec cards (colors, type, spacing, components) to eyeball the system.
- `ui_kits/stockpro/` — interactive React recreation of the app; reuse its
  `primitives.jsx` (Icon/Button/Badge/Card/StatCard/Field) and `kit.css`.

## Non-negotiables for on-brand work
- **Thai-first UI.** Labels and buttons in Thai; Latin only for technical tokens
  (Username, PO, VAT, CSV, INV-…). Product name "StockPro" stays Latin.
- **Font:** Sarabun (Google Fonts) → Leelawadee UI → Tahoma. Codes/barcodes in Courier New mono.
- **Warm paper canvas** `#f0efe9`, white cards, warm-grey text. NOT cool SaaS blue.
- **One brand gradient** (blue→violet) reserved for logo mark, avatars, active nav, CTA glow.
- **Five semantic roles**, each a {solid, tint-bg, dark-text} trio. Use the tokens, don't invent colors.
- **Icons:** Lucide line icons, stroke 2, round caps. No emoji. `฿` and `✕` are the only glyphs.
- **Radii** 4/8/12px + full pills. **Soft layered shadows.** **Fast functional motion** (0.13–0.25s, ease, no bounce).
