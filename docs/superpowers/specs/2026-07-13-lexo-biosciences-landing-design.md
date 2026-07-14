# Lexo Landing Page — Integrated Biosciences Design Adaptation

**Date:** 2026-07-13
**Approach:** B — Token replacement + IB composition elements
**Scope:** `lexo/src/app/page.tsx` only. App shell, auth, and dashboard untouched.

---

## Goal

Adapt the Lexo marketing landing page to the Integrated Biosciences (IB) "bioluminescent laboratory at midnight" design system. Preserve Lexo's content, structure, and interactive mockup; replace the visual language entirely.

---

## Design Tokens

### Colors

| Role | Value | IB Token |
|---|---|---|
| Canvas dark | `#222f30` | Abyssal Ink |
| Accent lime | `#cef79e` | Bioluminescent Lime |
| Canvas light (depoimentos) | `#f7f7f5` | Bone White |
| Card on light | `#ffffff` | Paper |
| Secondary text / dark borders | `#4d5757` | Graphite |
| Light borders / metadata | `#c9cbbe` | Lichen |
| Footer ground | `#000000` | Void |
| Dark card surface | `#1a2526` | ~Abyssal Ink darkened (cards/mockups) |

**Rules:**
- `#cef79e` appears only on micro-surfaces: 40×40 arrow buttons, 6px tag dots, active nav pill, popular plan border/badge.
- Zero gradients anywhere.
- Zero box-shadows, zero glow, zero blur effects on content (only `backdrop-filter` on sticky nav).
- All depth via color contrast + 1px hairline borders.

### Typography

**Inter Tight 400** — sole display and body font (Aspekta substitute). Load via `next/font/google`.
**Roboto Mono 400** — nav links, section counters, tags, badges, button text, metadata. Load via `next/font/google`.

Token scale (from IB spec):

| Role | Size | Line Height | Letter Spacing |
|---|---|---|---|
| caption / Roboto Mono | 13px | 1.23 | -0.26px |
| body | 18px | 1.30 | -0.018px |
| body-lg | 22px | 1.30 | -0.13px |
| heading-sm | 36px | 1.20 | -0.22px |
| heading-lg | 58px | 1.10 | -0.7px |
| display | 75px | 1.10 | -1.5px |
| display-xl | 111px | 1.00 | -2.22px |

No bold, no italic, no weight variation. Hierarchy = size + tracking only.

### Shapes & Layout

- Border radius: nav 12px, tags 9999px, cards 16–20px, buttons 8px, large cards 40px
- Arrow CTA buttons: exactly 40×40px, filled `#cef79e`, `#222f30` arrow icon
- Page max-width: 1200px
- Section vertical padding: 104px (same as current)
- Section gap between dark bands: no divider needed (same surface)
- Dividers: 1px `#4d5757` (dark sections) or 1px `#c9cbbe` (light section)

---

## Section-by-Section Spec

### Animations removed
- Aurora blobs (all 5)
- Dot grid + beam sweep
- Vinheta + grain layer
- `text-flow` animated gradient on h1
- `flow-border` animated gradient border (Lexo IA section, Stats section)
- Pricing card glow pulse orbs (CTA Final section)
- `badge-pulse` ring
- `badge-shimmer` sheen

### Animations kept
- `[data-reveal]` scroll fade-up (keep as-is)
- Sliding nav pill (active + hover — restyle only)
- Count-up on stats enter
- Marquee trust bar
- `wf-*` wireframe animations in Como Funciona steps (recolor to lime)
- `cursor-blink` in Lexo IA chat demo
- `chat-item-late` appear in Lexo IA chat demo
- `live-dot` in Portal mockup (recolor to `#cef79e`)
- `hero-panel` / `hero-card` mount animations

---

### NAV

```
bg: #222f30 at 85% opacity + backdrop-filter blur(20px)
border-bottom: 1px solid #4d5757
```

- Logo "Lexo": Inter Tight 400, 21px, `#ffffff`, tracking -0.6px
- Logo icon: border radius 8px, bg `#1a2526`
- Nav links: Roboto Mono 400, 13px, `#c9cbbe`, tracking -0.26px
- Hover pill: bg `rgba(255,255,255,0.05)`, radius 12px
- Active pill: bg `#cef79e`, text `#222f30`, no border
- CTA "Área do Cliente": ghost, border `1px solid #4d5757`, text `#c9cbbe`, Roboto Mono 13px, radius 8px
- CTA "Criar conta grátis": bg `#222f30`, border `1px solid #cef79e`, text `#cef79e`, Roboto Mono 13px, radius 8px

---

### HERO

