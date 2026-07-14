# Landing v2 — Variante Editorial (estilo monopo saigon)

**Data:** 2026-07-14
**Arquivo-alvo:** `lexo/src/app/landing-v2/page.tsx` (novo arquivo, não toca em `page.tsx`)
**Status:** Aprovado para implementação após revisão do spec

---

## Objetivo

Criar uma landing page **alternativa** (rota `/landing-v2`), lado a lado com a
atual (`/`), aplicando o design de referência extraído em `assets/` (estilo
"monopo saigon": editorial monocromático, tema light, tipografia gigante,
zero sombra, um único gesto cromático). Serve pra comparar visualmente antes
de decidir se substitui a landing atual.

A landing atual **não é alterada**. O conteúdo (seções, textos, dados) é o
mesmo — só o vocabulário visual muda.

### Decisões do usuário
- **Escopo:** variante paralela em nova rota, não substitui `/`.
- **Conteúdo:** adapta todas as seções existentes ao estilo editorial (não é
  só hero + como-funciona).
- **Hero backdrop:** gradiente iridescente animado em CSS puro (sem
  imagem/vídeo — não existe asset pronto, só os tokens de cor).
- **Rota:** `/landing-v2`.

---

## 1. Arquitetura

Replica o padrão já estabelecido em `lexo/src/app/page.tsx`: um único client
component auto-contido.

- Tokens de design como `const` no topo do arquivo (cores, spacing, radius —
  ver seção 2).
- CSS bruto (keyframes, `[data-reveal]`, media queries responsivas) injetado
  via `<style>{CSS}</style>`, mesmo mecanismo do arquivo atual.
- Layout via `style` inline nos elementos, como o padrão atual.
- Scroll-reveal via `IntersectionObserver` em `[data-reveal]` (copiado do
  arquivo atual).
- `prefers-reduced-motion` respeitado do mesmo jeito que hoje.

**Por que não Tailwind utilities / CSS Modules:** registrar os ~30 tokens do
`assets/tokens.json` em `@theme` do `globals.css` poluiria o design system
global por uma página isolada. CSS Modules não traz ganho real pra um único
arquivo. O padrão inline+`<style>` já está provado no `page.tsx` atual.

### Fonte
`Roobert` (fonte do design original) não está disponível — substituída por
`Inter`, que já é carregada em `lexo/src/app/layout.tsx` como `--font-sans`.
`Raleway` (usada uma única vez no site-fonte) é descartada — variação de peso
do Inter cobre o caso, evita importar fonte nova para um único uso.

### Fundo
`body` tem `bg-background` escuro global (`globals.css`, oklch dark). O
wrapper raiz da página define `min-height: 100vh` e
`background: var(--color-paper)` (`#fff`) para cobrir isso — mesma técnica
que a landing atual usa para o próprio fundo dark (`page.tsx:719`, inline
`minHeight: "100vh"`).

---

## 2. Tokens de design (extraídos de `assets/`)

```css
/* Cores */
--color-obsidian: #000000;      /* texto primário, stroke, overlay */
--color-paper: #ffffff;         /* canvas primário */
--color-inkstone: #181818;      /* corpo de texto em footer/headings secundários */
--color-felt-gray: #6d6d6d;     /* texto mudo, legendas, endereço */
--color-slate-pill: #636363;    /* único fill sólido (não usado aqui — sem cookie banner) */
--color-ash-mist: #9a9a9a;      /* mid-tone p/ estados disabled */
--gradient-iridescent: linear-gradient(90deg, rgb(160,224,171), rgb(255,172,46) 50%, rgb(165,45,37));

/* Tipografia (Inter no lugar de Roobert) */
--text-display: clamp(48px, 12vw, 225px);   /* hero headline */
--text-heading-lg: clamp(32px, 7vw, 94px);  /* CTA final, stats */
--text-heading: clamp(28px, 5vw, 78px);     /* seção IA (whisper, weight 300) */
--text-heading-sm: 54px;
--text-subheading: 39px;
--text-body: 18px;
--text-caption: 11px-12px;

/* Pesos */
300 (whisper — manifesto/IA), 400 (padrão), 600 (nunca acima de 45px)

/* Spacing base 4px */ 8, 12, 28, 40, 48, 64, 68, 152

/* Radius */
cards/images/inputs: 0px (reto)
buttons/tags: 75px (pill completo)
/* nunca radius entre 1px e 74px */

/* Motion */
easing principal: cubic-bezier(0.19, 1, 0.22, 1)
durações: 0.8s–1.25s (transforms), 0.4s ease (cor/opacidade)
```

---

## 3. Seções (conteúdo idêntico à landing atual, tratamento editorial)

