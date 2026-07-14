# Tema do app — migração pra Integrated Biosciences (fundação + piloto)

**Data:** 2026-07-14
**Status:** Aprovado para implementação
**Escopo desta fase:** tokens globais + 2 componentes com estilo hardcoded (Button, Logo) + validação na página Dashboard. **Não** inclui as outras 12 páginas do dashboard nem login/2FA/registrar — essas são fases seguintes, uma por vez, depois que o piloto for aprovado.

---

## Objetivo

Levar a identidade visual "Integrated Biosciences" construída em `/landing-v2`
(dark Abyssal Ink + acento único Lime, tipografia Inter/JetBrains Mono, zero
sombra/gradiente) pro app autenticado, substituindo a paleta índigo/violeta
atual (`globals.css`).

## Por que é mais simples do que parece

O app já usa um sistema de tokens semânticos do shadcn (`--background`,
`--card`, `--primary`, `--muted-foreground`, `--border`, `--radius`, `--brand`,
etc.) consumidos via classes Tailwind (`bg-card`, `text-brand`, `border-border`
...). Auditei os componentes-chave da UI compartilhada:

| Componente | Usa só tokens? | Ação |
|---|---|---|
| `card.tsx` | ✅ 100% token (`bg-card`, `ring-foreground/10`) | nenhuma edição — herda sozinho |
| `page-header.tsx` | ✅ 100% token (`bg-brand/10`, `text-brand`) | nenhuma edição — herda sozinho |
| `sidebar-nav.tsx` | ✅ 100% token (`bg-brand/10`, `var(--brand)` no inset border) — **memória antiga citava gradiente, mas o código atual não tem, já é flat** | nenhuma edição — herda sozinho |
| `badge.tsx` | ✅ 100% token | nenhuma edição — herda sozinho |
| `button.tsx` | ⚠️ 1 valor hardcoded: `hover:shadow-[0_0_20px_oklch(0.66_0.18_274_/_0.45)]` no variant `default` | remover (design system não usa sombra/glow) |
| `logo.tsx` | ❌ cores oklch hardcoded fora do sistema de token + fonte Geist hardcoded | reescrever pro visual flat Abyssal/Lime |

Ou seja: redefinir os valores em `globals.css` já resolve ~90% do trabalho
visual em cascata. Só `button.tsx` e `logo.tsx` precisam de edição manual
nessa fase.

---

## 1. Tokens (`lexo/src/app/globals.css`, bloco `:root`)

O bloco `:root` é o único (não há `.dark` separado — dark mode já é o tema
único do app, hardcoded). Novos valores:

| Token | Valor atual | Valor novo | Papel |
|---|---|---|---|
| `--background` | `oklch(0.11 0.018 264)` | `#222f30` (Abyssal Ink) | fundo global |
| `--foreground` | `oklch(0.93 0.008 264)` | `#ffffff` (Paper) | texto primário |
| `--card` | `oklch(0.155 0.02 264)` | `#222f30` (igual ao bg — separação vem da borda, não de elevação) | superfície de card |
| `--card-foreground` | `oklch(0.93 0.008 264)` | `#ffffff` | texto em card |
| `--popover` / `--popover-foreground` | tons de slate | `#222f30` / `#ffffff` | dropdown/popover |
| `--primary` | `oklch(0.66 0.18 274)` (índigo) | `#cef79e` (Lime) | CTA principal |
| `--primary-foreground` | `oklch(0.98 0.01 274)` (quase branco) | `#222f30` (Abyssal) | texto sobre Lime — **crítico**: texto branco sobre lime claro não teria contraste |
| `--secondary` / `--secondary-foreground` | slate escuro / quase branco | `#2c3b3c` / `#ffffff` | superfície secundária (ex: hover) |
| `--muted` | `oklch(0.20 0.02 264)` | `#283738` | fundo mudo |
| `--muted-foreground` | `oklch(0.60 0.02 264)` | `#93a09f` (Mist — mesmo tom usado na landing pra resolver o contraste do texto secundário) | texto mudo |
| `--accent` / `--accent-foreground` | índigo 28%/95% | `#cef79e1a` / `#cef79e` | hover sutil, tag ativo |
| `--brand` / `--brand-foreground` | = primary/primary-foreground | = primary/primary-foreground | ícone de `PageHeader`, active state do `SidebarNav` |
| `--success` | `oklch(0.65 0.17 150)` | mantém | badge "em dia" — decisão: semáforo de status continua colorido |
| `--warning` | `oklch(0.75 0.16 80)` | mantém | badge "médio" |
| `--destructive` | `oklch(0.62 0.18 22)` | mantém | badge "urgente"/erro |
| `--border` / `--input` | branco 7-10% opacidade | `#4d5757` (Graphite) | hairline — vira o principal separador visual, já que não tem mais sombra |
| `--ring` | índigo 60% | `#cef79e99` (Lime) | anel de foco (acessibilidade — mantém visível) |
| `--radius` | `0.625rem` (~10px) | mantém `0.625rem` | sem mudança — já compatível com o range 8–20px do design system |
| `--chart-1..5` | índigo/ciano/verde/âmbar/laranja | `--chart-1: #cef79e` (Lime, série principal); `--chart-2..5`: variações dessaturadas de verde-acinzentado (`#8fae94`, `#6d7f78`, `#4d5757`, `#c9cbbe`) | gráficos ficam majoritariamente mono, com Lime destacando a série principal — polimento fino de cada gráfico fica pra quando essa página específica for migrada |
| `--sidebar` / `--sidebar-*` | tons de slate + índigo | espelha os tokens acima (`--sidebar: #1a2425` — um tico mais escuro que o `--background` pra diferenciar a coluna lateral, resto = brand) | coluna lateral |
| `--font-sans` | Geist | Inter (já carregada globalmente via `layout.tsx` pra landing-v2) | tipografia |
| `--font-mono` | Geist Mono | JetBrains Mono (idem) | labels técnicas |
| `--shadow-panel` | `0 24px 60px -24px oklch(0 0 0 / 0.45)` | remover (setar vazio/`none`) | design system é flat — depth vem de borda, não sombra |

