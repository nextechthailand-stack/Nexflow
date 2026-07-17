# Product

## Register

product

## Users

Two user roles share the app:

- **Business owners / managers (เจ้าของ/ผู้จัดการ):** use the Dashboard and Reports to monitor stock levels, sales, and profitability; make restocking and pricing decisions.
- **Counter / warehouse staff (พนักงานหน้าร้าน/คลังสินค้า):** perform the daily scan-to-receive (StockIn) and scan-to-sell (StockOut) flows; need the interface to be fast and error-forgiving under time pressure.

Primary context: a busy Thai seafood shop or distribution business. The environment is noisy, time-pressured, and Thai-language only. Staff may have limited tech literacy; owners want data clarity at a glance.

## Product Purpose

NEXflow is a Thai-first inventory and stock-management Electron desktop application built for seafood businesses. It covers stock receiving (GRN documents), sales (TIV thermal + INV A4 invoices), reporting across 6 dimensions, product and customer management, and user access control. Success looks like: stock is always accurate, invoices print without friction, and the owner can read the health of the business in under a minute.

## Brand Personality

Simple, trustworthy, professional — เรียบง่าย ใช้งานง่าย ดูเป็นมืออาชีพ

Three words: **Calm · Clear · Capable**

Emotional goals: operators should feel confident, not confused. Owners should feel in control, not overwhelmed.

## Anti-references

- **Legacy ERP systems (SAP, Oracle):** cluttered, dense, intimidating — NEXflow should feel nothing like enterprise middleware.
- **Generic SaaS blue (Notion, Monday, ClickUp clones):** cookie-cutter indigo-on-white with no identity — NEXflow should have its own voice, not look like every other dashboard.
- **Budget Thai POS apps:** plastic-looking, low-rent — NEXflow must feel premium enough that owners are proud to have it at the counter.
- **Consumer social apps (Instagram / TikTok aesthetic):** playful color explosions, entertainment-first — NEXflow is a professional tool, not entertainment.

## Design Principles

1. **Function before form** — every design decision must reduce friction for a time-pressured worker. If it looks good but slows the scan-to-sell flow, it is wrong.
2. **Calm under load** — when many things are happening simultaneously (scan, print, void, edit), the UI must stay quiet. Whitespace and restraint beat competing colors for attention.
3. **Thai-first legibility** — Sarabun at correct weight and size is never negotiable. Thai script needs more leading than Latin; never compress this for visual density.
4. **Authoritative precision** — stock numbers, totals, and document numbers must always look exact and final. The product handles real money; data must feel trustworthy, not approximate.
5. **Premium without pretension** — the product should look better than a budget POS and more approachable than enterprise software. Confident, not flashy.

## Accessibility & Inclusion

- WCAG AA minimum (≥4.5:1 body text contrast, ≥3:1 large text).
- Thai language only; no internationalization required.
- Desktop (Electron) only; no mobile layout needed.
- Minimal motion by default; preserve `prefers-reduced-motion` when motion is added.