| # | Seção | Tratamento |
|---|-------|-----------|
| 1 | **Nav** | Header fixo transparente 66px, sem fundo até rolar. Logo "Lexo" esquerda, menu direita (Recursos / Como funciona / Preços / Entrar) 12px weight 400. Sem seletor de idioma. |
| 2 | **Hero** | Full-viewport. Gradiente iridescente animado (verde→âmbar→oxblood) via CSS puro (`@keyframes`, blend de radial-gradients, ~20-30s loop). Headline `--text-display` weight 400 branca sobre o gradiente. **Desvio do design-fonte:** mantém 1 ghost pill CTA "Criar conta grátis" (dark-surface variant) abaixo do headline — landing de SaaS precisa converter, hero sem CTA não serve o objetivo do negócio. Sem mockup/preview de dashboard. |
| 3 | **Trust bar** | Linha única de texto (wordmarks/nomes), 12px, sem cards, espaçados por whitespace. |
| 4 | **Features (6)** | Lista vertical numerada (01–06), sem ícones, sem grid. Título 18px + descrição, hairline `1px solid` divider entre linhas ("Project Card / List Row"). |
| 5 | **Como funciona** | Pipeline vertical: número grande (`--text-heading-lg`, weight 400, line-height 0.76) + texto do passo, alternando texto-esquerda/número-direita por linha. |
| 6 | **Lexo IA** | Seção-manifesto: headline whisper (`--text-heading`, weight 300) + parágrafo curto. Tom de statement, não pitch de feature. |
| 7 | **Stats** | Números grandes (`--text-heading-lg`) lado a lado, legenda 11px Felt Gray abaixo de cada um. |
| 8 | **Portal do cliente** | Bloco assimétrico texto-esquerda/mockup-direita. O mockup atual (cards com `boxShadow`/`borderRadius`/oklch coloridos, feito só com `div`s) é reconstruído no vocabulário editorial: mesmos `div`s, mas sem sombra, `radius: 0`, paleta monocromática (obsidian/paper/felt-gray) — não precisa de imagem/foto real. |
| 9 | **Depoimentos** | Uma citação grande por vez (29px, weight 300), atribuição 11px Felt Gray abaixo. Sem aspas decorativas, sem avatar-card. |
| 10 | **Preços** | Linhas (não cards): nome do plano + preço + ghost pill CTA, separadas por hairline border, cantos retos. |
| 11 | **CTA final** | Banda full-bleed Obsidian (`#000`), headline branca `--text-heading` weight 300, ghost pill dark-surface. |
| 12 | **Footer** | Bloco 3 colunas estilo "endereço", 11px Felt Gray, sem divisores, compacto (`margin-top: 8px` entre linhas). |
| 13 | **Scroll indicator** | Badge circular rotativo ("VER MAIS · VER MAIS") canto inferior esquerdo, stroke preto sobre transparente, rotação contínua lenta — reusa o mesmo padrão de `@keyframes` de rotação. |

### Componentes reutilizáveis (definidos uma vez, usados nas seções acima)
- **Ghost Pill Button** (light/dark surface variants) — transparent bg, border 1px, radius 75px, padding 11px/33px, Inter 16px weight 400. Sem hover-fill; anima `border-opacity` e `letter-spacing` no hover (`cubic-bezier(0.19,1,0.22,1)`, 0.8s).
- **Text Link** — sem sublinhado, sem fundo, cor muda por contexto (light/dark surface).
- **Section divider row** — hairline `1px solid` (obsidian em light bg, `rgba(255,255,255,.3)` em dark bg), usado em features/pricing.

---

## 4. Fora do escopo (YAGNI)

- **Cookie banner** — não existe na landing atual; specific de compliance do
  site-fonte (VN), não vou inventar copy de consentimento sem pedido real.
- **Language switcher** (EN/VN/中文) — Lexo é pt-BR only.
- **Raleway** — fonte extra para um único uso (ver seção 1).
- **Imagem/vídeo real no hero** — usa gradiente CSS até um asset real ser
  fornecido (decisão do usuário).

---

## 5. Responsivo

Mesmo mecanismo `.lp-section` com overrides de padding em media query (regra
existente em `page.tsx`, replicada). Escala tipográfica via `clamp()` nos
tamanhos grandes (225px/94px/78px não cabem em mobile — ver tokens na seção 2,
já expressos como `clamp()`).

---

## 6. Verificação

Página estática sem lógica de negócio (sem forms, sem submits, sem dados
dinâmicos) — não há o que testar automatizado além de type-check. Verificação
é visual:

1. `npm run dev`, abrir `http://localhost:3000/landing-v2`.
2. Conferir as 13 seções renderizam com o conteúdo correto.
3. Testar responsivo (mobile width) e `prefers-reduced-motion` (DevTools).
4. Conferir que `/` (landing atual) continua inalterada.