**Fora do escopo desta fase:** os keyframes de animação (`fade-up`,
`shimmer`, `glow-pulse`, `border-glow`, `today-pulse`) continuam existindo;
alguns usam `oklch(0.66 0.18 274 ...)` (o antigo índigo) hardcoded no próprio
keyframe (não como var) — esses ficam órfãos com a cor antiga até serem
tocados página por página nas fases seguintes. Não quebra nada, só fica com
a cor errada até ser migrado.

---

## 2. `button.tsx`

Trocar:
```
hover:shadow-[0_0_20px_oklch(0.66_0.18_274_/_0.45)] transition-shadow
```
por nada (remover o glow — só mantém `hover:bg-primary/90`, que já herda o
Lime pelo token).

---

## 3. `logo.tsx`

Reescrever pro visual flat, sem gradiente, coerente com o mark usado na nav
da `/landing-v2`:
- `LogoMark`: fundo `#222f30` (ou Lime — a definir no piloto qual lê melhor
  no sidebar escuro), ícone em stroke branco; remove o segundo `path` em
  `oklch(0.72 0.16 290)` (era o acento violeta) — troca pro Lime `#cef79e`
  se mantiver um segundo traço de destaque, senão remove.
- `LogoWordmark`: cor `#ffffff`, `fontFamily` passa a herdar `var(--font-sans)`
  (Inter) em vez de `"Geist"` hardcoded.

---

## 4. Piloto: página Dashboard

Depois dos tokens + Button + Logo, abrir `/dashboard` no navegador e
verificar: KPIs, cards, sidebar (nav ativo, ícones, badge "NOVO"), topbar,
contraste de texto mudo (mesma armadilha que pegamos na landing — conferir
que `--muted-foreground` não ficou ilegível), gráficos (mesmo que com as
cores só "ok" por enquanto, não geniais — polimento fino é fase futura).
Screenshot antes/depois pra comparação.

---

## 5. Fora de escopo (fica pra fases seguintes, uma de cada vez)

- As outras 12 páginas do dashboard (processos, clientes, agenda,
  financeiro, jurimetria, timesheet, tarefas, andamentos, pesquisa-jurídica,
  portal-cliente, planos, configurações).
- Login / 2FA / Registrar.
- Polimento fino de gráficos (paleta de dado, não só token base).
- Migração dos keyframes que têm a cor antiga hardcoded dentro do próprio
  `@keyframes` (fade-up etc. — ver nota acima).
- A landing atual (`/`) — não muda, conforme decidido nesta mesma conversa.

---

## 6. Verificação

Sem suíte de testes automatizados no projeto (`AGENTS.md`/`CLAUDE.md`
confirmam). Verificação é visual + `tsc --noEmit`:

1. `npx tsc --noEmit` limpo.
2. `npm run dev`, abrir `/dashboard` logado, conferir contraste e leitura
   de cada elemento (sidebar, cards, botões, badges de status).
3. Conferir que `/landing-v2` e `/` continuam intactas (não tocamos nada
   lá nessa fase).
4. Testar `prefers-reduced-motion` não é afetado (não mexe em animação
   nessa fase, só cor).