Left column:
- Badge above headline: lime dot 6px + Roboto Mono 13px `NOVO · LEXO IA & JURIMETRIA`, color `#4d5757`, no background pill
- Headline: Inter Tight 400, 75px, tracking -1.5px, line-height 1.1, `#ffffff`. Period-terminated: "O sistema que cuida do escritório enquanto você cuida da causa."
- Subtext: 18px, `#4d5757`, max-width 480px, line-height 1.3
- CTA primary: arrow button row — 40×40 `#cef79e` square (radius 8px) with `#222f30` arrow SVG, beside text label "Começar teste de 14 dias" in Inter Tight 18px `#ffffff`
- CTA secondary: ghost button, border `1px solid #4d5757`, text `#c9cbbe`, Roboto Mono 13px, radius 8px
- Trust row: Roboto Mono 13px `#4d5757` — "Sem cartão de crédito · Migração assistida · LGPD & ISO 27001"

Right column (mockup):
- Outer container: border `1px solid #4d5757`, bg `#1a2526`, radius 16px, no shadow
- Browser chrome: dots `#4d5757` (no colored traffic lights), URL in Roboto Mono 11px `#4d5757`
- KPI cards: border `1px solid #4d5757`, bg `#222f30`. Urgent badge: border `1px solid #cef79e`, text `#cef79e` — no gradient background
- AI summary card: border `1px solid #4d5757`, skeleton lines `#4d5757`
- Process rows: border `1px solid #4d5757`, risk badge "ALTO" border `1px solid #cef79e` text `#cef79e`
- Floating AI card: border `1px solid #4d5757`, bg `#1a2526`, radius 14px, no rotation, no shadow

---

### TRUST BAR

- Marquee kept. Label: Roboto Mono 13px `#4d5757`, tracking 1px
- Names: Inter Tight 400, 19px, `#4d5757`, opacity 0.6

---

### FEATURES (Recursos)

Section header:
- Pill counter `01`: border `1px solid #4d5757`, radius 9999px, Roboto Mono 13px `#4d5757`, placed above title
- Title: Inter Tight 400, 42px, tracking -0.5px, color `#4d5757` (Graphite — reflective counterpoint per IB spec)
- No overline label "PLATAFORMA COMPLETA"

Cards (grid 2+4 kept):
- Border `1px solid #4d5757`, bg `#222f30`, radius 16–20px, padding 32px (featured) / 22px (small)
- Icon: stroke `#cef79e`, no colored background container
- Feature label: lime dot 6px + Roboto Mono 13px uppercase `#4d5757`
- "NOVO" badge: lime dot 6px + Roboto Mono `#4d5757`
- Arrow button: 40×40 `#cef79e`, radius 8px, `#222f30` arrow SVG — bottom-right of each card, links to `/registrar`
- Hover: border `#c9cbbe`, no glow, no translateY, no box-shadow

---

### COMO FUNCIONA

- Pill counter `02` above section title
- Title: Inter Tight 400, 42px, `#4d5757`
- Each step card:
  - Internal step counter `01`/`02`/`03`: Roboto Mono 13px, border `1px solid #4d5757`, radius 9999px, color `#4d5757`
  - Step title: Inter Tight 400, 36px, tracking -0.22px, `#ffffff`
  - Step desc: 18px, `#4d5757`
  - Card: border `1px solid #4d5757`, bg `#222f30`, radius 18px
- Wireframes: recolor all accent to `#cef79e`, inner bg `#1a2526`, skeleton lines `#4d5757`
- Curved arrows between steps: stroke `#4d5757`, opacity 0.4

---

### LEXO IA

- Pill counter `03` above badge
- Container: border `1px solid #4d5757`, bg `#1a2526`, radius 20px — remove `flow-border`
- Badge `✦ LEXO IA`: Roboto Mono 13px, border `1px solid #4d5757`, radius 9999px, color `#4d5757`
- Headline: Inter Tight 400, 42px, `#ffffff`
- Body: 18px, `#4d5757`
- Check items: lime dot 6px (replace `✓`)
- Chat demo container: border `1px solid #4d5757`
- User bubble: bg `#222f30`, border `1px solid #4d5757`
- AI bubble: border `1px solid #cef79e`, bg `#222f30` (no gradient)
- Deadline rows inside bubble: bg `#1a2526`, border `1px solid #4d5757`, dot `#cef79e`
- Cursor blink: `#cef79e`

---

### STATS

- Container: border `1px solid #4d5757`, radius 16px, padding 40px — remove `flow-border`
- Numbers: Inter Tight 400, 72px, tracking -2.5px, `#ffffff` — no gradient text
- Labels: Roboto Mono 13px, `#4d5757`
- Vertical dividers between stats: `1px solid #4d5757`
- Count-up kept

