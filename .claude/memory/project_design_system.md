---
name: project-design-system
description: "Sistema de design do Lexo: paleta, animações, componentes visuais e identidade da marca"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3f560977-e40d-440d-ae26-6c3583887664
---

## Identidade Visual Lexo

**Logo:** `lexo/src/components/ui/logo.tsx` — `LogoMark` (ícone SVG "strata": 3 barras ascendentes com gradiente índigo-violeta) e `LogoWordmark` (LogoMark + texto "Lexo" em gradiente).

**Favicon:** `lexo/public/favicon.svg` — mesmo ícone strata.

**Referências de marca:** `lexo/public/brand-concepts.html` e `lexo/public/brand-final.html`.

---

## Paleta Dark Mode (globals.css — classe `.dark`)

Dark mode é **hardcoded** (`className="dark"` no `<html>`). Valores chave em oklch:

| Token | Valor |
|---|---|
| `--background` | `oklch(0.11 0.018 264)` — quasi-preto azulado |
| `--card` | `oklch(0.155 0.02 264)` |
| `--primary` | `oklch(0.66 0.18 274)` — índigo |
| `--muted-foreground` | `oklch(0.60 0.02 264)` |
| `--border` | `oklch(1 0 0 / 7%)` |

**Acento principal:** índigo/violeta `oklch(0.66 0.18 274)`.

---

## Animações CSS (globals.css)

Definidas como custom properties e keyframes:

- `animate-fade-up` → `fade-up 0.5s ease both`
- `animate-fade-in` → `fade-in 0.4s ease both` (com stagger via `--delay` CSS var)
- `animate-shimmer` → `shimmer 2.5s linear infinite`
- `animate-glow-pulse` → `glow-pulse 3s ease-in-out infinite`

---

## Componentes

### PageHeader (`lexo/src/components/page-header.tsx`)
Cabeçalho de página reutilizável. Props: `title`, `icon?: LucideIcon`, `action?: ReactNode`.
Ícone renderizado em badge com fundo `oklch(0.66 0.18 274 / 0.15)`.
Usado em todas as páginas do dashboard.

### SidebarNav (`lexo/src/components/sidebar-nav.tsx`)
- Links com `animate-fade-in` e stagger via `--delay` CSS var
- Estado ativo: `linear-gradient(90deg, oklch(0.66 0.18 274 / 0.2), ...)` + `inset 1px 0 0 oklch(0.66 0.18 274 / 0.8)` como borda esquerda luminosa

### Logo (`lexo/src/components/ui/logo.tsx`)
`LogoMark` + `LogoWordmark`. Gradiente `#a5b4fc → #6366f1 → #3730a3`.

---

## Arquivos-chave do Layout

- `lexo/src/app/(dashboard)/layout.tsx` — sidebar com glass morphism, header com avatar
- `lexo/src/app/globals.css` — tokens de cor, animações, keyframes
- `lexo/src/proxy.ts` — auth guard Edge-safe (exporta `proxy`, importado como `middleware` em next.config)

**Why:** Redesign feito em 2026-06-17 para dar identidade profissional ao produto antes de avançar para Fase 2.
**How to apply:** Sempre usar a paleta oklch definida em globals.css. Novos ícones de página usam o padrão do PageHeader. Novas animações reutilizam as classes CSS existentes.
