# Assets inventory

The StockPro source ships **no raster images, no photography, no illustration,
and no logo image file**. Its entire visual identity is CSS + inlined Lucide SVG
icons. This folder therefore contains *recreations* of the brand mark plus
guidance for icons.

## Logo
| File | What | Notes |
|---|---|---|
| `logo-mark.svg` | "SP" mark on the blue→violet brand gradient, rounded square | Recreated from the source's CSS `.sb-mark` / `.login-logo`. Use radius ≈ 28% of size. |
| `logo-lockup.svg` | Mark + "StockPro" wordmark + Thai tagline | Horizontal lockup as used in the sidebar header. |

Brand gradient: `linear-gradient(135deg, #5b7cff, #8b5cf6)`.
Wordmark weight 700; mark letters weight 800, white.

## Icons — Lucide (CDN)
The source hand-inlines **Lucide** line icons (stroke 2, round caps/joins,
`fill:none`, `currentColor`). Rather than copy dozens of SVGs, link Lucide from
CDN — it is an exact match:

```html
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script>lucide.createIcons();</script>
<!-- usage: <i data-lucide="layout-grid"></i> -->
```

Icons used in StockPro (name → where):
`layout-grid` dashboard · `arrow-right` stock-in · `arrow-left` stock-out ·
`file-text` invoices · `bar-chart` reports · `warehouse` stock mgmt ·
`package` products · `users` customers · `user` users · `settings` settings ·
`check` confirm · `x` / `x-circle` close / void · `search` · `download` ·
`chevron-right` / `chevron-down` disclosure.

No emoji. No icon font. `฿` is the only currency glyph; `✕` is the only
glyph-as-button (modal close).