---

### PORTAL DO CLIENTE

- Pill counter `04` above section title
- Title: Inter Tight 400, 42px, `#4d5757`
- Mockup card: border `1px solid #4d5757`, bg `#1a2526`, radius 16px, no shadow
- Avatar: bg `#222f30`, border `1px solid #4d5757`
- Live dot: `#cef79e`
- Status badge "Em dia": Roboto Mono 13px, border `1px solid #4d5757`, dot `#cef79e`, text `#4d5757`
- Inner cards: border `1px solid #4d5757`, bg `#222f30`
- CTA arrow button: 40×40 `#cef79e`

---

### DEPOIMENTOS — light section

**Full section background flips to `#f7f7f5` (Bone White).** This is the only light section. The contrast with surrounding dark bands signals rhythm per IB spec.

- Pill counter `05` — border `1px solid #c9cbbe`, text `#4d5757`
- Title: Inter Tight 400, 42px, `#222f30`
- Cards: bg `#ffffff`, border `1px solid #c9cbbe`, radius 20px, padding 40px
- Stars: `#cef79e`
- Quote: Inter Tight 400, 18px, `#222f30`, line-height 1.3
- Name: Inter Tight 400, 14px, `#222f30`
- Role: Roboto Mono 13px, `#4d5757`
- Avatar: bg `#222f30`, text `#ffffff`, no gradient

---

### PRICING

- Returns to dark (`#222f30`)
- Pill counter `06`
- Title: Inter Tight 400, 42px, `#4d5757`
- Cards: border `1px solid #4d5757`, bg `#222f30`, radius 18px
- Featured card "Escritório": border `1px solid #cef79e` (lime border = selected signal)
- Badge "MAIS POPULAR": Roboto Mono 13px, bg `#cef79e`, text `#222f30`, radius 9999px — no shimmer animation
- Price: Inter Tight 400, 38px, `#ffffff`, tracking -1.5px
- Period: Roboto Mono 13px, `#4d5757`
- CTA button (Escritório): ghost — border `1px solid #cef79e`, text `#cef79e`, bg transparent, radius 8px, Roboto Mono 13px
- CTA button (others): ghost — border `1px solid #4d5757`, text `#c9cbbe`, radius 8px
- Check items: lime dot 6px + Inter Tight 13px `#4d5757`
- No hover glow, no popular card box-shadow

---

### CTA FINAL

- Container: border `1px solid #4d5757`, bg `#222f30`, radius 20px, padding 56px
- Remove pulsing orbs and radial gradient overlay
- Headline: Inter Tight 400, 58px, tracking -0.7px, `#ffffff`
- Sub: 18px, `#4d5757`
- CTA primary: filled — bg `#222f30`, border `1px solid #cef79e`, text `#cef79e`, Roboto Mono 13px, radius 8px
- CTA secondary: ghost — border `1px solid #4d5757`, text `#c9cbbe`

---

### FOOTER

- Bg: `#000000` (Void — deeper than canvas)
- Border-top: `1px solid #4d5757`
- Logo "Lexo": Inter Tight 400, 18px, `#ffffff`
- Legal line: Roboto Mono 13px, `#4d5757`
- Links: Roboto Mono 13px, `#c9cbbe`

---

## Implementation Notes

- Load fonts in `lexo/src/app/layout.tsx` via `next/font/google`: `Inter_Tight` (subsets: latin, weight: 400) + `Roboto_Mono` (subsets: latin, weight: 400). Pass as CSS variables `--font-inter-tight` and `--font-roboto-mono`.
- Update token consts at top of `page.tsx`: replace `BG`, `AC`, `AC2`, `AC3`, `AC_CY`, `AC_MG`, `SURF1`, `SURF2`, `F`, `FM` with IB values.
- Remove aurora blob JSX + all 4 `aurora-*` keyframes.
- Remove dot grid + beam div + `beam-sweep` keyframe + `bg-beam` class.
- Remove vinheta div + grain div.
- Remove `text-flow` CSS class + `gradient-flow` keyframe.
- Remove `flow-border` CSS class (used on Lexo IA section and Stats section).
- Remove `badge-pulse::after`, `badge-shimmer::after` CSS.
- Remove `glow-pulse` keyframe + pulsing orb divs in CTA Final.
- Keep all other CSS keyframes and classes.
- Add section counter pill component inline (small span with border `1px solid #4d5757`, Roboto Mono 13px, radius 9999px, padding 4px 12px).
- Add arrow CTA button: `<span style={{width:40,height:40,...}}><svg arrow/></span>`.
- Depoimentos section: wrap in full-bleed `#f7f7f5` div; inner content constrained to 1200px.
